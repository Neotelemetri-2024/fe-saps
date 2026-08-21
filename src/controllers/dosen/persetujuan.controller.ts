import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';
import { z } from 'zod';
import { logAudit } from '../../lib/auditLog';
import { NotifikasiService } from '../../services/notifikasi.service';
import { bagiPoin } from '../../lib/distribusiPoin';

const ASAL_INTERNAL = ['kurikuler_ukm', 'kurikuler_ukmf', 'universitas'] as const;

function isAsalInternal(asal: string | null | undefined) {
  return !!asal && (ASAL_INTERNAL as readonly string[]).includes(asal);
}

/**
 * Setelah Dosen PA menyetujui izin kegiatan internal:
 * buat/update PerolehanPoin + Detail dari matriks, dan finalize KlaimPoin.
 */
async function cetakPoinInternalSetelahPA(tx: any, partisipasiId: bigint) {
  const partisipasi = await tx.partisipasi.findUnique({
    where: { id: partisipasiId },
    include: {
      kegiatan: { include: { kegiatanCapaian: true, organisasi: { select: { nama: true } } } },
      klaimPoin: { include: { perolehanPoin: true } },
    },
  });

  if (!partisipasi?.kegiatan) return;
  if (!isAsalInternal(partisipasi.kegiatan.asal)) return;

  const kegiatan = partisipasi.kegiatan;
  const peranId = partisipasi.peranVerifId ?? partisipasi.klaimPoin?.peranUsulanId;
  if (!peranId) {
    throw new Error('Peran peserta tidak ditemukan untuk mencetak poin internal');
  }

  if (!kegiatan.kegiatanCapaian?.length) {
    throw new Error(`Alokasi capaian kegiatan "${kegiatan.nama}" belum diatur`);
  }

  const matriks = await tx.matriksPoin.findFirst({
    where: {
      kurikulumId: kegiatan.kurikulumId,
      kategoriId: kegiatan.kategoriId,
      skalaId: kegiatan.skalaId,
      peranId,
    },
  });

  if (!matriks) {
    throw new Error(`Matriks poin tidak ditemukan untuk kegiatan "${kegiatan.nama}"`);
  }

  const detailRows = bagiPoin<number>(
    matriks.poin,
    kegiatan.kegiatanCapaian.map((kc: any) => ({
      ref: kc.subCapaianId as number,
      bobot: Number(kc.alokasiPersen),
    })),
  ).map((b) => ({ subCapaianId: b.ref, poin: b.poin }));

  let klaim = partisipasi.klaimPoin;
  if (!klaim) {
    klaim = await tx.klaimPoin.create({
      data: {
        partisipasiId: partisipasi.id,
        peranUsulanId: peranId,
        status: 'disetujui',
        alasan: 'Disetujui Dosen PA — poin internal dicetak otomatis',
      },
      include: { perolehanPoin: true },
    });
  } else {
    klaim = await tx.klaimPoin.update({
      where: { id: klaim.id },
      data: {
        peranUsulanId: peranId,
        status: 'disetujui',
        alasan: 'Disetujui Dosen PA — poin internal dicetak otomatis',
      },
      include: { perolehanPoin: true },
    });
  }

  let perolehanId: bigint;
  const existing = klaim.perolehanPoin;

  if (existing) {
    await tx.perolehanPoin.update({
      where: { id: existing.id },
      data: { totalPoin: matriks.poin, status: 'sah' },
    });
    await tx.perolehanDetail.deleteMany({ where: { perolehanPoinId: existing.id } });
    perolehanId = existing.id;
  } else {
    const dibuat = await tx.perolehanPoin.create({
      data: {
        klaimPoinId: klaim.id,
        mahasiswaId: partisipasi.mahasiswaId,
        kegiatanId: kegiatan.id,
        totalPoin: matriks.poin,
        status: 'sah',
      },
    });
    perolehanId = dibuat.id;
  }

  if (detailRows.length > 0) {
    await tx.perolehanDetail.createMany({
      data: detailRows.map((d) => ({ ...d, perolehanPoinId: perolehanId })),
    });
  }

  const penyelenggaraNama = kegiatan.organisasi?.nama || kegiatan.nama;
  await tx.notifikasi.create({
    data: {
      userId: partisipasi.mahasiswaId,
      judul: 'Poin Kegiatan Diperoleh',
      isi: `Dosen PA menyetujui kegiatan "${kegiatan.nama}". Anda memperoleh ${matriks.poin} poin dari ${penyelenggaraNama}.`,
      refType: 'perolehan_poin',
      refId: perolehanId,
    },
  });
}

// ==================== VALIDASI ====================
const izinDecisionSchema = z.object({
  status: z.enum(['disetujui', 'ditolak', 'revisi']),
  alasan: z.string().optional(),
});

// ==================== DAFTAR PERMINTAAN IZIN ====================

// GET /api/dosen/persetujuan — Dosen PA melihat daftar izin mahasiswa bimbingannya
export const getIzinForDosen = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dosenPaId = BigInt(req.user!.id);
    const data = await prisma.izinPA.findMany({
      where: { dosenPaId },
      include: {
        partisipasi: {
          include: {
            mahasiswa: {
              include: { user: { select: { nama: true } } },
            },
            kegiatan: {
              include: {
                kategori: true,
                skala: true,
              },
            },
            peranVerif: true,
            klaimPoin: {
              select: { peranUsulanId: true, peranUsulan: { select: { nama: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Deteksi pengajuan ulang: partisipasiId yang muncul >1x
    const partisipasiCount: Record<string, number> = {};
    data.forEach(izin => {
      const pid = izin.partisipasiId.toString();
      partisipasiCount[pid] = (partisipasiCount[pid] || 0) + 1;
    });
    const seenPid = new Set<string>();

    // Serialisasi data agar bigint menjadi string
    const serializedData = data.map(izin => {
        const pid = izin.partisipasiId.toString();
        const isUlang = partisipasiCount[pid] > 1 && !seenPid.has(pid);
        seenPid.add(pid);
        const klaim = (izin.partisipasi as any).klaimPoin;
        return {
          ...izin,
          id: izin.id.toString(),
          partisipasiId: pid,
          dosenPaId: izin.dosenPaId.toString(),
          isUlang,
          peran: klaim?.peranUsulan?.nama || izin.partisipasi.peranVerif?.nama || null,
          peranId: klaim?.peranUsulanId?.toString() || null,
          partisipasi: {
              ...izin.partisipasi,
              id: izin.partisipasi.id.toString(),
              mahasiswaId: izin.partisipasi.mahasiswaId.toString(),
              kegiatanId: izin.partisipasi.kegiatanId,
              mahasiswa: {
                  ...izin.partisipasi.mahasiswa,
                  userId: izin.partisipasi.mahasiswa.userId.toString(),
                  dosenPaId: izin.partisipasi.mahasiswa.dosenPaId?.toString()
              }
          }
        };
    });
    
    res.json({ success: true, data: serializedData });
  } catch (error) {
    next(error);
  }
};

// ==================== KEPUTUSAN IZIN (BULK) ====================

const izinBulkSchema = z.object({
  ids: z.array(z.union([z.string(), z.number()])).min(1),
});

// PUT /api/dosen/persetujuan-bulk — Dosen PA menyetujui beberapa izin (status diajukan) sekaligus
export const putuskanIzinPABulk = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dosenPaId = BigInt(req.user!.id);
    const body = izinBulkSchema.parse(req.body);
    const ids = body.ids.map((id) => BigInt(id));

    const izinList = await prisma.izinPA.findMany({
      where: { id: { in: ids } },
      include: { partisipasi: true },
    });

    const invalid = izinList.find(
      (izin) => izin.dosenPaId !== dosenPaId || izin.status !== 'diajukan'
    );
    if (izinList.length !== ids.length || invalid) {
      return res.status(403).json({
        success: false,
        message: 'Beberapa izin tidak valid, bukan milik Anda, atau bukan berstatus Diajukan.',
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.izinPA.updateMany({
        where: { id: { in: ids } },
        data: { status: 'disetujui', decidedAt: new Date() },
      });
      await tx.partisipasi.updateMany({
        where: { id: { in: izinList.map((izin) => izin.partisipasiId) } },
        data: { status: 'disetujui_pa' as any },
      });
      for (const izin of izinList) {
        await cetakPoinInternalSetelahPA(tx, izin.partisipasiId);
        await tx.notifikasi.create({
          data: {
            userId: izin.partisipasi.mahasiswaId,
            judul: 'Izin Kegiatan disetujui',
            isi: 'Izin Anda untuk mengikuti kegiatan telah disetujui oleh Dosen PA.',
            refType: 'izin_pa',
            refId: izin.id,
          },
        });
      }
    });

    await logAudit({
      entitas: 'izin_pa',
      entitasId: ids[0],
      aksi: 'setujui',
      statusLama: 'diajukan',
      statusBaru: 'disetujui',
      aktorId: dosenPaId,
    });

    res.json({ success: true, message: `${ids.length} izin berhasil disetujui.` });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', errors: error.issues });
    }
    if (typeof error?.message === 'string' && (
      error.message.includes('Matriks poin') ||
      error.message.includes('Alokasi capaian') ||
      error.message.includes('Peran peserta')
    )) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// ==================== KEPUTUSAN IZIN ====================

// PUT /api/dosen/persetujuan/:id — Dosen PA menyetujui / menolak izin
export const putuskanIzinPA = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dosenPaId = BigInt(req.user!.id);
    const { id } = req.params;
    const body = izinDecisionSchema.parse(req.body);

    const izin = await prisma.izinPA.findUnique({
      where: { id: BigInt(id as string) },
      include: { partisipasi: true },
    });

    if (!izin) {
      return res.status(404).json({ success: false, message: 'Izin PA tidak ditemukan' });
    }
    if (izin.dosenPaId !== dosenPaId) {
      return res.status(403).json({ success: false, message: 'Izin ini bukan untuk Anda' });
    }
    if ((body.status === 'ditolak' || body.status === 'revisi') && !body.alasan) {
      return res.status(400).json({ success: false, message: 'Alasan penolakan/revisi wajib diisi' });
    }

    const updatedIzin = await prisma.$transaction(async (tx) => {
      const updated = await tx.izinPA.update({
        where: { id: BigInt(id as string) },
        data: {
          status: body.status,
          alasan: body.alasan,
          decidedAt: new Date(),
        },
      });

      let statusPartisipasi = 'disetujui_pa';
      if (body.status === 'ditolak') statusPartisipasi = 'ditolak_pa';
      if (body.status === 'revisi') statusPartisipasi = 'revisi_pa';

      await tx.partisipasi.update({
        where: { id: izin.partisipasiId },
        data: { status: statusPartisipasi as any },
      });

      if (body.status === 'disetujui') {
        await cetakPoinInternalSetelahPA(tx, izin.partisipasiId);
      }

      return updated;
    });

    // Notifikasi ke mahasiswa
    let statusText = 'disetujui ✅';
    if (body.status === 'ditolak') statusText = 'ditolak ❌';
    if (body.status === 'revisi') statusText = 'diminta revisi ⚠️';
    
    await NotifikasiService.kirim({
      userId: izin.partisipasi.mahasiswaId,
      judul: `Izin Kegiatan ${statusText}`,
      isi: `Izin Anda untuk mengikuti kegiatan telah ${statusText} oleh Dosen PA.${body.alasan ? ` Alasan: ${body.alasan}` : ''}`,
      refType: 'izin_pa',
      refId: BigInt(id as string),
    });

    await logAudit({
      entitas: 'izin_pa',
      entitasId: BigInt(id as string),
      aksi: body.status === 'disetujui' ? 'setujui' : (body.status === 'revisi' ? 'revisi' : 'tolak'),
      statusLama: 'diajukan',
      statusBaru: body.status,
      aktorId: dosenPaId,
    });

    res.json({ success: true, data: { ...updatedIzin, id: updatedIzin.id.toString(), partisipasiId: updatedIzin.partisipasiId.toString(), dosenPaId: updatedIzin.dosenPaId.toString() } });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', errors: error.issues });
    }
    if (typeof error?.message === 'string' && (
      error.message.includes('Matriks poin') ||
      error.message.includes('Alokasi capaian') ||
      error.message.includes('Peran peserta')
    )) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// ==================== SARAN PA ====================

// POST /api/dosen/saran — Dosen PA memberikan saran
export const createSaranPA = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dosenPaId = BigInt(req.user!.id);
    const mahasiswaId = BigInt(req.body.mahasiswaId);
    const isi = req.body.isi as string;

    if (!isi || isi.length < 3) {
      return res.status(400).json({ success: false, message: 'Isi saran minimal 3 karakter' });
    }

    // Verifikasi relasi bimbingan
    const mahasiswa = await prisma.mahasiswa.findUnique({ where: { userId: mahasiswaId } });
    if (!mahasiswa || mahasiswa.dosenPaId !== dosenPaId) {
      return res.status(403).json({ success: false, message: 'Bukan mahasiswa bimbingan Anda' });
    }

    const saran = await prisma.saranPA.create({
      data: { dosenPaId, mahasiswaId, isi },
    });

    await NotifikasiService.kirim({
      userId: mahasiswaId,
      judul: 'Saran dari Dosen PA',
      isi: `Dosen PA Anda memberikan saran baru.`,
      refType: 'saran_pa',
      refId: saran.id,
    });

    res.status(201).json({ success: true, data: { ...saran, id: saran.id.toString(), dosenPaId: saran.dosenPaId.toString(), mahasiswaId: saran.mahasiswaId.toString() } });
  } catch (error) {
    next(error);
  }
};

// GET /api/dosen/saran?mahasiswaId=X — Daftar saran PA
export const getSaranPA = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mahasiswaId = BigInt(req.query.mahasiswaId as string);
    const data = await prisma.saranPA.findMany({
      where: { mahasiswaId },
      include: {
        dosenPA: {
          include: { user: { select: { nama: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    const serializedData = data.map(s => ({
        ...s,
        id: s.id.toString(),
        dosenPaId: s.dosenPaId.toString(),
        mahasiswaId: s.mahasiswaId.toString(),
        dosenPA: {
            ...s.dosenPA,
            userId: s.dosenPA.userId.toString()
        }
    }));
    
    res.json({ success: true, data: serializedData });
  } catch (error) {
    next(error);
  }
};
