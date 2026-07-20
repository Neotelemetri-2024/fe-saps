import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';
import { logAudit } from '../lib/auditLog';

// ==================== VALIDASI ====================
const createKurikulumSchema = z.object({
  nama: z.string().min(3),
  tahunAkademik: z.string().regex(/^\d{4}\/\d{4}$/, 'Format: 2024/2025'),
  versi: z.number().int().positive().optional(),
});

const createCapaianSchema = z.object({
  nama: z.string().min(3),
  jumlahPoin: z.number().int().positive(),
  urutan: z.number().int().positive().optional(),
});

const createSubCapaianSchema = z.object({
  nama: z.string().min(3),
  bobotPersen: z.number().min(0.01).max(100),
});

const updateCapaianSchema = z.object({
  nama: z.string().min(3).optional(),
  jumlahPoin: z.number().int().positive().optional(),
  urutan: z.number().int().positive().optional(),
});

const updateSubCapaianSchema = z.object({
  nama: z.string().min(3).optional(),
  bobotPersen: z.number().min(0.01).max(100).optional(),
});

// ==================== KURIKULUM CRUD ====================

// GET /api/kurikulum — Daftar semua kurikulum
export const getAllKurikulum = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status) where.status = status as string;

    const data = await prisma.kurikulum.findMany({
      where,
      include: {
        pembuat: { select: { id: true, nama: true } },
        _count: { select: { capaian: true, matriksPoin: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// GET /api/kurikulum/aktif — Kurikulum yang sedang aktif
export const getKurikulumAktif = async (req: Request, res: Response) => {
  try {
    const data = await prisma.kurikulum.findFirst({
      where: { status: 'aktif' },
      include: {
        capaian: {
          include: { subCapaian: true },
          orderBy: { urutan: 'asc' },
        },
      },
    });
    if (!data) {
      res.status(404).json({ success: false, message: 'Belum ada kurikulum aktif' });
      return;
    }
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// GET /api/kurikulum/:id — Detail kurikulum + capaian + sub_capaian
export const getKurikulumById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = await prisma.kurikulum.findUnique({
      where: { id: Number(id) },
      include: {
        pembuat: { select: { id: true, nama: true } },
        capaian: {
          include: { subCapaian: { orderBy: { id: 'asc' } } },
          orderBy: { urutan: 'asc' },
        },
      },
    });
    if (!data) {
      res.status(404).json({ success: false, message: 'Kurikulum tidak ditemukan' });
      return;
    }
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// POST /api/kurikulum — Buat kurikulum baru (draft)
export const createKurikulum = async (req: Request, res: Response): Promise<void> => {
  try {
    const dibuatOleh = BigInt(req.user!.id);
    const data = createKurikulumSchema.parse(req.body);

    const newKurikulum = await prisma.kurikulum.create({
      data: {
        nama: data.nama,
        tahunAkademik: data.tahunAkademik,
        versi: data.versi ?? 1,
        status: 'draft',
        dibuatOleh,
      },
    });

    await logAudit({
      entitas: 'kurikulum',
      entitasId: newKurikulum.id,
      aksi: 'create',
      statusBaru: 'draft',
      aktorId: dibuatOleh,
    });

    res.status(201).json({ success: true, data: newKurikulum });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validasi gagal', errors: error.issues });
    } else {
      console.error(error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
  }
};

// PUT /api/kurikulum/:id/aktivasi — Aktifkan kurikulum (arsipkan yg lama) [BR-001]
export const aktivasiKurikulum = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const aktorId = BigInt(req.user!.id);

    const kurikulum = await prisma.kurikulum.findUnique({ where: { id: Number(id) } });
    if (!kurikulum) {
      res.status(404).json({ success: false, message: 'Kurikulum tidak ditemukan' });
      return;
    }
    if (kurikulum.status !== 'draft') {
      res.status(400).json({ success: false, message: 'Hanya kurikulum draft yang bisa diaktifkan' });
      return;
    }

    // Arsipkan kurikulum aktif saat ini (jika ada) [BR-001]
    await prisma.kurikulum.updateMany({
      where: { status: 'aktif' },
      data: { status: 'arsip' },
    });

    // Aktifkan kurikulum baru
    const updated = await prisma.kurikulum.update({
      where: { id: Number(id) },
      data: { status: 'aktif', activatedAt: new Date() },
    });

    await logAudit({
      entitas: 'kurikulum',
      entitasId: updated.id,
      aksi: 'aktivasi',
      statusLama: 'draft',
      statusBaru: 'aktif',
      aktorId,
    });

    res.json({ success: true, data: updated, message: 'Kurikulum berhasil diaktifkan' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// PUT /api/kurikulum/:id/non-aktif — Non-aktifkan kurikulum
export const nonAktifKurikulum = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const aktorId = BigInt(req.user!.id);

    const kurikulum = await prisma.kurikulum.findUnique({ where: { id: Number(id) } });
    if (!kurikulum) {
      res.status(404).json({ success: false, message: 'Kurikulum tidak ditemukan' });
      return;
    }
    if (kurikulum.status !== 'aktif') {
      res.status(400).json({ success: false, message: 'Hanya kurikulum aktif yang bisa dinonaktifkan' });
      return;
    }

    const updated = await prisma.kurikulum.update({
      where: { id: Number(id) },
      data: { status: 'arsip' },
    });

    await logAudit({
      entitas: 'kurikulum',
      entitasId: updated.id,
      aksi: 'non_aktif',
      statusLama: 'aktif',
      statusBaru: 'arsip',
      aktorId,
    });

    res.json({ success: true, data: updated, message: 'Kurikulum berhasil dinonaktifkan' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// DELETE /api/kurikulum/:id — Hapus kurikulum (Hanya jika tidak aktif)
export const deleteKurikulum = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const aktorId = BigInt(req.user!.id);

    const kurikulum = await prisma.kurikulum.findUnique({ where: { id: Number(id) } });
    if (!kurikulum) {
      res.status(404).json({ success: false, message: 'Kurikulum tidak ditemukan' });
      return;
    }
    if (kurikulum.status === 'aktif') {
      res.status(400).json({ success: false, message: 'Kurikulum aktif TIDAK BOLEH dihapus. Nonaktifkan terlebih dahulu.' });
      return;
    }

    await prisma.kurikulum.delete({
      where: { id: Number(id) },
    });

    await logAudit({
      entitas: 'kurikulum',
      entitasId: BigInt(id as string),
      aksi: 'delete',
      statusLama: kurikulum.status,
      aktorId,
    });

    res.json({ success: true, message: 'Kurikulum berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server (kurikulum mungkin masih terkait dengan data poin mahasiswa)' });
  }
};

// ==================== CAPAIAN CRUD ====================

// POST /api/kurikulum/:kurikulumId/capaian
export const createCapaian = async (req: Request, res: Response): Promise<void> => {
  try {
    const { kurikulumId } = req.params;
    const data = createCapaianSchema.parse(req.body);

    const kurikulum = await prisma.kurikulum.findUnique({ where: { id: Number(kurikulumId) } });
    if (!kurikulum) {
      res.status(404).json({ success: false, message: 'Kurikulum tidak ditemukan' });
      return;
    }

    const newCapaian = await prisma.capaian.create({
      data: {
        kurikulumId: Number(kurikulumId),
        nama: data.nama,
        jumlahPoin: data.jumlahPoin,
        urutan: data.urutan,
      },
    });
    res.status(201).json({ success: true, data: newCapaian });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validasi gagal', errors: error.issues });
    } else {
      console.error(error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
  }
};

// PUT /api/capaian/:id
export const updateCapaian = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = updateCapaianSchema.parse(req.body);

    const updated = await prisma.capaian.update({
      where: { id: Number(id) },
      data,
    });
    res.json({ success: true, data: updated, message: 'Capaian berhasil diperbarui' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validasi gagal', errors: error.issues });
    } else {
      console.error(error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
  }
};

// DELETE /api/capaian/:id
export const deleteCapaian = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Pastikan kurikulum parent bukan 'aktif' (opsional, tapi disarankan)
    const capaian = await prisma.capaian.findUnique({
      where: { id: Number(id) },
      include: { kurikulum: true }
    });

    if (!capaian) {
      res.status(404).json({ success: false, message: 'Capaian tidak ditemukan' });
      return;
    }

    if (capaian.kurikulum.status === 'aktif') {
      res.status(400).json({ success: false, message: 'Tidak dapat menghapus capaian pada kurikulum yang sedang aktif' });
      return;
    }

    await prisma.capaian.delete({
      where: { id: Number(id) },
    });
    res.json({ success: true, message: 'Capaian berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server (capaian mungkin memiliki data terkait)' });
  }
};

// ==================== SUB CAPAIAN CRUD ====================

// POST /api/capaian/:capaianId/sub-capaian
export const createSubCapaian = async (req: Request, res: Response): Promise<void> => {
  try {
    const { capaianId } = req.params;
    const data = createSubCapaianSchema.parse(req.body);

    const capaian = await prisma.capaian.findUnique({
      where: { id: Number(capaianId) },
      include: { subCapaian: true },
    });
    if (!capaian) {
      res.status(404).json({ success: false, message: 'Capaian tidak ditemukan' });
      return;
    }

    // Validasi: total bobot + yang baru <= 100% [BR-002]
    const totalBobotExisting = capaian.subCapaian.reduce(
      (sum, sc) => sum + Number(sc.bobotPersen), 0
    );
    if (totalBobotExisting + data.bobotPersen > 100) {
      res.status(400).json({
        success: false,
        message: `Total bobot melebihi 100%. Saat ini: ${totalBobotExisting}%, maks tambahan: ${100 - totalBobotExisting}%`,
      });
      return;
    }

    const newSubCapaian = await prisma.subCapaian.create({
      data: {
        capaianId: Number(capaianId),
        nama: data.nama,
        bobotPersen: data.bobotPersen,
      },
    });
    res.status(201).json({ success: true, data: newSubCapaian });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validasi gagal', errors: error.issues });
    } else {
      console.error(error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
  }
};

// PUT /api/sub-capaian/:id
export const updateSubCapaian = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = updateSubCapaianSchema.parse(req.body);

    const subCapaian = await prisma.subCapaian.findUnique({
      where: { id: Number(id) },
      include: { capaian: { include: { subCapaian: true } } }
    });

    if (!subCapaian) {
      res.status(404).json({ success: false, message: 'Sub Capaian tidak ditemukan' });
      return;
    }

    if (data.bobotPersen) {
      const totalBobotLain = subCapaian.capaian.subCapaian
        .filter(sc => sc.id !== Number(id))
        .reduce((sum, sc) => sum + Number(sc.bobotPersen), 0);
      
      if (totalBobotLain + data.bobotPersen > 100) {
        res.status(400).json({
          success: false,
          message: `Total bobot melebihi 100%. Saat ini sub capaian lain berjumlah: ${totalBobotLain}%, maks untuk ini: ${100 - totalBobotLain}%`,
        });
        return;
      }
    }

    const updated = await prisma.subCapaian.update({
      where: { id: Number(id) },
      data,
    });
    res.json({ success: true, data: updated, message: 'Sub Capaian berhasil diperbarui' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validasi gagal', errors: error.issues });
    } else {
      console.error(error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
  }
};

// DELETE /api/sub-capaian/:id
export const deleteSubCapaian = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const subCapaian = await prisma.subCapaian.findUnique({
      where: { id: Number(id) },
      include: { capaian: { include: { kurikulum: true } } }
    });

    if (!subCapaian) {
      res.status(404).json({ success: false, message: 'Sub Capaian tidak ditemukan' });
      return;
    }

    if (subCapaian.capaian.kurikulum.status === 'aktif') {
      res.status(400).json({ success: false, message: 'Tidak dapat menghapus sub capaian pada kurikulum yang sedang aktif' });
      return;
    }

    await prisma.subCapaian.delete({
      where: { id: Number(id) },
    });

    res.json({ 
      success: true, 
      message: 'Sub Capaian berhasil dihapus. PERINGATAN: Total presentase bobot untuk Capaian ini telah berkurang. Harap sesuaikan presentase sub capaian lainnya atau buat yang baru agar totalnya tetap 100%.' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server (sub capaian mungkin memiliki data terkait)' });
  }
};
