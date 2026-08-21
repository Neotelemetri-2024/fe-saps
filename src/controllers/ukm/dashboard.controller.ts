import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';

// ==================== DASHBOARD UKM ====================

export const getDashboardUKM = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Dapatkan organisasi di mana user ini menjadi operator
    const operator = await prisma.organisasiOperator.findFirst({
      where: { userId: BigInt(userId) },
      include: {
        organisasi: { select: { nama: true } }
      }
    });

    if (!operator) {
      return res.status(403).json({ success: false, message: 'Anda bukan operator organisasi/UKM manapun.' });
    }

    const organisasiId = operator.organisasiId;
    const namaOrganisasi = operator.organisasi.nama;

    const draftCount = await prisma.kegiatan.count({
      where: {
        organisasiId,
        status: 'draft'
      }
    });

    const pendingCount = await prisma.kegiatan.count({
      where: {
        organisasiId,
        status: { in: ['diajukan', 'terverifikasi', 'perlu_revisi'] }
      }
    });

    const disetujuiCount = await prisma.kegiatan.count({
      where: {
        organisasiId,
        status: { in: ['disetujui', 'terpublikasi'] }
      }
    });

    const ditolakCount = await prisma.kegiatan.count({
      where: {
        organisasiId,
        status: 'ditolak'
      }
    });

    const currentDate = new Date();
    const eventAktifCount = await prisma.kegiatan.count({
      where: {
        organisasiId,
        status: { in: ['disetujui', 'terpublikasi'] },
        tanggalSelesai: { gte: currentDate }
      }
    });

    // Riwayat Terbaru Pengajuan Kegiatan
    const riwayatTerbaru = await prisma.kegiatan.findMany({
      where: { organisasiId },
      include: {
        kategori: { select: { nama: true } },
        skala: { select: { nama: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const tabelRiwayat = riwayatTerbaru.map((k, i) => {
      return {
        no: i + 1,
        id: k.id,
        nama: k.nama,
        namaKegiatan: k.nama,
        jenis: k.kategori?.nama || '-',
        jenisKegiatan: k.kategori?.nama || '-',
        skala: k.skala?.nama || '-',
        tanggalMulai: k.tanggalMulai,
        tanggalSelesai: k.tanggalSelesai,
        diajukanPada: k.createdAt,
        createdAt: k.createdAt,
        status: k.status,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        organisasi: {
          id: organisasiId,
          nama: namaOrganisasi
        },
        statistik: {
          draft: draftCount,
          pending: pendingCount,
          disetujui: disetujuiCount,
          ditolak: ditolakCount,
          eventAktif: eventAktifCount
        },
        riwayatPengajuan: tabelRiwayat,
        // alias supaya FE lama tetap bisa baca
        riwayatKegiatan: tabelRiwayat,
        kegiatan: tabelRiwayat,
      }
    });

  } catch (error: any) {
    next(error);
  }
};
