import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';
import { logAudit } from '../lib/auditLog';

// ==================== VALIDASI ====================
const createKegiatanSchema = z.object({
  nama: z.string().min(3),
  kategoriId: z.number().int().positive(),
  skalaId: z.number().int().positive(),
  asal: z.enum(['kurikuler_ukm', 'kurikuler_ukmf', 'universitas', 'eksternal']),
  deskripsi: z.string().optional(),
  tanggalMulai: z.string().refine(v => !isNaN(Date.parse(v))),
  tanggalSelesai: z.string().refine(v => !isNaN(Date.parse(v))),
  lokasi: z.string().optional(),
  kuota: z.number().int().positive().optional(),
  organisasiId: z.number().int().positive().optional(),
  penyelenggaraExt: z.string().optional(),
  // Alokasi capaian
  alokasi: z.array(z.object({
    subCapaianId: z.number().int().positive(),
    alokasiPersen: z.number().min(0.01).max(100),
  })).min(1),
});

const approvalSchema = z.object({
  keputusan: z.enum(['setuju', 'revisi', 'tolak']),
  alasan: z.string().optional(),
});

// ==================== KEGIATAN CRUD ====================

// GET /api/kegiatan — Daftar kegiatan (filter: status, asal, kategoriId)
export const getAllKegiatan = async (req: Request, res: Response) => {
  try {
    const { status, asal, kategoriId, search } = req.query;
    const where: any = {};
    if (status) where.status = status as string;
    if (asal) where.asal = asal as string;
    if (kategoriId) where.kategoriId = Number(kategoriId);
    if (search) {
      where.OR = [
        { nama: { contains: search as string } },
        { lokasi: { contains: search as string } },
        { penyelenggaraExt: { contains: search as string } },
      ];
    }

    const data = await prisma.kegiatan.findMany({
      where,
      include: {
        kategori: true,
        skala: true,
        organisasi: { select: { id: true, nama: true, tipe: true } },
        kurikulum: { select: { id: true, nama: true } },
        pembuat: { select: { id: true, nama: true } },
        _count: { select: { partisipasi: true, kegiatanCapaian: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// GET /api/kegiatan/:id — Detail kegiatan + alokasi + approval history
export const getKegiatanById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = await prisma.kegiatan.findUnique({
      where: { id: Number(id) },
      include: {
        kategori: true,
        skala: true,
        organisasi: true,
        kurikulum: { select: { id: true, nama: true, status: true } },
        pembuat: { select: { id: true, nama: true } },
        kegiatanCapaian: {
          include: { subCapaian: { include: { capaian: true } } },
        },
        kegiatanApproval: {
          include: { aktor: { select: { id: true, nama: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { partisipasi: true } },
      },
    });
    if (!data) {
      res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan' });
      return;
    }
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// POST /api/kegiatan — Buat kegiatan baru (draft)
export const createKegiatan = async (req: Request, res: Response): Promise<void> => {
  try {
    const dibuatOleh = BigInt(req.body.dibuatOleh);
    const body = createKegiatanSchema.parse(req.body);

    // Validasi kurikulum aktif [BR-001]
    const kurikulumAktif = await prisma.kurikulum.findFirst({ where: { status: 'aktif' } });
    if (!kurikulumAktif) {
      res.status(400).json({ success: false, message: 'Tidak ada kurikulum aktif. Kegiatan tidak bisa dibuat.' });
      return;
    }

    // Validasi total alokasi = 100% [BR-032]
    const totalAlokasi = body.alokasi.reduce((sum, a) => sum + a.alokasiPersen, 0);
    if (Math.abs(totalAlokasi - 100) > 0.01) {
      res.status(400).json({
        success: false,
        message: `Total alokasi harus tepat 100%. Saat ini: ${totalAlokasi}%`,
      });
      return;
    }

    // Buat kegiatan + alokasi capaian dalam satu transaksi
    const kegiatan = await prisma.kegiatan.create({
      data: {
        nama: body.nama,
        kategoriId: body.kategoriId,
        skalaId: body.skalaId,
        asal: body.asal,
        deskripsi: body.deskripsi,
        tanggalMulai: new Date(body.tanggalMulai),
        tanggalSelesai: new Date(body.tanggalSelesai),
        lokasi: body.lokasi,
        kuota: body.kuota,
        organisasiId: body.organisasiId,
        penyelenggaraExt: body.penyelenggaraExt,
        kurikulumId: kurikulumAktif.id,
        dibuatOleh,
        status: 'draft',
        kegiatanCapaian: {
          create: body.alokasi.map(a => ({
            subCapaianId: a.subCapaianId,
            alokasiPersen: a.alokasiPersen,
          })),
        },
      },
      include: { kegiatanCapaian: true },
    });

    await logAudit({
      entitas: 'kegiatan',
      entitasId: kegiatan.id,
      aksi: 'create',
      statusBaru: 'draft',
      aktorId: dibuatOleh,
    });

    res.status(201).json({ success: true, data: kegiatan });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validasi gagal', errors: error.issues });
    } else {
      console.error(error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
  }
};

// PUT /api/kegiatan/:id/ajukan — Ajukan kegiatan untuk verifikasi
export const ajukanKegiatan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const aktorId = BigInt(req.body.aktorId);

    const kegiatan = await prisma.kegiatan.findUnique({ where: { id: Number(id) } });
    if (!kegiatan) {
      res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan' });
      return;
    }
    if (kegiatan.status !== 'draft' && kegiatan.status !== 'perlu_revisi') {
      res.status(400).json({ success: false, message: 'Kegiatan hanya bisa diajukan dari status draft/perlu_revisi' });
      return;
    }

    const updated = await prisma.kegiatan.update({
      where: { id: Number(id) },
      data: { status: 'diajukan' },
    });

    await logAudit({
      entitas: 'kegiatan',
      entitasId: updated.id,
      aksi: 'ajukan',
      statusLama: kegiatan.status,
      statusBaru: 'diajukan',
      aktorId,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// ==================== VERIFIKASI & APPROVAL [BR-009] ====================

// GET /api/kegiatan/verifikasi — Kegiatan menunggu verifikasi Admin
export const getKegiatanForVerifikasi = async (req: Request, res: Response) => {
  try {
    const data = await prisma.kegiatan.findMany({
      where: { status: 'diajukan' },
      include: {
        kategori: true,
        skala: true,
        organisasi: { select: { id: true, nama: true, tipe: true } },
        pembuat: { select: { id: true, nama: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// PUT /api/kegiatan/:id/verifikasi — Admin verifikasi (setuju/revisi/tolak)
export const verifikasiKegiatan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const aktorId = BigInt(req.body.aktorId);
    const body = approvalSchema.parse(req.body);

    const kegiatan = await prisma.kegiatan.findUnique({ where: { id: Number(id) } });
    if (!kegiatan) {
      res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan' });
      return;
    }
    if (kegiatan.status !== 'diajukan') {
      res.status(400).json({ success: false, message: 'Kegiatan tidak dalam status diajukan' });
      return;
    }

    // Maker ≠ checker [BR-012]
    if (kegiatan.dibuatOleh === aktorId) {
      res.status(403).json({ success: false, message: 'Pembuat kegiatan tidak boleh memverifikasi sendiri [BR-012]' });
      return;
    }

    if (body.keputusan === 'revisi' || body.keputusan === 'tolak') {
      if (!body.alasan) {
        res.status(400).json({ success: false, message: 'Alasan wajib diisi untuk revisi/tolak' });
        return;
      }
    }

    const statusBaru =
      body.keputusan === 'setuju' ? 'terverifikasi' :
      body.keputusan === 'revisi' ? 'perlu_revisi' : 'ditolak';

    // Simpan catatan approval
    await prisma.kegiatanApproval.create({
      data: {
        kegiatanId: Number(id),
        tahap: 'verifikasi',
        aktorId,
        keputusan: body.keputusan,
        alasan: body.alasan,
      },
    });

    const updated = await prisma.kegiatan.update({
      where: { id: Number(id) },
      data: { status: statusBaru as any },
    });

    // Notifikasi ke pembuat
    await prisma.notifikasi.create({
      data: {
        userId: kegiatan.dibuatOleh,
        judul: `Kegiatan ${body.keputusan === 'setuju' ? 'Terverifikasi' : body.keputusan === 'revisi' ? 'Perlu Revisi' : 'Ditolak'}`,
        isi: `Kegiatan "${kegiatan.nama}" telah ${body.keputusan} oleh Admin.${body.alasan ? ` Alasan: ${body.alasan}` : ''}`,
        refType: 'kegiatan',
        refId: BigInt(id as string),
      },
    });

    await logAudit({
      entitas: 'kegiatan',
      entitasId: Number(id),
      aksi: `verifikasi.${body.keputusan}`,
      statusLama: 'diajukan',
      statusBaru,
      aktorId,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validasi gagal', errors: error.issues });
    } else {
      console.error(error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
  }
};

// GET /api/kegiatan/approval — Kegiatan menunggu approval Pimpinan
export const getKegiatanForApproval = async (req: Request, res: Response) => {
  try {
    const data = await prisma.kegiatan.findMany({
      where: { status: 'terverifikasi' },
      include: {
        kategori: true,
        skala: true,
        organisasi: { select: { id: true, nama: true, tipe: true } },
        pembuat: { select: { id: true, nama: true } },
        kegiatanApproval: {
          where: { tahap: 'verifikasi' },
          include: { aktor: { select: { id: true, nama: true } } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// PUT /api/kegiatan/:id/approval — Pimpinan approval (setuju/revisi/tolak)
export const approvalKegiatan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const aktorId = BigInt(req.body.aktorId);
    const body = approvalSchema.parse(req.body);

    const kegiatan = await prisma.kegiatan.findUnique({ where: { id: Number(id) } });
    if (!kegiatan) {
      res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan' });
      return;
    }
    if (kegiatan.status !== 'terverifikasi') {
      res.status(400).json({ success: false, message: 'Kegiatan belum diverifikasi Admin' });
      return;
    }

    if ((body.keputusan === 'revisi' || body.keputusan === 'tolak') && !body.alasan) {
      res.status(400).json({ success: false, message: 'Alasan wajib diisi untuk revisi/tolak' });
      return;
    }

    const statusBaru =
      body.keputusan === 'setuju' ? 'disetujui' :
      body.keputusan === 'revisi' ? 'perlu_revisi' : 'ditolak';

    await prisma.kegiatanApproval.create({
      data: {
        kegiatanId: Number(id),
        tahap: 'approval',
        aktorId,
        keputusan: body.keputusan,
        alasan: body.alasan,
      },
    });

    const updated = await prisma.kegiatan.update({
      where: { id: Number(id) },
      data: { status: statusBaru as any },
    });

    await prisma.notifikasi.create({
      data: {
        userId: kegiatan.dibuatOleh,
        judul: `Kegiatan ${body.keputusan === 'setuju' ? 'Disetujui ✅' : body.keputusan === 'revisi' ? 'Perlu Revisi ⚠️' : 'Ditolak ❌'}`,
        isi: `Kegiatan "${kegiatan.nama}" telah ${body.keputusan} oleh Pimpinan.${body.alasan ? ` Alasan: ${body.alasan}` : ''}`,
        refType: 'kegiatan',
        refId: BigInt(id as string),
      },
    });

    await logAudit({
      entitas: 'kegiatan',
      entitasId: Number(id),
      aksi: `approval.${body.keputusan}`,
      statusLama: 'terverifikasi',
      statusBaru,
      aktorId,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validasi gagal', errors: error.issues });
    } else {
      console.error(error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
  }
};

// PUT /api/kegiatan/:id/publikasi — Publikasikan kegiatan yang sudah disetujui
export const publikasiKegiatan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const aktorId = BigInt(req.body.aktorId);

    const kegiatan = await prisma.kegiatan.findUnique({ where: { id: Number(id) } });
    if (!kegiatan || kegiatan.status !== 'disetujui') {
      res.status(400).json({ success: false, message: 'Kegiatan belum disetujui atau tidak ditemukan' });
      return;
    }

    const updated = await prisma.kegiatan.update({
      where: { id: Number(id) },
      data: { status: 'terpublikasi' },
    });

    await logAudit({
      entitas: 'kegiatan',
      entitasId: Number(id),
      aksi: 'publikasi',
      statusLama: 'disetujui',
      statusBaru: 'terpublikasi',
      aktorId,
    });

    res.json({ success: true, data: updated, message: 'Kegiatan dipublikasikan' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// DELETE /api/kegiatan/:id — Hapus Kegiatan (Hanya jika belum berjalan/ada partisipan)
export const hapusKegiatan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const aktorId = BigInt(req.body.aktorId || 0);

    const kegiatan = await prisma.kegiatan.findUnique({
      where: { id: Number(id) },
      include: { _count: { select: { partisipasi: true } } },
    });

    if (!kegiatan) {
      res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan' });
      return;
    }

    // Proteksi Keamanan (Aturan Bisnis)
    const deletableStatuses = ['draft', 'diajukan', 'perlu_revisi', 'ditolak', 'terverifikasi', 'disetujui', 'terpublikasi'];
    const nonDeletableStatuses = ['berlangsung', 'selesai', 'diarsipkan', 'dibatalkan'];

    if (nonDeletableStatuses.includes(kegiatan.status)) {
      res.status(400).json({ 
        success: false, 
        message: `Kegiatan tidak bisa dihapus karena sudah dalam status '${kegiatan.status}'. Gunakan fitur batalkan/arsipkan.` 
      });
      return;
    }

    // Proteksi Lapis 2: Jika sudah ada mahasiswa yang mendaftar (partisipasi > 0), tidak boleh dihapus!
    if (kegiatan._count.partisipasi > 0) {
      res.status(400).json({
        success: false,
        message: 'Kegiatan tidak bisa dihapus secara permanen karena sudah ada mahasiswa yang mendaftar partisipasi.',
      });
      return;
    }

    // Gunakan transaksi untuk menghapus data terkait yang terhubung (KegiatanCapaian, KegiatanApproval)
    // Walaupun Cascade OnDelete di Prisma biasa di-setting, ini lebih aman secara eksplisit
    await prisma.$transaction([
      prisma.kegiatanApproval.deleteMany({ where: { kegiatanId: Number(id) } }),
      prisma.kegiatanCapaian.deleteMany({ where: { kegiatanId: Number(id) } }),
      prisma.kegiatan.delete({ where: { id: Number(id) } }),
    ]);

    await logAudit({
      entitas: 'kegiatan',
      entitasId: Number(id),
      aksi: 'delete',
      statusLama: kegiatan.status,
      statusBaru: 'deleted',
      aktorId,
    });

    res.json({ success: true, message: 'Kegiatan beserta alokasi capaiannya berhasil dihapus permanen' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat menghapus kegiatan' });
  }
};
