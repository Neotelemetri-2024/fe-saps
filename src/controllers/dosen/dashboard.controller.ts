import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';
import { hitungProgresKurikulumMahasiswa } from '../mahasiswa/dashboard.controller';
import { perolehanUntukKurikulum, resolveKurikulumMahasiswa } from '../../services/kurikulumResolver.service';

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
      return res.status(200).json({
        success: true,
        data: {
          dosen: {
            nama: req.user?.nama || 'Dosen',
            fakultas: '-',
            nidn: '-',
          },
          totalMahasiswa: 0,
          pendingApproval: 0,
          mahasiswaPerluPerhatian: 0,
          mahasiswaBimbingan: [],
          rekapKategori: [],
        },
      });
    }

    // Total Mahasiswa Bimbingan
    const mahasiswaBimbingan = await prisma.mahasiswa.findMany({
      where: { dosenPaId: BigInt(dosenUserId) },
      include: {
        user: { select: { nama: true } },
        prodi: { select: { nama: true } },
        perolehanPoin: {
          where: { status: 'sah' },
          include: {
            detail: {
              include: { subCapaian: { include: { capaian: true } } }
            }
          }
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
      namaMahasiswa: izin.partisipasi?.mahasiswa?.user?.nama || '-',
      namaKegiatan: izin.partisipasi?.kegiatan?.nama || '-',
      tanggal: izin.createdAt
    }));

    // Progres Capaian per mahasiswa berbasis kurikulum & identifikasi "perlu perhatian"
    const progresMahasiswa = [];
    let totalPoinSemua = 0;
    let perluPerhatianCount = 0;
    const kategoriPoinMap: Record<string, number> = {};

    for (const mhs of mahasiswaBimbingan) {
      let kurikulumMhs = null;
      try {
        kurikulumMhs = await resolveKurikulumMahasiswa(mhs);
      } catch {
        kurikulumMhs = null;
      }
      const poinKurikulum = kurikulumMhs ? perolehanUntukKurikulum(mhs.perolehanPoin, kurikulumMhs.id) : [];
      const prog = kurikulumMhs
        ? hitungProgresKurikulumMahasiswa(kurikulumMhs, poinKurikulum)
        : { totalPoin: 0, totalPoinProgres: 0, totalTarget: 0, persentaseTotal: 0, isLulus: false, statusKelulusan: 'Belum Memenuhi Syarat' };

      totalPoinSemua += prog.totalPoin;
      const persentase = prog.persentaseTotal;

      // Perlu perhatian: belum lulus dan capaian target < 50%
      const perluPerhatian = !prog.isLulus && persentase < 50;
      if (perluPerhatian) perluPerhatianCount++;

      progresMahasiswa.push({
        mahasiswaId: mhs.userId.toString(),
        nama: mhs.user.nama,
        nim: mhs.nim,
        prodi: mhs.prodi.nama,
        angkatan: mhs.angkatan,
        ipk: '-', // IPK tidak ada di schema, placeholder
        capaianPersen: persentase,
        totalPoin: prog.totalPoin,                   // Total riil
        totalPoinProgres: prog.totalPoinProgres,     // Poin masuk progres (capped)
        totalTarget: prog.totalTarget,
        isLulus: prog.isLulus,
        statusKelulusan: prog.statusKelulusan,
        status: prog.isLulus ? 'lulus' : perluPerhatian ? 'perlu_perhatian' : 'baik'
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
      const kategoriNama = kl.partisipasi?.kegiatan?.kategori?.nama || 'Lainnya';
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
          include: {
            detail: {
              include: { subCapaian: { include: { capaian: true } } }
            }
          }
        }
      }
    });

    const result = await Promise.all(mahasiswaBimbingan.map(async mhs => {
      let kurikulumMhs = null;
      try {
        kurikulumMhs = await resolveKurikulumMahasiswa(mhs);
      } catch {
        kurikulumMhs = null;
      }
      const poinKurikulum = kurikulumMhs ? perolehanUntukKurikulum(mhs.perolehanPoin, kurikulumMhs.id) : [];
      const prog = kurikulumMhs
        ? hitungProgresKurikulumMahasiswa(kurikulumMhs, poinKurikulum)
        : { totalPoin: 0, totalPoinProgres: 0, totalTarget: 0, persentaseTotal: 0, isLulus: false, statusKelulusan: 'Belum Memenuhi Syarat' };

      const persentase = prog.persentaseTotal;
      const perluPerhatian = !prog.isLulus && persentase < 50;
      
      return {
        mahasiswaId: mhs.userId.toString(),
        nama: mhs.user.nama,
        nim: mhs.nim,
        prodi: mhs.prodi.nama,
        angkatan: mhs.angkatan,
        ipk: '-', // IPK not in schema
        capaianPersen: persentase,
        totalPoin: prog.totalPoin,                   // Total riil
        totalPoinProgres: prog.totalPoinProgres,     // Poin target kelulusan (capped)
        totalTarget: prog.totalTarget,
        isLulus: prog.isLulus,
        statusKelulusan: prog.statusKelulusan,
        status: prog.isLulus ? 'lulus' : perluPerhatian ? 'perlu_perhatian' : 'baik'
      };
    }));

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

    // Ambil kurikulum assignment mahasiswa
    let kurikulumAktif;
    try {
      kurikulumAktif = await resolveKurikulumMahasiswa(mahasiswa);
    } catch {
      return res.status(400).json({ success: false, message: 'Kurikulum mahasiswa tidak dapat ditentukan' });
    }

    // Perolehan poin mahasiswa dengan detail sub capaian & capaian
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

    const poinKurikulum = perolehanUntukKurikulum(perolehanPoin, kurikulumAktif.id);
    const prog = hitungProgresKurikulumMahasiswa(kurikulumAktif, poinKurikulum);

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
        kurikulumNama: prog.kurikulumNama,
        totalPoin: prog.totalPoin,                   // Total riil mahasiswa (termasuk kelebihan)
        totalPoinProgres: prog.totalPoinProgres,     // Poin target kelulusan (capped)
        totalTarget: prog.totalTarget,
        persentaseTotal: prog.persentaseTotal,
        isLulus: prog.isLulus,
        statusKelulusan: prog.statusKelulusan,
        totalPoinPerCapaian: prog.progresTahunan.map((c: any) => ({
          id: c.id,
          nama: c.nama,
          targetPoin: c.targetPoin,
          poinTerkumpul: c.poinTerkumpul,
          poinProgres: c.poinProgres,
          poinLebih: c.poinLebih,
          persentase: c.persentase,
          status: c.status
        })),
        subCapaianData: prog.progresTahunan.map((c: any) => ({
          capaianId: c.id,
          capaianNama: c.nama,
          subCapaian: (c.subCapaian || []).map((sc: any) => ({
            id: sc.id,
            nama: sc.nama,
            bobotPersen: sc.bobotPersen,
            targetPoin: sc.targetPoin,
            poinTerkumpul: sc.poinTerkumpul,
            poinProgres: sc.poinProgres,
            poinLebih: sc.poinLebih,
            isTuntas: sc.isTuntas
          }))
        })),
        radarData: prog.radarData,
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

    const allKurikulumAktif = await prisma.kurikulum.findMany({
      where: { status: 'aktif' },
      include: {
        capaian: {
          orderBy: { urutan: 'asc' },
          include: { subCapaian: true }
        }
      }
    });

    const mahasiswaBimbingan = await prisma.mahasiswa.findMany({
      where: { dosenPaId: BigInt(dosenUserId) },
      include: {
        user: { select: { nama: true } },
        prodi: { select: { nama: true } },
        perolehanPoin: {
          where: { status: 'sah' },
          include: {
            detail: {
              include: { subCapaian: { include: { capaian: true } } }
            }
          }
        }
      }
    });

    // Filter hanya mahasiswa yang belum lulus dan capaian target < 50%
    const result = [];
    for (const mhs of mahasiswaBimbingan) {
      let kurikulumMhs = null;
      try {
        kurikulumMhs = await resolveKurikulumMahasiswa(mhs);
      } catch {
        kurikulumMhs = allKurikulumAktif[0] || null;
      }
      const poinKurikulum = kurikulumMhs ? perolehanUntukKurikulum(mhs.perolehanPoin, kurikulumMhs.id) : [];
      const prog = kurikulumMhs
        ? hitungProgresKurikulumMahasiswa(kurikulumMhs, poinKurikulum)
        : { totalPoin: 0, totalPoinProgres: 0, totalTarget: 0, persentaseTotal: 0, isLulus: false, statusKelulusan: 'Belum Memenuhi Syarat' };

      result.push({
          mahasiswaId: mhs.userId.toString(),
          nama: mhs.user.nama,
          nim: mhs.nim,
          prodi: mhs.prodi.nama,
          angkatan: mhs.angkatan,
          ipk: '-',
          capaianPersen: prog.persentaseTotal,
          totalPoin: prog.totalPoin,
          totalPoinProgres: prog.totalPoinProgres,
          totalTarget: prog.totalTarget,
          isLulus: prog.isLulus,
          statusKelulusan: prog.statusKelulusan,
          status: 'perlu_perhatian'
        });
    }

    const filtered = result.filter((m) => !m.isLulus && m.capaianPersen < 50);

    res.status(200).json({
      success: true,
      data: filtered,
      total: filtered.length
    });

  } catch (error: any) {
    next(error);
  }
};
