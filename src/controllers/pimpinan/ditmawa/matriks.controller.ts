import { Request, Response } from 'express';
import prisma from '../../../lib/prisma';
import { z } from 'zod';
import { logAudit } from '../../../lib/auditLog';

// ==================== VALIDASI ====================
const upsertMatriksSchema = z.object({
  kurikulumId: z.number().int().positive(),
  kategoriId: z.number().int().positive(),
  skalaId: z.number().int().positive(),
  peranId: z.number().int().positive(),
  poin: z.number().int().min(0),
});

// ==================== MATRIKS POIN CRUD ====================

// GET /api/matriks — Daftar matriks poin berdasarkan kurikulum
export const getMatriksPoin = async (req: Request, res: Response) => {
  try {
    const { kurikulumId, kategoriId, skalaId } = req.query;

    const where: any = {};
    if (kurikulumId) where.kurikulumId = Number(kurikulumId);
    if (kategoriId) where.kategoriId = Number(kategoriId);
    if (skalaId) where.skalaId = Number(skalaId);

    const data = await prisma.matriksPoin.findMany({
      where,
      include: {
        kategori: true,
        skala: true,
        peran: true,
        kurikulum: { select: { id: true, nama: true, status: true } },
      },
      orderBy: [{ kategoriId: 'asc' }, { skalaId: 'asc' }, { peranId: 'asc' }],
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// Schema untuk batch upsert (dengan nama string untuk resolve)
const batchUpsertItemSchema = z.object({
  kategori: z.string().min(1),
  peran: z.string().min(1),
  skala: z.string().min(1),
  poin: z.number().int().min(0),
});

const syncMatriksSchema = z.object({
  kategoriId: z.number().int().positive().optional(),
  kategoriNama: z.string().min(1),
  columns: z.array(z.object({
    id: z.number().int().positive().optional(),
    nama: z.string().min(1),
  })).min(1),
  rows: z.array(z.object({
    id: z.number().int().positive().optional(),
    nama: z.string().min(1),
  })).min(1),
  cells: z.array(z.object({
    peranKey: z.union([z.number().int().positive(), z.string().min(1)]),
    skalaKey: z.union([z.number().int().positive(), z.string().min(1)]),
    poin: z.number().int().min(0),
  })),
});

function softDeleteName(nama: string, id: number) {
  if (nama.startsWith('(tidak digunakan)')) return nama;
  return `(tidak digunakan) ${id}-${nama}`.slice(0, 80);
}

async function resolveOrCreatePeran(
  tx: any,
  kategoriId: number,
  nama: string,
  urutan: number,
) {
  const existing = await tx.mpPeran.findFirst({
    where: { kategoriId, nama },
  });
  if (existing) return existing;
  return tx.mpPeran.create({
    data: { kategoriId, nama, urutan },
  });
}

async function resolveOrCreateSkala(
  tx: any,
  kategoriId: number,
  nama: string,
  urutan: number,
) {
  const existing = await tx.mpSkala.findFirst({
    where: { kategoriId, nama },
  });
  if (existing) return existing;
  return tx.mpSkala.create({
    data: { kategoriId, nama, urutan },
  });
}

// POST /api/matriks/sync — Sinkronisasi penuh 1 kategori (baris/kolom/nilai)
export const syncMatriksPoin = async (req: Request, res: Response): Promise<void> => {
  try {
    const aktorId = BigInt(req.user!.id);
    const payload = syncMatriksSchema.parse(req.body);

    const kurikulum = await prisma.kurikulum.findFirst({ where: { status: 'aktif' } });
    if (!kurikulum) {
      res.status(400).json({ success: false, message: 'Tidak ada kurikulum aktif' });
      return;
    }
    const kurikulumId = kurikulum.id;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Pastikan kategori
      let kategori;
      if (payload.kategoriId) {
        kategori = await tx.mpKategori.findUnique({ where: { id: payload.kategoriId } });
        if (!kategori) throw new Error(`Kategori ID ${payload.kategoriId} tidak ditemukan`);
        if (payload.kategoriNama && payload.kategoriNama !== kategori.nama) {
          kategori = await tx.mpKategori.update({
            where: { id: kategori.id },
            data: { nama: payload.kategoriNama },
          });
        }
      } else {
        kategori = await tx.mpKategori.findFirst({ where: { nama: payload.kategoriNama } });
        if (!kategori) {
          kategori = await tx.mpKategori.create({ data: { nama: payload.kategoriNama } });
        }
      }

      const kategoriId = kategori.id;

      // Master data yang belum pernah masuk grid tidak boleh ikut dinonaktifkan,
      // karena masih dipakai sebagai opsi dropdown oleh role lain.
      const priorCells = await tx.matriksPoin.findMany({
        where: { kurikulumId, kategoriId },
        select: { peranId: true, skalaId: true },
      });
      const priorPeranIds = new Set(priorCells.map((c) => c.peranId));
      const priorSkalaIds = new Set(priorCells.map((c) => c.skalaId));

      // 2. Sync skala (columns)
      const skalaIdMap = new Map<string | number, number>(); // key dari FE → id DB
      const keptSkalaIds = new Set<number>();

      for (let i = 0; i < payload.columns.length; i++) {
        const col = payload.columns[i];
        let skala;
        if (col.id) {
          skala = await tx.mpSkala.findFirst({ where: { id: col.id, kategoriId } });
          if (skala) {
            if (skala.nama !== col.nama || skala.urutan !== i + 1) {
              skala = await tx.mpSkala.update({
                where: { id: skala.id },
                data: { nama: col.nama, urutan: i + 1 },
              });
            }
          } else {
            skala = await resolveOrCreateSkala(tx, kategoriId, col.nama, i + 1);
          }
        } else {
          skala = await resolveOrCreateSkala(tx, kategoriId, col.nama, i + 1);
          if (skala.urutan !== i + 1) {
            skala = await tx.mpSkala.update({
              where: { id: skala.id },
              data: { urutan: i + 1 },
            });
          }
        }
        keptSkalaIds.add(skala.id);
        if (col.id) skalaIdMap.set(col.id, skala.id);
        skalaIdMap.set(col.nama, skala.id);
        skalaIdMap.set(`idx:${i}`, skala.id);
      }

      // Soft-delete skala yang tidak lagi ada di payload
      const allSkala = await tx.mpSkala.findMany({
        where: {
          kategoriId,
          NOT: { nama: { startsWith: '(tidak digunakan)' } },
        },
      });
      for (const s of allSkala) {
        if (!keptSkalaIds.has(s.id) && priorSkalaIds.has(s.id)) {
          await tx.mpSkala.update({
            where: { id: s.id },
            data: { nama: softDeleteName(s.nama, s.id) },
          });
        }
      }

      // 3. Sync peran (rows)
      const peranIdMap = new Map<string | number, number>();
      const keptPeranIds = new Set<number>();

      for (let i = 0; i < payload.rows.length; i++) {
        const row = payload.rows[i];
        let peran;
        if (row.id) {
          peran = await tx.mpPeran.findFirst({ where: { id: row.id, kategoriId } });
          if (peran) {
            if (peran.nama !== row.nama || peran.urutan !== i + 1) {
              peran = await tx.mpPeran.update({
                where: { id: peran.id },
                data: { nama: row.nama, urutan: i + 1 },
              });
            }
          } else {
            peran = await resolveOrCreatePeran(tx, kategoriId, row.nama, i + 1);
          }
        } else {
          peran = await resolveOrCreatePeran(tx, kategoriId, row.nama, i + 1);
          if (peran.urutan !== i + 1) {
            peran = await tx.mpPeran.update({
              where: { id: peran.id },
              data: { urutan: i + 1 },
            });
          }
        }
        keptPeranIds.add(peran.id);
        if (row.id) peranIdMap.set(row.id, peran.id);
        peranIdMap.set(row.nama, peran.id);
        peranIdMap.set(`idx:${i}`, peran.id);
      }

      const allPeran = await tx.mpPeran.findMany({
        where: {
          kategoriId,
          NOT: { nama: { startsWith: '(tidak digunakan)' } },
        },
      });
      for (const p of allPeran) {
        if (!keptPeranIds.has(p.id) && priorPeranIds.has(p.id)) {
          await tx.mpPeran.update({
            where: { id: p.id },
            data: { nama: softDeleteName(p.nama, p.id) },
          });
        }
      }

      // 4. Upsert semua sel matriks
      const upserted: any[] = [];
      const activePairs = new Set<string>(); // peranId-skalaId

      for (const cell of payload.cells) {
        const peranId = peranIdMap.get(cell.peranKey);
        const skalaId = skalaIdMap.get(cell.skalaKey);
        if (!peranId || !skalaId) continue;
        if (!keptPeranIds.has(peranId) || !keptSkalaIds.has(skalaId)) continue;

        activePairs.add(`${peranId}-${skalaId}`);

        const existing = await tx.matriksPoin.findUnique({
          where: {
            kurikulumId_kategoriId_skalaId_peranId: {
              kurikulumId,
              kategoriId,
              skalaId,
              peranId,
            },
          },
        });

        if (existing) {
          if (existing.poin !== cell.poin) {
            await tx.matriksPoinHistori.create({
              data: {
                matriksPoinId: existing.id,
                poinLama: existing.poin,
                poinBaru: cell.poin,
                diubahOleh: aktorId,
              },
            });
            const updated = await tx.matriksPoin.update({
              where: { id: existing.id },
              data: { poin: cell.poin },
            });
            upserted.push(updated);
          } else {
            upserted.push(existing);
          }
        } else {
          const created = await tx.matriksPoin.create({
            data: { kurikulumId, kategoriId, skalaId, peranId, poin: cell.poin },
          });
          await tx.matriksPoinHistori.create({
            data: {
              matriksPoinId: created.id,
              poinLama: null,
              poinBaru: cell.poin,
              diubahOleh: aktorId,
            },
          });
          upserted.push(created);
        }
      }

      // Hapus sel matriks yang tidak lagi ada di grid aktif (untuk kategori ini)
      const existingCells = await tx.matriksPoin.findMany({
        where: { kurikulumId, kategoriId },
      });
      for (const cell of existingCells) {
        const key = `${cell.peranId}-${cell.skalaId}`;
        if (!activePairs.has(key) && (!keptPeranIds.has(cell.peranId) || !keptSkalaIds.has(cell.skalaId))) {
          await tx.matriksPoinHistori.deleteMany({ where: { matriksPoinId: cell.id } });
          await tx.matriksPoin.delete({ where: { id: cell.id } });
        }
      }

      await logAudit({
        entitas: 'matriks_poin',
        entitasId: BigInt(kategoriId),
        aksi: 'sync_kategori',
        statusBaru: `${payload.rows.length}x${payload.columns.length}`,
        aktorId,
      });

      return {
        kategoriId,
        kategoriNama: kategori.nama,
        totalCells: upserted.length,
        peranIds: [...keptPeranIds],
        skalaIds: [...keptSkalaIds],
      };
    });

    res.json({
      success: true,
      data: result,
      message: `Matriks kategori "${result.kategoriNama}" berhasil disinkronkan (${result.totalCells} sel)`,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validasi gagal', errors: error.issues });
    } else if (error?.code === 'P2002') {
      res.status(400).json({
        success: false,
        message: 'Nama peran atau skala sudah dipakai di kategori ini. Gunakan nama lain.',
      });
    } else {
      console.error('[syncMatriksPoin]', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Terjadi kesalahan pada server',
      });
    }
  }
};

// POST /api/matriks — Tambah/update entri matriks (upsert) [BR-031]
// Menerima single object dengan ID atau array dengan nama string (batch)
export const upsertMatriksPoin = async (req: Request, res: Response): Promise<void> => {
  try {
    const aktorId = BigInt(req.user!.id);
    const body = req.body;

    // Array → batch mode (resolve nama ke ID, auto-create master jika belum ada)
    if (Array.isArray(body)) {
      const items = batchUpsertItemSchema.array().parse(body);

      const kurikulum = await prisma.kurikulum.findFirst({ where: { status: 'aktif' } });
      if (!kurikulum) {
        res.status(400).json({ success: false, message: 'Tidak ada kurikulum aktif' });
        return;
      }
      const kurikulumId = kurikulum.id;

      const results: any[] = [];
      const errors: string[] = [];

      for (const item of items) {
        try {
          let kategori = await prisma.mpKategori.findFirst({ where: { nama: item.kategori } });
          if (!kategori) {
            kategori = await prisma.mpKategori.create({ data: { nama: item.kategori } });
          }

          const peran = await resolveOrCreatePeran(prisma, kategori.id, item.peran, 99);
          const skala = await resolveOrCreateSkala(prisma, kategori.id, item.skala, 99);

          const existing = await prisma.matriksPoin.findUnique({
            where: {
              kurikulumId_kategoriId_skalaId_peranId: {
                kurikulumId,
                kategoriId: kategori.id,
                skalaId: skala.id,
                peranId: peran.id,
              },
            },
          });

          if (existing) {
            await prisma.matriksPoinHistori.create({
              data: {
                matriksPoinId: existing.id,
                poinLama: existing.poin,
                poinBaru: item.poin,
                diubahOleh: aktorId,
              },
            });
            const updated = await prisma.matriksPoin.update({
              where: { id: existing.id },
              data: { poin: item.poin },
            });
            results.push(updated);
          } else {
            const created = await prisma.matriksPoin.create({
              data: {
                kurikulumId,
                kategoriId: kategori.id,
                skalaId: skala.id,
                peranId: peran.id,
                poin: item.poin,
              },
            });
            await prisma.matriksPoinHistori.create({
              data: { matriksPoinId: created.id, poinLama: null, poinBaru: item.poin, diubahOleh: aktorId },
            });
            results.push(created);
          }
        } catch (e: any) {
          errors.push(`${item.kategori}/${item.peran}/${item.skala}: ${e?.message || 'gagal'}`);
        }
      }

      res.json({
        success: true,
        data: results,
        message: `${results.length} entri tersimpan${errors.length ? `, ${errors.length} gagal` : ''}`,
        ...(errors.length ? { errors } : {}),
      });
      return;
    }

    // Single object mode (dengan ID langsung)
    const data = upsertMatriksSchema.parse(body);

    const existing = await prisma.matriksPoin.findUnique({
      where: {
        kurikulumId_kategoriId_skalaId_peranId: {
          kurikulumId: data.kurikulumId,
          kategoriId: data.kategoriId,
          skalaId: data.skalaId,
          peranId: data.peranId,
        },
      },
    });

    if (existing) {
      await prisma.matriksPoinHistori.create({
        data: {
          matriksPoinId: existing.id,
          poinLama: existing.poin,
          poinBaru: data.poin,
          diubahOleh: aktorId,
        },
      });

      const updated = await prisma.matriksPoin.update({
        where: { id: existing.id },
        data: { poin: data.poin },
      });

      await logAudit({
        entitas: 'matriks_poin',
        entitasId: existing.id,
        aksi: 'update_poin',
        statusLama: String(existing.poin),
        statusBaru: String(data.poin),
        aktorId,
      });

      res.json({ success: true, data: updated, message: 'Poin diperbarui' });
    } else {
      const created = await prisma.matriksPoin.create({ data });

      await prisma.matriksPoinHistori.create({
        data: {
          matriksPoinId: created.id,
          poinLama: null,
          poinBaru: data.poin,
          diubahOleh: aktorId,
        },
      });

      await logAudit({
        entitas: 'matriks_poin',
        entitasId: created.id,
        aksi: 'create',
        statusBaru: String(data.poin),
        aktorId,
      });

      res.status(201).json({ success: true, data: created });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validasi gagal', errors: error.issues });
    } else {
      console.error(error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
  }
};

// GET /api/matriks/histori/:matriksPoinId — Histori perubahan nilai (satu sel)
export const getMatriksHistori = async (req: Request, res: Response) => {
  try {
    const matriksPoinId = req.params.matriksPoinId as string;
    const data = await prisma.matriksPoinHistori.findMany({
      where: { matriksPoinId: BigInt(matriksPoinId) },
      include: { pengubah: { select: { id: true, nama: true } } },
      orderBy: { diubahPada: 'desc' },
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// GET /api/matriks/histori — Seluruh histori perubahan nilai (semua sel)
export const getAllMatriksHistori = async (req: Request, res: Response) => {
  try {
    const data = await prisma.matriksPoinHistori.findMany({
      include: {
        pengubah: { select: { id: true, nama: true } },
        matriksPoin: {
          include: {
            kategori: true,
            skala: true,
            peran: true,
            kurikulum: { select: { nama: true } },
          },
        },
      },
      orderBy: { diubahPada: 'desc' },
      take: 200,
    });
    const mapped = data.map((h) => ({
      id: h.id,
      poinLama: h.poinLama,
      poinBaru: h.poinBaru,
      diubahPada: h.diubahPada,
      kategori: h.matriksPoin.kategori.nama,
      skala: h.matriksPoin.skala.nama,
      peran: h.matriksPoin.peran.nama,
      kurikulum: h.matriksPoin.kurikulum.nama,
      oleh: h.pengubah.nama,
    }));
    res.json({ success: true, data: mapped });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// DELETE /api/matriks/kategori/:id — Hapus 1 matriks (kategori) beserta baris/kolom/nilainya
// Soft-delete: nama kategori/peran/skala diganti prefix "(tidak digunakan)" agar
// referensi FK dari Kegiatan lama tetap valid dan dropdown lain tidak rusak.
export const deleteKategori = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const kategoriId = Number(id);

    const kategori = await prisma.mpKategori.findUnique({ where: { id: kategoriId } });
    if (!kategori) {
      res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
      return;
    }
    if (kategori.nama.startsWith('(tidak digunakan)')) {
      res.status(400).json({ success: false, message: 'Kategori sudah dinonaktifkan' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Hapus nilai matriks + histori milik kategori ini
      const cells = await tx.matriksPoin.findMany({
        where: { kategoriId },
        select: { id: true },
      });
      const cellIds = cells.map((c) => c.id);
      if (cellIds.length > 0) {
        await tx.matriksPoinHistori.deleteMany({ where: { matriksPoinId: { in: cellIds } } });
        await tx.matriksPoin.deleteMany({ where: { kategoriId } });
      }

      // Soft-delete peran & skala milik kategori ini
      const perans = await tx.mpPeran.findMany({ where: { kategoriId } });
      for (const p of perans) {
        await tx.mpPeran.update({
          where: { id: p.id },
          data: { nama: softDeleteName(p.nama, p.id) },
        });
      }
      const skalas = await tx.mpSkala.findMany({ where: { kategoriId } });
      for (const s of skalas) {
        await tx.mpSkala.update({
          where: { id: s.id },
          data: { nama: softDeleteName(s.nama, s.id) },
        });
      }

      // Soft-delete kategori itu sendiri
      await tx.mpKategori.update({
        where: { id: kategoriId },
        data: { nama: softDeleteName(kategori.nama, kategoriId) },
      });

      await logAudit({
        entitas: 'matriks_poin',
        entitasId: BigInt(kategoriId),
        aksi: 'hapus_kategori',
        statusLama: kategori.nama,
        aktorId: BigInt(req.user!.id),
      });
    });

    res.json({
      success: true,
      message: `Matriks "${kategori.nama}" berhasil dihapus`,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Terjadi kesalahan pada server',
    });
  }
};

// ==================== MASTER DATA LOOKUP ====================

// GET /api/matriks/kategori
export const getKategori = async (req: Request, res: Response) => {
  try {
    const data = await prisma.mpKategori.findMany({ orderBy: { id: 'asc' } });
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// POST /api/matriks/kategori
export const createKategori = async (req: Request, res: Response) => {
  try {
    const { nama, peran, skala } = req.body; // Peran dan Skala adalah array of string opsional
    if (!nama) {
      res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });
      return;
    }

    const data = await prisma.mpKategori.create({ 
      data: { 
        nama,
        peran: peran && Array.isArray(peran) ? {
          create: peran.map((p: string, idx: number) => ({
            nama: p,
            urutan: idx + 1
          }))
        } : undefined,
        skala: skala && Array.isArray(skala) ? {
          create: skala.map((s: string, idx: number) => ({
            nama: s,
            urutan: idx + 1
          }))
        } : undefined
      },
      include: { peran: true, skala: true }
    });

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// GET /api/master/skala
export const getSkala = async (req: Request, res: Response) => {
  try {
    const { kategoriId } = req.query;
    const where: any = {};
    if (kategoriId) where.kategoriId = Number(kategoriId);

    const data = await prisma.mpSkala.findMany({ 
      where,
      include: { kategori: true },
      orderBy: [{ kategoriId: 'asc' }, { urutan: 'asc' }] 
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// POST /api/matriks/skala
export const createSkala = async (req: Request, res: Response) => {
  try {
    const { kategoriId, nama, urutan } = req.body;
    if (!kategoriId || !nama) {
      res.status(400).json({ success: false, message: 'Kategori ID dan Nama Skala wajib diisi' });
      return;
    }

    const urutanToUse = urutan || 99;

    const data = await prisma.mpSkala.create({
      data: {
        kategoriId: Number(kategoriId),
        nama,
        urutan: Number(urutanToUse)
      }
    });

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// PUT /api/matriks/skala/:id
export const updateSkala = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nama, urutan } = req.body;

    const data = await prisma.mpSkala.update({
      where: { id: Number(id) },
      data: {
        ...(nama && { nama }),
        ...(urutan !== undefined && { urutan: Number(urutan) }),
      }
    });

    res.json({ success: true, message: 'Skala berhasil diperbarui', data });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Skala tidak ditemukan' });
      return;
    }
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// DELETE /api/matriks/skala/:id
export const deleteSkala = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Prisma akan melempar error referential integrity jika ada relasi yang menghalangi
    await prisma.mpSkala.delete({
      where: { id: Number(id) }
    });

    res.json({ success: true, message: 'Skala berhasil dihapus' });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Skala tidak ditemukan' });
      return;
    }
    if (error.code === 'P2003') {
      res.status(400).json({ success: false, message: 'Gagal dihapus: Skala ini sedang digunakan pada Kegiatan atau Matriks Poin.' });
      return;
    }
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// GET /api/master/peran?kategoriId=1
export const getPeran = async (req: Request, res: Response) => {
  try {
    const { kategoriId } = req.query;
    const where: any = {};
    if (kategoriId) where.kategoriId = Number(kategoriId);

    const data = await prisma.mpPeran.findMany({
      where,
      include: { kategori: true },
      orderBy: [{ kategoriId: 'asc' }, { urutan: 'asc' }],
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// POST /api/matriks/peran
export const createPeran = async (req: Request, res: Response) => {
  try {
    const { kategoriId, nama, urutan } = req.body;
    if (!kategoriId || !nama) {
      res.status(400).json({ success: false, message: 'Kategori ID dan Nama Peran wajib diisi' });
      return;
    }

    const urutanToUse = urutan || 99; // Default urutan paling akhir jika tidak diisi

    const data = await prisma.mpPeran.create({
      data: {
        kategoriId: Number(kategoriId),
        nama,
        urutan: Number(urutanToUse)
      }
    });

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// PUT /api/matriks/peran/:id
export const updatePeran = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nama, urutan } = req.body;

    const data = await prisma.mpPeran.update({
      where: { id: Number(id) },
      data: {
        ...(nama && { nama }),
        ...(urutan !== undefined && { urutan: Number(urutan) }),
      }
    });

    res.json({ success: true, message: 'Peran berhasil diperbarui', data });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Peran tidak ditemukan' });
      return;
    }
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// DELETE /api/matriks/peran/:id
export const deletePeran = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Prisma akan melempar error referential integrity jika ada relasi yang menghalangi
    await prisma.mpPeran.delete({
      where: { id: Number(id) }
    });

    res.json({ success: true, message: 'Peran berhasil dihapus' });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Peran tidak ditemukan' });
      return;
    }
    if (error.code === 'P2003') {
      res.status(400).json({ success: false, message: 'Gagal dihapus: Peran ini sedang digunakan pada Partisipasi atau Matriks Poin.' });
      return;
    }
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};
