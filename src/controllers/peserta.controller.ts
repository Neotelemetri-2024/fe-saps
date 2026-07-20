import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { z } from 'zod';
import { logAudit } from '../lib/auditLog';

// ==================== VALIDASI ====================

const importPesertaSchema = z.object({
  peserta: z.array(z.object({
    nim: z.string().min(1, 'NIM wajib diisi'),
    peranId: z.number().int().positive().optional(),
    hadir: z.boolean().default(false),
  })).min(1, 'Minimal 1 peserta'),
});

// ==================== MANAJEMEN PESERTA ====================

// GET /api/kegiatan/:id/peserta — Daftar peserta kegiatan dengan filter & pagination
export const getPesertaKegiatan = async (req: Request, res: Response): Promise<void> => {
  try {
    const kegiatanId = Number(req.params.id);
    const { search, filter, page = '1', limit = '10' } = req.query;

    // Pastikan kegiatan ada
    const kegiatan = await prisma.kegiatan.findUnique({
      where: { id: kegiatanId },
      include: { kategori: true, skala: true, organisasi: true },
    });

    if (!kegiatan) {
      res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan' });
      return;
    }

    // Build filter
    const where: any = { kegiatanId };

    if (filter === 'hadir') {
      where.kehadiran = true;
    } else if (filter === 'tidak_hadir') {
      where.kehadiran = false;
    }

    if (search) {
      where.OR = [
        { mahasiswa: { nim: { contains: search as string } } },
        { mahasiswa: { user: { nama: { contains: search as string } } } },
      ];
    }

    // Pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const total = await prisma.partisipasi.count({ where });

    const peserta = await prisma.partisipasi.findMany({
      where,
      include: {
        mahasiswa: {
          include: {
            user: { select: { nama: true, email: true } },
            prodi: {
              include: {
                fakultas: { select: { nama: true } },
              },
            },
          },
        },
        peranVerif: true,
        klaimPoin: {
          select: { id: true, status: true },
        },
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limitNum,
    });

    // Hitung statistik
    const statsAll = await prisma.partisipasi.count({ where: { kegiatanId } });
    const statsHadir = await prisma.partisipasi.count({ where: { kegiatanId, kehadiran: true } });
    const statsTidakHadir = await prisma.partisipasi.count({ where: { kegiatanId, kehadiran: false } });

    // Cek apakah sudah pernah submit poin (ada klaim yang sudah disetujui)
    const sudahSubmit = await prisma.klaimPoin.count({
      where: {
        partisipasi: { kegiatanId },
        status: 'disetujui',
      },
    });

    res.json({
      success: true,
      data: {
        kegiatan: {
          id: kegiatan.id,
          nama: kegiatan.nama,
          tanggalMulai: kegiatan.tanggalMulai,
          lokasi: kegiatan.lokasi,
          asal: kegiatan.asal,
          kategori: kegiatan.kategori,
          skala: kegiatan.skala,
          organisasi: kegiatan.organisasi,
        },
        peserta,
        statistik: {
          totalTerdaftar: statsAll,
          hadir: statsHadir,
          tidakHadir: statsTidakHadir,
        },
        sudahSubmitPoin: sudahSubmit > 0,
      },
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

// POST /api/kegiatan/:id/peserta/import — Import peserta dari data CSV (JSON array)
export const importPeserta = async (req: Request, res: Response): Promise<void> => {
  try {
    const kegiatanId = Number(req.params.id);
    const aktorId = BigInt(req.user!.id);
    const body = importPesertaSchema.parse(req.body);

    // Pastikan kegiatan ada & statusnya valid
    const kegiatan = await prisma.kegiatan.findUnique({
      where: { id: kegiatanId },
      include: { organisasi: true },
    });
    if (!kegiatan) {
      res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan' });
      return;
    }

    // ── Otorisasi ──
    const userJabatan = req.user!.jabatan;
    const userPeran = req.user!.peran;
    const effectiveRole = userPeran === 'staff' && userJabatan ? userJabatan : userPeran;

    if (effectiveRole === 'operator_org') {
      if (kegiatan.dibuatOleh !== aktorId) {
        res.status(403).json({ success: false, message: 'Anda hanya dapat mengelola peserta untuk kegiatan yang Anda buat.' });
        return;
      }
    } else if (effectiveRole === 'admin_fakultas') {
      const staffData = await prisma.staff.findUnique({ where: { userId: aktorId } });
      if (!staffData?.fakultasId || kegiatan.organisasi?.fakultasId !== staffData.fakultasId) {
        res.status(403).json({ success: false, message: 'Anda tidak berhak mengelola peserta dari fakultas lain.' });
        return;
      }
    } // admin_ditmawa diperbolehkan (sebagai admin pusat)

    // Kegiatan harus dalam status yang mengizinkan input peserta
    const allowedStatuses = ['disetujui', 'terpublikasi', 'berlangsung', 'selesai'];
    if (!allowedStatuses.includes(kegiatan.status)) {
      res.status(400).json({
        success: false,
        message: `Kegiatan dalam status '${kegiatan.status}'. Import peserta hanya bisa dilakukan jika status: ${allowedStatuses.join(', ')}`,
      });
      return;
    }

    // Cek apakah sudah pernah submit poin — jika sudah, tidak boleh import lagi
    const sudahSubmit = await prisma.klaimPoin.count({
      where: {
        partisipasi: { kegiatanId },
        status: 'disetujui',
      },
    });
    if (sudahSubmit > 0) {
      res.status(400).json({
        success: false,
        message: 'Peserta sudah di-submit untuk klaim poin. Gunakan fitur Edit untuk mengubah data.',
      });
      return;
    }

    // Cari semua mahasiswa berdasarkan NIM
    const nimList = body.peserta.map(p => p.nim);
    const mahasiswaList = await prisma.mahasiswa.findMany({
      where: { nim: { in: nimList } },
      include: { user: { select: { nama: true } } },
    });

    const nimToMahasiswa = new Map(mahasiswaList.map(m => [m.nim, m]));

    const imported: { nim: string; nama: string; status: string }[] = [];
    const errors: { nim: string; error: string }[] = [];

    await prisma.$transaction(async (tx) => {
      for (const peserta of body.peserta) {
        const mahasiswa = nimToMahasiswa.get(peserta.nim);

        if (!mahasiswa) {
          errors.push({ nim: peserta.nim, error: 'NIM tidak ditemukan di database' });
          continue;
        }

        // Upsert partisipasi (buat baru atau update jika sudah ada)
        try {
          await tx.partisipasi.upsert({
            where: {
              kegiatanId_mahasiswaId: {
                kegiatanId,
                mahasiswaId: mahasiswa.userId,
              },
            },
            update: {
              kehadiran: peserta.hadir,
              peranVerifId: peserta.peranId ?? null,
              status: peserta.hadir ? 'hadir' : 'tidak_hadir',
            },
            create: {
              kegiatanId,
              mahasiswaId: mahasiswa.userId,
              kehadiran: peserta.hadir,
              peranVerifId: peserta.peranId ?? null,
              status: peserta.hadir ? 'hadir' : 'tidak_hadir',
            },
          });

          imported.push({
            nim: peserta.nim,
            nama: mahasiswa.user.nama,
            status: peserta.hadir ? 'hadir' : 'tidak_hadir',
          });
        } catch (err: any) {
          errors.push({ nim: peserta.nim, error: `Gagal menyimpan: ${err.message}` });
        }
      }
    });

    await logAudit({
      entitas: 'kegiatan',
      entitasId: kegiatanId,
      aksi: 'import_peserta',
      statusBaru: `imported ${imported.length} peserta`,
      aktorId,
    });

    res.json({
      success: true,
      message: `Berhasil mengimport ${imported.length} dari ${body.peserta.length} peserta.`,
      data: {
        imported,
        errors: errors.length > 0 ? errors : undefined,
      },
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

// POST /api/kegiatan/:id/peserta/submit-poin — Auto-generate klaim & cetak poin untuk peserta hadir
export const submitPoinPeserta = async (req: Request, res: Response): Promise<void> => {
  try {
    const kegiatanId = Number(req.params.id);
    const aktorId = BigInt(req.user!.id);

    // Ambil kegiatan + alokasi capaian
    const kegiatan = await prisma.kegiatan.findUnique({
      where: { id: kegiatanId },
      include: {
        kegiatanCapaian: true,
        organisasi: true,
      },
    });

    if (!kegiatan) {
      res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan' });
      return;
    }

    // ── Otorisasi ──
    const userJabatan = req.user!.jabatan;
    const userPeran = req.user!.peran;
    const effectiveRole = userPeran === 'staff' && userJabatan ? userJabatan : userPeran;

    if (effectiveRole === 'operator_org') {
      if (kegiatan.dibuatOleh !== aktorId) {
        res.status(403).json({ success: false, message: 'Anda hanya dapat mengelola peserta untuk kegiatan yang Anda buat.' });
        return;
      }
    } else if (effectiveRole === 'admin_fakultas') {
      const staffData = await prisma.staff.findUnique({ where: { userId: aktorId } });
      if (!staffData?.fakultasId || kegiatan.organisasi?.fakultasId !== staffData.fakultasId) {
        res.status(403).json({ success: false, message: 'Anda tidak berhak mengelola peserta dari fakultas lain.' });
        return;
      }
    } // admin_ditmawa diperbolehkan (sebagai admin pusat)

    // Cek apakah sudah pernah submit
    const sudahSubmit = await prisma.klaimPoin.count({
      where: {
        partisipasi: { kegiatanId },
        status: 'disetujui',
      },
    });
    if (sudahSubmit > 0) {
      res.status(400).json({
        success: false,
        message: 'Poin peserta sudah pernah di-submit sebelumnya. Status: Telah Tercatat.',
      });
      return;
    }

    // Ambil semua partisipasi yang hadir DAN punya peran
    const pesertaHadir = await prisma.partisipasi.findMany({
      where: {
        kegiatanId,
        kehadiran: true,
        peranVerifId: { not: null },
      },
      include: {
        mahasiswa: {
          include: { user: { select: { nama: true } } },
        },
      },
    });

    if (pesertaHadir.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Tidak ada peserta yang hadir dan memiliki peran. Pastikan kehadiran dan peran sudah diisi.',
      });
      return;
    }

    const processedIds: bigint[] = [];
    const errors: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const partisipasi of pesertaHadir) {
        const peranId = partisipasi.peranVerifId!;

        // Lookup matriks poin [BR-030]
        const matriks = await tx.matriksPoin.findFirst({
          where: {
            kurikulumId: kegiatan.kurikulumId,
            kategoriId: kegiatan.kategoriId,
            skalaId: kegiatan.skalaId,
            peranId,
          },
        });

        if (!matriks) {
          errors.push(
            `${partisipasi.mahasiswa.user.nama} (peran ID ${peranId}): Matriks poin tidak ditemukan`
          );
          continue;
        }

        // Cek apakah klaim sudah ada untuk partisipasi ini
        const existingKlaim = await tx.klaimPoin.findUnique({
          where: { partisipasiId: partisipasi.id },
        });

        if (existingKlaim) {
          errors.push(
            `${partisipasi.mahasiswa.user.nama}: Klaim sudah ada (ID: ${existingKlaim.id})`
          );
          continue;
        }

        // 1. Buat KlaimPoin bayangan (langsung disetujui)
        const klaim = await tx.klaimPoin.create({
          data: {
            partisipasiId: partisipasi.id,
            peranUsulanId: peranId,
            status: 'disetujui',
            validatorId: aktorId,
            alasan: 'Auto-generated: Poin diberikan oleh penyelenggara kegiatan',
          },
        });

        // 2. Buat PerolehanPoin + Detail
        const perolehan = await tx.perolehanPoin.create({
          data: {
            klaimPoinId: klaim.id,
            mahasiswaId: partisipasi.mahasiswaId,
            kegiatanId,
            totalPoin: matriks.poin,
            status: 'sah',
            detail: {
              create: kegiatan.kegiatanCapaian.map((kc) => ({
                subCapaianId: kc.subCapaianId,
                poin: Math.round((matriks.poin * Number(kc.alokasiPersen)) / 100),
              })),
            },
          },
        });

        // 3. Notifikasi ke mahasiswa
        await tx.notifikasi.create({
          data: {
            userId: partisipasi.mahasiswaId,
            judul: 'Poin Diperoleh! 🎉',
            isi: `Selamat! Anda mendapatkan ${matriks.poin} poin dari partisipasi Anda pada kegiatan "${kegiatan.nama}".`,
            refType: 'perolehan_poin',
            refId: perolehan.id,
          },
        });

        processedIds.push(partisipasi.id);
      }

      if (processedIds.length === 0) {
        throw new Error('Tidak ada peserta yang berhasil diproses. ' + errors.join(' | '));
      }
    });

    // Audit log
    await logAudit({
      entitas: 'kegiatan',
      entitasId: kegiatanId,
      aksi: 'submit_poin_peserta',
      statusBaru: `${processedIds.length} peserta mendapat poin`,
      aktorId,
    });

    res.json({
      success: true,
      message: `Berhasil mencetak poin untuk ${processedIds.length} dari ${pesertaHadir.length} peserta yang hadir.`,
      data: {
        totalDiproses: processedIds.length,
        totalGagal: errors.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      res.status(409).json({
        success: false,
        message: 'Sebagian peserta sudah memiliki poin untuk kegiatan ini (duplikat).',
      });
    } else {
      console.error(error);
      res.status(500).json({ success: false, message: error.message || 'Terjadi kesalahan pada server' });
    }
  }
};

// GET /api/kegiatan/:id/peserta/template — Download CSV template
export const downloadTemplatePeserta = async (req: Request, res: Response): Promise<void> => {
  try {
    const kegiatanId = Number(req.params.id);

    // Ambil daftar peran yang tersedia untuk kategori kegiatan ini
    const kegiatan = await prisma.kegiatan.findUnique({
      where: { id: kegiatanId },
      select: { nama: true, kategoriId: true },
    });

    if (!kegiatan) {
      res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan' });
      return;
    }

    const peranList = await prisma.mpPeran.findMany({
      where: { kategoriId: kegiatan.kategoriId },
      orderBy: { urutan: 'asc' },
    });

    // Header CSV
    const header = 'NIM,HADIR,PERAN_ID';
    const komentar = `# Template Import Peserta - ${kegiatan.nama}`;
    const komentarPeran = `# Daftar PERAN_ID yang tersedia: ${peranList.map(p => `${p.id}=${p.nama}`).join(', ')}`;
    const contoh = '# Contoh: 2311210001,true,3';
    const csvContent = [komentar, komentarPeran, contoh, header, ''].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="template_peserta_${kegiatanId}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// PUT /api/kegiatan/:id/peserta/update — Update kehadiran & peran peserta secara massal
export const updatePeserta = async (req: Request, res: Response): Promise<void> => {
  try {
    const kegiatanId = Number(req.params.id);
    const aktorId = BigInt(req.user!.id);

    const updateSchema = z.object({
      peserta: z.array(z.object({
        partisipasiId: z.number().or(z.string().transform(v => Number(v))),
        hadir: z.boolean(),
        peranId: z.number().int().positive().optional().nullable(),
      })).min(1),
    });

    const body = updateSchema.parse(req.body);

    // Pastikan kegiatan ada
    const kegiatan = await prisma.kegiatan.findUnique({
      where: { id: kegiatanId },
      include: { organisasi: true },
    });
    if (!kegiatan) {
      res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan' });
      return;
    }

    // ── Otorisasi ──
    const userJabatan = req.user!.jabatan;
    const userPeran = req.user!.peran;
    const effectiveRole = userPeran === 'staff' && userJabatan ? userJabatan : userPeran;

    if (effectiveRole === 'operator_org') {
      if (kegiatan.dibuatOleh !== aktorId) {
        res.status(403).json({ success: false, message: 'Anda hanya dapat mengelola peserta untuk kegiatan yang Anda buat.' });
        return;
      }
    } else if (effectiveRole === 'admin_fakultas') {
      const staffData = await prisma.staff.findUnique({ where: { userId: aktorId } });
      if (!staffData?.fakultasId || kegiatan.organisasi?.fakultasId !== staffData.fakultasId) {
        res.status(403).json({ success: false, message: 'Anda tidak berhak mengelola peserta dari fakultas lain.' });
        return;
      }
    } // admin_ditmawa diperbolehkan (sebagai admin pusat)

    // Update semua partisipasi dalam transaksi
    await prisma.$transaction(async (tx) => {
      for (const p of body.peserta) {
        await tx.partisipasi.update({
          where: { id: BigInt(p.partisipasiId) },
          data: {
            kehadiran: p.hadir,
            peranVerifId: p.peranId ?? null,
            status: p.hadir ? 'hadir' : 'tidak_hadir',
          },
        });
      }
    });

    await logAudit({
      entitas: 'kegiatan',
      entitasId: kegiatanId,
      aksi: 'update_peserta',
      statusBaru: `Updated ${body.peserta.length} peserta`,
      aktorId,
    });

    res.json({
      success: true,
      message: `Berhasil mengupdate ${body.peserta.length} peserta.`,
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
