import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';

// ==================== DASHBOARD DOSEN PA ====================

export const getDashboardDosen = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dosenUserId = req.user?.id;
    if (!dosenUserId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Ambil dosen + semua mahasiswa bimbingan
    const dosen = await prisma.dosen.findUnique({
      where: { userId: BigInt(dosenUserId) },
      include: {
        user: { select: { nama: true } },
        fakultas: { select: { nama: true } }
      }
    });

    if (!dosen) {
      return res.status(404).json({ success: false, message: 'Profil dosen tidak ditemukan' });
    }

    // Total Mahasiswa Bimbingan
    const mahasiswaBimbingan = await prisma.mahasiswa.findMany({
      where: { dosenPaId: BigInt(dosenUserId) },
      include: {
        user: { select: { nama: true } },
        prodi: { select: { nama: true } },
        perolehanPoin: {
          where: { status: 'sah' },
          select: { totalPoin: true }
        }
      }
    });

    const totalMahasiswa = mahasiswaBimbingan.length;

    // Pending Approval (izin PA yang masih diajukan)
    const pendingApproval = await prisma.izinPA.count({
      where: {
        dosenPaId: BigInt(dosenUserId),
        status: 'diajukan'
      }
    });

    // Permintaan persetujuan terbaru (3 terbaru)
    const permintaanTerbaru = await prisma.izinPA.findMany({
      where: {
        dosenPaId: BigInt(dosenUserId),
        status: 'diajukan'
      },
      include: {
        partisipasi: {
          include: {
            mahasiswa: { include: { user: { select: { nama: true } } } },
            kegiatan: { select: { nama: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    });

    const permintaanPersetujuan = permintaanTerbaru.map(izin => ({
      id: izin.id.toString(),
      namaMahasiswa: izin.partisipasi.mahasiswa.user.nama,
      namaKegiatan: izin.partisipasi.kegiatan.nama,
      tanggal: izin.createdAt
    }));

    // Kurikulum aktif untuk menghitung capaian
    const kurikulumAktif = await prisma.kurikulum.findFirst({
      where: { status: 'aktif' },
      include: {
        capaian: { orderBy: { urutan: 'asc' } }
      }
    });

    const totalTarget = kurikulumAktif
      ? kurikulumAktif.capaian.reduce((sum, c) => sum + c.jumlahPoin, 0)
      : 550;

    // Progres Capaian Tahunan per mahasiswa + identifikasi "perlu perhatian"
    const progresMahasiswa = [];
    let totalPoinSemua = 0;
    let perluPerhatianCount = 0;
    const kategoriPoinMap: Record<string, number> = {};

    for (const mhs of mahasiswaBimbingan) {
      const totalPoin = mhs.perolehanPoin.reduce((sum, p) => sum + p.totalPoin, 0);
      totalPoinSemua += totalPoin;
      const persentase = totalTarget > 0 ? Math.round((totalPoin / totalTarget) * 100) : 0;

      // Perlu perhatian: capaian < 50%
      const perluPerhatian = persentase < 50;
      if (perluPerhatian) perluPerhatianCount++;

      progresMahasiswa.push({
        mahasiswaId: mhs.userId.toString(),
        nama: mhs.user.nama,
        nim: mhs.nim,
        prodi: mhs.prodi.nama,
        angkatan: mhs.angkatan,
        ipk: '-', // IPK tidak ada di schema, placeholder
        capaianPersen: persentase,
        totalPoin,
        status: perluPerhatian ? 'perlu_perhatian' : 'on_track'
      });
    }

    // Rata-rata capaian per jenis kegiatan (bar chart)
    const klaimBimbingan = await prisma.klaimPoin.findMany({
      where: {
        status: 'disetujui',
        partisipasi: {
          mahasiswa: { dosenPaId: BigInt(dosenUserId) }
        }
      },
      include: {
        perolehanPoin: { select: { totalPoin: true } },
        partisipasi: {
          include: {
            kegiatan: {
              include: { kategori: { select: { nama: true } } }
            }
          }
        }
      }
    });

    for (const kl of klaimBimbingan) {
      const kategoriNama = kl.partisipasi.kegiatan.kategori?.nama || 'Lainnya';
      const poin = kl.perolehanPoin?.totalPoin || 0;
      kategoriPoinMap[kategoriNama] = (kategoriPoinMap[kategoriNama] || 0) + poin;
    }

    const chartKategori = Object.entries(kategoriPoinMap).map(([label, value]) => ({
      label,
      value
    }));

    res.status(200).json({
      success: true,
      data: {
        namaDosen: dosen.user.nama,
        fakultas: dosen.fakultas?.nama,
        totalMahasiswa,
        rataRataIpk: '-', // Tidak ada field IPK di schema
        pendingApproval,
        perluPerhatian: perluPerhatianCount,
        permintaanPersetujuan,
        chartKategori,
        progresMahasiswa
      }
    });

  } catch (error: any) {
    next(error);
  }
};

// ==================== DAFTAR MAHASISWA BIMBINGAN ====================

export const getDaftarMahasiswaBimbingan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dosenUserId = req.user?.id;
    if (!dosenUserId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const search = req.query.search as string;
    const whereClause: any = { dosenPaId: BigInt(dosenUserId) };

    if (search) {
      whereClause.OR = [
        { user: { nama: { contains: search } } },
        { nim: { contains: search } }
      ];
    }

    const mahasiswaBimbingan = await prisma.mahasiswa.findMany({
      where: whereClause,
      include: {
        user: { select: { nama: true } },
        prodi: { select: { nama: true } },
        perolehanPoin: {
          where: { status: 'sah' },
          select: { totalPoin: true }
        }
      }
    });

    const kurikulumAktif = await prisma.kurikulum.findFirst({
      where: { status: 'aktif' },
      include: { capaian: true }
    });

    const totalTarget = kurikulumAktif
      ? kurikulumAktif.capaian.reduce((sum, c) => sum + c.jumlahPoin, 0)
      : 550;

    const result = mahasiswaBimbingan.map(mhs => {
      const totalPoin = mhs.perolehanPoin.reduce((sum, p) => sum + p.totalPoin, 0);
      const persentase = totalTarget > 0 ? Math.round((totalPoin / totalTarget) * 100) : 0;
      
      return {
        mahasiswaId: mhs.userId.toString(),
        nama: mhs.user.nama,
        nim: mhs.nim,
        prodi: mhs.prodi.nama,
        angkatan: mhs.angkatan,
        ipk: '-', // IPK not in schema
        capaianPersen: persentase,
        totalPoin,
        status: persentase < 50 ? 'perlu_perhatian' : 'on_track'
      };
    });

    res.status(200).json({
      success: true,
      data: result,
      total: result.length
    });

  } catch (error: any) {
    next(error);
  }
};

// ==================== DETAIL MAHASISWA BIMBINGAN ====================

export const getDetailMahasiswa = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dosenUserId = req.user?.id;
    if (!dosenUserId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const mahasiswaId = BigInt(req.params.mahasiswaId as string);

    // Validasi: mahasiswa ini harus bimbingan dosen ini
    const mahasiswa = await prisma.mahasiswa.findUnique({
      where: { userId: mahasiswaId },
      include: {
        user: { select: { nama: true } },
        prodi: { select: { nama: true } }
      }
    });

    if (!mahasiswa || mahasiswa.dosenPaId !== BigInt(dosenUserId)) {
      return res.status(403).json({ success: false, message: 'Bukan mahasiswa bimbingan Anda' });
    }

    // Kurikulum aktif + capaian
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

    // Perolehan poin mahasiswa
    const perolehanPoin = await prisma.perolehanPoin.findMany({
      where: { mahasiswaId, status: 'sah' },
      include: {
        detail: {
          include: {
            subCapaian: { include: { capaian: true } }
          }
        }
      }
    });

    const totalPoin = perolehanPoin.reduce((sum, p) => sum + p.totalPoin, 0);
    const totalTarget = kurikulumAktif.capaian.reduce((sum, c) => sum + c.jumlahPoin, 0);

    // Poin per capaian (horizontal bar chart)
    const capaianMap: Record<number, number> = {};
    const subCapaianMap: Record<number, number> = {};
    for (const p of perolehanPoin) {
      for (const d of p.detail) {
        const capaianId = d.subCapaian.capaianId;
        capaianMap[capaianId] = (capaianMap[capaianId] || 0) + d.poin;
        subCapaianMap[d.subCapaianId] = (subCapaianMap[d.subCapaianId] || 0) + d.poin;
      }
    }

    const totalPoinPerCapaian = kurikulumAktif.capaian.map(c => ({
      id: c.id,
      nama: c.nama,
      targetPoin: c.jumlahPoin,
      poinTerkumpul: capaianMap[c.id] || 0,
      persentase: c.jumlahPoin > 0
        ? Math.round(((capaianMap[c.id] || 0) / c.jumlahPoin) * 100)
        : 0
    }));

    // Sub capaian detail (radar chart data)
    const subCapaianData = kurikulumAktif.capaian.map(c => ({
      capaianId: c.id,
      capaianNama: c.nama,
      subCapaian: c.subCapaian.map(sc => ({
        id: sc.id,
        nama: sc.nama,
        bobotPersen: sc.bobotPersen,
        poinTerkumpul: subCapaianMap[sc.id] || 0
      }))
    }));

    // Timeline Aktivitas (partisipasi + izin PA terbaru)
    const aktivitas = await prisma.partisipasi.findMany({
      where: { mahasiswaId },
      include: {
        kegiatan: {
          include: {
            kategori: { select: { nama: true } }
          }
        },
        izinPA: { orderBy: { createdAt: 'desc' }, take: 1 },
        klaimPoin: {
          select: { status: true },
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const timeline = aktivitas.map(a => {
      let statusAktivitas = 'Pending';
      if (a.izinPA[0]?.status === 'disetujui') statusAktivitas = 'Disetujui Dosen PA';
      else if (a.izinPA[0]?.status === 'ditolak') statusAktivitas = 'Ditolak';
      if (a.klaimPoin?.status === 'disetujui') statusAktivitas = 'Disetujui Universitas';

      return {
        namaKegiatan: a.kegiatan.nama,
        jenisKegiatan: a.kegiatan.kategori?.nama,
        tanggal: a.kegiatan.tanggalMulai,
        status: statusAktivitas
      };
    });

    // Riwayat Saran/Catatan dari Dosen PA ini ke mahasiswa ini
    const riwayatCatatan = await prisma.saranPA.findMany({
      where: {
        dosenPaId: BigInt(dosenUserId),
        mahasiswaId
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: {
        profil: {
          nama: mahasiswa.user.nama,
          nim: mahasiswa.nim,
          prodi: mahasiswa.prodi.nama,
          angkatan: mahasiswa.angkatan,
          ipk: '-'
        },
        totalPoin,
        totalTarget,
        persentaseTotal: totalTarget > 0 ? Math.round((totalPoin / totalTarget) * 100) : 0,
        totalPoinPerCapaian,
        subCapaianData,
        timeline,
        riwayatCatatan: riwayatCatatan.map(s => ({
          id: s.id.toString(),
          isi: s.isi,
          tanggal: s.createdAt
        }))
      }
    });

  } catch (error: any) {
    next(error);
  }
};

// ==================== MAHASISWA PERLU PERHATIAN ====================

export const getMahasiswaPerluPerhatian = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dosenUserId = req.user?.id;
    if (!dosenUserId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const mahasiswaBimbingan = await prisma.mahasiswa.findMany({
      where: { dosenPaId: BigInt(dosenUserId) },
      include: {
        user: { select: { nama: true } },
        prodi: { select: { nama: true } },
        perolehanPoin: {
          where: { status: 'sah' },
          select: { totalPoin: true }
        }
      }
    });

    const kurikulumAktif = await prisma.kurikulum.findFirst({
      where: { status: 'aktif' },
      include: { capaian: true }
    });

    const totalTarget = kurikulumAktif
      ? kurikulumAktif.capaian.reduce((sum, c) => sum + c.jumlahPoin, 0)
      : 550;

    // Filter hanya yang capaian < 50%
    const result = mahasiswaBimbingan
      .map(mhs => {
        const totalPoin = mhs.perolehanPoin.reduce((sum, p) => sum + p.totalPoin, 0);
        const persentase = totalTarget > 0 ? Math.round((totalPoin / totalTarget) * 100) : 0;
        return {
          mahasiswaId: mhs.userId.toString(),
          nama: mhs.user.nama,
          nim: mhs.nim,
          prodi: mhs.prodi.nama,
          ipk: '-',
          capaianPersen: persentase,
          totalPoin,
          status: 'perlu_perhatian'
        };
      })
      .filter(m => m.capaianPersen < 50);

    res.status(200).json({
      success: true,
      data: result,
      total: result.length
    });

  } catch (error: any) {
    next(error);
  }
};
