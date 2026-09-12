import { Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";
import { JWT_SECRET } from "../middlewares/auth.middleware";
import { resolveKurikulumMahasiswa, resolveKurikulumIdForAngkatan } from "../services/kurikulumResolver.service";
import { z } from "zod";

// ==================== VALIDASI ====================
const loginSchema = z.object({
  email: z.string({ message: "Email wajib diisi" }).email("Format email tidak valid"),
  password: z.string({ message: "Password wajib diisi" }).min(1, "Password wajib diisi"),
});

const registerSchema = z.object({
  nama: z.string({ message: "Nama wajib diisi" }).min(2, "Nama minimal 2 karakter"),
  email: z.string({ message: "Email wajib diisi" }).email("Format email tidak valid"),
  password: z.string({ message: "Password wajib diisi" }).min(8, "Password minimal 8 karakter"),
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
        select: { jabatan: true },
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
      const errorMsg = error.issues.map((i) => i.message).join(", ") || "Validasi gagal";
      res.status(400).json({
        success: false,
        message: errorMsg,
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
            prodiId: true,
            prodi: {
              select: {
                id: true,
                nama: true,
                fakultasId: true,
                fakultas: { select: { id: true, nama: true } },
              },
            },
            dosenPA: { select: { user: { select: { nama: true } } } },
          },
        },
        dosen: {
          select: {
            nidn: true,
            fakultas: { select: { id: true, nama: true } },
          },
        },
        staff: {
          select: {
            jabatan: true,
            namaJabatan: true,
            nip: true,
            fakultas: { select: { id: true, nama: true } },
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
      // Fallback aman untuk user SSO baru jika query profil belum menemukan record internal
      res.json({
        success: true,
        data: {
          id: req.user.id,
          nama: req.user.nama || 'Pengguna',
          email: (req.user as any).email || '',
          peran: req.user.peran,
          aktif: true,
        },
      });
      return;
    }

    let userResponse: any = user;
    if (user.peran === "mahasiswa" && user.id) {
      try {
        const kur = await resolveKurikulumMahasiswa(user.id, prisma, {
          includeStructure: false,
          requireActive: false,
        });
        if (kur && user.mahasiswa) {
          userResponse = {
            ...user,
            mahasiswa: {
              ...user.mahasiswa,
              kurikulumId: kur.id,
              kurikulumNama: kur.nama,
              kurikulum: { id: kur.id, nama: kur.nama },
            },
          };
        }
      } catch (err) {
        // Abaikan jika tidak dapat di-resolve agar tidak menimbulkan error 500
      }
    }

    res.json({ success: true, data: userResponse });
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
  email: z
    .union([z.string().email("Format email tidak valid"), z.null()])
    .optional(),
  nomorTelepon: z
    .coerce.string()
    .max(30, "Nomor telepon maksimal 30 karakter")
    .nullable()
    .optional(),
  alamat: z
    .string()
    .max(255, "Alamat maksimal 255 karakter")
    .nullable()
    .optional(),
  prodiId: z.coerce.number().int("ID Program Studi harus bilangan bulat").positive("ID Program Studi tidak valid").optional(),
});

/**
 * PUT /api/auth/profil
 *
 * Memperbarui profil user yang sedang login:
 * - nama, email, nomorTelepon, alamat (tabel users)
 * - prodiId (tabel mahasiswa, hanya peran mahasiswa)
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

    if (data.prodiId !== undefined) {
      const current = await prisma.user.findUnique({
        where: { id: userId },
        select: { peran: true, mahasiswa: { select: { userId: true } } },
      });
      if (current?.peran !== "mahasiswa" || !current.mahasiswa) {
        res.status(400).json({
          success: false,
          message: "Hanya mahasiswa yang dapat mengubah program studi.",
        });
        return;
      }
      const prodi = await prisma.programStudi.findUnique({
        where: { id: data.prodiId },
      });
      if (!prodi) {
        res.status(400).json({
          success: false,
          message: "Program studi tidak ditemukan.",
        });
        return;
      }
      await prisma.mahasiswa.update({
        where: { userId },
        data: { prodiId: data.prodiId },
      });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.nama !== undefined && { nama: data.nama }),
        ...(data.email ? { email: data.email } : {}),
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
        mahasiswa: {
          select: {
            nim: true,
            prodiId: true,
            prodi: {
              select: {
                id: true,
                nama: true,
                fakultasId: true,
                fakultas: { select: { id: true, nama: true } },
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Profil berhasil diperbarui.",
      data: {
        ...user,
        id: user.id.toString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMsg = error.issues.map((i) => i.message).join(", ") || "Validasi gagal";
      res.status(400).json({
        success: false,
        message: errorMsg,
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
    passwordLama: z.string({ message: "Password lama wajib diisi" }).min(1, "Password lama wajib diisi"),
    passwordBaru: z.string({ message: "Password baru wajib diisi" }).min(8, "Password baru minimal 8 karakter"),
    konfirmasiPassword: z.string({ message: "Konfirmasi password wajib diisi" }).min(1, "Konfirmasi password wajib diisi"),
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
      const errorMsg = error.issues.map((i) => i.message).join(", ") || "Validasi gagal";
      res.status(400).json({
        success: false,
        message: errorMsg,
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
      const errorMsg = error.issues.map((i) => i.message).join(", ") || "Validasi gagal";
      res.status(400).json({
        success: false,
        message: errorMsg,
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

// ==================== SSO UNAND (KEYCLOAK) ====================

const SSO_AUTH_URL = process.env.SSO_AUTH_URL || 'https://sso.unand.ac.id/auth/realms/unand/protocol/openid-connect/auth';
const SSO_TOKEN_URL = process.env.SSO_TOKEN_URL || 'https://sso.unand.ac.id/auth/realms/unand/protocol/openid-connect/token';
const SSO_USERINFO_URL = process.env.SSO_USERINFO_URL || 'https://sso.unand.ac.id/auth/realms/unand/protocol/openid-connect/userinfo';
const SSO_LOGOUT_URL = process.env.SSO_LOGOUT_URL || 'https://sso.unand.ac.id/auth/realms/unand/protocol/openid-connect/logout';
const SSO_CLIENT_ID = process.env.SSO_CLIENT_ID || 'saps-unand';
const SSO_CLIENT_SECRET = process.env.SSO_CLIENT_SECRET || '';
const SSO_REDIRECT_URI = process.env.SSO_REDIRECT_URI || 'https://api-studentconnect.unand.ac.id/api/auth/callback';
const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://studentconnect.unand.ac.id').replace(/\/$/, '');

// In-memory PKCE state cache dengan TTL 15 menit
interface SsoStateRecord {
  verifier: string;
  frontendUrl?: string;
  expiresAt: number;
}
const ssoStateMap = new Map<string, SsoStateRecord>();

function cleanExpiredSsoStates() {
  const now = Date.now();
  for (const [key, value] of ssoStateMap.entries()) {
    if (value.expiresAt < now) {
      ssoStateMap.delete(key);
    }
  }
}

function base64UrlEncode(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * GET /api/auth/sso
 * Mengarahkan user ke Keycloak SSO UNAND dengan parameter PKCE & state
 */
export const ssoLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    cleanExpiredSsoStates();

    const referer = req.headers.referer || req.headers.origin;
    let targetFrontend = FRONTEND_URL;
    if (typeof req.query.frontend === 'string' && req.query.frontend.trim()) {
      targetFrontend = req.query.frontend.trim().replace(/\/$/, '');
    } else if (referer && typeof referer === 'string') {
      try {
        const u = new URL(referer);
        targetFrontend = `${u.protocol}//${u.host}`;
      } catch {}
    }

    const state = crypto.randomBytes(24).toString('hex');
    const verifier = base64UrlEncode(crypto.randomBytes(32));
    const challenge = base64UrlEncode(crypto.createHash('sha256').update(verifier).digest());

    ssoStateMap.set(state, {
      verifier,
      frontendUrl: targetFrontend,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    const params = new URLSearchParams({
      client_id: SSO_CLIENT_ID,
      redirect_uri: SSO_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid profile email',
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      prompt: 'login', // Memaksa Keycloak selalu menampilkan halaman login username & password
    });

    res.redirect(`${SSO_AUTH_URL}?${params.toString()}`);
  } catch (error) {
    console.error('[SSO Login Error]', error);
    res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent('Gagal menginisiasi login SSO.')}`);
  }
};

/**
 * GET /api/auth/sso/mock
 * Endpoint khusus pengujian SSO di environment Local Development.
 * Menjalankan alur JIT Auto-Provisioning & pembuatan session yang sama persis seperti SSO Keycloak nyata,
 * tanpa memerlukan whitelist domain/IP di server Keycloak UNAND.
 */
export const ssoMockLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const role = (req.query.role || 'mahasiswa').toString().toLowerCase();
    const referer = req.headers.referer || req.headers.origin;
    let targetFrontend = FRONTEND_URL;
    if (typeof req.query.frontend === 'string' && req.query.frontend.trim()) {
      targetFrontend = req.query.frontend.trim().replace(/\/$/, '');
    } else if (referer && typeof referer === 'string') {
      try {
        const u = new URL(referer);
        targetFrontend = `${u.protocol}//${u.host}`;
      } catch {}
    } else {
      targetFrontend = 'http://localhost:5173';
    }

    let email = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : '';
    let nama = typeof req.query.nama === 'string' ? req.query.nama.trim() : '';
    let username = typeof req.query.nim === 'string' ? req.query.nim.trim() : '';

    if (role === 'dosen') {
      username = username || '198501012010121001';
      nama = nama || 'Dr. Dosen Teladan, M.Kom';
      email = email || `${username}@unand.ac.id`;
    } else {
      username = username || '2411522001';
      nama = nama || (username === '2411522001' ? 'Sheva Ramadhan' : `Mahasiswa (${username})`);
      email = email || `${username}@student.unand.ac.id`;
    }

    let peran: 'mahasiswa' | 'dosen' | 'staff' = role === 'dosen' ? 'dosen' : 'mahasiswa';

    // Auto-Provisioning / JIT User Sync di database
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`[SSO Mock Local] Auto-provisioning user: ${email} (${peran})`);
      user = await prisma.user.create({
        data: {
          nama,
          email,
          passwordHash: await hashPassword(crypto.randomUUID()),
          peran: peran as any,
          aktif: true,
        },
      });
    } else if (!user.aktif) {
      await prisma.user.update({
        where: { id: user.id },
        data: { aktif: true },
      });
    }

    if (user.peran === 'mahasiswa') {
      const existingMhs = await prisma.mahasiswa.findUnique({
        where: { userId: user.id },
      });

      if (!existingMhs) {
        let nim = username;
        let angkatan = new Date().getFullYear();
        if (/^\d{2}/.test(nim)) {
          const prefixYear = parseInt(nim.substring(0, 2), 10);
          if (prefixYear >= 15 && prefixYear <= 40) {
            angkatan = 2000 + prefixYear;
          }
        }
        const defaultProdi = await prisma.programStudi.findFirst();
        const prodiId = defaultProdi?.id || 1;
        const kurikulumId = await resolveKurikulumIdForAngkatan(angkatan);

        await prisma.mahasiswa.create({
          data: {
            userId: user.id,
            nim,
            angkatan,
            prodiId,
            kurikulumId,
          },
        });
      }
    } else if (user.peran === 'dosen') {
      const existingDosen = await prisma.dosen.findUnique({
        where: { userId: user.id },
      });
      if (!existingDosen) {
        const defaultFakultas = await prisma.fakultas.findFirst();
        await prisma.dosen.create({
          data: {
            userId: user.id,
            nidn: username || `NIDN-${user.id}`,
            fakultasId: defaultFakultas?.id || 1,
          },
        });
      }
    }

    const tokenPayload: Record<string, any> = {
      id: user.id.toString(),
      peran: user.peran,
      nama: user.nama,
      email: user.email,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    res.redirect(`${targetFrontend}/login?sso=success&token=${encodeURIComponent(token)}`);
  } catch (err: any) {
    console.error('[SSO Mock Error]', err);
    res.redirect(`http://localhost:5173/login?error=${encodeURIComponent('Gagal simulasi SSO: ' + (err?.message || 'Error'))}`);
  }
};

/**
 * GET /api/auth/callback
 * Menerima callback dari Keycloak SSO UNAND:
 * 1. Tukar authorization code dengan access_token/id_token
 * 2. Ambil user profile dari userinfo endpoint atau id_token
 * 3. Auto-provisioning: jika user belum ada di db_saps, buat otomatis (Mahasiswa / Dosen)
 * 4. Generate JWT token SAPS
 * 5. Redirect ke Frontend: /login?sso=success&token=...
 */
export const ssoCallback = async (req: Request, res: Response): Promise<void> => {
  const { code, state, error, error_description } = req.query;

  const stateStr = typeof state === 'string' ? state : '';
  const cachedState = stateStr ? ssoStateMap.get(stateStr) : undefined;
  const clientFrontendUrl = cachedState?.frontendUrl || FRONTEND_URL;
  const codeVerifier = cachedState?.verifier;
  if (stateStr) {
    ssoStateMap.delete(stateStr);
  }

  if (error) {
    console.error('[SSO Callback Error dari IdP]', error, error_description);
    res.redirect(`${clientFrontendUrl}/login?error=${encodeURIComponent(String(error_description || error))}`);
    return;
  }

  if (!code || typeof code !== 'string') {
    res.redirect(`${clientFrontendUrl}/login?error=${encodeURIComponent('Kode otorisasi SSO tidak ditemukan.')}`);
    return;
  }

  try {
    cleanExpiredSsoStates();

    // 1. Tukarkan authorization code ke Keycloak Token Endpoint
    const tokenRequestBody: Record<string, string> = {
      grant_type: 'authorization_code',
      client_id: SSO_CLIENT_ID,
      code,
      redirect_uri: SSO_REDIRECT_URI,
    };
    if (codeVerifier) {
      tokenRequestBody.code_verifier = codeVerifier;
    }
    if (SSO_CLIENT_SECRET) {
      tokenRequestBody.client_secret = SSO_CLIENT_SECRET;
    }

    const tokenRes = await fetch(SSO_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(tokenRequestBody).toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('[SSO Token Exchange Gagal]', tokenRes.status, errText);
      res.redirect(`${clientFrontendUrl}/login?error=${encodeURIComponent('Gagal menukarkan token SSO ke server UNAND.')}`);
      return;
    }

    const tokenData: any = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const idToken = tokenData.id_token;

    // 2. Ambil data profil user dari Keycloak UserInfo atau decoded id_token
    let ssoProfile: any = {};
    if (accessToken) {
      try {
        const userInfoRes = await fetch(SSO_USERINFO_URL, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (userInfoRes.ok) {
          ssoProfile = await userInfoRes.json();
        }
      } catch (uiErr) {
        console.warn('[SSO UserInfo Warning]', uiErr);
      }
    }

    // Fallback baca payload dari id_token jika userinfo kosong/parsial
    if ((!ssoProfile.email || !ssoProfile.name) && idToken) {
      try {
        const parts = idToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          ssoProfile = { ...payload, ...ssoProfile };
        }
      } catch (pErr) {
        console.warn('[SSO ID Token Parse Warning]', pErr);
      }
    }

    const email = (ssoProfile.email || ssoProfile.preferred_username || '').trim().toLowerCase();
    const nama = ssoProfile.name || ssoProfile.given_name || ssoProfile.preferred_username || email.split('@')[0] || 'Pengguna UNAND';
    const username = (ssoProfile.preferred_username || '').trim();

    if (!email) {
      res.redirect(`${clientFrontendUrl}/login?error=${encodeURIComponent('Email tidak ditemukan dari akun SSO Anda.')}`);
      return;
    }

    // 3. Deteksi Peran (Role) secara cerdas:
    // - Jika email @student.unand.ac.id atau username / email berformat NIM (10 digit): Mahasiswa
    // - Jika email @unand.ac.id atau username berformat NIP (18 digit): Dosen
    // - Fallback default: Mahasiswa
    const isStudentEmail = email.endsWith('@student.unand.ac.id');
    const isNimUsername = /^\d{10}$/.test(username);
    const isNimEmail = /^\d{10}/.test(email);

    let peran: 'mahasiswa' | 'dosen' | 'staff' = 'mahasiswa';
    if (isStudentEmail || isNimUsername || isNimEmail) {
      peran = 'mahasiswa';
    } else if (email.endsWith('@unand.ac.id')) {
      peran = 'dosen';
    }

    // 4. Bangun Identitas Pengguna dari Session Login SSO (Sesuai Arahan DTI: Gunakan Session SSO)
    let userIdStr = username || email;
    let finalPeran = peran;

    // Sinkronisasi DB Ringan (Graceful & Non-blocking agar tidak membebani atau menolak user)
    try {
      let user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            nama,
            email,
            passwordHash: await hashPassword(crypto.randomUUID()),
            peran: peran as any,
            aktif: true,
          },
        });
      } else {
        if (!user.aktif) {
          await prisma.user.update({
            where: { id: user.id },
            data: { aktif: true },
          });
        }
        finalPeran = user.peran as any;
      }

      userIdStr = user.id.toString();

      // Sinkronkan data relasi mahasiswa/dosen untuk integritas modul SAPS
      if (user.peran === 'mahasiswa') {
        const existingMhs = await prisma.mahasiswa.findUnique({
          where: { userId: user.id },
        });

        if (!existingMhs) {
          let nim = username;
          if (!/^\d{10}$/.test(nim)) {
            const match = email.match(/^(\d{10})/);
            if (match) nim = match[1];
          }
          nim = nim || `NIM${user.id.toString().padStart(8, '0')}`;

          let angkatan = new Date().getFullYear();
          if (/^\d{2}/.test(nim)) {
            const prefixYear = parseInt(nim.substring(0, 2), 10);
            if (prefixYear >= 15 && prefixYear <= 40) {
              angkatan = 2000 + prefixYear;
            }
          }

          const defaultProdi = await prisma.programStudi.findFirst();
          const prodiId = defaultProdi?.id || 1;
          const kurikulumId = await resolveKurikulumIdForAngkatan(angkatan);

          await prisma.mahasiswa.create({
            data: {
              userId: user.id,
              nim,
              angkatan,
              prodiId,
              kurikulumId,
            },
          });
        }
      } else if (user.peran === 'dosen') {
        const existingDosen = await prisma.dosen.findUnique({
          where: { userId: user.id },
        });

        if (!existingDosen) {
          const defaultFakultas = await prisma.fakultas.findFirst();
          await prisma.dosen.create({
            data: {
              userId: user.id,
              nidn: username || `NIDN-${user.id}`,
              fakultasId: defaultFakultas?.id || 1,
            },
          });
        }
      }
    } catch (syncErr) {
      // Jika database sedang sibuk/ada kendala, login SSO TETAP BERHASIL dengan session token
      console.warn('[SSO Session Handled Gracefully]', syncErr);
    }

    // 5. Generate JWT Token SAPS dari Session SSO
    const tokenPayload: Record<string, any> = {
      id: userIdStr,
      peran: finalPeran,
      nama,
      email,
      nim: finalPeran === 'mahasiswa' ? username : undefined,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    // 6. Redirect ke Frontend dengan session token
    res.redirect(`${clientFrontendUrl}/login?sso=success&token=${encodeURIComponent(token)}`);
  } catch (err: any) {
    console.error('[SSO Callback Fatal Error]', err);
    res.redirect(`${clientFrontendUrl}/login?error=${encodeURIComponent('Terjadi kesalahan saat memproses login SSO: ' + (err?.message || 'Server error'))}`);
  }
};

/**
 * GET /api/auth/sso/logout
 * Mengarahkan user ke logout Keycloak SSO UNAND
 */
export const ssoLogout = async (_req: Request, res: Response): Promise<void> => {
  const postLogoutRedirect = `${FRONTEND_URL}/login`;
  const logoutUrl = `${SSO_LOGOUT_URL}?post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirect)}&client_id=${encodeURIComponent(SSO_CLIENT_ID)}`;
  res.redirect(logoutUrl);
};

