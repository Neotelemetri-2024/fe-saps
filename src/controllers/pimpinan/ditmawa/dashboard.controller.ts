import { Request, Response } from 'express';
import prisma from '../../../lib/prisma';

// GET /api/pimpinan/dashboard — Pimpinan Ditmawa (semua prodi)
export const dashboardPimpinanDitmawa = async (req: Request, res: Response): Promise<void> => {
  try {
    const userJabatan = req.user!.jabatan;
    if (userJabatan !== 'pimpinan_ditmawa') {
      res.status(403).json({ success: false, message: 'Akses ditolak' });
      return;
    }

    // 1. Kartu Metrik
    const [mahasiswaAktif, totalFakultas, totalPending, kurikulumAktifData] = await Promise.all([
      prisma.user.count({ where: { peran: 'mahasiswa', aktif: true } }),
      prisma.fakultas.count(),
      prisma.kegiatan.count({ where: { status: 'terverifikasi' } }), // menunggu pimpinan
      prisma.kurikulum.findFirst({ where: { status: 'aktif' }, select: { nama: true } })
    ]);

    const kurikulumAktif = kurikulumAktifData?.nama || 'Belum Ada Kurikulum Aktif';

    // 2. Grafik poin per UKM berdasarkan pengajuan Kegiatan
    // Ambil daftar UKM
    const ukms = await prisma.organisasi.findMany({
      where: { tipe: 'UKM' },
      select: { id: true, nama: true }
    });

    // Untuk tiap UKM, hitung total poin dari PerolehanPoin
    const grafikData = await Promise.all(
      ukms.map(async (ukm) => {
        const perolehans = await prisma.perolehanPoin.findMany({
          where: {
            status: 'sah',
            kegiatan: { organisasiId: ukm.id }
          },
          select: { totalPoin: true }
        });

        const totalPoin = perolehans.reduce((sum, p) => sum + p.totalPoin, 0);

        return {
          ukm: ukm.nama,
          totalPoin: totalPoin
        };
      })
    );

    // Sortir menurun berdasarkan total poin untuk mempercantik grafik
    grafikData.sort((a, b) => b.totalPoin - a.totalPoin);

    const data = {
      statistik: {
        mahasiswaAktif,
        totalFakultas,
        totalPending,
        kurikulumAktif
      },
      grafikPoinUkm: grafikData
    };

    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};
