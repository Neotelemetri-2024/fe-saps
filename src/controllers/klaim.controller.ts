import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';
import { logAudit } from '../lib/auditLog';

// ==================== VALIDASI ====================
const createKlaimSchema = z.object({
  peranUsulanId: z.number().int().positive(),
  bukti: z.array(z.object({
    tipe: z.enum(['pdf', 'link']),
    url: z.string().min(3),
  })).optional(),
});

const validasiKlaimSchema = z.object({
  keputusan: z.enum(['disetujui', 'perlu_revisi', 'ditolak']),
  alasan: z.string().optional(),
  peranVerifId: z.number().int().positive().optional(), // crosscheck peran
});

// ==================== KLAIM POIN ====================

// POST /api/klaim — Mahasiswa ajukan klaim poin atas partisipasi
export const createKlaim = async (req: Request, res: Response): Promise<void> => {
  try {
    const mahasiswaId = BigInt(req.body.mahasiswaId);
    const partisipasiId = BigInt(req.body.partisipasiId);
    const body = createKlaimSchema.parse(req.body);

    // Cek partisipasi valid + izin PA sudah disetujui [BR-019]
    const partisipasi = await prisma.partisipasi.findUnique({
      where: { id: partisipasiId },
      include: {
        kegiatan: true,
        izinPA: { where: { status: 'disetujui' }, take: 1 },
      },
    });

    if (!partisipasi) {
      res.status(404).json({ success: false, message: 'Partisipasi tidak ditemukan' });
      return;
    }
    if (partisipasi.mahasiswaId !== mahasiswaId) {
      res.status(403).json({ success: false, message: 'Bukan partisipasi Anda' });
      return;
    }

    // Gate: izin PA harus sudah disetujui [BR-019]
    // Untuk kegiatan eksternal, izin bisa di titik klaim [BR-015]
    if (partisipasi.kegiatan.asal !== 'eksternal' && partisipasi.izinPA.length === 0) {
      res.status(400).json({ success: false, message: 'Izin PA belum disetujui. Klaim tidak bisa dilakukan [BR-019]' });
      return;
    }

    // Tentukan validator berdasarkan asal kegiatan [BR-018]
    let validatorId: bigint | null = null;
    if (partisipasi.kegiatan.organisasiId) {
      // Kegiatan internal (UKM/UKMF) — validator = operator organisasi
      const operator = await prisma.organisasiOperator.findFirst({
        where: { organisasiId: partisipasi.kegiatan.organisasiId },
      });
      validatorId = operator?.userId ?? null;
    }
    // Jika tidak ada organisasi (universitas/eksternal) → validator = Admin Ditmawa (diisi saat validasi)

    // Buat klaim + bukti [BR-020 lapis 2: UNIQUE partisipasiId]
    const klaim = await prisma.klaimPoin.create({
      data: {
        partisipasiId,
        peranUsulanId: body.peranUsulanId,
        status: 'menunggu_validasi',
        validatorId,
        bukti: body.bukti ? {
          create: body.bukti.map(b => ({ tipe: b.tipe, url: b.url })),
        } : undefined,
      },
      include: { bukti: true },
    });

    await logAudit({
      entitas: 'klaim_poin',
      entitasId: klaim.id,
      aksi: 'create',
      statusBaru: 'menunggu_validasi',
      aktorId: mahasiswaId,
    });

    res.status(201).json({ success: true, data: klaim });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      res.status(409).json({ success: false, message: 'Klaim sudah pernah diajukan untuk partisipasi ini [BR-020]' });
    } else if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validasi gagal', errors: error.issues });
    } else {
      console.error(error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
  }
};

// GET /api/klaim/saya?mahasiswaId=X — Daftar klaim milik mahasiswa
export const getMyKlaim = async (req: Request, res: Response) => {
  try {
    const mahasiswaId = BigInt(req.query.mahasiswaId as string);
    const data = await prisma.klaimPoin.findMany({
      where: { partisipasi: { mahasiswaId } },
      include: {
        partisipasi: {
          include: {
            kegiatan: { include: { kategori: true, skala: true } },
          },
        },
        peranUsulan: true,
        bukti: true,
        perolehanPoin: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// GET /api/klaim/validasi?validatorId=X — Daftar klaim menunggu validasi
export const getKlaimForValidasi = async (req: Request, res: Response) => {
  try {
    const { validatorId, status } = req.query;
    const where: any = {};
    if (validatorId) where.validatorId = BigInt(validatorId as string);
    if (status) where.status = status as string;
    else where.status = 'menunggu_validasi';

    const data = await prisma.klaimPoin.findMany({
      where,
      include: {
        partisipasi: {
          include: {
            kegiatan: { include: { kategori: true, skala: true } },
            mahasiswa: { include: { user: { select: { nama: true } } } },
            peranVerif: true,
          },
        },
        peranUsulan: true,
        bukti: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// PUT /api/klaim/:id/validasi — Validator (penyelenggara) crosscheck klaim & proses poin [BR-030]
export const validasiKlaim = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const aktorId = BigInt(req.body.aktorId);
    const body = validasiKlaimSchema.parse(req.body);

    const klaim = await prisma.klaimPoin.findUnique({
      where: { id: BigInt(id) },
      include: { 
        partisipasi: {
          include: {
            kegiatan: {
              include: {
                kegiatanCapaian: true,
              }
            },
            mahasiswa: true
          }
        } 
      },
    });

    if (!klaim) {
      res.status(404).json({ success: false, message: 'Klaim tidak ditemukan' });
      return;
    }
    if (klaim.status !== 'menunggu_validasi') {
      res.status(400).json({ success: false, message: 'Klaim sudah diproses sebelumnya' });
      return;
    }

    if ((body.keputusan === 'perlu_revisi' || body.keputusan === 'ditolak') && !body.alasan) {
      res.status(400).json({ success: false, message: 'Alasan wajib diisi' });
      return;
    }

    if (body.keputusan === 'disetujui') {
      const kegiatan = klaim.partisipasi.kegiatan;
      const peranFinalId = body.peranVerifId || klaim.peranUsulanId;

      // Update peran verif di partisipasi jika diubah validator
      if (body.peranVerifId) {
        await prisma.partisipasi.update({
          where: { id: klaim.partisipasiId },
          data: { peranVerifId: body.peranVerifId },
        });
      }

      if (!peranFinalId) {
        res.status(400).json({ success: false, message: 'Peran tidak ditemukan' });
        return;
      }

      // Lookup matriks poin [BR-030]
      const matriks = await prisma.matriksPoin.findFirst({
        where: {
          kurikulumId: kegiatan.kurikulumId,
          kategoriId: kegiatan.kategoriId,
          skalaId: kegiatan.skalaId,
          peranId: peranFinalId,
        },
      });

      if (!matriks) {
        res.status(404).json({
          success: false,
          message: `Matriks poin tidak ditemukan untuk kombinasi: kategori=${kegiatan.kategoriId}, skala=${kegiatan.skalaId}, peran=${peranFinalId}`,
        });
        return;
      }

      // Buat perolehan_poin + detail [BR-032] [BR-020]
      const perolehan = await prisma.perolehanPoin.create({
        data: {
          klaimPoinId: BigInt(id),
          mahasiswaId: klaim.partisipasi.mahasiswaId,
          kegiatanId: kegiatan.id,
          totalPoin: matriks.poin,
          status: 'sah',
          detail: {
            create: kegiatan.kegiatanCapaian.map(kc => ({
              subCapaianId: kc.subCapaianId,
              poin: Math.round(matriks.poin * Number(kc.alokasiPersen) / 100),
            })),
          },
        },
        include: { detail: true },
      });

      // Update klaim status ke disetujui
      await prisma.klaimPoin.update({
        where: { id: BigInt(id) },
        data: { 
          status: 'disetujui',
          validatorId: aktorId,
          alasan: body.alasan
        },
      });

      // Notifikasi ke mahasiswa
      await prisma.notifikasi.create({
        data: {
          userId: klaim.partisipasi.mahasiswaId,
          judul: 'Poin Diperoleh! 🎉',
          isi: `Klaim poin Anda disetujui. Anda memperoleh ${matriks.poin} poin dari kegiatan "${kegiatan.nama}".${body.alasan ? ` Catatan: ${body.alasan}` : ''}`,
          refType: 'perolehan_poin',
          refId: perolehan.id,
        },
      });

      await logAudit({
        entitas: 'klaim_poin',
        entitasId: BigInt(id),
        aksi: 'validasi.disetujui',
        statusLama: 'menunggu_validasi',
        statusBaru: 'disetujui',
        aktorId,
      });

      res.json({ success: true, data: { klaim: { id: klaim.id, status: 'disetujui' }, perolehan } });
    } else {
      // Perlu Revisi atau Ditolak
      const updated = await prisma.klaimPoin.update({
        where: { id: BigInt(id) },
        data: {
          status: body.keputusan,
          alasan: body.alasan,
          validatorId: aktorId,
        },
      });

      // Notifikasi ke mahasiswa
      const statusTitle = body.keputusan === 'perlu_revisi' ? 'Perlu Revisi ⚠️' : 'Ditolak ❌';
      await prisma.notifikasi.create({
        data: {
          userId: klaim.partisipasi.mahasiswaId,
          judul: `Klaim Poin ${statusTitle}`,
          isi: `Klaim poin Anda ${body.keputusan === 'perlu_revisi' ? 'perlu direvisi' : 'ditolak'}. Alasan: ${body.alasan}`,
          refType: 'klaim_poin',
          refId: BigInt(id),
        },
      });

      await logAudit({
        entitas: 'klaim_poin',
        entitasId: BigInt(id),
        aksi: `validasi.${body.keputusan}`,
        statusLama: 'menunggu_validasi',
        statusBaru: body.keputusan,
        aktorId,
      });

      res.json({ success: true, data: updated });
    }
  } catch (error: any) {
    if (error?.code === 'P2002') {
      res.status(409).json({ success: false, message: 'Poin sudah pernah diberikan untuk kegiatan ini [BR-020]' });
    } else if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validasi gagal', errors: error.issues });
    } else {
      console.error(error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
  }
};
