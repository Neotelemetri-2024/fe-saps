import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { JWT_SECRET } from "../middlewares/auth.middleware";
import { z } from "zod";

// ==================== VALIDASI ====================
const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

const registerSchema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
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
        message: "Email atau password salah.",
      });
      return;
    }

    // 2. Cek apakah akun aktif
    if (!user.aktif) {
      res.status(403).json({
        success: false,
        message: "Akun Anda dinonaktifkan. Hubungi admin.",
      });
      return;
    }

    // 3. Verifikasi password
    const isPasswordValid = await bcrypt.compare(
      data.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Password salah. Silakan coba lagi.",
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
    if (user.peran === "staff") {
      const staff = await prisma.staff.findUnique({
        where: { userId: user.id },
      });
      if (staff) {
        tokenPayload.jabatan = staff.jabatan;
      }
    }

    // Jika operator_org, ambil organisasi terkait
    if (user.peran === "operator_org") {
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
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "24h" });

    res.json({
      success: true,
      message: "Login berhasil!",
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
        message: "Validasi gagal",
        errors: error.issues,
      });
    } else {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
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
      res.status(401).json({ success: false, message: "Unauthorized" });
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
        nomorTelepon: true,
        alamat: true,
        createdAt: true,
        mahasiswa: {
          select: {
            nim: true,
            angkatan: true,
            prodi: {
              select: { nama: true, fakultas: { select: { nama: true } } },
            },
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
      res.status(404).json({ success: false, message: "User tidak ditemukan" });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan pada server" });
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

// ==================== UPDATE PROFIL ====================

const updateProfilSchema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter").optional(),
  email: z.string().email("Format email tidak valid").optional(),
  nomorTelepon: z
    .string()
    .max(30, "Nomor telepon maksimal 30 karakter")
    .nullable()
    .optional(),
  alamat: z
    .string()
    .max(255, "Alamat maksimal 255 karakter")
    .nullable()
    .optional(),
});

/**
 * PUT /api/auth/profil
 *
 * Memperbarui profil user yang sedang login:
 * - nama, email (tabel users)
 * - nomorTelepon, alamat (tabel users — kolom baru)
 *
 * Membutuhkan token JWT yang valid.
 */
export const updateProfil = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const data = updateProfilSchema.parse(req.body);

    if (Object.keys(data).length === 0) {
      res
        .status(400)
        .json({ success: false, message: "Tidak ada data yang dikirim." });
      return;
    }

    const userId = BigInt(req.user.id);

    // Jika email diubah, pastikan tidak dipakai user lain
    if (data.email) {
      const existing = await prisma.user.findFirst({
        where: { email: data.email, NOT: { id: userId } },
      });
      if (existing) {
        res.status(400).json({
          success: false,
          message: "Email sudah digunakan oleh akun lain.",
        });
        return;
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.nama !== undefined && { nama: data.nama }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.nomorTelepon !== undefined && {
          nomorTelepon: data.nomorTelepon,
        }),
        ...(data.alamat !== undefined && { alamat: data.alamat }),
      },
      select: {
        id: true,
        nama: true,
        email: true,
        peran: true,
        nomorTelepon: true,
        alamat: true,
      },
    });

    res.json({
      success: true,
      message: "Profil berhasil diperbarui.",
      data: user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Validasi gagal",
        errors: error.issues,
      });
    } else {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
      });
    }
  }
};

// ==================== GANTI PASSWORD ====================

const gantiPasswordSchema = z
  .object({
    passwordLama: z.string().min(1, "Password lama wajib diisi"),
    passwordBaru: z.string().min(6, "Password baru minimal 6 karakter"),
    konfirmasiPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((d) => d.passwordBaru === d.konfirmasiPassword, {
    message: "Konfirmasi password tidak cocok.",
    path: ["konfirmasiPassword"],
  });

/**
 * PUT /api/auth/ganti-password
 *
 * Mengganti password user yang sedang login.
 * Password lama harus benar sebelum password baru disimpan.
 *
 * Membutuhkan token JWT yang valid.
 */
export const gantiPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const data = gantiPasswordSchema.parse(req.body);

    const userId = BigInt(req.user.id);
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      res.status(404).json({ success: false, message: "User tidak ditemukan" });
      return;
    }

    // Verifikasi password lama
    const isMatch = await bcrypt.compare(data.passwordLama, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ success: false, message: "Password lama salah." });
      return;
    }

    // Jangan mengubah password jika sama dengan yang lama
    const sameAsOld = await bcrypt.compare(
      data.passwordBaru,
      user.passwordHash,
    );
    if (sameAsOld) {
      res.status(400).json({
        success: false,
        message: "Password baru tidak boleh sama dengan password lama.",
      });
      return;
    }

    const passwordHash = await hashPassword(data.passwordBaru);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    res.json({ success: true, message: "Password berhasil diubah." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Validasi gagal",
        errors: error.issues,
      });
    } else {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
      });
    }
  }
};

// ==================== UPDATE FCM TOKEN ====================

const fcmTokenSchema = z.object({
  fcmToken: z.string().min(1, "FCM Token wajib diisi"),
});

/**
 * PUT /api/auth/fcm-token
 *
 * Menyimpan/memperbarui FCM device token untuk push notification.
 * Dipanggil oleh Frontend setelah user login dan mendapatkan izin notifikasi browser.
 */
export const updateFcmToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const data = fcmTokenSchema.parse(req.body);
    const userId = BigInt(req.user.id);

    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken: data.fcmToken },
    });

    res.json({ success: true, message: "FCM Token berhasil disimpan." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: "Validasi gagal",
        errors: error.issues,
      });
    } else {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan pada server",
      });
    }
  }
};
