import { Request, Response, NextFunction } from 'express';
import prisma from '../../../lib/prisma';
import { z } from 'zod';
import { logAudit } from '../../../lib/auditLog';

// ==================== VALIDASI ====================
const createKegiatanSchema = z.object({
  nama: z.string().min(3),
  kategoriId: z.number().int().positive(),
  skalaId: z.number().int().positive(),
  // 'internal' diterima sebagai alias FE lama → dipetakan ke kurikuler_ukm/ukmf di controller
  asal: z.enum(['kurikuler_ukm', 'kurikuler_ukmf', 'universitas', 'eksternal', 'internal']),
  deskripsi: z.string().max(500).optional(),
  tanggalMulai: z.string().refine(v => !isNaN(Date.parse(v))),
  tanggalSelesai: z.string().refine(v => !isNaN(Date.parse(v))),
  lokasi: z.string().max(200).optional(),
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
  alasan: z.string().max(500, 'Alasan maksimal 500 karakter').optional(),
  alokasi: z.array(z.object({
    subCapaianId: z.number(),
    alokasiPersen: z.number().min(0).max(100),
  })).optional(),
});

// ==================== KEGIATAN CRUD ====================

// GET /api/kegiatan â€” Daftar kegiatan (filter: status, asal, kategoriId)
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

    const userPeran = req.user!.peran;
    
    // Jika operator UKM/UKMF, hanya lihat kegiatan organisasinya
    if (userPeran === 'operator_org') {
      const operatorData = await prisma.organisasiOperator.findUnique({
        where: { userId: BigInt(req.user!.id) }
      });
      if (operatorData) {
        where.organisasiId = operatorData.organisasiId;
      }
    }

    const data = await prisma.kegiatan.findMany({
      where,
      include: {
        kategori: true,
        skala: true,
        organisasi: { select: { id: true, nama: true, tipe: true } },
        kurikulum: { select: { id: true, nama: true } },
        pembuat: { select: { id: true, nama: true } },
        kegiatanApproval: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { aktor: { select: { nama: true } } },
        },
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

// GET /api/kegiatan/:id â€” Detail kegiatan + alokasi + approval history
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
        pembuat: { 
          select: { 
            id: true, 
            nama: true,
            mahasiswa: {
              select: {
                nim: true,
                prodi: { select: { nama: true, fakultas: { select: { nama: true } } } }
              }
            }
          } 
        },
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

// POST /api/kegiatan â€” Buat kegiatan baru
// Alur approval berbeda tergantung pembuat:
//   Admin Ditmawa   â†’ langsung disetujui (tidak perlu izin)
//   Operator UKM    â†’ diajukan â†’ Admin Ditmawa â†’ Pimpinan Ditmawa
//   Operator UKMF   â†’ diajukan â†’ Admin Fakultas â†’ Pimpinan Fakultas
export const createKegiatan = async (req: Request, res: Response): Promise<void> => {
  try {
    const dibuatOleh = BigInt(req.user!.id);
    const userPeran = req.user!.peran;
    const userJabatan = req.user!.jabatan;
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

    const effectiveRole = userPeran === 'staff' && userJabatan ? userJabatan : userPeran;

    let resolvedOrganisasiId = body.organisasiId ?? null;
    let resolvedAsal: 'kurikuler_ukm' | 'kurikuler_ukmf' | 'universitas' | 'eksternal' =
      body.asal === 'internal' ? 'kurikuler_ukm' : body.asal;

    if (effectiveRole === 'admin_ditmawa' || effectiveRole === 'admin_fakultas') {
      if (body.asal === 'internal') {
        resolvedAsal = effectiveRole === 'admin_fakultas' ? 'kurikuler_ukmf' : 'universitas';
      }
    } else if (effectiveRole === 'operator_org') {
      const operatorData = await prisma.organisasiOperator.findUnique({
        where: { userId: dibuatOleh },
        include: { organisasi: true },
      });

      if (!operatorData) {
        res.status(400).json({ success: false, message: 'Anda belum terdaftar sebagai operator organisasi.' });
        return;
      }

      const org = operatorData.organisasi;
      resolvedOrganisasiId = org.id;
      resolvedAsal = org.tipe === 'UKMF' ? 'kurikuler_ukmf' : 'kurikuler_ukm';
    } else {
      res.status(403).json({ success: false, message: 'Role Anda tidak diizinkan membuat kegiatan.' });
      return;
    }

    // Selalu simpan sebagai draft — kirim lewat PUT /:id/ajukan
    const kegiatan = await prisma.kegiatan.create({
      data: {
        nama: body.nama,
        kategoriId: body.kategoriId,
        skalaId: body.skalaId,
        asal: resolvedAsal,
        deskripsi: body.deskripsi,
        tanggalMulai: new Date(body.tanggalMulai),
        tanggalSelesai: new Date(body.tanggalSelesai),
        lokasi: body.lokasi,
        kuota: body.kuota,
        organisasiId: resolvedOrganisasiId ?? undefined,
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
      aksi: 'create_draft',
      statusBaru: 'draft',
      aktorId: dibuatOleh,
    });

    res.status(201).json({
      success: true,
      message: 'Kegiatan tersimpan sebagai draft. Kirim dari daftar kegiatan setelah siap.',
      data: kegiatan,
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

// PUT /api/kegiatan/:id â€” Edit kegiatan (hanya saat draft atau perlu_revisi)
export const editKegiatan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const body = createKegiatanSchema.parse(req.body);
    const userId = BigInt(req.user!.id);
    const userPeran = req.user!.peran;

    const existing = await prisma.kegiatan.findUnique({
      where: { id: Number(id) }
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan' });
      return;
    }

    if (existing.status !== 'draft' && existing.status !== 'perlu_revisi') {
      res.status(400).json({ success: false, message: 'Hanya kegiatan berstatus draft atau perlu revisi yang bisa diedit' });
      return;
    }

    // Cek otorisasi
    if (userPeran === 'operator_org') {
      const operatorData = await prisma.organisasiOperator.findUnique({ where: { userId } });
      if (!operatorData || operatorData.organisasiId !== existing.organisasiId) {
        res.status(403).json({ success: false, message: 'Tidak diizinkan mengedit kegiatan milik organisasi lain' });
        return;
      }
    } else if (existing.dibuatOleh !== userId) {
      res.status(403).json({ success: false, message: 'Tidak diizinkan mengedit kegiatan ini' });
      return;
    }

    const totalAlokasi = body.alokasi.reduce((sum, a) => sum + a.alokasiPersen, 0);
    if (Math.abs(totalAlokasi - 100) > 0.01) {
      res.status(400).json({
        success: false,
        message: `Total alokasi harus tepat 100%. Saat ini: ${totalAlokasi}%`,
      });
      return;
    }

    const resolvedAsal =
      body.asal === 'internal'
        ? (existing.asal === 'kurikuler_ukmf' ? 'kurikuler_ukmf' : 'kurikuler_ukm')
        : body.asal;

    await prisma.$transaction(async (tx) => {
      await tx.kegiatan.update({
        where: { id: Number(id) },
        data: {
          nama: body.nama,
          kategoriId: body.kategoriId,
          skalaId: body.skalaId,
          asal: resolvedAsal,
          deskripsi: body.deskripsi,
          tanggalMulai: new Date(body.tanggalMulai),
          tanggalSelesai: new Date(body.tanggalSelesai),
          lokasi: body.lokasi,
          kuota: body.kuota,
          penyelenggaraExt: body.penyelenggaraExt,
        }
      });

      await tx.kegiatanCapaian.deleteMany({ where: { kegiatanId: Number(id) } });

      await tx.kegiatanCapaian.createMany({
        data: body.alokasi.map(a => ({
          kegiatanId: Number(id),
          subCapaianId: a.subCapaianId,
          alokasiPersen: a.alokasiPersen,
        }))
      });
    });

    res.json({ success: true, message: 'Kegiatan berhasil diperbarui' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Data tidak valid', errors: error.issues });
    } else {
      console.error(error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
  }
};


// PUT /api/kegiatan/verifikasi-bulk â€” Verifikasi banyak kegiatan sekaligus
export const verifikasiKegiatanBulk = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const aktorId = BigInt(req.user!.id);
    const userJabatan = req.user!.jabatan;

    const schema = z.object({
      kegiatanIds: z.array(z.number()).min(1),
      keputusan: z.enum(['setuju', 'tolak', 'revisi']),
      alasan: z.string().optional(),
    });

    const body = schema.parse(req.body);

    if ((body.keputusan === 'tolak' || body.keputusan === 'revisi') && !body.alasan) {
      return res.status(400).json({ success: false, message: 'Alasan wajib diisi jika ditolak/revisi' });
    }

    const kegiatans = await prisma.kegiatan.findMany({
      where: {
        id: { in: body.kegiatanIds },
        status: 'diajukan'
      },
      include: {
        organisasi: true
      }
    });

    if (kegiatans.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada kegiatan valid yang bisa diverifikasi.' });
    }

    let statusBaru = 'terverifikasi';
    if (body.keputusan === 'revisi') statusBaru = 'perlu_revisi';
    if (body.keputusan === 'tolak') statusBaru = 'ditolak';

    // Proses satu per satu agar notifikasi dan audit log berjalan lancar
    let successCount = 0;
    for (const kegiatan of kegiatans) {
      // Sama seperti logika satuan: Admin Fakultas hanya boleh verifikasi UKMF fakultasnya
      if (userJabatan === 'admin_fakultas') {
        const staffData = await prisma.staff.findUnique({ where: { userId: aktorId } });
        if (!staffData?.fakultasId || kegiatan.organisasi?.fakultasId !== staffData.fakultasId) {
          continue; // skip
        }
      }

      await prisma.kegiatan.update({
        where: { id: kegiatan.id },
        data: { status: statusBaru as any },
      });

      await prisma.kegiatanApproval.create({
        data: {
          kegiatanId: kegiatan.id,
          tahap: 'verifikasi',
          aktorId,
          keputusan: body.keputusan as any,
          alasan: body.alasan,
        },
      });

      await logAudit({
        entitas: 'kegiatan',
        entitasId: kegiatan.id,
        aksi: 'verifikasi_bulk',
        statusLama: 'diajukan',
        statusBaru,
        aktorId,
      });

      // Notifikasi ke pembuat kegiatan
      await prisma.notifikasi.create({
        data: {
          userId: kegiatan.dibuatOleh,
          judul: `Kegiatan ${body.keputusan === 'setuju' ? 'Terverifikasi ✅' : body.keputusan === 'revisi' ? 'Perlu Revisi ⚠️' : 'Ditolak ❌'}`,
          isi: `Kegiatan "${kegiatan.nama}" telah diverifikasi oleh Admin. Keputusan: ${body.keputusan}.${body.alasan ? ' Alasan: ' + body.alasan : ''}`,
          refType: 'kegiatan',
          refId: BigInt(kegiatan.id),
        },
      });

      // Jika setuju dan bukan eksternal, beri notif ke pimpinan
      if (body.keputusan === 'setuju' && kegiatan.asal !== 'eksternal') {
        let pimpinanTargets: { userId: bigint }[] = [];
        if (kegiatan.organisasi?.tipe === 'UKMF') {
          const pimpinanFakultas = await prisma.staff.findMany({
            where: { jabatan: 'pimpinan_fakultas', fakultasId: kegiatan.organisasi.fakultasId, user: { aktif: true } },
            select: { userId: true },
          });
          pimpinanTargets = pimpinanFakultas.map(p => ({ userId: p.userId }));
        } else {
          const pimpinanDitmawa = await prisma.staff.findMany({
            where: { jabatan: 'pimpinan_ditmawa', user: { aktif: true } },
            select: { userId: true },
          });
          pimpinanTargets = pimpinanDitmawa.map(p => ({ userId: p.userId }));
        }

        if (pimpinanTargets.length > 0) {
          await prisma.notifikasi.createMany({
            data: pimpinanTargets.map(t => ({
              userId: t.userId,
              judul: 'Kegiatan Menunggu Approval ⏳',
              isi: `Kegiatan "${kegiatan.nama}" telah lolos verifikasi Admin dan menunggu approval final Anda.`,
              refType: 'kegiatan',
              refId: BigInt(kegiatan.id),
            })),
          });
        }
      }

      successCount++;
    }

    res.json({ success: true, message: `${successCount} kegiatan berhasil diproses secara bulk.` });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', errors: error.issues });
    }
    next(error);
  }
};

// PUT /api/kegiatan/:id/ajukan — Kirim draft / ajukan ulang setelah revisi
export const ajukanKegiatan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const aktorId = BigInt(req.user!.id);

    const kegiatan = await prisma.kegiatan.findUnique({
      where: { id: Number(id) },
      include: { organisasi: true },
    });
    if (!kegiatan) {
      res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan' });
      return;
    }

    const statusLama = kegiatan.status;
    if (statusLama !== 'draft' && statusLama !== 'perlu_revisi') {
      res.status(400).json({
        success: false,
        message: 'Kegiatan hanya bisa dikirim dari status draft atau perlu_revisi',
      });
      return;
    }

    // Otorisasi: operator hanya milik org-nya; admin/pembuat boleh miliknya
    const userPeran = req.user!.peran;
    const userJabatan = req.user!.jabatan;
    const effectiveRole = userPeran === 'staff' && userJabatan ? userJabatan : userPeran;

    if (userPeran === 'operator_org') {
      const operatorData = await prisma.organisasiOperator.findUnique({ where: { userId: aktorId } });
      if (!operatorData || operatorData.organisasiId !== kegiatan.organisasiId) {
        res.status(403).json({ success: false, message: 'Tidak diizinkan mengajukan kegiatan milik organisasi lain' });
        return;
      }
    } else if (
      effectiveRole !== 'admin_ditmawa' &&
      effectiveRole !== 'admin_fakultas' &&
      kegiatan.dibuatOleh !== aktorId
    ) {
      res.status(403).json({ success: false, message: 'Tidak diizinkan mengajukan kegiatan ini' });
      return;
    }

    const isAdmin = effectiveRole === 'admin_ditmawa' || effectiveRole === 'admin_fakultas';
    const statusBaru = isAdmin ? 'terverifikasi' : 'diajukan';

    let notifTargets: { userId: bigint }[] = [];
    let notifJudul = statusLama === 'draft' ? 'Pengajuan Kegiatan Baru' : 'Pengajuan Ulang Kegiatan';
    let notifIsi = '';
    let notifLabel = 'Admin';

    if (isAdmin) {
      if (effectiveRole === 'admin_ditmawa') {
        const pimpinanDitmawa = await prisma.staff.findMany({
          where: { jabatan: 'pimpinan_ditmawa', user: { aktif: true } },
          select: { userId: true },
        });
        notifTargets = pimpinanDitmawa.map((p) => ({ userId: p.userId }));
        notifIsi = `Kegiatan "${kegiatan.nama}" telah dikirim oleh Admin Ditmawa dan menunggu persetujuan Anda.`;
        notifLabel = 'Pimpinan Ditmawa';
      } else {
        const adminData = await prisma.staff.findUnique({ where: { userId: aktorId } });
        const pimpinanFakultas = await prisma.staff.findMany({
          where: {
            jabatan: 'pimpinan_fakultas',
            fakultasId: adminData?.fakultasId,
            user: { aktif: true },
          },
          select: { userId: true },
        });
        notifTargets = pimpinanFakultas.map((p) => ({ userId: p.userId }));
        notifIsi = `Kegiatan "${kegiatan.nama}" telah dikirim oleh Admin Fakultas dan menunggu persetujuan Anda.`;
        notifLabel = 'Pimpinan Fakultas';
      }
    } else if (kegiatan.organisasi?.tipe === 'UKMF' && kegiatan.organisasi.fakultasId) {
      const adminFakultas = await prisma.staff.findMany({
        where: {
          jabatan: 'admin_fakultas',
          fakultasId: kegiatan.organisasi.fakultasId,
          user: { aktif: true },
        },
        select: { userId: true },
      });
      notifTargets = adminFakultas.map((a) => ({ userId: a.userId }));
      notifIsi = `Kegiatan "${kegiatan.nama}" dari ${kegiatan.organisasi.nama} telah diajukan dan menunggu verifikasi Anda.`;
      notifLabel = 'Admin Fakultas';
      notifJudul = statusLama === 'draft' ? 'Pengajuan Kegiatan UKMF Baru' : notifJudul;
    } else {
      const adminDitmawa = await prisma.staff.findMany({
        where: { jabatan: 'admin_ditmawa', user: { aktif: true } },
        select: { userId: true },
      });
      notifTargets = adminDitmawa.map((a) => ({ userId: a.userId }));
      const orgNama = kegiatan.organisasi?.nama || 'Organisasi';
      notifIsi = `Kegiatan "${kegiatan.nama}" dari ${orgNama} telah diajukan dan menunggu verifikasi Anda.`;
      notifLabel = 'Admin Ditmawa';
      notifJudul = statusLama === 'draft' ? 'Pengajuan Kegiatan UKM Baru' : notifJudul;
    }

    const updated = await prisma.kegiatan.update({
      where: { id: Number(id) },
      data: { status: statusBaru as any },
    });

    if (notifTargets.length > 0) {
      await prisma.notifikasi.createMany({
        data: notifTargets.map((t) => ({
          userId: t.userId,
          judul: notifJudul,
          isi: notifIsi,
          refType: 'kegiatan',
          refId: BigInt(kegiatan.id),
        })),
      });
    }

    await logAudit({
      entitas: 'kegiatan',
      entitasId: updated.id,
      aksi: statusLama === 'draft' ? 'ajukan' : 'ajukan_ulang',
      statusLama,
      statusBaru,
      aktorId,
    });

    res.json({
      success: true,
      message: `Kegiatan berhasil dikirim ke ${notifLabel}. Setelah dikirim, kegiatan tidak dapat diedit.`,
      data: updated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// ==================== VERIFIKASI & APPROVAL [BR-009] ====================

// GET /api/kegiatan/verifikasi â€” Kegiatan untuk verifikasi Admin (Ditmawa atau Fakultas)
// Admin Ditmawa â†’ melihat kegiatan UKM (tingkat universitas)
// Admin Fakultas â†’ melihat kegiatan UKMF dari fakultasnya
export const getKegiatanForVerifikasi = async (req: Request, res: Response) => {
  try {
    const { search, kategoriId, skalaId, status, tahun, asal, page = '1', limit = '10' } = req.query;
    const userJabatan = req.user!.jabatan;

    const where: any = {};

    // Filter status: default hanya yang diajukan, bisa tampilkan semua
    if (status && status !== 'semua') {
      where.status = status as string;
    } else {
      where.status = { in: ['diajukan', 'terverifikasi', 'perlu_revisi', 'ditolak', 'disetujui'] };
    }

    // ── Filter berdasarkan jabatan Admin dan asal kegiatan ──
    if (asal === 'eksternal') {
      where.asal = 'eksternal';
    } else if (asal === 'universitas' || asal === 'internal') {
      where.asal = 'universitas';
    } else if (asal === 'kurikuler_ukm') {
      where.asal = 'kurikuler_ukm';
    } else if (asal === 'kurikuler_ukmf') {
      where.asal = 'kurikuler_ukmf';
      if (userJabatan === 'admin_fakultas') {
        const staffData = await prisma.staff.findUnique({
          where: { userId: BigInt(req.user!.id) },
        });
        if (staffData?.fakultasId) {
          where.organisasi = { fakultasId: staffData.fakultasId };
        }
      }
    } else {
      // Default: pengajuan internal (UKM / UKMF)
      if (userJabatan === 'admin_fakultas') {
        const staffData = await prisma.staff.findUnique({
          where: { userId: BigInt(req.user!.id) },
        });
        if (staffData?.fakultasId) {
          where.organisasi = { fakultasId: staffData.fakultasId };
          where.asal = 'kurikuler_ukmf';
        }
      } else {
        // Admin Ditmawa: UKM + universitas
        where.asal = { in: ['kurikuler_ukm', 'universitas'] };
      }
    }

    if (kategoriId) where.kategoriId = Number(kategoriId);
    if (skalaId) where.skalaId = Number(skalaId);

    if (tahun) {
      const year = Number(tahun);
      where.tanggalMulai = {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      };
    }

    if (search) {
      where.OR = [
        { nama: { contains: search as string } },
        { organisasi: { nama: { contains: search as string } } },
        { penyelenggaraExt: { contains: search as string } },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const total = await prisma.kegiatan.count({ where });

    const data = await prisma.kegiatan.findMany({
      where,
      include: {
        kategori: true,
        skala: true,
        organisasi: { select: { id: true, nama: true, tipe: true, fakultasId: true } },
        pembuat: {
          select: {
            id: true,
            nama: true,
            mahasiswa: { select: { nim: true, prodi: { select: { nama: true } } } },
          },
        },
        kegiatanCapaian: {
          include: { subCapaian: { include: { capaian: true } } },
        },
        kegiatanApproval: {
          include: { aktor: { select: { id: true, nama: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    });

    res.json({
      success: true,
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// PUT /api/kegiatan/:id/verifikasi â€” Admin verifikasi (setuju/revisi/tolak)
// Setelah disetujui â†’ notifikasi ke Pimpinan yang tepat (Ditmawa atau Fakultas)
export const verifikasiKegiatan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const aktorId = BigInt(req.user!.id);
    const body = approvalSchema.parse(req.body);

    const kegiatan = await prisma.kegiatan.findUnique({
      where: { id: Number(id) },
      include: { organisasi: true },
    });
    if (!kegiatan) {
      res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan' });
      return;
    }
    if (kegiatan.status !== 'diajukan') {
      res.status(400).json({ success: false, message: 'Kegiatan tidak dalam status diajukan' });
      return;
    }

    // Maker â‰  checker [BR-012]
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

    // Jika setuju dan ada alokasi capaian, simpan kegiatanCapaian
    if (body.keputusan === 'setuju' && body.alokasi && body.alokasi.length > 0) {
      await prisma.kegiatanCapaian.deleteMany({ where: { kegiatanId: Number(id) } });
      await prisma.kegiatanCapaian.createMany({
        data: body.alokasi.map((a) => ({
          kegiatanId: Number(id),
          subCapaianId: a.subCapaianId,
          alokasiPersen: a.alokasiPersen,
        })),
      });
    }

    // Notifikasi ke pembuat kegiatan
    await prisma.notifikasi.create({
      data: {
        userId: kegiatan.dibuatOleh,
        judul: `Kegiatan ${body.keputusan === 'setuju' ? 'Terverifikasi âœ…' : body.keputusan === 'revisi' ? 'Perlu Revisi âš ï¸' : 'Ditolak âŒ'}`,
        isi: `Kegiatan "${kegiatan.nama}" telah ${body.keputusan} oleh Admin.${body.alasan ? ` Alasan: ${body.alasan}` : ''}`,
        refType: 'kegiatan',
        refId: BigInt(id as string),
      },
    });

    // Jika disetujui (terverifikasi), notifikasi ke Pimpinan yang tepat
    if (body.keputusan === 'setuju') {
      let pimpinanTargets: { userId: bigint }[] = [];

      if (kegiatan.organisasi?.tipe === 'UKMF' && kegiatan.organisasi.fakultasId) {
        // UKMF â†’ notifikasi ke Pimpinan Fakultas
        const pimpinanFakultas = await prisma.staff.findMany({
          where: { jabatan: 'pimpinan_fakultas', fakultasId: kegiatan.organisasi.fakultasId, user: { aktif: true } },
          select: { userId: true },
        });
        pimpinanTargets = pimpinanFakultas.map(p => ({ userId: p.userId }));
      } else {
        // UKM / universitas â†’ notifikasi ke Pimpinan Ditmawa
        const pimpinanDitmawa = await prisma.staff.findMany({
          where: { jabatan: 'pimpinan_ditmawa', user: { aktif: true } },
          select: { userId: true },
        });
        pimpinanTargets = pimpinanDitmawa.map(p => ({ userId: p.userId }));
      }

      if (pimpinanTargets.length > 0) {
        await prisma.notifikasi.createMany({
          data: pimpinanTargets.map(t => ({
            userId: t.userId,
            judul: 'Kegiatan Menunggu Approval ðŸ“‹',
            isi: `Kegiatan "${kegiatan.nama}" telah terverifikasi dan menunggu persetujuan Anda.`,
            refType: 'kegiatan',
            refId: BigInt(kegiatan.id),
          })),
        });
      }
    }

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

// GET /api/kegiatan/approval â€” Kegiatan untuk approval Pimpinan (Ditmawa atau Fakultas)
export const getKegiatanForApproval = async (req: Request, res: Response) => {
  try {
    const { search, kategoriId, skalaId, status, asal, tahun, page = '1', limit = '10' } = req.query;
    const userJabatan = req.user!.jabatan;

    const where: any = {};

    // Jika tidak ada filter status spesifik, tampilkan semua yang relevan untuk Pimpinan
    // (terverifikasi = menunggu approval, disetujui = sudah disetujui, perlu_revisi, ditolak)
    if (status && status !== 'semua') {
      where.status = status as string;
    } else {
      // Default: tampilkan kegiatan yang sudah melewati tahap verifikasi Admin
      where.status = { in: ['terverifikasi', 'disetujui', 'perlu_revisi', 'ditolak'] };
    }

    // â”€â”€ Filter berdasarkan jabatan Pimpinan â”€â”€
    if (userJabatan === 'pimpinan_fakultas') {
      // Pimpinan Fakultas: hanya kegiatan UKMF dari fakultas yang sama
      const staffData = await prisma.staff.findUnique({
        where: { userId: BigInt(req.user!.id) },
      });
      if (staffData?.fakultasId) {
        where.organisasi = { fakultasId: staffData.fakultasId };
        where.asal = 'kurikuler_ukmf';
      }
    } else {
      // Pimpinan Ditmawa: kegiatan UKM, universitas, dan eksternal mahasiswa
      where.asal = { in: ['kurikuler_ukm', 'universitas', 'eksternal'] };
    }

    if (kategoriId) where.kategoriId = Number(kategoriId);
    if (skalaId) where.skalaId = Number(skalaId);

    if (asal === 'universitas' || asal === 'internal') {
      where.asal = 'universitas';
    } else if (asal === 'kurikuler_ukm') {
      where.asal = 'kurikuler_ukm';
    } else if (asal === 'eksternal') {
      where.asal = 'eksternal';
    }

    // Filter berdasarkan tahun (dari tanggalMulai)
    if (tahun) {
      const year = Number(tahun);
      where.tanggalMulai = {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      };
    }

    // Pencarian berdasarkan nama kegiatan atau nama organisasi
    if (search) {
      where.OR = [
        { nama: { contains: search as string } },
        { organisasi: { nama: { contains: search as string } } },
        { penyelenggaraExt: { contains: search as string } },
      ];
    }

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Hitung total data (untuk pagination)
    const total = await prisma.kegiatan.count({ where });

    const data = await prisma.kegiatan.findMany({
      where,
      include: {
        kategori: true,
        skala: true,
        organisasi: { select: { id: true, nama: true, tipe: true } },
        pembuat: { 
          select: { 
            id: true, 
            nama: true,
            mahasiswa: {
              select: {
                nim: true,
                prodi: { select: { nama: true } }
              }
            }
          } 
        },
        kegiatanCapaian: {
          include: { subCapaian: { include: { capaian: true } } },
        },
        kegiatanApproval: {
          include: { aktor: { select: { id: true, nama: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    });

    res.json({
      success: true,
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// PUT /api/kegiatan/:id/approval â€” Pimpinan approval (setuju/revisi/tolak)
export const approvalKegiatan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const aktorId = BigInt(req.user!.id);
    const userJabatan = req.user!.jabatan;
    const body = approvalSchema.parse(req.body);

    const kegiatan = await prisma.kegiatan.findUnique({
      where: { id: Number(id) },
      include: { organisasi: true },
    });
    if (!kegiatan) {
      res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan' });
      return;
    }
    if (kegiatan.status !== 'terverifikasi') {
      res.status(400).json({ success: false, message: 'Kegiatan belum diverifikasi Admin' });
      return;
    }

    // â”€â”€ Otorisasi Pimpinan Fakultas â”€â”€
    if (userJabatan === 'pimpinan_fakultas') {
      const staffData = await prisma.staff.findUnique({
        where: { userId: aktorId },
      });
      if (!staffData?.fakultasId || kegiatan.organisasi?.fakultasId !== staffData.fakultasId) {
        res.status(403).json({ success: false, message: 'Anda tidak berhak menyetujui kegiatan dari fakultas lain.' });
        return;
      }
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
        judul: `Kegiatan ${body.keputusan === 'setuju' ? 'Disetujui âœ…' : body.keputusan === 'revisi' ? 'Perlu Revisi âš ï¸' : 'Ditolak âŒ'}`,
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

const bulkApprovalSchema = z.object({
  kegiatanIds: z.array(z.number().int().positive()).min(1, 'Minimal 1 kegiatan'),
  keputusan: z.enum(['setuju', 'revisi', 'tolak']),
  alasan: z.string().max(500).optional(),
});

export const approvalKegiatanBulk = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const aktorId = BigInt(req.user!.id);
    const userJabatan = req.user!.jabatan;
    const body = bulkApprovalSchema.parse(req.body);

    if ((body.keputusan === 'revisi' || body.keputusan === 'tolak') && !body.alasan) {
      res.status(400).json({ success: false, message: 'Alasan wajib diisi untuk revisi/tolak' });
      return;
    }

    let statusBaru = 'disetujui';
    if (body.keputusan === 'revisi') statusBaru = 'perlu_revisi';
    if (body.keputusan === 'tolak') statusBaru = 'ditolak';

    let successCount = 0;
    const errors: string[] = [];

    for (const kegiatanId of body.kegiatanIds) {
      try {
        const kegiatan = await prisma.kegiatan.findUnique({
          where: { id: kegiatanId },
          include: { organisasi: true },
        });

        if (!kegiatan) { errors.push(`ID ${kegiatanId}: tidak ditemukan`); continue; }
        if (kegiatan.status !== 'terverifikasi') { errors.push(`ID ${kegiatanId}: belum diverifikasi Admin`); continue; }

        if (userJabatan === 'pimpinan_fakultas') {
          const staffData = await prisma.staff.findUnique({ where: { userId: aktorId } });
          if (!staffData?.fakultasId || kegiatan.organisasi?.fakultasId !== staffData.fakultasId) {
            errors.push(`ID ${kegiatanId}: bukan kegiatan fakultas Anda`);
            continue;
          }
        }

        await prisma.kegiatanApproval.create({
          data: { kegiatanId, tahap: 'approval', aktorId, keputusan: body.keputusan, alasan: body.alasan },
        });

        await prisma.kegiatan.update({ where: { id: kegiatanId }, data: { status: statusBaru as any } });

        await prisma.notifikasi.create({
          data: {
            userId: kegiatan.dibuatOleh,
            judul: `Kegiatan ${body.keputusan === 'setuju' ? 'Disetujui' : body.keputusan === 'revisi' ? 'Perlu Revisi' : 'Ditolak'}`,
            isi: `Kegiatan "${kegiatan.nama}" telah ${body.keputusan} oleh Pimpinan.${body.alasan ? ` Alasan: ${body.alasan}` : ''}`,
            refType: 'kegiatan',
            refId: BigInt(kegiatanId),
          },
        });

        await logAudit({
          entitas: 'kegiatan', entitasId: kegiatanId,
          aksi: `approval.${body.keputusan}`, statusLama: 'terverifikasi', statusBaru, aktorId,
        });

        successCount++;
      } catch (e) {
        errors.push(`ID ${kegiatanId}: gagal diproses`);
      }
    }

    res.json({
      success: true,
      message: `${successCount} kegiatan berhasil di-${body.keputusan}. ${errors.length > 0 ? `${errors.length} gagal.` : ''}`,
      errors: errors.length > 0 ? errors : undefined,
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

// PUT /api/kegiatan/:id/publikasi â€” Publikasikan kegiatan yang sudah disetujui
export const publikasiKegiatan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const aktorId = BigInt(req.user!.id);
    const userJabatan = req.user!.jabatan;
    const userPeran = req.user!.peran;

    const kegiatan = await prisma.kegiatan.findUnique({
      where: { id: Number(id) },
      include: { organisasi: true },
    });
    if (!kegiatan || kegiatan.status !== 'disetujui') {
      res.status(400).json({ success: false, message: 'Kegiatan belum disetujui atau tidak ditemukan' });
      return;
    }

    // â”€â”€ Otorisasi Publikasi â”€â”€
    const effectiveRole = userPeran === 'staff' && userJabatan ? userJabatan : userPeran;

    if (effectiveRole === 'operator_org') {
      // Operator hanya boleh mempublikasikan kegiatannya sendiri
      if (kegiatan.dibuatOleh !== aktorId) {
        res.status(403).json({ success: false, message: 'Anda hanya dapat mempublikasikan kegiatan yang Anda buat.' });
        return;
      }
    } else if (effectiveRole === 'admin_fakultas') {
      // Admin Fakultas hanya boleh mempublikasikan kegiatan UKMF di fakultasnya
      const staffData = await prisma.staff.findUnique({ where: { userId: aktorId } });
      if (!staffData?.fakultasId || kegiatan.organisasi?.fakultasId !== staffData.fakultasId) {
        res.status(403).json({ success: false, message: 'Anda tidak berhak mempublikasikan kegiatan dari fakultas lain.' });
        return;
      }
    } // Admin Ditmawa bisa publish kegiatan apapun secara default (atau terbatas pada non-UKMF)

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

// DELETE /api/kegiatan/:id â€” Hapus Kegiatan (Hanya jika belum berjalan/ada partisipan)
export const hapusKegiatan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const aktorId = BigInt(req.user!.id);
    const userJabatan = req.user!.jabatan;

    const kegiatan = await prisma.kegiatan.findUnique({
      where: { id: Number(id) },
      include: {
        _count: { select: { partisipasi: true } },
        organisasi: true,
      },
    });

    if (!kegiatan) {
      res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan' });
      return;
    }

    // â”€â”€ Otorisasi Hapus â”€â”€
    if (userJabatan === 'admin_fakultas') {
      const staffData = await prisma.staff.findUnique({ where: { userId: aktorId } });
      if (!staffData?.fakultasId || kegiatan.organisasi?.fakultasId !== staffData.fakultasId) {
        res.status(403).json({ success: false, message: 'Anda tidak berhak menghapus kegiatan dari fakultas lain.' });
        return;
      }
    }

    // Hapus hanya sebelum masuk alur approval aktif
    const deletableStatuses = ['draft', 'perlu_revisi', 'ditolak'];
    if (!deletableStatuses.includes(kegiatan.status)) {
      res.status(400).json({
        success: false,
        message: `Kegiatan berstatus '${kegiatan.status}' tidak bisa dihapus. Hanya draft, perlu_revisi, atau ditolak yang boleh dihapus.`,
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
