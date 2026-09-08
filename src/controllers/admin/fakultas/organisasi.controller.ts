import { Request, Response } from 'express';
import prisma from '../../../lib/prisma';
import { z } from 'zod';
import { logAudit } from '../../../lib/auditLog';
import bcrypt from 'bcryptjs';

// ==================== VALIDASI ====================
const createAkunLengkapSchema = z.object({
  namaUkm: z.string().min(3, 'Nama UKMF minimal 3 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  status: z.boolean(), // true = Aktif, false = Non Aktif
  fakultasId: z.coerce.number().optional().nullable(),
});

const resetPasswordSchema = z.object({
  passwordBaru: z.string().min(8, 'Password baru minimal 8 karakter'),
});

// ==================== OPERATOR UKMF CRUD (ADMIN FAKULTAS & PIMPINAN DITMAWA) ====================

// GET /api/organisasi-fakultas/akun — Daftar akun operator UKMF di fakultasnya (atau seluruh fakultas untuk Ditmawa)
export const getAkunUKMF = async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = req.user!.peran === 'staff' && req.user!.jabatan ? req.user!.jabatan : req.user!.peran;
    const aktorId = BigInt(req.user!.id);
    let targetFakultasId: number | undefined = undefined;

    if (userRole === 'admin_fakultas') {
      const staff = await prisma.staff.findUnique({ where: { userId: aktorId } });
      if (!staff?.fakultasId) {
        res.status(403).json({ success: false, message: 'Admin tidak memiliki fakultas' });
        return;
      }
      targetFakultasId = staff.fakultasId;
    } else if (req.query.fakultasId) {
      targetFakultasId = Number(req.query.fakultasId);
    }

    const whereCondition: any = {
      organisasi: {
        tipe: 'UKMF',
        deletedAt: null,
        ...(targetFakultasId ? { fakultasId: targetFakultasId } : {}),
      },
      user: {
        deletedAt: null,
      },
    };

    const data = await prisma.organisasiOperator.findMany({
      where: whereCondition,
      include: {
        user: { select: { id: true, nama: true, email: true, aktif: true } },
        organisasi: {
          select: {
            id: true,
            nama: true,
            tipe: true,
            fakultas: { select: { nama: true } },
          },
        },
      },
      orderBy: {
        organisasi: { nama: 'asc' },
      },
    });

    // Formatting agar lebih mudah dikonsumsi frontend sesuai UI
    const formattedData = data.map((d, index) => ({
      no: index + 1,
      userId: d.user.id.toString(),
      organisasiId: d.organisasiId,
      namaUkm: d.organisasi.nama,
      fakultas: d.organisasi.fakultas?.nama || null,
      email: d.user.email,
      status: d.user.aktif,
    }));

    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// POST /api/organisasi-fakultas/akun — Buat Organisasi (UKMF) sekaligus User Operatornya
export const createAkunUKMF = async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = req.user!.peran === 'staff' && req.user!.jabatan ? req.user!.jabatan : req.user!.peran;
    const aktorId = BigInt(req.user!.id);
    const body = createAkunLengkapSchema.parse(req.body);

    let targetFakultasId: number | null = null;

    if (userRole === 'admin_fakultas') {
      const staff = await prisma.staff.findUnique({ where: { userId: aktorId } });
      if (!staff?.fakultasId) {
        res.status(403).json({ success: false, message: 'Admin tidak memiliki akses fakultas' });
        return;
      }
      targetFakultasId = staff.fakultasId;
    } else if (body.fakultasId) {
      targetFakultasId = Number(body.fakultasId);
    } else {
      // Fallback ke fakultas pertama jika belum dipilih oleh Pimpinan Ditmawa
      const firstFakultas = await prisma.fakultas.findFirst({ select: { id: true } });
      targetFakultasId = firstFakultas?.id || 1;
    }

    const email = body.email.trim().toLowerCase();

    const checkExistingUser = await prisma.user.findFirst({
      where: { email }
    });

    if (checkExistingUser) {
      res.status(400).json({ success: false, message: 'Email sudah digunakan' });
      return;
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const newAkun = await prisma.$transaction(async (tx) => {
      // 1. Buat Organisasi tipe UKMF
      const org = await tx.organisasi.create({
        data: {
          nama: body.namaUkm,
          tipe: 'UKMF',
          fakultasId: targetFakultasId,
        },
      });

      // 2. Buat User (Operator UKMF)
      const user = await tx.user.create({
        data: {
          nama: `Operator ${body.namaUkm}`,
          email,
          passwordHash,
          peran: 'operator_org', // Role umum untuk semua organisasi
          aktif: body.status,
        },
      });

      // 3. Tautkan User ke Organisasi
      const op = await tx.organisasiOperator.create({
        data: {
          userId: user.id,
          organisasiId: org.id,
        },
      });

      return { org, user, op };
    });

    await logAudit({
      entitas: 'organisasi',
      entitasId: newAkun.org.id,
      aksi: 'create',
      statusBaru: 'UKMF',
      aktorId,
    });

    res.status(201).json({ 
      success: true, 
      message: 'Akun UKMF berhasil dibuat'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMsg = error.issues.map((i) => i.message).join(', ');
      res.status(400).json({ success: false, message: errorMsg || 'Validasi gagal', errors: error.issues });
    } else {
      console.error(error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
  }
};

// PUT /api/organisasi-fakultas/akun/:userId/toggle-status â€” Aktifkan/Nonaktifkan akun UKMF
export const toggleStatusAkunUKMF = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const aktorId = BigInt(req.user!.id);
    const userRole = req.user!.peran === 'staff' && req.user!.jabatan ? req.user!.jabatan : req.user!.peran;
    const isSuperAdmin = userRole === 'pimpinan_ditmawa' || userRole === 'pimpinan_utama';
    const staff = await prisma.staff.findUnique({ where: { userId: aktorId } });
    const fakultasId = staff?.fakultasId;
    
    const operator = await prisma.organisasiOperator.findUnique({
      where: { userId: BigInt(userId as string) },
      include: { user: true, organisasi: true },
    });

    if (!operator) {
      res.status(404).json({ success: false, message: 'Akun UKMF tidak ditemukan' });
      return;
    }

    if (!isSuperAdmin && (operator.organisasi.fakultasId !== fakultasId || operator.organisasi.tipe !== 'UKMF')) {
      res.status(403).json({ success: false, message: 'Akses ditolak. Anda hanya dapat mengatur UKMF di fakultas Anda.' });
      return;
    }

    const newStatus = !operator.user.aktif;
    
    await prisma.user.update({
      where: { id: BigInt(userId as string) },
      data: { aktif: newStatus },
    });

    await logAudit({
      entitas: 'user',
      entitasId: operator.userId,
      aksi: 'toggle_status',
      statusLama: operator.user.aktif ? 'aktif' : 'nonaktif',
      statusBaru: newStatus ? 'aktif' : 'nonaktif',
      aktorId,
    });

    res.json({ 
      success: true, 
      message: `Akun UKMF berhasil di${newStatus ? 'aktifkan' : 'nonaktifkan'}` 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// PUT /api/organisasi-fakultas/akun/:userId/reset-password — Reset password akun UKMF
export const resetPasswordUKMF = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const aktorId = BigInt(req.user!.id);
    const userRole = req.user!.peran === 'staff' && req.user!.jabatan ? req.user!.jabatan : req.user!.peran;
    const isSuperAdmin = userRole === 'pimpinan_ditmawa' || userRole === 'pimpinan_utama';
    const staff = await prisma.staff.findUnique({ where: { userId: aktorId } });
    const fakultasId = staff?.fakultasId;
    
    const body = resetPasswordSchema.parse(req.body);

    const operator = await prisma.organisasiOperator.findUnique({
      where: { userId: BigInt(userId as string) },
      include: { organisasi: true },
    });

    if (!operator || (!isSuperAdmin && (operator.organisasi.fakultasId !== fakultasId || operator.organisasi.tipe !== 'UKMF'))) {
      res.status(403).json({ success: false, message: 'Akses ditolak atau akun tidak ditemukan.' });
      return;
    }

    const passwordHash = await bcrypt.hash(body.passwordBaru, 10);

    await prisma.user.update({
      where: { id: BigInt(userId as string) },
      data: { passwordHash },
    });

    res.json({ success: true, message: 'Password berhasil direset' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMsg = error.issues.map((i) => i.message).join(', ');
      res.status(400).json({ success: false, message: errorMsg || 'Validasi gagal', errors: error.issues });
    } else {
      console.error(error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
  }
};

// DELETE /api/organisasi-fakultas/akun/:userId — Hapus Akun & UKMF
export const hapusAkunUKMF = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const aktorId = BigInt(req.user!.id);
    const userRole = req.user!.peran === 'staff' && req.user!.jabatan ? req.user!.jabatan : req.user!.peran;
    const isSuperAdmin = userRole === 'pimpinan_ditmawa' || userRole === 'pimpinan_utama';
    const staff = await prisma.staff.findUnique({ where: { userId: aktorId } });
    const fakultasId = staff?.fakultasId;

    const operator = await prisma.organisasiOperator.findUnique({
      where: { userId: BigInt(userId as string) },
      include: { organisasi: true },
    });

    if (!operator || (!isSuperAdmin && (operator.organisasi.fakultasId !== fakultasId || operator.organisasi.tipe !== 'UKMF'))) {
      res.status(403).json({ success: false, message: 'Akses ditolak atau akun tidak ditemukan.' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.organisasi.update({
        where: { id: operator.organisasiId },
        data: { deletedAt: new Date() },
      });
      await tx.user.update({
        where: { id: BigInt(userId as string) },
        data: { aktif: false, deletedAt: new Date() },
      });
    });

    await logAudit({
      entitas: 'organisasi',
      entitasId: operator.organisasiId,
      aksi: 'soft_delete',
      statusBaru: 'deleted',
      aktorId,
    });

    res.json({ success: true, message: 'Akun UKMF berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};
