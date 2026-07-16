import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';
import { logAudit } from '../lib/auditLog';

// ==================== VALIDASI ====================
const upsertMatriksSchema = z.object({
  kurikulumId: z.number().int().positive(),
  kategoriId: z.number().int().positive(),
  skalaId: z.number().int().positive(),
  peranId: z.number().int().positive(),
  poin: z.number().int().positive(),
});

// ==================== MATRIKS POIN CRUD ====================

// GET /api/matriks — Daftar matriks poin berdasarkan kurikulum
export const getMatriksPoin = async (req: Request, res: Response) => {
  try {
    const { kurikulumId, kategoriId, skalaId } = req.query;

    const where: any = {};
    if (kurikulumId) where.kurikulumId = Number(kurikulumId);
    if (kategoriId) where.kategoriId = Number(kategoriId);
    if (skalaId) where.skalaId = Number(skalaId);

    const data = await prisma.matriksPoin.findMany({
      where,
      include: {
        kategori: true,
        skala: true,
        peran: true,
        kurikulum: { select: { id: true, nama: true, status: true } },
      },
      orderBy: [{ kategoriId: 'asc' }, { skalaId: 'asc' }, { peranId: 'asc' }],
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// POST /api/matriks — Tambah/update entri matriks (upsert) [BR-031]
export const upsertMatriksPoin = async (req: Request, res: Response): Promise<void> => {
  try {
    const aktorId = BigInt(req.body.aktorId); // dari JWT nanti
    const data = upsertMatriksSchema.parse(req.body);

    // Cek apakah sudah ada
    const existing = await prisma.matriksPoin.findUnique({
      where: {
        kurikulumId_kategoriId_skalaId_peranId: {
          kurikulumId: data.kurikulumId,
          kategoriId: data.kategoriId,
          skalaId: data.skalaId,
          peranId: data.peranId,
        },
      },
    });

    if (existing) {
      // Update — catat histori dulu [BR-031]
      await prisma.matriksPoinHistori.create({
        data: {
          matriksPoinId: existing.id,
          poinLama: existing.poin,
          poinBaru: data.poin,
          diubahOleh: aktorId,
        },
      });

      const updated = await prisma.matriksPoin.update({
        where: { id: existing.id },
        data: { poin: data.poin },
      });

      await logAudit({
        entitas: 'matriks_poin',
        entitasId: existing.id,
        aksi: 'update_poin',
        statusLama: String(existing.poin),
        statusBaru: String(data.poin),
        aktorId,
      });

      res.json({ success: true, data: updated, message: 'Poin diperbarui' });
    } else {
      // Buat baru
      const created = await prisma.matriksPoin.create({ data });

      await prisma.matriksPoinHistori.create({
        data: {
          matriksPoinId: created.id,
          poinLama: null,
          poinBaru: data.poin,
          diubahOleh: aktorId,
        },
      });

      await logAudit({
        entitas: 'matriks_poin',
        entitasId: created.id,
        aksi: 'create',
        statusBaru: String(data.poin),
        aktorId,
      });

      res.status(201).json({ success: true, data: created });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validasi gagal', errors: error.issues });
    } else {
      console.error(error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
  }
};

// GET /api/matriks/histori/:matriksPoinId — Histori perubahan nilai
export const getMatriksHistori = async (req: Request, res: Response) => {
  try {
    const matriksPoinId = req.params.matriksPoinId as string;
    const data = await prisma.matriksPoinHistori.findMany({
      where: { matriksPoinId: BigInt(matriksPoinId) },
      include: { pengubah: { select: { id: true, nama: true } } },
      orderBy: { diubahPada: 'desc' },
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// ==================== MASTER DATA LOOKUP ====================

// GET /api/master/kategori
export const getKategori = async (req: Request, res: Response) => {
  try {
    const data = await prisma.mpKategori.findMany({ orderBy: { id: 'asc' } });
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// GET /api/master/skala
export const getSkala = async (req: Request, res: Response) => {
  try {
    const data = await prisma.mpSkala.findMany({ orderBy: { urutan: 'asc' } });
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// GET /api/master/peran?kategoriId=1
export const getPeran = async (req: Request, res: Response) => {
  try {
    const { kategoriId } = req.query;
    const where: any = {};
    if (kategoriId) where.kategoriId = Number(kategoriId);

    const data = await prisma.mpPeran.findMany({
      where,
      include: { kategori: true },
      orderBy: [{ kategoriId: 'asc' }, { urutan: 'asc' }],
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};
