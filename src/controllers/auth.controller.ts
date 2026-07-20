import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { JWT_SECRET } from '../middlewares/auth.middleware';
import { z } from 'zod';

// ==================== VALIDASI ====================
const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

const registerSchema = z.object({
  nama: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

// ==================== LOGIN ====================

/**
 * POST /api/auth/login
 * 
 * Menerima email + password, memverifikasi, dan mengembalikan JWT token.
 * Token berisi: id, peran, jabatan (jika staff), dan nama.
 * 
 * Alur penentuan role di token:
 * - Jika user.peran === 'staff', kita query tabel Staff untuk mendapatkan jabatan
 *   (admin_ditmawa, pimpinan_ditmawa, admin_fakultas, pimpinan_fakultas)
 * - Jika user.peran === 'operator_org', kita query tabel OrganisasiOperator
 *   untuk mendapatkan organisasiId
 * - Jika user.peran === 'mahasiswa' atau 'dosen', cukup simpan peran saja
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = loginSchema.parse(req.body);

    // 1. Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Email atau password salah.',
      });
      return;
    }

    // 2. Cek apakah akun aktif
    if (!user.aktif) {
      res.status(403).json({
        success: false,
        message: 'Akun Anda dinonaktifkan. Hubungi admin.',
      });
      return;
    }

    // 3. Verifikasi password
    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Email atau password salah.',
      });
      return;
    }

    // 4. Bangun JWT payload berdasarkan role
    const tokenPayload: Record<string, any> = {
      id: user.id.toString(),
      peran: user.peran,
      nama: user.nama,
    };

    // Jika staff, ambil jabatan spesifik
    if (user.peran === 'staff') {
      const staff = await prisma.staff.findUnique({
        where: { userId: user.id },
      });
      if (staff) {
        tokenPayload.jabatan = staff.jabatan;
      }
    }

    // Jika operator_org, ambil organisasi terkait
    if (user.peran === 'operator_org') {
      const operator = await prisma.organisasiOperator.findUnique({
        where: { userId: user.id },
        include: { organisasi: { select: { id: true, nama: true } } },
      });
      if (operator) {
        tokenPayload.organisasiId = operator.organisasiId;
        tokenPayload.namaOrganisasi = operator.organisasi.nama;
      }
    }

    // 5. Generate JWT token (berlaku 24 jam)
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      message: 'Login berhasil!',
      data: {
        token,
        user: {
          id: user.id.toString(),
          nama: user.nama,
          email: user.email,
          peran: user.peran,
          jabatan: tokenPayload.jabatan || null,
          organisasiId: tokenPayload.organisasiId || null,
          namaOrganisasi: tokenPayload.namaOrganisasi || null,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validasi gagal',
        errors: error.issues,
      });
    } else {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan pada server',
      });
    }
  }
};

// ==================== GET PROFILE (ME) ====================

/**
 * GET /api/auth/me
 * 
 * Mengembalikan profil lengkap user yang sedang login.
 * Membutuhkan token JWT yang valid.
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const userId = BigInt(req.user.id);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nama: true,
        email: true,
        peran: true,
        aktif: true,
        createdAt: true,
        mahasiswa: {
          select: {
            nim: true,
            angkatan: true,
            prodi: { select: { nama: true, fakultas: { select: { nama: true } } } },
            dosenPA: { select: { user: { select: { nama: true } } } },
          },
        },
        dosen: {
          select: {
            nidn: true,
            fakultas: { select: { nama: true } },
          },
        },
        staff: {
          select: {
            jabatan: true,
            fakultas: { select: { nama: true } },
          },
        },
        organisasiOperator: {
          select: {
            organisasi: { select: { id: true, nama: true, tipe: true } },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User tidak ditemukan' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// ==================== HASH PASSWORD HELPER ====================

/**
 * Fungsi bantuan: Hash password menggunakan bcrypt.
 * Digunakan saat membuat user baru atau reset password.
 */
export const hashPassword = async (plainPassword: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plainPassword, salt);
};
