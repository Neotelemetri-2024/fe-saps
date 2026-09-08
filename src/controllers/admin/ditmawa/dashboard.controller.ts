import { Request, Response } from 'express';
import prisma from '../../../lib/prisma';

function labelAsal(asal: string | null | undefined): string {
  switch (asal) {
    case 'eksternal':
      return 'Eksternal';
    case 'kurikuler_ukm':
      return 'UKM';
    case 'kurikuler_ukmf':
      return 'UKMF';
    case 'universitas':
      return 'Event Global';
    default:
      return asal || '-';
  }
}

const kegiatanInclude = {
  kategori: { select: { nama: true } },
  skala: { select: { nama: true } },
  organisasi: { select: { nama: true } },
  kurikulum: { select: { id: true, nama: true } },
  pembuat: {
    select: {
      nama: true,
      mahasiswa: {
        select: {
          nim: true,
          kurikulum: { select: { id: true, nama: true } },
        },
      },
    },
  },
  _count: {
    select: { partisipasi: true },
  },
} as const;

function mapKegiatanRow(k: any) {
  return {
    id: k.id,
    namaKegiatan: k.nama,
    asal: k.asal,
    asalLabel: labelAsal(k.asal),
    kategori: k.kategori?.nama || '-',
    skala: k.skala?.nama || '-',
    tanggalMulai: k.tanggalMulai,
    tanggalSelesai: k.tanggalSelesai,
    diajukanPada: k.createdAt,
    peserta: k._count?.partisipasi ?? 0,
    pengaju: k.pembuat?.nama || k.organisasi?.nama || '-',
    kurikulumNama: k.pembuat?.mahasiswa?.kurikulum?.nama || k.kurikulum?.nama || null,
    status: k.status,
    statusRaw: k.status,
  };
}

async function fetchKegiatanTerbaru(asalFilter: object, take = 5) {
  const rows = await prisma.kegiatan.findMany({
    where: {
      status: { notIn: ['draft'] },
      ...asalFilter,
    },
    include: kegiatanInclude,
    orderBy: { createdAt: 'desc' },
    take,
  });
  return rows.map(mapKegiatanRow);
}

// GET /api/umum/dashboard/admin-ditmawa — Dashboard Admin Ditmawa
export const dashboardAdminDitmawa = async (req: Request, res: Response) => {
  try {
    const currentDate = new Date();
    const [disetujuiCount, pendingCount, ditolakCount, eventGlobalAktifCount] = await Promise.all([
      prisma.kegiatan.count({ where: { status: 'disetujui' } }),
      prisma.kegiatan.count({ where: { status: 'diajukan' } }),
      prisma.kegiatan.count({ where: { status: 'ditolak' } }),
      prisma.kegiatan.count({
        where: {
          status: { in: ['disetujui', 'terpublikasi', 'berlangsung'] },
          tanggalSelesai: { gte: currentDate },
          asal: 'universitas',
        },
      }),
    ]);

    const [eksternal, internal, eventGlobal] = await Promise.all([
      fetchKegiatanTerbaru({ asal: 'eksternal' }, 5),
      fetchKegiatanTerbaru({ asal: { in: ['kurikuler_ukm', 'kurikuler_ukmf'] } }, 5),
      fetchKegiatanTerbaru({ asal: 'universitas' }, 5),
    ]);

    res.json({
      success: true,
      data: {
        statistik: {
          disetujui: disetujuiCount,
          pending: pendingCount,
          ditolak: ditolakCount,
          eventGlobalAktif: eventGlobalAktifCount,
        },
        // kompatibilitas lama
        kegiatanTerbaru: [...eksternal, ...internal, ...eventGlobal].slice(0, 10),
        kegiatanEksternal: eksternal,
        kegiatanInternal: internal,
        kegiatanEventGlobal: eventGlobal,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};
