"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurriculumResolutionError = void 0;
exports.resolveKurikulumForAngkatan = resolveKurikulumForAngkatan;
exports.resolveKurikulumIdForAngkatan = resolveKurikulumIdForAngkatan;
exports.resolveKurikulumMahasiswa = resolveKurikulumMahasiswa;
exports.resolveKurikulumMahasiswaMap = resolveKurikulumMahasiswaMap;
exports.assignMahasiswaKurikulum = assignMahasiswaKurikulum;
exports.getKurikulumByFilter = getKurikulumByFilter;
exports.targetPoinKurikulum = targetPoinKurikulum;
exports.perolehanUntukKurikulum = perolehanUntukKurikulum;
exports.filterKegiatanCapaianForKurikulum = filterKegiatanCapaianForKurikulum;
exports.buildSettlementDetails = buildSettlementDetails;
exports.resolveMatriksMahasiswa = resolveMatriksMahasiswa;
exports.assertKurikulumNotReferencedByMahasiswa = assertKurikulumNotReferencedByMahasiswa;
exports.assertAlokasiCoversActiveKurikulum = assertAlokasiCoversActiveKurikulum;
const distribusiPoin_1 = require("../lib/distribusiPoin");
const prisma_1 = __importDefault(require("../lib/prisma"));
class CurriculumResolutionError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'CurriculumResolutionError';
    }
}
exports.CurriculumResolutionError = CurriculumResolutionError;
const kurikulumInclude = {
    capaian: {
        include: { subCapaian: { orderBy: { id: 'asc' } } },
        orderBy: { urutan: 'asc' },
    },
};
async function resolveKurikulumForAngkatan(angkatan, db = prisma_1.default) {
    if (angkatan == null)
        return null;
    return db.kurikulum.findFirst({
        where: {
            status: 'aktif',
            angkatanMulai: { lte: angkatan },
        },
        orderBy: [{ angkatanMulai: 'desc' }, { id: 'desc' }],
    });
}
async function resolveKurikulumIdForAngkatan(angkatan, db = prisma_1.default) {
    return (await resolveKurikulumForAngkatan(angkatan, db))?.id ?? null;
}
/** Prefer explicit Mahasiswa.kurikulumId; otherwise latest active start year <= angkatan. */
async function resolveKurikulumMahasiswa(mahasiswa, db = prisma_1.default, options = {}) {
    const includeStructure = options.includeStructure !== false;
    let row;
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
    }
    else {
        row = mahasiswa;
    }
    if (!row)
        throw new CurriculumResolutionError('MAHASISWA_NOT_FOUND', 'Mahasiswa tidak ditemukan');
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
        throw new CurriculumResolutionError('CURRICULUM_NOT_FOUND', `Tidak ada kurikulum aktif untuk angkatan ${row.angkatan}`);
    }
    return inferred;
}
async function resolveKurikulumMahasiswaMap(mahasiswaList, db = prisma_1.default) {
    const map = new Map();
    const missing = mahasiswaList.filter((m) => !m.kurikulumId);
    const explicitIds = [...new Set(mahasiswaList.map((m) => m.kurikulumId).filter(Boolean))];
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
    const byId = new Map(explicitRows.map((k) => [k.id, k]));
    for (const m of mahasiswaList) {
        const key = String(m.userId);
        if (m.kurikulumId && byId.has(m.kurikulumId)) {
            map.set(key, byId.get(m.kurikulumId));
            continue;
        }
        if (m.angkatan == null)
            continue;
        const match = aktif.find((k) => k.angkatanMulai != null && k.angkatanMulai <= m.angkatan);
        if (match)
            map.set(key, match);
    }
    return map;
}
async function assignMahasiswaKurikulum(mahasiswaId, db = prisma_1.default, options = {}) {
    const mahasiswa = await db.mahasiswa.findUnique({
        where: { userId: mahasiswaId },
        select: { userId: true, angkatan: true, kurikulumId: true },
    });
    if (!mahasiswa)
        throw new CurriculumResolutionError('MAHASISWA_NOT_FOUND', 'Mahasiswa tidak ditemukan');
    if (mahasiswa.kurikulumId && !options.force) {
        return resolveKurikulumMahasiswa(mahasiswa, db);
    }
    const kurikulum = await resolveKurikulumMahasiswa({ ...mahasiswa, kurikulumId: null }, db, { includeStructure: false });
    await db.mahasiswa.update({
        where: { userId: mahasiswaId },
        data: { kurikulumId: kurikulum.id },
    });
    return kurikulum;
}
async function getKurikulumByFilter(kurikulumId, db = prisma_1.default) {
    if (kurikulumId) {
        return db.kurikulum.findUnique({
            where: { id: Number(kurikulumId) },
            include: kurikulumInclude,
        });
    }
    return null;
}
function targetPoinKurikulum(kurikulum) {
    return kurikulum?.capaian?.reduce((sum, c) => sum + Number(c.jumlahPoin || 0), 0) ?? 0;
}
function perolehanUntukKurikulum(perolehanPoin, kurikulumId) {
    return (perolehanPoin || []).filter((p) => {
        if (p.kurikulumId != null)
            return Number(p.kurikulumId) === Number(kurikulumId);
        if (!p.detail?.length)
            return false;
        return p.detail.every((d) => Number(d.subCapaian?.capaian?.kurikulumId) === Number(kurikulumId));
    });
}
async function filterKegiatanCapaianForKurikulum(kegiatanId, kurikulumId, db = prisma_1.default) {
    const mappings = await db.kegiatanCapaian.findMany({
        where: {
            kegiatanId,
            subCapaian: { capaian: { kurikulumId } },
        },
        include: {
            subCapaian: { include: { capaian: true } },
        },
    });
    const total = mappings.reduce((sum, m) => sum + Number(m.alokasiPersen), 0);
    if (mappings.length === 0 || Math.abs(total - 100) > 0.01) {
        throw new CurriculumResolutionError('CURRICULUM_MAPPING_INVALID', `Pemetaan kegiatan untuk kurikulum ${kurikulumId} harus tepat 100%`);
    }
    return mappings;
}
async function buildSettlementDetails(kegiatanId, kurikulumId, totalPoin, db = prisma_1.default) {
    const mappings = await filterKegiatanCapaianForKurikulum(kegiatanId, kurikulumId, db);
    return (0, distribusiPoin_1.bagiPoin)(totalPoin, mappings.map((m) => ({ ref: m.subCapaianId, bobot: Number(m.alokasiPersen) }))).map((b) => ({ subCapaianId: Number(b.ref), poin: b.poin }));
}
async function resolveMatriksMahasiswa(mahasiswaId, dims, db = prisma_1.default) {
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
async function assertKurikulumNotReferencedByMahasiswa(kurikulumId, db = prisma_1.default) {
    const count = await db.mahasiswa.count({ where: { kurikulumId } });
    if (count > 0) {
        throw new CurriculumResolutionError('CURRICULUM_STILL_IN_USE', `Kurikulum masih digunakan ${count} mahasiswa dan tidak dapat diarsipkan`);
    }
}
async function assertAlokasiCoversActiveKurikulum(alokasi, db = prisma_1.default) {
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
    const byKurikulum = new Map();
    for (const a of alokasi) {
        const sub = subs.find((s) => s.id === a.subCapaianId);
        const kurikulumId = sub.capaian.kurikulumId;
        byKurikulum.set(kurikulumId, (byKurikulum.get(kurikulumId) || 0) + Number(a.alokasiPersen));
    }
    for (const k of aktif) {
        const total = byKurikulum.get(k.id) || 0;
        if (Math.abs(total - 100) > 0.01) {
            throw new CurriculumResolutionError('CURRICULUM_MAPPING_INVALID', `Total alokasi kurikulum "${k.nama}" harus 100% (saat ini ${total}%)`);
        }
    }
    for (const kurikulumId of byKurikulum.keys()) {
        if (!aktif.some((k) => k.id === kurikulumId)) {
            throw new CurriculumResolutionError('CURRICULUM_MAPPING_INVALID', `Alokasi memuat kurikulum ${kurikulumId} yang tidak aktif`);
        }
    }
    return aktif;
}
