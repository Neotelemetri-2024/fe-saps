import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';
import { z } from 'zod';

const submitKlaimEksternalSchema = z.object({
  partisipasiId: z.number().int().positive(),
  peranUsulanId: z.number().int().positive(),
  buktiUrl: z.string().url(),
});

// 1. Mengambil Kegiatan Eksternal yang tersedia untuk diklaim
// Syarat: diajukan oleh mhsw ybs (disetujui admin), ada partisipasi, izin PA disetujui, belum diklaim
export const getKegiatanTersedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Cari partisipasi milik mahasiswa ini untuk kegiatan eksternal yg dibuatnya
    const partisipasiTersedia = await prisma.partisipasi.findMany({
      where: {
        mahasiswaId: BigInt(userId),
        kegiatan: {
          asal: 'eksternal',
          dibuatOleh: BigInt(userId),
          status: { in: ['terpublikasi', 'disetujui'] }, // Sudah disetujui Admin
        },
        izinPA: {
          some: { status: 'disetujui' } // Sudah diizinkan PA
        },
        klaimPoin: null // Belum pernah diklaim
      },
      include: {
        kegiatan: {
          include: {
            kategori: { select: { id: true, nama: true } }
          }
        }
      }
    });

    const result = partisipasiTersedia.map(p => ({
      partisipasiId: p.id.toString(),
      kegiatanId: p.kegiatan.id,
      namaKegiatan: p.kegiatan.nama,
      jenisKegiatan: p.kegiatan.kategori?.nama,
      kategoriId: p.kegiatan.kategoriId,
      tanggalPelaksanaan: p.kegiatan.tanggalMulai
    }));

    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    next(error);
  }
};

// 2. Submit Klaim Poin Eksternal
export const ajukanKlaimEksternal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const body = submitKlaimEksternalSchema.parse(req.body);

    // Cek partisipasi valid
    const partisipasi = await prisma.partisipasi.findUnique({
      where: { id: BigInt(body.partisipasiId) },
      include: {
        kegiatan: true,
        izinPA: { where: { status: 'disetujui' }, take: 1 },
        klaimPoin: true
      }
    });

    if (!partisipasi || partisipasi.mahasiswaId !== BigInt(userId)) {
      return res.status(404).json({ success: false, message: 'Partisipasi tidak ditemukan atau tidak valid' });
    }

    if (partisipasi.kegiatan.asal !== 'eksternal') {
      return res.status(400).json({ success: false, message: 'Klaim ini khusus untuk kegiatan eksternal' });
    }

    if (partisipasi.izinPA.length === 0) {
      return res.status(400).json({ success: false, message: 'Izin Dosen PA belum disetujui. Tidak dapat mengklaim poin.' });
    }

    if (partisipasi.klaimPoin) {
      return res.status(400).json({ success: false, message: 'Kegiatan ini sudah pernah diklaim.' });
    }

    // Buat Klaim
    const klaim = await prisma.klaimPoin.create({
      data: {
        partisipasiId: BigInt(body.partisipasiId),
        peranUsulanId: body.peranUsulanId,
        status: 'menunggu_validasi',
        bukti: {
          create: [{ tipe: 'pdf', url: body.buktiUrl }]
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Klaim poin eksternal berhasil diajukan',
      data: { klaimId: klaim.id.toString() }
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validasi gagal', errors: error.issues });
    } else {
      next(error);
    }
  }
};

// 3. Mengambil Riwayat Klaim Eksternal
export const getRiwayatKlaimEksternal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Ambil klaim poin dimana kegiatan = eksternal dan dibuat oleh mahasiswa ini
    const data = await prisma.klaimPoin.findMany({
      where: {
        partisipasi: {
          mahasiswaId: BigInt(userId),
          kegiatan: {
            asal: 'eksternal',
            dibuatOleh: BigInt(userId)
          }
        }
      },
      include: {
        peranUsulan: { select: { nama: true } },
        partisipasi: {
          include: {
            kegiatan: {
              include: {
                kategori: { select: { nama: true } },
                skala: { select: { nama: true } }
              }
            }
          }
        },
        perolehanPoin: { select: { totalPoin: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const result = data.map((k) => {
      let statusStr = 'Pending';
      if (k.status === 'disetujui') statusStr = 'Disetujui';
      else if (k.status === 'ditolak') statusStr = 'Ditolak';

      return {
        id: k.id.toString(),
        namaKegiatan: k.partisipasi.kegiatan.nama,
        jenisKegiatan: k.partisipasi.kegiatan.kategori?.nama,
        peran: k.peranUsulan?.nama,
        penyelenggara: k.partisipasi.kegiatan.penyelenggaraExt,
        tanggalPelaksanaan: k.partisipasi.kegiatan.tanggalMulai,
        skala: k.partisipasi.kegiatan.skala?.nama,
        poin: k.perolehanPoin?.totalPoin || '-',
        status: statusStr,
        alasan: k.alasan || null,
        tanggalKlaim: k.createdAt
      };
    });

    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    next(error);
  }
};
