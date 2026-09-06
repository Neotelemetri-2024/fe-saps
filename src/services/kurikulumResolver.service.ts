import { bagiPoin } from '../lib/distribusiPoin';
import prisma from '../lib/prisma';

export type DbClient = typeof prisma | any;

export class CurriculumResolutionError extends Error {
  constructor(
    public readonly code:
      | 'MAHASISWA_NOT_FOUND'
      | 'ANGKATAN_REQUIRED'
      | 'CURRICULUM_NOT_FOUND'
      | 'CURRICULUM_MAPPING_INVALID'
      | 'CURRICULUM_STILL_IN_USE',
    message: string,
  ) {
    super(message);
    this.name = 'CurriculumResolutionError';
  }
}

type MahasiswaLike = {
  userId?: bigint;
  angkatan?: number | null;
  kurikulumId?: number | null;
  kurikulum?: { id: number; nama?: string; angkatanMulai?: number | null; status?: string } | null;
};

const kurikulumInclude = {
  capaian: {
    include: { subCapaian: { orderBy: { id: 'asc' as const } } },
    orderBy: { urutan: 'asc' as const },
  },
};

export async function resolveKurikulumForAngkatan(
  angkatan: number | null | undefined,
  db: DbClient = prisma,
) {
  if (angkatan == null) return null;
  return db.kurikulum.findFirst({
    where: {
      status: 'aktif',
      angkatanMulai: { lte: angkatan },
    },
    orderBy: [{ angkatanMulai: 'desc' }, { id: 'desc' }],
  });
}

export async function resolveKurikulumIdForAngkatan(
  angkatan: number | null | undefined,
  db: DbClient = prisma,
): Promise<number | null> {
  return (await resolveKurikulumForAngkatan(angkatan, db))?.id ?? null;
}

/** Prefer explicit Mahasiswa.kurikulumId; otherwise latest active start year <= angkatan. */
export async function resolveKurikulumMahasiswa(
  mahasiswa: MahasiswaLike | bigint | number,
  db: DbClient = prisma,
  options: { includeStructure?: boolean; requireActive?: boolean } = {},
) {
  const includeStructure = options.includeStructure !== false;
  let row: MahasiswaLike | null;

  if (typeof mahasiswa === 'bigint' || typeof mahasiswa === 'number') {
    row = await db.mahasiswa.findUnique({
      where: { userId: BigInt(mahasiswa) },
      select: {
        userId: true,
        angkatan: true,
        kurikulumId: true,
        kurikulum: true,
      },
    });
  } else {
    row = mahasiswa;
  }

  if (!row) throw new CurriculumResolutionError('MAHASISWA_NOT_FOUND', 'Mahasiswa tidak ditemukan');

  if (row.kurikulumId) {
    if (row.kurikulum && !includeStructure) {
      if (options.requireActive && row.kurikulum.status && row.kurikulum.status !== 'aktif') {
        throw new CurriculumResolutionError('CURRICULUM_NOT_FOUND', 'Kurikulum mahasiswa tidak aktif');
      }
      return row.kurikulum;
    }
    const explicit = await db.kurikulum.findUnique({
      where: { id: row.kurikulumId },
      include: includeStructure ? kurikulumInclude : undefined,
    });
    if (!explicit) {
      throw new CurriculumResolutionError('CURRICULUM_NOT_FOUND', 'Kurikulum assignment mahasiswa tidak ditemukan');
    }
    if (options.requireActive && explicit.status !== 'aktif') {
      throw new CurriculumResolutionError('CURRICULUM_NOT_FOUND', 'Kurikulum mahasiswa tidak aktif');
    }
    return explicit;
  }

  if (row.angkatan == null) {
    throw new CurriculumResolutionError('ANGKATAN_REQUIRED', 'Angkatan mahasiswa wajib diisi untuk menentukan kurikulum');
  }

  const inferred = await db.kurikulum.findFirst({
    where: {
      status: 'aktif',
      angkatanMulai: { lte: row.angkatan },
    },
    orderBy: [{ angkatanMulai: 'desc' }, { id: 'desc' }],
    include: includeStructure ? kurikulumInclude : undefined,
  });

  if (!inferred) {
    throw new CurriculumResolutionError(
      'CURRICULUM_NOT_FOUND',
      `Tidak ada kurikulum aktif untuk angkatan ${row.angkatan}`,
    );
  }
  return inferred;
}

export async function resolveKurikulumMahasiswaMap(
  mahasiswaList: MahasiswaLike[],
  db: DbClient = prisma,
) {
  const map = new Map<string, any>();
  const missing = mahasiswaList.filter((m) => !m.kurikulumId);
  const explicitIds = [...new Set(mahasiswaList.map((m) => m.kurikulumId).filter(Boolean))] as number[];

  const [explicitRows, aktif] = await Promise.all([
    explicitIds.length
      ? db.kurikulum.findMany({
          where: { id: { in: explicitIds } },
          include: kurikulumInclude,
        })
      : Promise.resolve([]),
    missing.length
      ? db.kurikulum.findMany({
          where: { status: 'aktif', angkatanMulai: { not: null } },
          orderBy: [{ angkatanMulai: 'desc' }, { id: 'desc' }],
          include: kurikulumInclude,
        })
      : Promise.resolve([]),
  ]);

  const byId = new Map(explicitRows.map((k: any) => [k.id, k]));

  for (const m of mahasiswaList) {
    const key = String(m.userId);
    if (m.kurikulumId && byId.has(m.kurikulumId)) {
      map.set(key, byId.get(m.kurikulumId));
      continue;
    }
    if (m.angkatan == null) continue;
    const match = aktif.find((k: any) => k.angkatanMulai != null && k.angkatanMulai <= m.angkatan!);
    if (match) map.set(key, match);
  }
  return map;
}

export async function assignMahasiswaKurikulum(
  mahasiswaId: bigint,
  db: DbClient = prisma,
  options: { force?: boolean } = {},
) {
  const mahasiswa = await db.mahasiswa.findUnique({
    where: { userId: mahasiswaId },
    select: { userId: true, angkatan: true, kurikulumId: true },
  });
  if (!mahasiswa) throw new CurriculumResolutionError('MAHASISWA_NOT_FOUND', 'Mahasiswa tidak ditemukan');
  if (mahasiswa.kurikulumId && !options.force) {
    return resolveKurikulumMahasiswa(mahasiswa, db);
  }
  const kurikulum = await resolveKurikulumMahasiswa(
    { ...mahasiswa, kurikulumId: null },
    db,
    { includeStructure: false },
  );
  await db.mahasiswa.update({
    where: { userId: mahasiswaId },
    data: { kurikulumId: kurikulum.id },
  });
  return kurikulum;
}

export async function getKurikulumByFilter(
  kurikulumId?: number | null,
  db: DbClient = prisma,
) {
  if (kurikulumId) {
    return db.kurikulum.findUnique({
      where: { id: Number(kurikulumId) },
      include: kurikulumInclude,
    });
  }
  return null;
}

export function targetPoinKurikulum(kurikulum: { capaian?: Array<{ jumlahPoin: number }> } | null | undefined) {
  return kurikulum?.capaian?.reduce((sum, c) => sum + Number(c.jumlahPoin || 0), 0) ?? 0;
}

export function perolehanUntukKurikulum(perolehanPoin: any[], kurikulumId: number) {
  return (perolehanPoin || []).filter((p) => {
    if (p.kurikulumId != null) return Number(p.kurikulumId) === Number(kurikulumId);
    if (!p.detail?.length) return false;
    return p.detail.every(
      (d: any) => Number(d.subCapaian?.capaian?.kurikulumId) === Number(kurikulumId),
    );
  });
}

export async function filterKegiatanCapaianForKurikulum(
  kegiatanId: number,
  kurikulumId: number,
  db: DbClient = prisma,
) {
  const mappings = await db.kegiatanCapaian.findMany({
    where: {
      kegiatanId,
      subCapaian: { capaian: { kurikulumId } },
    },
    include: {
      subCapaian: { include: { capaian: true } },
    },
  });

  const total = mappings.reduce((sum: number, m: any) => sum + Number(m.alokasiPersen), 0);
  if (mappings.length === 0 || Math.abs(total - 100) > 0.01) {
    throw new CurriculumResolutionError(
      'CURRICULUM_MAPPING_INVALID',
      `Pemetaan kegiatan untuk kurikulum ${kurikulumId} harus tepat 100%`,
    );
  }
  return mappings;
}

export async function buildSettlementDetails(
  kegiatanId: number,
  kurikulumId: number,
  totalPoin: number,
  db: DbClient = prisma,
) {
  const mappings = await filterKegiatanCapaianForKurikulum(kegiatanId, kurikulumId, db);
  return bagiPoin(
    totalPoin,
    mappings.map((m: any) => ({ ref: m.subCapaianId as number, bobot: Number(m.alokasiPersen) })),
  ).map((b) => ({ subCapaianId: Number(b.ref), poin: b.poin }));
}

export async function resolveMatriksMahasiswa(
  mahasiswaId: bigint,
  dims: { kategoriId: number; skalaId: number; peranId: number },
  db: DbClient = prisma,
) {
  const kurikulum = await resolveKurikulumMahasiswa(mahasiswaId, db, {
    includeStructure: false,
    requireActive: true,
  });
  const matriks = await db.matriksPoin.findFirst({
    where: {
      kurikulumId: kurikulum.id,
      kategoriId: dims.kategoriId,
      skalaId: dims.skalaId,
      peranId: dims.peranId,
    },
  });
  return { kurikulum, matriks };
}

export async function assertKurikulumNotReferencedByMahasiswa(
  kurikulumId: number,
  db: DbClient = prisma,
) {
  const count = await db.mahasiswa.count({ where: { kurikulumId } });
  if (count > 0) {
    throw new CurriculumResolutionError(
      'CURRICULUM_STILL_IN_USE',
      `Kurikulum masih digunakan ${count} mahasiswa dan tidak dapat diarsipkan`,
    );
  }
}

export async function assertAlokasiCoversActiveKurikulum(
  alokasi: Array<{ subCapaianId: number; alokasiPersen: number }>,
  db: DbClient = prisma,
) {
  const aktif = await db.kurikulum.findMany({
    where: { status: 'aktif' },
    select: { id: true, nama: true },
    orderBy: { id: 'asc' },
  });
  if (aktif.length === 0) {
    throw new CurriculumResolutionError('CURRICULUM_NOT_FOUND', 'Belum ada kurikulum aktif');
  }

  const ids = alokasi.map((a) => a.subCapaianId);
  if (new Set(ids).size !== ids.length) {
    throw new CurriculumResolutionError('CURRICULUM_MAPPING_INVALID', 'Sub capaian duplikat dalam alokasi');
  }

  const subs = await db.subCapaian.findMany({
    where: { id: { in: ids } },
    include: { capaian: { select: { kurikulumId: true } } },
  });
  if (subs.length !== ids.length) {
    throw new CurriculumResolutionError('CURRICULUM_MAPPING_INVALID', 'Ada sub capaian yang tidak valid');
  }

  const byKurikulum = new Map<number, number>();
  for (const a of alokasi) {
    const sub = subs.find((s: any) => s.id === a.subCapaianId);
    const kurikulumId = sub.capaian.kurikulumId;
    byKurikulum.set(kurikulumId, (byKurikulum.get(kurikulumId) || 0) + Number(a.alokasiPersen));
  }

  for (const k of aktif) {
    const total = byKurikulum.get(k.id) || 0;
    if (Math.abs(total - 100) > 0.01) {
      throw new CurriculumResolutionError(
        'CURRICULUM_MAPPING_INVALID',
        `Total alokasi kurikulum "${k.nama}" harus 100% (saat ini ${total}%)`,
      );
    }
  }

  for (const kurikulumId of byKurikulum.keys()) {
    if (!aktif.some((k: any) => k.id === kurikulumId)) {
      throw new CurriculumResolutionError(
        'CURRICULUM_MAPPING_INVALID',
        `Alokasi memuat kurikulum ${kurikulumId} yang tidak aktif`,
      );
    }
  }

  return aktif;
}
