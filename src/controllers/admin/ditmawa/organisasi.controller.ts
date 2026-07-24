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

// ==================== OPERATOR UKM CRUD (ADMIN DITMAWA) ====================

// GET /api/organisasi/akun â€” Daftar akun operator UKM
export const getAkunUKM = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await prisma.organisasiOperator.findMany({
      where: {
        organisasi: {
          tipe: 'UKM', // Admin Ditmawa hanya mengurus UKM
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

// POST /api/organisasi/akun â€” Buat Organisasi (UKM) sekaligus User Operatornya
export const createAkunLengkap = async (req: Request, res: Response): Promise<void> => {
  try {
    const aktorId = BigInt(req.user!.id);
    const body = createAkunLengkapSchema.parse(req.body);

    const emailFormat = `${body.username}@ukm.unand.ac.id`;

    const checkExistingUser = await prisma.user.findFirst({
      where: { email: emailFormat }
    });

    if (checkExistingUser) {
      res.status(400).json({ success: false, message: 'Username sudah digunakan' });
      return;
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const newAkun = await prisma.$transaction(async (tx) => {
      // 1. Buat Organisasi tipe UKM
      const org = await tx.organisasi.create({
        data: {
          nama: body.namaUkm,
          tipe: 'UKM',
          fakultasId: null, // UKM universitas tidak punya fakultas
        },
      });

      // 2. Buat User (Operator UKM)
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
      statusBaru: 'UKM',
      aktorId,
    });

    res.status(201).json({ 
      success: true, 
      message: 'Akun UKM berhasil dibuat'
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

// PUT /api/organisasi/akun/:userId/toggle-status â€” Aktifkan/Nonaktifkan akun UKM
export const toggleStatusAkun = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const aktorId = BigInt(req.user!.id);
    
    const operator = await prisma.organisasiOperator.findUnique({
      where: { userId: BigInt(userId as string) },
      include: { user: true, organisasi: true },
    });

    if (!operator) {
      res.status(404).json({ success: false, message: 'Akun UKM tidak ditemukan' });
      return;
    }

    if (operator.organisasi.tipe !== 'UKM') {
      res.status(403).json({ success: false, message: 'Akses ditolak. Anda hanya dapat mengatur UKM.' });
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
      message: `Akun UKM berhasil di${newStatus ? 'aktifkan' : 'nonaktifkan'}` 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// PUT /api/organisasi/akun/:userId/reset-password â€” Reset password akun UKM
export const resetPasswordAkun = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const body = resetPasswordSchema.parse(req.body);

    const operator = await prisma.organisasiOperator.findUnique({
      where: { userId: BigInt(userId as string) },
      include: { organisasi: true },
    });

    if (!operator || operator.organisasi.tipe !== 'UKM') {
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

// DELETE /api/organisasi/akun/:userId â€” Hapus Akun & UKM
export const hapusAkun = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const aktorId = BigInt(req.user!.id);

    const operator = await prisma.organisasiOperator.findUnique({
      where: { userId: BigInt(userId as string) },
      include: { organisasi: true },
    });

    if (!operator || operator.organisasi.tipe !== 'UKM') {
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

    res.json({ success: true, message: 'Akun UKM berhasil dihapus beserta datanya' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};
