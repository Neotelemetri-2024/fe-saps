import { Request, Response } from 'express';
import prisma from '../../../lib/prisma';
import { z } from 'zod';
import { logAudit } from '../../../lib/auditLog';

// ==================== VALIDASI ====================
const createKurikulumSchema = z.object({
  nama: z.string({ message: 'Nama kurikulum wajib diisi' }).min(1, 'Nama kurikulum wajib diisi'),
  tahunAkademik: z.string({ message: 'Tahun akademik wajib diisi' }).regex(/^(\d{4}|\d{4}\/\d{4})$/, 'Format tahun akademik: 2026 atau 2026/2027'),
  angkatanMulai: z.number({ message: 'Angkatan mulai wajib diisi' }).int('Angkatan mulai harus bilangan bulat').min(1900, 'Tahun angkatan minimal 1900').max(2200, 'Tahun angkatan maksimal 2200'),
  versi: z.number().int('Versi harus bilangan bulat').positive('Versi harus berupa angka positif').optional(),
});

const updateKurikulumSchema = createKurikulumSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  'Tidak ada data yang diperbarui',
);

async function assertAngkatanMulaiUnique(angkatanMulai: number, excludeId?: number) {
  const duplicate = await prisma.kurikulum.findFirst({
    where: {
      angkatanMulai,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });
  if (duplicate) throw new Error('ANGKATAN_MULAI_DUPLICATE');
}

async function getReadinessProblem(kurikulumId: number): Promise<string | null> {
  const kurikulum = await prisma.kurikulum.findUnique({
    where: { id: kurikulumId },
    include: { capaian: { include: { subCapaian: true } }, matriksPoin: { take: 1 } },
  });
  if (!kurikulum?.angkatanMulai) return 'Angkatan mulai wajib diisi sebelum aktivasi';
  if (kurikulum.capaian.length === 0) return 'Kurikulum harus memiliki minimal satu capaian';
  const incomplete = kurikulum.capaian.find(
    (c) => c.subCapaian.length === 0 || Math.abs(c.subCapaian.reduce((sum, s) => sum + Number(s.bobotPersen), 0) - 100) > 0.01,
  );
  if (incomplete) return `Total bobot sub capaian "${incomplete.nama}" harus tepat 100%`;
  if (kurikulum.matriksPoin.length === 0) return 'Matriks poin kurikulum belum tersedia';
  return null;
}

const createCapaianSchema = z.object({
  nama: z.string({ message: 'Nama capaian wajib diisi' }).min(3, 'Nama capaian minimal 3 karakter'),
  jumlahPoin: z.number({ message: 'Jumlah poin wajib diisi' }).int('Jumlah poin harus bilangan bulat').positive('Jumlah poin harus lebih dari 0'),
  urutan: z.number().int('Urutan harus bilangan bulat').positive('Urutan harus berupa angka positif').optional(),
});

const createSubCapaianSchema = z.object({
  nama: z.string({ message: 'Nama sub capaian wajib diisi' }).min(3, 'Nama sub capaian minimal 3 karakter'),
  bobotPersen: z.number({ message: 'Bobot persen wajib diisi' }).int('Bobot persen harus bilangan bulat').min(1, 'Bobot minimal 1%').max(100, 'Bobot maksimal 100%'),
});

const updateCapaianSchema = z.object({
  nama: z.string().min(3, 'Nama capaian minimal 3 karakter').optional(),
  jumlahPoin: z.number().int('Jumlah poin harus bilangan bulat').positive('Jumlah poin harus lebih dari 0').optional(),
  urutan: z.number().int('Urutan harus bilangan bulat').positive('Urutan harus berupa angka positif').optional(),
});

const updateSubCapaianSchema = z.object({
  nama: z.string().min(3, 'Nama sub capaian minimal 3 karakter').optional(),
  bobotPersen: z.number().int('Bobot persen harus bilangan bulat').min(1, 'Bobot minimal 1%').max(100, 'Bobot maksimal 100%').optional(),
});

// ==================== KURIKULUM CRUD ====================

// GET /api/kurikulum — Daftar semua kurikulum
export const getAllKurikulum = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const where: any = { deletedAt: null };
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
    const data = await prisma.kurikulum.findMany({
      where: { status: 'aktif', deletedAt: null },
      include: {
        capaian: {
          where: { deletedAt: null },
          include: {
            subCapaian: {
              where: { deletedAt: null },
            },
          },
          orderBy: { urutan: 'asc' },
        },
      },
      orderBy: { id: 'asc' },
    });
    if (!data || data.length === 0) {
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
    const data = await prisma.kurikulum.findFirst({
      where: { id: Number(id), deletedAt: null },
      include: {
        pembuat: { select: { id: true, nama: true } },
        capaian: {
          where: { deletedAt: null },
          include: {
            subCapaian: {
              where: { deletedAt: null },
              orderBy: { id: 'asc' },
            },
          },
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

// POST /api/kurikulum â€” Buat kurikulum baru (draft)
export const createKurikulum = async (req: Request, res: Response): Promise<void> => {
  try {
    const dibuatOleh = BigInt(req.user!.id);
    const data = createKurikulumSchema.parse(req.body);

    await assertAngkatanMulaiUnique(data.angkatanMulai);
    const newKurikulum = await prisma.$transaction(async (tx) => {
      const created = await tx.kurikulum.create({
        data: {
          nama: data.nama,
          tahunAkademik: data.tahunAkademik,
          angkatanMulai: data.angkatanMulai,
          versi: data.versi ?? 1,
          status: 'draft',
          dibuatOleh,
        },
      });
      await tx.auditLog.create({ data: {
        entitas: 'kurikulum', entitasId: BigInt(created.id), aksi: 'create',
        statusBaru: 'draft', aktorId: dibuatOleh,
      } });
      return created;
    });

    res.status(201).json({ success: true, data: newKurikulum });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMsg = error.issues.map((i) => i.message).join(', ') || 'Validasi gagal';
      res.status(400).json({ success: false, message: errorMsg, errors: error.issues });
    } else {
      console.error(error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
  }
};

// PUT /api/kurikulum/:id/aktivasi — Aktifkan kurikulum tanpa menonaktifkan yang lama
export const aktivasiKurikulum = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const aktorId = BigInt(req.user!.id);

    const kurikulum = await prisma.kurikulum.findFirst({ where: { id: Number(id), deletedAt: null } });
    if (!kurikulum) {
      res.status(404).json({ success: false, message: 'Kurikulum tidak ditemukan' });
      return;
    }
    if (kurikulum.status === 'aktif') {
      res.status(400).json({ success: false, message: 'Kurikulum sudah aktif' });
      return;
    }

    const readiness = await getReadinessProblem(Number(id));
    if (readiness) {
      res.status(400).json({ success: false, message: readiness });
      return;
    }
    if (kurikulum.angkatanMulai != null) {
      await assertAngkatanMulaiUnique(kurikulum.angkatanMulai, Number(id));
    }

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.kurikulum.update({
        where: { id: Number(id) },
        data: { status: 'aktif', activatedAt: new Date() },
      });
      await tx.auditLog.create({
        data: {
          entitas: 'kurikulum',
          entitasId: BigInt(row.id),
          aksi: 'aktivasi',
          statusLama: kurikulum.status,
          statusBaru: 'aktif',
          aktorId,
        },
      });
      return row;
    });

    res.json({ success: true, data: updated, message: 'Kurikulum berhasil diaktifkan' });
  } catch (error: any) {
    if (error?.message === 'ANGKATAN_MULAI_DUPLICATE') {
      res.status(400).json({ success: false, message: 'Angkatan mulai sudah dipakai kurikulum lain' });
      return;
    }
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// PUT /api/kurikulum/:id/non-aktif — Non-aktifkan kurikulum
export const nonAktifKurikulum = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const aktorId = BigInt(req.user!.id);

    const kurikulum = await prisma.kurikulum.findFirst({ where: { id: Number(id), deletedAt: null } });
    if (!kurikulum) {
      res.status(404).json({ success: false, message: 'Kurikulum tidak ditemukan' });
      return;
    }
    if (kurikulum.status !== 'aktif') {
      res.status(400).json({ success: false, message: 'Hanya kurikulum aktif yang bisa dinonaktifkan' });
      return;
    }

    const masihDipakai = await prisma.mahasiswa.count({ where: { kurikulumId: Number(id) } });
    if (masihDipakai > 0) {
      res.status(400).json({
        success: false,
        message: `Kurikulum masih digunakan ${masihDipakai} mahasiswa dan tidak dapat diarsipkan`,
      });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.kurikulum.update({
        where: { id: Number(id) },
        data: { status: 'arsip' },
      });
      await tx.auditLog.create({
        data: {
          entitas: 'kurikulum',
          entitasId: BigInt(row.id),
          aksi: 'non_aktif',
          statusLama: 'aktif',
          statusBaru: 'arsip',
          aktorId,
        },
      });
      return row;
    });

    res.json({ success: true, data: updated, message: 'Kurikulum berhasil dinonaktifkan' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// DELETE /api/kurikulum/:id — Hapus kurikulum (Soft Delete)
export const deleteKurikulum = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const aktorId = BigInt(req.user!.id);

    const kurikulum = await prisma.kurikulum.findFirst({ where: { id: Number(id), deletedAt: null } });
    if (!kurikulum) {
      res.status(404).json({ success: false, message: 'Kurikulum tidak ditemukan' });
      return;
    }
    if (kurikulum.status === 'aktif') {
      res.status(400).json({ success: false, message: 'Kurikulum aktif TIDAK BOLEH dihapus. Nonaktifkan terlebih dahulu.' });
      return;
    }

    // Soft delete kurikulum
    await prisma.kurikulum.update({
      where: { id: Number(id) },
      data: { deletedAt: new Date() },
    });

    await logAudit({
      entitas: 'kurikulum',
      entitasId: BigInt(id as string),
      aksi: 'soft_delete',
      statusLama: kurikulum.status,
      aktorId,
    });

    res.json({ success: true, message: 'Kurikulum berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
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
      const errorMsg = error.issues.map((i) => i.message).join(', ') || 'Validasi gagal';
      res.status(400).json({ success: false, message: errorMsg, errors: error.issues });
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
      const errorMsg = error.issues.map((i) => i.message).join(', ') || 'Validasi gagal';
      res.status(400).json({ success: false, message: errorMsg, errors: error.issues });
    } else {
      console.error(error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
  }
};

// DELETE /api/capaian/:id (Soft Delete)
export const deleteCapaian = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Pastikan kurikulum parent bukan 'aktif'
    const capaian = await prisma.capaian.findFirst({
      where: { id: Number(id), deletedAt: null },
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

    await prisma.capaian.update({
      where: { id: Number(id) },
      data: { deletedAt: new Date() },
    });
    res.json({ success: true, message: 'Capaian berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// ==================== SUB CAPAIAN CRUD ====================

// POST /api/capaian/:capaianId/sub-capaian
export const createSubCapaian = async (req: Request, res: Response): Promise<void> => {
  try {
    const { capaianId } = req.params;
    const data = createSubCapaianSchema.parse(req.body);

    const capaian = await prisma.capaian.findFirst({
      where: { id: Number(capaianId), deletedAt: null },
      include: { subCapaian: { where: { deletedAt: null } } },
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
      const errorMsg = error.issues.map((i) => i.message).join(', ') || 'Validasi gagal';
      res.status(400).json({ success: false, message: errorMsg, errors: error.issues });
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

    const subCapaian = await prisma.subCapaian.findFirst({
      where: { id: Number(id), deletedAt: null },
      include: { capaian: { include: { subCapaian: { where: { deletedAt: null } } } } }
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
      const errorMsg = error.issues.map((i) => i.message).join(', ') || 'Validasi gagal';
      res.status(400).json({ success: false, message: errorMsg, errors: error.issues });
    } else {
      console.error(error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
  }
};

// DELETE /api/sub-capaian/:id (Soft Delete)
export const deleteSubCapaian = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const subCapaian = await prisma.subCapaian.findFirst({
      where: { id: Number(id), deletedAt: null },
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

    await prisma.subCapaian.update({
      where: { id: Number(id) },
      data: { deletedAt: new Date() },
    });

    res.json({ 
      success: true, 
      message: 'Sub Capaian berhasil dihapus. PERINGATAN: Total presentase bobot untuk Capaian ini telah berkurang. Harap sesuaikan presentase sub capaian lainnya atau buat yang baru agar totalnya tetap 100%.' 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};
