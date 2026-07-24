import { Request, Response } from 'express';
import prisma from '../../../lib/prisma';
import { z } from 'zod';
import { logAudit } from '../../../lib/auditLog';
import bcrypt from 'bcryptjs';

// ==================== VALIDASI ====================
const createAkunLengkapSchema = z.object({
  namaUkm: z.string().min(3),
  username: z.string().min(3),
  password: z.string().min(6),
  status: z.boolean(), // true = Aktif, false = Non Aktif
});

const resetPasswordSchema = z.object({
  passwordBaru: z.string().min(6),
});

// ==================== OPERATOR UKMF CRUD (ADMIN FAKULTAS) ====================

// GET /api/organisasi-fakultas/akun â€” Daftar akun operator UKMF di fakultasnya
export const getAkunUKMF = async (req: Request, res: Response): Promise<void> => {
  try {
    const aktorId = BigInt(req.user!.id);
    const staff = await prisma.staff.findUnique({ where: { userId: aktorId } });
    const fakultasId = staff?.fakultasId;

    if (!fakultasId) {
      res.status(403).json({ success: false, message: 'Admin tidak memiliki fakultas' });
      return;
    }

    const data = await prisma.organisasiOperator.findMany({
      where: {
        organisasi: {
          tipe: 'UKMF',
          fakultasId,
        },
      },
      include: {
        user: { select: { id: true, nama: true, email: true, aktif: true } },
        organisasi: { select: { id: true, nama: true, tipe: true } },
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
      username: d.user.email.split('@')[0], // Mengambil bagian depan email sebagai username
      status: d.user.aktif,
    }));

    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// POST /api/organisasi-fakultas/akun â€” Buat Organisasi (UKMF) sekaligus User Operatornya
export const createAkunUKMF = async (req: Request, res: Response): Promise<void> => {
  try {
    const aktorId = BigInt(req.user!.id);
    const staff = await prisma.staff.findUnique({ where: { userId: aktorId } });
    const fakultasId = staff?.fakultasId;

    if (!fakultasId) {
      res.status(403).json({ success: false, message: 'Admin tidak memiliki akses fakultas' });
      return;
    }

    const body = createAkunLengkapSchema.parse(req.body);
    const emailFormat = `${body.username}@ukmf.unand.ac.id`;

    const checkExistingUser = await prisma.user.findFirst({
      where: { email: emailFormat }
    });

    if (checkExistingUser) {
      res.status(400).json({ success: false, message: 'Username sudah digunakan' });
      return;
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const newAkun = await prisma.$transaction(async (tx) => {
      // 1. Buat Organisasi tipe UKMF
      const org = await tx.organisasi.create({
        data: {
          nama: body.namaUkm,
          tipe: 'UKMF',
          fakultasId, // Sesuai fakultas admin
        },
      });

      // 2. Buat User (Operator UKMF)
      const user = await tx.user.create({
        data: {
          nama: `Operator ${body.namaUkm}`,
          email: emailFormat, 
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
      res.status(400).json({ success: false, message: 'Validasi gagal', errors: error.issues });
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

    if (operator.organisasi.fakultasId !== fakultasId || operator.organisasi.tipe !== 'UKMF') {
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

// PUT /api/organisasi-fakultas/akun/:userId/reset-password â€” Reset password akun UKMF
export const resetPasswordUKMF = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const aktorId = BigInt(req.user!.id);
    const staff = await prisma.staff.findUnique({ where: { userId: aktorId } });
    const fakultasId = staff?.fakultasId;
    
    const body = resetPasswordSchema.parse(req.body);

    const operator = await prisma.organisasiOperator.findUnique({
      where: { userId: BigInt(userId as string) },
      include: { organisasi: true },
    });

    if (!operator || operator.organisasi.fakultasId !== fakultasId || operator.organisasi.tipe !== 'UKMF') {
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
      res.status(400).json({ success: false, message: 'Validasi gagal', errors: error.issues });
    } else {
      console.error(error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
  }
};

// DELETE /api/organisasi-fakultas/akun/:userId â€” Hapus Akun & UKMF
export const hapusAkunUKMF = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const aktorId = BigInt(req.user!.id);
    const staff = await prisma.staff.findUnique({ where: { userId: aktorId } });
    const fakultasId = staff?.fakultasId;

    const operator = await prisma.organisasiOperator.findUnique({
      where: { userId: BigInt(userId as string) },
      include: { organisasi: true },
    });

    if (!operator || operator.organisasi.fakultasId !== fakultasId || operator.organisasi.tipe !== 'UKMF') {
      res.status(403).json({ success: false, message: 'Akses ditolak atau akun tidak ditemukan.' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.organisasiOperator.delete({ where: { userId: BigInt(userId as string) } });
      await tx.organisasi.delete({ where: { id: operator.organisasiId } });
      await tx.user.delete({ where: { id: BigInt(userId as string) } });
    });

    await logAudit({
      entitas: 'organisasi',
      entitasId: operator.organisasiId,
      aksi: 'delete',
      statusBaru: 'deleted',
      aktorId,
    });

    res.json({ success: true, message: 'Akun UKMF berhasil dihapus beserta datanya' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};
