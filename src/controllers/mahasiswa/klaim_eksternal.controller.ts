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
        OR: [
          { klaimPoin: null },
          { klaimPoin: { status: 'draft' } }
        ]
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

    const { partisipasiId, peranUsulanId } = req.body;
    const file = req.file;

    if (!partisipasiId || !peranUsulanId || !file) {
      return res.status(400).json({ success: false, message: 'Harap isi semua kolom wajib dan unggah file bukti' });
    }

    const partisipasiIdBigInt = BigInt(partisipasiId);
    const peranUsulanIdInt = parseInt(peranUsulanId);
    const buktiUrl = `/uploads/${file.filename}`;

    // Cek partisipasi valid
    const partisipasi = await prisma.partisipasi.findUnique({
      where: { id: partisipasiIdBigInt },
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

    if (partisipasi.klaimPoin && partisipasi.klaimPoin.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Kegiatan ini sudah pernah diklaim.' });
    }

    // Update draft yang ada, atau buat baru
    let klaim;
    if (partisipasi.klaimPoin) {
      klaim = await prisma.klaimPoin.update({
        where: { id: partisipasi.klaimPoin.id },
        data: {
          peranUsulanId: peranUsulanIdInt,
          status: 'menunggu_validasi',
          bukti: {
            create: [{ tipe: 'pdf', url: buktiUrl }]
          }
        }
      });
    } else {
      klaim = await prisma.klaimPoin.create({
        data: {
          partisipasiId: partisipasiIdBigInt,
          peranUsulanId: peranUsulanIdInt,
          status: 'menunggu_validasi',
          bukti: {
            create: [{ tipe: 'pdf', url: buktiUrl }]
          }
        }
      });
    }

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
        peranUsulan: { select: { id: true, nama: true } },
        partisipasi: {
          include: {
            kegiatan: {
              include: {
                kategori: { select: { id: true, nama: true } },
                skala: { select: { id: true, nama: true } },
                kurikulum: { select: { id: true } }
              }
            }
          }
        },
        perolehanPoin: { select: { totalPoin: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Ambil matriks poin untuk estimasi (bulk lookup)
    const matriksMap = new Map<string, number>();
    const matriksList = await prisma.matriksPoin.findMany({
      select: { kurikulumId: true, kategoriId: true, skalaId: true, peranId: true, poin: true }
    });
    for (const m of matriksList) {
      matriksMap.set(`${m.kurikulumId}_${m.kategoriId}_${m.skalaId}_${m.peranId}`, m.poin);
    }

    const result = data.map((k) => {
      let statusStr = 'Pending';
      if (k.status === 'disetujui') statusStr = 'Disetujui';
      else if (k.status === 'ditolak') statusStr = 'Ditolak';
      else if (k.status === 'menunggu_validasi') statusStr = 'Menunggu Validasi';
      else if (k.status === 'menunggu_pimpinan') statusStr = 'Menunggu Pimpinan';
      else if (k.status === 'perlu_revisi') statusStr = 'Perlu Revisi';

      // Poin sah dari perolehanPoin (setelah disetujui)
      let poin: number | string | null = k.perolehanPoin?.totalPoin ?? null;

      // Jika belum ada perolehanPoin, estimasi dari MatriksPoin
      if (poin === null && k.peranUsulan && k.partisipasi?.kegiatan) {
        const keg = k.partisipasi.kegiatan;
        const key = `${keg.kurikulumId}_${keg.kategoriId}_${keg.skalaId}_${k.peranUsulan.id}`;
        const estimasi = matriksMap.get(key);
        poin = estimasi ?? null;
      }

      return {
        id: k.id.toString(),
        namaKegiatan: k.partisipasi.kegiatan.nama,
        jenisKegiatan: k.partisipasi.kegiatan.kategori?.nama,
        peran: k.peranUsulan?.nama,
        penyelenggara: k.partisipasi.kegiatan.penyelenggaraExt,
        tanggalPelaksanaan: k.partisipasi.kegiatan.tanggalMulai,
        skala: k.partisipasi.kegiatan.skala?.nama,
        poin,
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
