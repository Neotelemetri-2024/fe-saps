import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { logAudit } from '../lib/auditLog';

// Schema validasi
const staffSchema = z.object({
  nama: z.string().min(3, 'Nama minimal 3 karakter'),
  nip: z.string().optional().nullable(),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter').optional(), // Opsional saat edit
  jabatan: z.enum(['admin_ditmawa', 'pimpinan_ditmawa', 'admin_fakultas', 'pimpinan_fakultas', 'pimpinan_utama']),
  fakultasId: z.number().int().positive().optional().nullable(),
  aktif: z.boolean().default(true),
});

export const createStaff = async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.peran; // 'staff'
    const userId = req.user?.id ? BigInt(req.user.id) : null;

    if (!userId || userRole !== 'staff') {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    const currStaff = await prisma.staff.findUnique({ where: { userId } });
    if (!currStaff) return res.status(403).json({ success: false, message: 'Data staff tidak ditemukan' });

    const body = staffSchema.parse(req.body);

    // Otorisasi pembuatan akun
    if (currStaff.jabatan === 'pimpinan_utama' || currStaff.jabatan === 'pimpinan_ditmawa') {
      // Pimpinan Ditmawa/Utama boleh buat: pimpinan_utama, pimpinan_fakultas, admin_ditmawa
      if (!['pimpinan_utama', 'pimpinan_fakultas', 'admin_ditmawa'].includes(body.jabatan)) {
        return res.status(403).json({ success: false, message: 'Pimpinan Ditmawa hanya dapat membuat akun Pimpinan atau Admin Ditmawa' });
      }
    } else if (currStaff.jabatan === 'pimpinan_fakultas') {
      // Pimpinan Fakultas boleh buat: admin_fakultas (hanya untuk fakultasnya sendiri)
      if (body.jabatan !== 'admin_fakultas') {
        return res.status(403).json({ success: false, message: 'Pimpinan Fakultas hanya dapat membuat akun Admin Fakultas' });
      }
      if (body.fakultasId !== currStaff.fakultasId) {
        return res.status(403).json({ success: false, message: 'Hanya dapat membuat admin untuk fakultas Anda sendiri' });
      }
    } else {
      return res.status(403).json({ success: false, message: 'Akses ditolak. Hanya Pimpinan yang dapat membuat akun' });
    }

    // Jika fakultas, pastikan fakultasId ada
    if (body.jabatan.includes('fakultas') && !body.fakultasId) {
      return res.status(400).json({ success: false, message: 'Fakultas wajib diisi untuk peran tingkat Fakultas' });
    }

    // Cek email duplikat
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email sudah digunakan' });
    }

    const passwordHash = await bcrypt.hash(body.password || 'password123', 10);

    const newUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          nama: body.nama,
          email: body.email,
          passwordHash,
          peran: 'staff',
          aktif: body.aktif,
        }
      });

      await tx.staff.create({
        data: {
          userId: u.id,
          jabatan: body.jabatan as any,
          nip: body.nip,
          fakultasId: body.fakultasId || null,
        }
      });

      return u;
    });

    await logAudit({
      entitas: 'user',
      entitasId: newUser.id,
      aksi: 'CREATE',
      statusBaru: 'aktif',
      aktorId: userId,
    });

    res.status(201).json({ success: true, message: 'Akun berhasil dibuat', data: { id: newUser.id.toString(), nama: newUser.nama, email: newUser.email } });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const errorMsg = error.issues.map((i) => i.message).join(', ') || 'Validasi gagal';
      return res.status(400).json({ success: false, message: errorMsg, errors: error.issues });
    }
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server', error: error.message });
  }
};

export const getStaff = async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.peran;
    const userId = req.user?.id ? BigInt(req.user.id) : null;

    if (!userId || userRole !== 'staff') {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    const currStaff = await prisma.staff.findUnique({ where: { userId } });
    if (!currStaff) return res.status(403).json({ success: false, message: 'Data staff tidak ditemukan' });

    let whereClause: any = {};
    if (currStaff.jabatan === 'pimpinan_utama' || currStaff.jabatan === 'pimpinan_ditmawa') {
      whereClause.jabatan = { in: ['pimpinan_utama', 'pimpinan_fakultas', 'admin_ditmawa'] };
    } else if (currStaff.jabatan === 'pimpinan_fakultas') {
      whereClause.jabatan = 'admin_fakultas';
      whereClause.fakultasId = currStaff.fakultasId;
    } else {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    const staffs = await prisma.staff.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, nama: true, email: true, aktif: true, createdAt: true }
        },
        fakultas: { select: { nama: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const mapped = staffs.map(s => ({
      id: s.userId.toString(),
      nama: s.user.nama,
      email: s.user.email,
      jabatan: s.jabatan,
      nip: s.nip,
      fakultasId: s.fakultasId,
      fakultasNama: s.fakultas?.nama,
      aktif: s.user.aktif,
      createdAt: s.user.createdAt,
    }));

    res.json({ success: true, data: mapped });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server', error: error.message });
  }
};

export const updateStaff = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const targetUserId = BigInt(id as string);
    const userId = req.user?.id ? BigInt(req.user.id) : null;
    const userRole = req.user?.peran;

    if (!userId || userRole !== 'staff') return res.status(403).json({ success: false, message: 'Akses ditolak' });

    const body = staffSchema.parse(req.body);

    const currStaff = await prisma.staff.findUnique({ where: { userId } });
    if (!currStaff) return res.status(403).json({ success: false, message: 'Data staff tidak ditemukan' });

    const targetStaff = await prisma.staff.findUnique({ where: { userId: targetUserId } });
    if (!targetStaff) return res.status(404).json({ success: false, message: 'Akun tidak ditemukan' });

    // Otorisasi update (sama seperti create)
    if (currStaff.jabatan === 'pimpinan_utama' || currStaff.jabatan === 'pimpinan_ditmawa') {
      if (!['pimpinan_utama', 'pimpinan_fakultas', 'admin_ditmawa'].includes(targetStaff.jabatan)) {
        return res.status(403).json({ success: false, message: 'Pimpinan Ditmawa hanya dapat mengubah akun Pimpinan atau Admin Ditmawa' });
      }
    } else if (currStaff.jabatan === 'pimpinan_fakultas') {
      if (targetStaff.jabatan !== 'admin_fakultas' || targetStaff.fakultasId !== currStaff.fakultasId) {
        return res.status(403).json({ success: false, message: 'Pimpinan Fakultas hanya dapat mengubah akun Admin Fakultas di fakultas yang sama' });
      }
    } else {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    const existingEmail = await prisma.user.findFirst({
      where: { email: body.email, id: { not: targetUserId } }
    });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email sudah digunakan oleh akun lain' });
    }

    let passwordHash = undefined;
    if (body.password) {
      passwordHash = await bcrypt.hash(body.password, 10);
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: targetUserId },
        data: {
          nama: body.nama,
          email: body.email,
          aktif: body.aktif,
          ...(passwordHash && { passwordHash }),
        }
      });

      await tx.staff.update({
        where: { userId: targetUserId },
        data: {
          jabatan: body.jabatan as any,
          nip: body.nip,
          fakultasId: body.fakultasId || null,
        }
      });
    });

    await logAudit({
      entitas: 'user',
      entitasId: targetUserId,
      aksi: 'UPDATE',
      aktorId: userId,
    });

    res.json({ success: true, message: 'Akun berhasil diperbarui' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const errorMsg = error.issues.map((i) => i.message).join(', ') || 'Validasi gagal';
      return res.status(400).json({ success: false, message: errorMsg, errors: error.issues });
    }
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server', error: error.message });
  }
};
