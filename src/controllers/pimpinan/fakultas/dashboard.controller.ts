import { Request, Response } from 'express';
import prisma from '../../../lib/prisma';

// Helper untuk Pimpinan Fakultas / Pimpinan Utama
export const buildPimpinanDashboard = async (fakultasId?: number) => {
  const whereFakultas = fakultasId ? { fakultasId } : {};
  const whereMahasiswa = fakultasId ? { prodi: { fakultasId } } : {};

  const totalMahasiswa = await prisma.mahasiswa.count({ where: whereMahasiswa });

  const kurikulumAktif = await prisma.kurikulum.findFirst({
    where: { status: 'aktif' },
    include: { capaian: true }
  });
  const totalTargetPoinKurikulum = kurikulumAktif?.capaian.reduce((acc, c) => acc + c.jumlahPoin, 0) || 1;

  let kegiatanPending = 0;
  if (fakultasId) {
    kegiatanPending = await prisma.kegiatan.count({
      where: { status: 'terverifikasi', organisasi: { fakultasId } }
    });
  } else {
    kegiatanPending = await prisma.kegiatan.count({ where: { status: 'terverifikasi' } });
  }

  const kurikulumCount = await prisma.kurikulum.count({ where: { status: 'aktif' } });

  const prodiList = await prisma.programStudi.findMany({
    where: whereFakultas,
    include: {
      mahasiswa: {
        include: {
          perolehanPoin: {
            where: { status: 'sah' },
            include: { kegiatan: { include: { kategori: true, skala: true } } }
          }
        }
      }
    }
  });

  let totalKeseluruhanPoin = 0;
  let sumPersentaseMhs = 0;
  const skalaGlobalMap: Record<string, number> = {};

  const prodiStats = prodiList.map((prodi: any) => {
    let totalPoinProdi = 0;
    const kategoriMap: Record<string, number> = {};

    prodi.mahasiswa.forEach((mhs: any) => {
      let poinMhs = 0;
      mhs.perolehanPoin.forEach((pp: any) => {
        poinMhs += pp.totalPoin;
        totalPoinProdi += pp.totalPoin;
        const kategoriName = pp.kegiatan.kategori?.nama.toLowerCase() || 'lainnya';
        if (!kategoriMap[kategoriName]) kategoriMap[kategoriName] = 0;
        kategoriMap[kategoriName] += pp.totalPoin;

        const skalaName = pp.kegiatan.skala?.nama || 'Lainnya';
        if (!skalaGlobalMap[skalaName]) skalaGlobalMap[skalaName] = 0;
        skalaGlobalMap[skalaName] += pp.totalPoin;
      });
      sumPersentaseMhs += Math.min((poinMhs / totalTargetPoinKurikulum) * 100, 100);
    });
    totalKeseluruhanPoin += totalPoinProdi;

    const avgProdi = prodi.mahasiswa.length > 0
      ? Math.round(prodi.mahasiswa.reduce((sum: number, m: any) =>
          sum + Math.min((m.perolehanPoin.reduce((s: number, p: any) => s + p.totalPoin, 0) / totalTargetPoinKurikulum) * 100, 100), 0)
        / prodi.mahasiswa.length)
      : 0;

    return { prodiId: prodi.id, nama: prodi.nama, totalPoinAbsolut: totalPoinProdi, rataRataCapaianPersen: avgProdi, kategoriPoin: kategoriMap, jumlahMahasiswa: prodi.mahasiswa.length };
  });

  prodiStats.sort((a: any, b: any) => b.rataRataCapaianPersen - a.rataRataCapaianPersen);

  const peringkatProdi = prodiStats.map((p: any, index: number) => ({
    ranking: index + 1, 
    programStudi: p.nama, 
    rataRataCapaian: p.rataRataCapaianPersen, 
    totalPoin: p.totalPoinAbsolut,
    kategoriPoin: p.kategoriPoin
  }));

  const distribusiPoin = prodiStats.map((p: any) => ({
    programStudi: p.nama, totalPoin: p.totalPoinAbsolut,
    persentaseDariTotal: totalKeseluruhanPoin > 0 ? Math.round((p.totalPoinAbsolut / totalKeseluruhanPoin) * 100) : 0,
    jumlahMahasiswa: p.jumlahMahasiswa
  }));

  const poinBerdasarkanSkala = Object.entries(skalaGlobalMap).map(([nama, totalPoin]) => ({
    skala: nama,
    totalPoin,
    persentaseDariTotal: totalKeseluruhanPoin > 0 ? Math.round((totalPoin / totalKeseluruhanPoin) * 100) : 0
  }));

  const rataRataCapaianGlobal = totalMahasiswa > 0 ? Math.round(sumPersentaseMhs / totalMahasiswa) : 0;

  return {
    statistik: { totalMahasiswa, rataRataCapaian: rataRataCapaianGlobal, kegiatanPending, kurikulumAktif: kurikulumCount },
    peringkatProdi,
    distribusiPoin,
    poinBerdasarkanSkala
  };
};

// GET /api/pimpinan/dashboard — Pimpinan Fakultas (scope per fakultas)
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
