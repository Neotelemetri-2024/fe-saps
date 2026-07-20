import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';
import { logAudit } from '../lib/auditLog';

// ==================== VALIDASI ====================
const daftarPartisipasiSchema = z.object({
  kegiatanId: z.number().int().positive(),
});

const izinDecisionSchema = z.object({
  status: z.enum(['disetujui', 'ditolak']),
  alasan: z.string().optional(),
});

// ==================== PARTISIPASI ====================

// POST /api/partisipasi — Mahasiswa mendaftar kegiatan
export const daftarKegiatan = async (req: Request, res: Response): Promise<void> => {
  try {
    const mahasiswaUserId = BigInt(req.user!.id);
    const body = daftarPartisipasiSchema.parse(req.body);

    // Cek kegiatan ada & terpublikasi
    const kegiatan = await prisma.kegiatan.findUnique({ where: { id: body.kegiatanId } });
    if (!kegiatan) {
      res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan' });
      return;
    }
    if (kegiatan.status !== 'terpublikasi' && kegiatan.status !== 'berlangsung') {
      res.status(400).json({ success: false, message: 'Kegiatan belum terpublikasi atau sudah selesai' });
      return;
    }

    // Cek kuota
    if (kegiatan.kuota) {
      const count = await prisma.partisipasi.count({ where: { kegiatanId: body.kegiatanId } });
      if (count >= kegiatan.kuota) {
        res.status(400).json({ success: false, message: 'Kuota kegiatan sudah penuh' });
        return;
      }
    }

    // Cek mahasiswa valid
    const mahasiswa = await prisma.mahasiswa.findUnique({ where: { userId: mahasiswaUserId } });
    if (!mahasiswa) {
      res.status(404).json({ success: false, message: 'Profil mahasiswa tidak ditemukan' });
      return;
    }

    // Buat partisipasi (UNIQUE constraint mencegah duplikat) [BR-020 lapis 1]
    const partisipasi = await prisma.partisipasi.create({
      data: {
        kegiatanId: body.kegiatanId,
        mahasiswaId: mahasiswaUserId,
        status: 'terdaftar',
      },
    });

    await logAudit({
      entitas: 'partisipasi',
      entitasId: partisipasi.id,
      aksi: 'daftar',
      statusBaru: 'terdaftar',
      aktorId: mahasiswaUserId,
    });

    res.status(201).json({ success: true, data: partisipasi });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      res.status(409).json({ success: false, message: 'Anda sudah terdaftar di kegiatan ini' });
    } else if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validasi gagal', errors: error.issues });
    } else {
      console.error(error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
  }
};

// GET /api/partisipasi/saya?mahasiswaId=X — Daftar partisipasi mahasiswa
export const getMyPartisipasi = async (req: Request, res: Response) => {
  try {
    const mahasiswaId = BigInt(req.query.mahasiswaId as string);
    const data = await prisma.partisipasi.findMany({
      where: { mahasiswaId },
      include: {
        kegiatan: {
          include: {
            kategori: true,
            skala: true,
            organisasi: { select: { nama: true } },
          },
        },
        peranVerif: true,
        izinPA: { orderBy: { createdAt: 'desc' }, take: 1 },
        klaimPoin: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// ==================== IZIN PA ====================

// POST /api/partisipasi/:id/minta-izin — Mahasiswa minta izin PA
export const mintaIzinPA = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string; // partisipasi id

    const partisipasi = await prisma.partisipasi.findUnique({
      where: { id: BigInt(id) },
      include: { mahasiswa: true },
    });
    if (!partisipasi) {
      res.status(404).json({ success: false, message: 'Partisipasi tidak ditemukan' });
      return;
    }
    if (partisipasi.status !== 'terdaftar') {
      res.status(400).json({ success: false, message: 'Izin hanya bisa diminta dari status terdaftar' });
      return;
    }

    // Cek dosen PA
    if (!partisipasi.mahasiswa.dosenPaId) {
      res.status(400).json({ success: false, message: 'Anda belum memiliki Dosen PA' });
      return;
    }

    // Buat izin PA
    const izin = await prisma.izinPA.create({
      data: {
        partisipasiId: BigInt(id),
        dosenPaId: partisipasi.mahasiswa.dosenPaId,
        status: 'diajukan',
      },
    });

    // Update status partisipasi
    await prisma.partisipasi.update({
      where: { id: BigInt(id) },
      data: { status: 'menunggu_izin_pa' },
    });

    // Notifikasi ke Dosen PA
    await prisma.notifikasi.create({
      data: {
        userId: partisipasi.mahasiswa.dosenPaId,
        judul: 'Permohonan Izin Kegiatan',
        isi: `Mahasiswa bimbingan Anda mengajukan izin untuk mengikuti kegiatan.`,
        refType: 'izin_pa',
        refId: izin.id,
      },
    });

    await logAudit({
      entitas: 'partisipasi',
      entitasId: BigInt(id),
      aksi: 'minta_izin_pa',
      statusLama: 'terdaftar',
      statusBaru: 'menunggu_izin_pa',
      aktorId: partisipasi.mahasiswaId,
    });

    res.status(201).json({ success: true, data: izin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// GET /api/izin-pa/dosen?dosenPaId=X — Daftar izin PA untuk dosen
export const getIzinForDosen = async (req: Request, res: Response) => {
  try {
    const dosenPaId = BigInt(req.query.dosenPaId as string);
    const { status } = req.query;
    const where: any = { dosenPaId };
    if (status) where.status = status as string;

    const data = await prisma.izinPA.findMany({
      where,
      include: {
        partisipasi: {
          include: {
            kegiatan: { include: { kategori: true, skala: true } },
            mahasiswa: {
              include: { user: { select: { nama: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// PUT /api/izin-pa/:id — Dosen PA putuskan izin (setujui/tolak) [BR-016, BR-019]
export const putuskanIzinPA = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const dosenPaId = BigInt(req.user!.id);
    const body = izinDecisionSchema.parse(req.body);

    const izin = await prisma.izinPA.findUnique({
      where: { id: BigInt(id) },
      include: {
        partisipasi: {
          include: { mahasiswa: true },
        },
      },
    });

    if (!izin) {
      res.status(404).json({ success: false, message: 'Izin tidak ditemukan' });
      return;
    }
    if (izin.status !== 'diajukan') {
      res.status(400).json({ success: false, message: 'Izin sudah diproses' });
      return;
    }

    // Scope check: PA hanya atas bimbingannya [BR-016]
    if (izin.dosenPaId !== dosenPaId) {
      res.status(403).json({ success: false, message: 'Anda bukan Dosen PA mahasiswa ini [BR-016]' });
      return;
    }

    if (body.status === 'ditolak' && !body.alasan) {
      res.status(400).json({ success: false, message: 'Alasan penolakan wajib diisi' });
      return;
    }

    // Update izin
    const updatedIzin = await prisma.izinPA.update({
      where: { id: BigInt(id) },
      data: {
        status: body.status,
        alasan: body.alasan,
        decidedAt: new Date(),
      },
    });

    // Update status partisipasi
    const statusPartisipasi = body.status === 'disetujui' ? 'disetujui_pa' : 'ditolak_pa';
    await prisma.partisipasi.update({
      where: { id: izin.partisipasiId },
      data: { status: statusPartisipasi as any },
    });

    // Notifikasi ke mahasiswa
    const statusText = body.status === 'disetujui' ? 'disetujui ✅' : 'ditolak ❌';
    await prisma.notifikasi.create({
      data: {
        userId: izin.partisipasi.mahasiswaId,
        judul: `Izin Kegiatan ${statusText}`,
        isi: `Izin Anda untuk mengikuti kegiatan telah ${statusText} oleh Dosen PA.${body.alasan ? ` Alasan: ${body.alasan}` : ''}`,
        refType: 'izin_pa',
        refId: BigInt(id),
      },
    });

    await logAudit({
      entitas: 'izin_pa',
      entitasId: BigInt(id),
      aksi: body.status === 'disetujui' ? 'setujui' : 'tolak',
      statusLama: 'diajukan',
      statusBaru: body.status,
      aktorId: dosenPaId,
    });

    res.json({ success: true, data: updatedIzin });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validasi gagal', errors: error.issues });
    } else {
      console.error(error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
  }
};

// ==================== SARAN PA ====================

// POST /api/saran-pa — Dosen PA memberikan saran
export const createSaranPA = async (req: Request, res: Response): Promise<void> => {
  try {
    const dosenPaId = BigInt(req.user!.id);
    const mahasiswaId = BigInt(req.body.mahasiswaId);
    const isi = req.body.isi as string;

    if (!isi || isi.length < 3) {
      res.status(400).json({ success: false, message: 'Isi saran minimal 3 karakter' });
      return;
    }

    // Verifikasi relasi bimbingan [BR-016]
    const mahasiswa = await prisma.mahasiswa.findUnique({ where: { userId: mahasiswaId } });
    if (!mahasiswa || mahasiswa.dosenPaId !== dosenPaId) {
      res.status(403).json({ success: false, message: 'Bukan mahasiswa bimbingan Anda' });
      return;
    }

    const saran = await prisma.saranPA.create({
      data: { dosenPaId, mahasiswaId, isi },
    });

    await prisma.notifikasi.create({
      data: {
        userId: mahasiswaId,
        judul: 'Saran dari Dosen PA',
        isi: `Dosen PA Anda memberikan saran baru.`,
        refType: 'saran_pa',
        refId: saran.id,
      },
    });

    res.status(201).json({ success: true, data: saran });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// GET /api/saran-pa?mahasiswaId=X — Daftar saran PA
export const getSaranPA = async (req: Request, res: Response) => {
  try {
    const mahasiswaId = BigInt(req.query.mahasiswaId as string);
    const data = await prisma.saranPA.findMany({
      where: { mahasiswaId },
      include: {
        dosenPA: {
          include: { user: { select: { nama: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};
