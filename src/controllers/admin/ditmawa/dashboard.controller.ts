import { Request, Response } from 'express';
import prisma from '../../../lib/prisma';

// GET /api/admin/dashboard â€” Dashboard Admin Ditmawa
export const dashboardAdminDitmawa = async (req: Request, res: Response) => {
  try {
    const currentDate = new Date();
    const [disetujuiCount, pendingCount, ditolakCount, eventGlobalAktifCount] = await Promise.all([
      prisma.kegiatan.count({ where: { status: 'disetujui' } }),
      prisma.kegiatan.count({ where: { status: 'diajukan' } }),
      prisma.kegiatan.count({ where: { status: 'ditolak' } }),
      prisma.kegiatan.count({
        where: {
          status: 'disetujui',
          tanggalSelesai: { gte: currentDate },
          skala: {
            nama: {
              in: ['Internasional', 'Nasional']
            }
          }
        }
      })
    ]);

    const riwayatTerbaru = await prisma.kegiatan.findMany({
      include: { 
        kategori: { select: { nama: true } }, 
        skala: { select: { nama: true } },
        _count: {
          select: { partisipasi: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const tabelRiwayat = riwayatTerbaru.map((k) => {
      let statusStr = 'Pending';
      if (k.status === 'disetujui' || k.status === 'terpublikasi') statusStr = 'Aktif';
      else if (k.status === 'ditolak') statusStr = 'Ditolak';
      else if (k.status === 'perlu_revisi') statusStr = 'Revisi';
      else if (k.status === 'draft') statusStr = 'Draft';

      return {
        id: k.id,
        namaKegiatan: k.nama,
        kategori: k.kategori?.nama || '-',
        skala: k.skala?.nama || '-',
        tanggalMulai: k.tanggalMulai,
        tanggalSelesai: k.tanggalSelesai,
        peserta: k._count.partisipasi,
        poin: 50, // default fallback sesuai UI
        status: statusStr
      };
    });

    res.json({
      success: true,
      data: {
        statistik: { 
          disetujui: disetujuiCount, 
          pending: pendingCount, 
          ditolak: ditolakCount, 
          eventGlobalAktif: eventGlobalAktifCount 
        },
        kegiatanTerbaru: tabelRiwayat,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};
