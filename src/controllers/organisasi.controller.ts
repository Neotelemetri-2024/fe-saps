import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';
import { logAudit } from '../lib/auditLog';

// ==================== VALIDASI ====================
const createOrganisasiSchema = z.object({
  nama: z.string().min(3),
  // tipe: TipeOrg
  // Admin Ditmawa hanya bisa membuat tipe 'UKM'
});

const createOperatorSchema = z.object({
  nama: z.string().min(3),
  email: z.string().email(),
  organisasiId: z.number().int().positive(),
});

// Schema baru sesuai wireframe
const createAkunLengkapSchema = z.object({
  namaUkm: z.string().min(3),
  username: z.string().min(3),
  password: z.string().min(6),
  status: z.boolean(), // true = Aktif, false = Non Aktif
});

const resetPasswordSchema = z.object({
  passwordBaru: z.string().min(6),
});

// ==================== ORGANISASI CRUD ====================

// GET /api/organisasi — Daftar organisasi
export const getOrganisasi = async (req: Request, res: Response) => {
  try {
    const { tipe } = req.query;
    const where: any = {};
    if (tipe) where.tipe = tipe as string;

    const data = await prisma.organisasi.findMany({
      where,
      include: {
        fakultas: true,
        _count: { select: { operator: true, kegiatan: true } },
      },
      orderBy: { nama: 'asc' },
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// POST /api/organisasi — Buat organisasi baru (Admin Ditmawa HANYA UKM)
export const createOrganisasi = async (req: Request, res: Response): Promise<void> => {
  try {
    const aktorId = BigInt(req.body.aktorId); 
    const body = createOrganisasiSchema.parse(req.body);

    // [BR-TERKUNCI] Admin Ditmawa hanya bisa buat UKM, UKMF ditolak
    const tipeBaru = req.body.tipe || 'UKM';
    if (tipeBaru === 'UKMF') {
      res.status(403).json({ 
        success: false, 
        message: 'Akses Ditolak: Admin Ditmawa hanya dapat membuat organisasi bertipe UKM. UKMF adalah wewenang Admin Fakultas.' 
      });
      return;
    }

    const org = await prisma.organisasi.create({
      data: {
        nama: body.nama,
        tipe: 'UKM',
        fakultasId: null, // UKM universitas tidak punya fakultas
      },
    });

    await logAudit({
      entitas: 'organisasi',
      entitasId: org.id,
      aksi: 'create',
      statusBaru: 'UKM',
      aktorId,
    });

    res.status(201).json({ success: true, data: org });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validasi gagal', errors: error.issues });
    } else {
      console.error(error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
  }
};

// ==================== OPERATOR UKM CRUD ====================

// GET /api/organisasi/operator — Daftar akun operator UKM
export const getOperatorOrg = async (req: Request, res: Response) => {
  try {
    const data = await prisma.organisasiOperator.findMany({
      include: {
        user: { select: { id: true, nama: true, email: true, aktif: true } },
        organisasi: true,
      },
    });
    // Serialize bigint
    const serializedData = data.map(d => ({
      ...d,
      userId: d.userId.toString(),
      user: { ...d.user, id: d.user.id.toString() }
    }));
    res.json({ success: true, data: serializedData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// POST /api/organisasi/operator — Buat akun operator UKM
export const createOperatorOrg = async (req: Request, res: Response): Promise<void> => {
  try {
    const aktorId = BigInt(req.body.aktorId);
    const body = createOperatorSchema.parse(req.body);

    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({ where: { email: body.email } });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
      return;
    }

    // Pastikan organisasi tujuan adalah UKM
    const targetOrg = await prisma.organisasi.findUnique({ where: { id: body.organisasiId } });
    if (!targetOrg) {
      res.status(404).json({ success: false, message: 'Organisasi tidak ditemukan' });
      return;
    }
    if (targetOrg.tipe === 'UKMF') {
      res.status(403).json({ 
        success: false, 
        message: 'Akses Ditolak: Tidak dapat membuat operator untuk UKMF. Silakan hubungi Admin Fakultas.' 
      });
      return;
    }

    // Gunakan transaction untuk memastikan pembuatan User dan OperatorOrg atomik
    const newOperator = await prisma.$transaction(async (tx) => {
      // 1. Buat User
      const user = await tx.user.create({
        data: {
          nama: body.nama,
          email: body.email,
          passwordHash: 'Unand123!', // Standar default password
          peran: 'operator_org',
          aktif: true,
        },
      });

      // 2. Tautkan ke Organisasi
      const op = await tx.organisasiOperator.create({
        data: {
          userId: user.id,
          organisasiId: body.organisasiId,
        },
        include: {
          user: { select: { id: true, nama: true, email: true, aktif: true } },
          organisasi: true,
        },
      });

      return op;
    });

    await logAudit({
      entitas: 'user_operator_org',
      entitasId: newOperator.userId,
      aksi: 'create',
      statusBaru: 'aktif',
      aktorId,
    });

    res.status(201).json({ 
      success: true, 
      data: {
        ...newOperator,
        userId: newOperator.userId.toString(),
        user: { ...newOperator.user, id: newOperator.user.id.toString() }
      } 
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

// PUT /api/organisasi/operator/:userId/status — Aktifkan/Nonaktifkan akun
export const toggleStatusAkun = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const aktorId = BigInt(req.body.aktorId);
    
    // Pastikan yang ditoggle adalah operator UKM
    const operator = await prisma.organisasiOperator.findUnique({
      where: { userId: BigInt(userId as string) },
      include: { user: true, organisasi: true },
    });

    if (!operator) {
      res.status(404).json({ success: false, message: 'Operator organisasi tidak ditemukan' });
      return;
    }

    if (operator.organisasi.tipe === 'UKMF') {
      res.status(403).json({ success: false, message: 'Akses Ditolak: Hanya dapat menonaktifkan akun UKM.' });
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
      message: `Akun berhasil di${newStatus ? 'aktifkan' : 'nonaktifkan'}` 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// ==================== FITUR TERPADU (SESUAI WIREFRAME UI) ====================

// POST /api/organisasi/akun — Buat UKM dan Akun sekaligus
export const createAkunLengkap = async (req: Request, res: Response): Promise<void> => {
  try {
    const aktorId = BigInt(req.body.aktorId || 0); // Bisa dari token jwt (req.user)
    const body = createAkunLengkapSchema.parse(req.body);

    // Di database kita menggunakan email sebagai username
    const emailFormat = `${body.username}@ukm.unand.ac.id`;

    const existingUser = await prisma.user.findUnique({ where: { email: emailFormat } });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'Username sudah digunakan' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Buat Organisasi UKM
      const org = await tx.organisasi.create({
        data: {
          nama: body.namaUkm,
          tipe: 'UKM',
        },
      });

      // 2. Buat User Operator
      const user = await tx.user.create({
        data: {
          nama: `Operator ${body.namaUkm}`,
          email: emailFormat,
          passwordHash: body.password, // Catatan: Seharusnya di-hash pakai bcrypt!
          peran: 'operator_org',
          aktif: body.status,
        },
      });

      // 3. Sambungkan User ke Organisasi
      await tx.organisasiOperator.create({
        data: {
          userId: user.id,
          organisasiId: org.id,
        },
      });

      return { org, user };
    });

    await logAudit({
      entitas: 'akun_ukm_lengkap',
      entitasId: result.user.id,
      aksi: 'create',
      statusBaru: body.status ? 'aktif' : 'nonaktif',
      aktorId,
    });

    res.status(201).json({
      success: true,
      message: 'Akun UKM berhasil dibuat',
      data: {
        userId: result.user.id.toString(),
        namaUkm: result.org.nama,
        username: body.username,
        status: result.user.aktif
      }
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

// PUT /api/organisasi/akun/:userId/reset — Reset Password & Edit Status
export const resetPasswordAkun = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const body = resetPasswordSchema.parse(req.body);
    // Opsional update status jika dikirim dari frontend
    const { status } = req.body; 

    const dataUpdate: any = { passwordHash: body.passwordBaru };
    if (status !== undefined) {
      dataUpdate.aktif = status;
    }

    await prisma.user.update({
      where: { id: BigInt(userId as string) },
      data: dataUpdate,
    });

    res.json({ success: true, message: 'Password dan status akun berhasil direset' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validasi gagal', errors: error.issues });
    } else {
      console.error(error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
  }
};

// DELETE /api/organisasi/akun/:userId — Hapus Akun UKM
export const hapusAkun = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Prisma Cascade delete akan menghapus OrganisasiOperator otomatis, tapi Organisasi nya tertinggal.
    // Jika mau hapus organisasi-nya juga:
    const op = await prisma.organisasiOperator.findUnique({
      where: { userId: BigInt(userId as string) }
    });

    if (op) {
      await prisma.$transaction([
        prisma.user.delete({ where: { id: BigInt(userId as string) } }),
        prisma.organisasi.delete({ where: { id: op.organisasiId } })
      ]);
    }

    res.json({ success: true, message: 'Akun UKM berhasil dihapus permanen' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};
