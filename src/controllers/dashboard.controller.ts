import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// ==================== DASHBOARD MAHASISWA ====================

// GET /api/dashboard/mahasiswa?mahasiswaId=X
export const dashboardMahasiswa = async (req: Request, res: Response): Promise<void> => {
  try {
    const mahasiswaId = BigInt(req.query.mahasiswaId as string);

    const mahasiswa = await prisma.mahasiswa.findUnique({
      where: { userId: mahasiswaId },
      include: {
        user: { select: { nama: true, email: true } },
        prodi: { include: { fakultas: true } },
        dosenPA: { include: { user: { select: { nama: true } } } },
      },
    });
    if (!mahasiswa) {
      res.status(404).json({ success: false, message: 'Mahasiswa tidak ditemukan' });
      return;
    }

    // Poin per capaian (portofolio view)
    const perolehanDetail = await prisma.perolehanDetail.findMany({
      where: {
        perolehanPoin: { mahasiswaId, status: 'sah' },
      },
      include: {
        subCapaian: { include: { capaian: true } },
      },
    });

    // Agregasi per capaian
    const capaianMap = new Map<number, { nama: string; target: number; diperoleh: number }>();
    for (const d of perolehanDetail) {
      const capId = d.subCapaian.capaianId;
      if (!capaianMap.has(capId)) {
        capaianMap.set(capId, {
          nama: d.subCapaian.capaian.nama,
          target: d.subCapaian.capaian.jumlahPoin,
          diperoleh: 0,
        });
      }
      capaianMap.get(capId)!.diperoleh += d.poin;
    }

    const capaianProgress = Array.from(capaianMap.entries()).map(([id, c]) => ({
      capaianId: id,
      nama: c.nama,
      targetPoin: c.target,
      poinDiperoleh: c.diperoleh,
      persentase: Math.round((c.diperoleh / c.target) * 100),
    }));

    // Total poin
    const totalPoin = capaianProgress.reduce((sum, c) => sum + c.poinDiperoleh, 0);

    // Kurikulum aktif — ambil total target
    const kurikulumAktif = await prisma.kurikulum.findFirst({
      where: { status: 'aktif' },
      include: { capaian: true },
    });
    const totalTarget = kurikulumAktif?.capaian.reduce((s, c) => s + c.jumlahPoin, 0) ?? 550;

    // Statistik
    const [partisipasiCount, klaimPending, unreadNotif] = await Promise.all([
      prisma.partisipasi.count({ where: { mahasiswaId } }),
      prisma.klaimPoin.count({ where: { partisipasi: { mahasiswaId }, status: { in: ['draft', 'menunggu_validasi'] } } }),
      prisma.notifikasi.count({ where: { userId: mahasiswaId, dibaca: false } }),
    ]);

    // Kegiatan aktif (terpublikasi/berlangsung)
    const kegiatanAktif = await prisma.kegiatan.findMany({
      where: { status: { in: ['terpublikasi', 'berlangsung'] } },
      include: { kategori: true, skala: true },
      orderBy: { tanggalMulai: 'asc' },
      take: 5,
    });

    res.json({
      success: true,
      data: {
        profil: {
          userId: mahasiswa.userId,
          nim: mahasiswa.nim,
          nama: mahasiswa.user.nama,
          email: mahasiswa.user.email,
          prodi: mahasiswa.prodi.nama,
          fakultas: mahasiswa.prodi.fakultas.nama,
          angkatan: mahasiswa.angkatan,
          dosenPA: mahasiswa.dosenPA ? mahasiswa.dosenPA.user.nama : null,
        },
        ringkasan: {
          totalPoin,
          totalTarget,
          persentase: Math.round((totalPoin / totalTarget) * 100),
          eligibleYudisium: totalPoin >= totalTarget,
          totalPartisipasi: partisipasiCount,
          klaimPending,
        },
        capaianProgress,
        kegiatanAktif,
        unreadNotif,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// ==================== DASHBOARD DOSEN PA ====================

// GET /api/dashboard/dosen-pa?dosenPaId=X
export const dashboardDosenPA = async (req: Request, res: Response): Promise<void> => {
  try {
    const dosenPaId = BigInt(req.query.dosenPaId as string);

    const totalMahasiswa = await prisma.mahasiswa.count({ where: { dosenPaId } });
    const pendingIzin = await prisma.izinPA.count({ where: { dosenPaId, status: 'diajukan' } });

    const mahasiswaBimbingan = await prisma.mahasiswa.findMany({
      where: { dosenPaId },
      include: {
        user: { select: { nama: true } },
        perolehanPoin: { where: { status: 'sah' }, select: { totalPoin: true } },
      },
    });

    const kurikulumAktif = await prisma.kurikulum.findFirst({
      where: { status: 'aktif' },
      include: { capaian: true },
    });
    const totalTarget = kurikulumAktif?.capaian.reduce((s, c) => s + c.jumlahPoin, 0) ?? 550;

    const mahasiswaProgress = mahasiswaBimbingan.map(mhs => {
      const totalPoin = mhs.perolehanPoin.reduce((s, p) => s + p.totalPoin, 0);
      const persentase = Math.round((totalPoin / totalTarget) * 100);
      let status: 'HIJAU' | 'KUNING' | 'MERAH';
      if (persentase >= 60) status = 'HIJAU';
      else if (persentase >= 30) status = 'KUNING';
      else status = 'MERAH';

      return {
        userId: mhs.userId,
        nim: mhs.nim,
        nama: mhs.user.nama,
        angkatan: mhs.angkatan,
        totalPoin,
        totalTarget,
        persentase,
        status,
      };
    });

    const perluPerhatian = mahasiswaProgress.filter(m => m.status === 'MERAH').length;

    res.json({
      success: true,
      data: {
        totalMahasiswa,
        pendingIzin,
        perluPerhatian,
        mahasiswa: mahasiswaProgress,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// ==================== DASHBOARD ADMIN DITMAWA ====================

// GET /api/dashboard/admin-ditmawa
export const dashboardAdminDitmawa = async (req: Request, res: Response) => {
  try {
    const [kegiatanPending, klaimPending, totalKegiatan, totalMahasiswa] = await Promise.all([
      prisma.kegiatan.count({ where: { status: 'diajukan' } }),
      prisma.klaimPoin.count({ where: { status: 'menunggu_validasi' } }),
      prisma.kegiatan.count(),
      prisma.mahasiswa.count(),
    ]);

    const kegiatanTerbaru = await prisma.kegiatan.findMany({
      include: { kategori: true, skala: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({
      success: true,
      data: {
        statistik: { kegiatanPending, klaimPending, totalKegiatan, totalMahasiswa },
        kegiatanTerbaru,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// ==================== DASHBOARD PIMPINAN DITMAWA ====================

const buildPimpinanDashboard = async (fakultasId?: number) => {
  const whereFakultas = fakultasId ? { fakultasId } : {};
  const whereMahasiswa = fakultasId ? { prodi: { fakultasId } } : {};

  // 1. Statistik
  const totalMahasiswa = await prisma.mahasiswa.count({ where: whereMahasiswa });
  
  const kurikulumAktif = await prisma.kurikulum.findFirst({
    where: { status: 'aktif' },
    include: { capaian: true }
  });
  const totalTargetPoinKurikulum = kurikulumAktif?.capaian.reduce((acc, c) => acc + c.jumlahPoin, 0) || 1; 

  let kegiatanPending = 0;
  if (fakultasId) {
    kegiatanPending = await prisma.kegiatan.count({
      where: { 
        status: 'terverifikasi', 
        organisasi: { fakultasId } 
      }
    });
  } else {
    kegiatanPending = await prisma.kegiatan.count({
      where: { status: 'terverifikasi' }
    });
  }

  const kurikulumCount = await prisma.kurikulum.count({ where: { status: 'aktif' } });

  // 2. Agregasi per prodi
  const prodiList = await prisma.programStudi.findMany({
    where: whereFakultas,
    include: {
      mahasiswa: {
        include: {
          perolehanPoin: {
            where: { status: 'sah' },
            include: {
              kegiatan: { include: { kategori: true } },
            }
          }
        }
      }
    }
  });

  let totalKeseluruhanPoin = 0;
  let sumPersentaseMhs = 0;

  const prodiStats = prodiList.map((prodi: any) => {
    let totalPoinProdi = 0;
    const kategoriMap: Record<string, number> = {};

    prodi.mahasiswa.forEach((mhs: any) => {
      let poinMhs = 0;
      mhs.perolehanPoin.forEach((pp: any) => {
        poinMhs += pp.totalPoin;
        totalPoinProdi += pp.totalPoin;
        
        const kategoriName = pp.kegiatan.kategori.nama.toLowerCase();
        if (!kategoriMap[kategoriName]) kategoriMap[kategoriName] = 0;
        kategoriMap[kategoriName] += pp.totalPoin;
      });

      const persentaseMhs = Math.min((poinMhs / totalTargetPoinKurikulum) * 100, 100);
      sumPersentaseMhs += persentaseMhs;
    });

    totalKeseluruhanPoin += totalPoinProdi;

    const avgProdi = prodi.mahasiswa.length > 0 
      ? Math.round(prodi.mahasiswa.reduce((sum: number, m: any) => sum + Math.min((m.perolehanPoin.reduce((s: number, p: any) => s + p.totalPoin, 0) / totalTargetPoinKurikulum) * 100, 100), 0) / prodi.mahasiswa.length)
      : 0;

    return {
      prodiId: prodi.id,
      nama: prodi.nama,
      totalPoinAbsolut: totalPoinProdi,
      rataRataCapaianPersen: avgProdi,
      kategoriPoin: kategoriMap,
      jumlahMahasiswa: prodi.mahasiswa.length
    };
  });

  prodiStats.sort((a: any, b: any) => b.rataRataCapaianPersen - a.rataRataCapaianPersen);
  
  const peringkatProdi = prodiStats.map((p: any, index: number) => ({
    ranking: index + 1,
    programStudi: p.nama,
    rataRataCapaian: p.rataRataCapaianPersen,
    kategoriPoin: p.kategoriPoin
  }));

  const distribusiPoin = prodiStats.map((p: any) => ({
    programStudi: p.nama,
    totalPoin: p.totalPoinAbsolut,
    persentaseDariTotal: totalKeseluruhanPoin > 0 ? Math.round((p.totalPoinAbsolut / totalKeseluruhanPoin) * 100) : 0,
    jumlahMahasiswa: p.jumlahMahasiswa
  }));

  const rataRataCapaianGlobal = totalMahasiswa > 0 ? Math.round(sumPersentaseMhs / totalMahasiswa) : 0;

  return {
    statistik: {
      totalMahasiswa,
      rataRataCapaian: rataRataCapaianGlobal,
      kegiatanPending,
      kurikulumAktif: kurikulumCount
    },
    peringkatProdi,
    distribusiPoin
  };
};

// GET /api/dashboard/pimpinan-ditmawa
export const dashboardPimpinanDitmawa = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await buildPimpinanDashboard();
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// ==================== DASHBOARD PIMPINAN FAKULTAS ====================

// GET /api/dashboard/pimpinan-fakultas
export const dashboardPimpinanFakultas = async (req: Request, res: Response): Promise<void> => {
  try {
    const userJabatan = req.user!.jabatan;
    if (userJabatan !== 'pimpinan_fakultas') {
      res.status(403).json({ success: false, message: 'Akses ditolak' });
      return;
    }

    const staffData = await prisma.staff.findUnique({
      where: { userId: BigInt(req.user!.id) },
      select: { fakultasId: true }
    });

    if (!staffData || !staffData.fakultasId) {
      res.status(400).json({ success: false, message: 'Fakultas tidak ditemukan untuk user ini' });
      return;
    }

    const data = await buildPimpinanDashboard(staffData.fakultasId);
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// ==================== PORTOFOLIO & CV ====================

// GET /api/portofolio/:mahasiswaId — Portofolio lengkap mahasiswa
export const getPortofolio = async (req: Request, res: Response): Promise<void> => {
  try {
    const mahasiswaId = BigInt(req.params.mahasiswaId as string);

    const mahasiswa = await prisma.mahasiswa.findUnique({
      where: { userId: mahasiswaId },
      include: {
        user: { select: { nama: true, email: true } },
        prodi: { include: { fakultas: true } },
      },
    });
    if (!mahasiswa) {
      res.status(404).json({ success: false, message: 'Mahasiswa tidak ditemukan' });
      return;
    }

    const perolehan = await prisma.perolehanPoin.findMany({
      where: { mahasiswaId, status: 'sah' },
      include: {
        kegiatan: { include: { kategori: true, skala: true } },
        detail: { include: { subCapaian: { include: { capaian: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalPoin = perolehan.reduce((s, p) => s + p.totalPoin, 0);

    // Ringkasan per capaian
    const capaianMap = new Map<number, { nama: string; target: number; diperoleh: number }>();
    for (const p of perolehan) {
      for (const d of p.detail) {
        const capId = d.subCapaian.capaianId;
        if (!capaianMap.has(capId)) {
          capaianMap.set(capId, {
            nama: d.subCapaian.capaian.nama,
            target: d.subCapaian.capaian.jumlahPoin,
            diperoleh: 0,
          });
        }
        capaianMap.get(capId)!.diperoleh += d.poin;
      }
    }

    // Riwayat per kategori
    const riwayatPerKategori: Record<string, any[]> = {};
    for (const p of perolehan) {
      const kat = p.kegiatan.kategori.nama;
      if (!riwayatPerKategori[kat]) riwayatPerKategori[kat] = [];
      riwayatPerKategori[kat].push({
        kegiatan: p.kegiatan.nama,
        skala: p.kegiatan.skala.nama,
        totalPoin: p.totalPoin,
        tanggal: p.kegiatan.tanggalMulai,
      });
    }

    res.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        mahasiswa: {
          nim: mahasiswa.nim,
          nama: mahasiswa.user.nama,
          email: mahasiswa.user.email,
          prodi: mahasiswa.prodi.nama,
          fakultas: mahasiswa.prodi.fakultas.nama,
          angkatan: mahasiswa.angkatan,
        },
        ringkasan: {
          totalPoin,
          totalKegiatan: perolehan.length,
        },
        capaianProgress: Array.from(capaianMap.entries()).map(([id, c]) => ({
          capaianId: id,
          nama: c.nama,
          target: c.target,
          diperoleh: c.diperoleh,
          persentase: Math.round((c.diperoleh / c.target) * 100),
        })),
        riwayatPerKategori,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};
