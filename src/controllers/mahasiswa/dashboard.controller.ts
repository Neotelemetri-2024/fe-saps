import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';

// ==================== DASHBOARD MAHASISWA ====================

export const getDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const mahasiswa = await prisma.mahasiswa.findUnique({
      where: { userId: BigInt(userId) },
      include: {
        user: { select: { nama: true } },
        prodi: { select: { nama: true } }
      }
    });

    if (!mahasiswa) {
      return res.status(404).json({ success: false, message: 'Profil mahasiswa tidak ditemukan' });
    }

    // Ambil Kurikulum Aktif + Capaian (tahun)
    const kurikulumAktif = await prisma.kurikulum.findFirst({
      where: { status: 'aktif' },
      include: {
        capaian: {
          orderBy: { urutan: 'asc' },
          include: { subCapaian: true }
        }
      }
    });

    if (!kurikulumAktif) {
      return res.status(400).json({ success: false, message: 'Tidak ada kurikulum aktif' });
    }

    // Ambil perolehan poin mahasiswa ini
    const perolehanPoin = await prisma.perolehanPoin.findMany({
      where: { mahasiswaId: BigInt(userId), status: 'sah' },
      include: {
        detail: {
          include: { subCapaian: { include: { capaian: true } } }
        }
      }
    });

    // Hitung total poin
    const totalPoin = perolehanPoin.reduce((sum, p) => sum + p.totalPoin, 0);

    // Hitung target total dari seluruh capaian
    const totalTarget = kurikulumAktif.capaian.reduce((sum, c) => sum + c.jumlahPoin, 0);

    // Hitung poin per capaian (tahun)
    const capaianMap: Record<number, number> = {};
    for (const p of perolehanPoin) {
      for (const d of p.detail) {
        const capaianId = d.subCapaian.capaianId;
        capaianMap[capaianId] = (capaianMap[capaianId] || 0) + d.poin;
      }
    }

    const progresTahunan = kurikulumAktif.capaian.map(c => ({
      id: c.id,
      nama: c.nama,
      urutan: c.urutan,
      targetPoin: c.jumlahPoin,
      poinTerkumpul: capaianMap[c.id] || 0,
      persentase: c.jumlahPoin > 0
        ? Math.round(((capaianMap[c.id] || 0) / c.jumlahPoin) * 100)
        : 0,
      status: (capaianMap[c.id] || 0) >= c.jumlahPoin ? 'tuntas' : 'berjalan'
    }));

    // Radar Chart: poin per capaian dinormalisasi ke persen
    const radarData = kurikulumAktif.capaian.map(c => ({
      label: c.nama,
      value: c.jumlahPoin > 0
        ? Math.round(((capaianMap[c.id] || 0) / c.jumlahPoin) * 100)
        : 0
    }));

    // Riwayat Kegiatan Persetujuan Dosen PA (5 terbaru)
    const riwayatIzinPA = await prisma.izinPA.findMany({
      where: {
        partisipasi: { mahasiswaId: BigInt(userId) }
      },
      include: {
        partisipasi: {
          include: {
            kegiatan: {
              include: {
                kategori: { select: { nama: true } }
              }
            },
            peranVerif: { select: { nama: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const tabelIzinPA = riwayatIzinPA.map((izin, i) => ({
      no: i + 1,
      namaKegiatan: izin.partisipasi.kegiatan.nama,
      jenisKegiatan: izin.partisipasi.kegiatan.kategori?.nama,
      peran: izin.partisipasi.peranVerif?.nama || '-',
      penyelenggara: izin.partisipasi.kegiatan.penyelenggaraExt || '-',
      tanggal: izin.partisipasi.kegiatan.tanggalMulai,
      status: izin.status,
      alasan: izin.alasan
    }));

    // Riwayat Kegiatan Pengajuan Eksternal (5 terbaru)
    const riwayatEksternal = await prisma.kegiatan.findMany({
      where: {
        dibuatOleh: BigInt(userId),
        asal: 'eksternal'
      },
      include: {
        kategori: { select: { nama: true } },
        skala: { select: { nama: true } },
        kegiatanApproval: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const tabelEksternal = riwayatEksternal.map((k, i) => {
      let statusStr = 'Pending';
      if (k.status === 'disetujui' || k.status === 'terpublikasi') statusStr = 'Disetujui';
      else if (k.status === 'ditolak') statusStr = 'Ditolak';

      return {
        no: i + 1,
        namaKegiatan: k.nama,
        jenisKegiatan: k.kategori?.nama,
        peran: '-',
        penyelenggara: k.penyelenggaraExt,
        tanggal: k.tanggalMulai,
        skala: k.skala?.nama,
        status: statusStr,
        alasan: k.kegiatanApproval[0]?.alasan || null
      };
    });

    // Tentukan tahap berdasarkan poin
    let tahap = 'Tahap I: Dasar';
    const persen = totalTarget > 0 ? Math.round((totalPoin / totalTarget) * 100) : 0;
    if (persen >= 75) tahap = 'Tahap IV: Akhir';
    else if (persen >= 50) tahap = 'Tahap III: Mahir';
    else if (persen >= 25) tahap = 'Tahap II: Menengah';

    res.status(200).json({
      success: true,
      data: {
        nama: mahasiswa.user.nama,
        prodi: mahasiswa.prodi.nama,
        nim: mahasiswa.nim,
        angkatan: mahasiswa.angkatan,
        totalPoin,
        totalTarget,
        persentaseTotal: persen,
        tahap,
        progresTahunan,
        radarData,
        riwayatIzinPA: tabelIzinPA,
        riwayatEksternal: tabelEksternal
      }
    });

  } catch (error: any) {
    next(error);
  }
};

// ==================== RIWAYAT POIN ====================

export const getRiwayatPoin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Ambil Kurikulum Aktif + Capaian
    const kurikulumAktif = await prisma.kurikulum.findFirst({
      where: { status: 'aktif' },
      include: {
        capaian: { orderBy: { urutan: 'asc' } }
      }
    });

    if (!kurikulumAktif) {
      return res.status(400).json({ success: false, message: 'Tidak ada kurikulum aktif' });
    }

    // Ambil semua perolehan poin mahasiswa
    const perolehanPoin = await prisma.perolehanPoin.findMany({
      where: { mahasiswaId: BigInt(userId), status: 'sah' },
      include: {
        detail: {
          include: { subCapaian: { include: { capaian: true } } }
        }
      }
    });

    // Hitung per capaian (tahun kurikulum)
    const capaianMap: Record<number, number> = {};
    for (const p of perolehanPoin) {
      for (const d of p.detail) {
        const capaianId = d.subCapaian.capaianId;
        capaianMap[capaianId] = (capaianMap[capaianId] || 0) + d.poin;
      }
    }

    const totalPoin = perolehanPoin.reduce((sum, p) => sum + p.totalPoin, 0);
    const totalTarget = kurikulumAktif.capaian.reduce((sum, c) => sum + c.jumlahPoin, 0);

    const progressTahun = kurikulumAktif.capaian.map(c => ({
      id: c.id,
      nama: c.nama,
      urutan: c.urutan,
      targetPoin: c.jumlahPoin,
      poinTerkumpul: capaianMap[c.id] || 0,
      persentase: c.jumlahPoin > 0
        ? Math.round(((capaianMap[c.id] || 0) / c.jumlahPoin) * 100)
        : 0,
      status: (capaianMap[c.id] || 0) >= c.jumlahPoin ? 'completed' : 'in_progress'
    }));

    // Filter query params
    const { kategoriId, peranId, status, penyelenggara, tahun, search } = req.query;

    // Ambil seluruh klaim poin mahasiswa ini (tabel riwayat)
    const whereKlaim: any = {
      partisipasi: {
        mahasiswaId: BigInt(userId)
      }
    };

    if (status && status !== 'semua') {
      whereKlaim.status = status as string;
    }

    if (kategoriId) {
      whereKlaim.partisipasi.kegiatan = {
        ...whereKlaim.partisipasi.kegiatan,
        kategoriId: parseInt(kategoriId as string)
      };
    }

    if (penyelenggara) {
      whereKlaim.partisipasi.kegiatan = {
        ...whereKlaim.partisipasi.kegiatan,
        penyelenggaraExt: { contains: penyelenggara as string }
      };
    }

    if (tahun) {
      const yearStart = new Date(`${tahun}-01-01`);
      const yearEnd = new Date(`${parseInt(tahun as string) + 1}-01-01`);
      whereKlaim.partisipasi.kegiatan = {
        ...whereKlaim.partisipasi.kegiatan,
        tanggalMulai: { gte: yearStart, lt: yearEnd }
      };
    }

    if (peranId) {
      whereKlaim.peranUsulanId = parseInt(peranId as string);
    }

    if (search) {
      whereKlaim.partisipasi.kegiatan = {
        ...whereKlaim.partisipasi.kegiatan,
        nama: { contains: search as string }
      };
    }

    const klaimData = await prisma.klaimPoin.findMany({
      where: whereKlaim,
      include: {
        peranUsulan: { select: { nama: true } },
        bukti: { select: { url: true, tipe: true }, take: 1 },
        perolehanPoin: { select: { totalPoin: true } },
        partisipasi: {
          include: {
            kegiatan: {
              include: {
                kategori: { select: { nama: true } },
                skala: { select: { nama: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const tabelRiwayat = klaimData.map((k, i) => {
      let statusStr = 'Pending';
      if (k.status === 'disetujui') statusStr = 'Disetujui';
      else if (k.status === 'ditolak') statusStr = 'Ditolak';

      return {
        no: i + 1,
        namaKegiatan: k.partisipasi.kegiatan.nama,
        jenisKegiatan: k.partisipasi.kegiatan.kategori?.nama,
        peran: k.peranUsulan?.nama || '-',
        penyelenggara: k.partisipasi.kegiatan.penyelenggaraExt || '-',
        tanggal: k.partisipasi.kegiatan.tanggalMulai,
        bukti: k.bukti[0]?.url || null,
        poin: k.perolehanPoin?.totalPoin || '-',
        status: statusStr
      };
    });

    res.status(200).json({
      success: true,
      data: {
        totalPoin,
        totalTarget,
        progressTahun,
        riwayat: tabelRiwayat
      }
    });

  } catch (error: any) {
    next(error);
  }
};
