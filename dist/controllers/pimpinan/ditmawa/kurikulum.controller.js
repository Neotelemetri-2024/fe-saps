"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSubCapaian = exports.updateSubCapaian = exports.createSubCapaian = exports.deleteCapaian = exports.updateCapaian = exports.createCapaian = exports.deleteKurikulum = exports.nonAktifKurikulum = exports.aktivasiKurikulum = exports.createKurikulum = exports.getKurikulumById = exports.getKurikulumAktif = exports.getAllKurikulum = void 0;
const prisma_1 = __importDefault(require("../../../lib/prisma"));
const zod_1 = require("zod");
const auditLog_1 = require("../../../lib/auditLog");
// ==================== VALIDASI ====================
const createKurikulumSchema = zod_1.z.object({
    nama: zod_1.z.string().min(3),
    tahunAkademik: zod_1.z.string().regex(/^\d{4}\/\d{4}$/, 'Format: 2024/2025'),
    angkatanMulai: zod_1.z.number().int().min(1900).max(2200),
    versi: zod_1.z.number().int().positive().optional(),
});
const updateKurikulumSchema = createKurikulumSchema.partial().refine((data) => Object.keys(data).length > 0, 'Tidak ada data yang diperbarui');
async function assertAngkatanMulaiUnique(angkatanMulai, excludeId) {
    const duplicate = await prisma_1.default.kurikulum.findFirst({
        where: {
            angkatanMulai,
            ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
        select: { id: true },
    });
    if (duplicate)
        throw new Error('ANGKATAN_MULAI_DUPLICATE');
}
async function getReadinessProblem(kurikulumId) {
    const kurikulum = await prisma_1.default.kurikulum.findUnique({
        where: { id: kurikulumId },
        include: { capaian: { include: { subCapaian: true } }, matriksPoin: { take: 1 } },
    });
    if (!kurikulum?.angkatanMulai)
        return 'Angkatan mulai wajib diisi sebelum aktivasi';
    if (kurikulum.capaian.length === 0)
        return 'Kurikulum harus memiliki minimal satu capaian';
    const incomplete = kurikulum.capaian.find((c) => c.subCapaian.length === 0 || Math.abs(c.subCapaian.reduce((sum, s) => sum + Number(s.bobotPersen), 0) - 100) > 0.01);
    if (incomplete)
        return `Total bobot sub capaian "${incomplete.nama}" harus tepat 100%`;
    if (kurikulum.matriksPoin.length === 0)
        return 'Matriks poin kurikulum belum tersedia';
    return null;
}
const createCapaianSchema = zod_1.z.object({
    nama: zod_1.z.string().min(3),
    jumlahPoin: zod_1.z.number().int().positive(),
    urutan: zod_1.z.number().int().positive().optional(),
});
const createSubCapaianSchema = zod_1.z.object({
    nama: zod_1.z.string().min(3),
    bobotPersen: zod_1.z.number().int().min(1).max(100),
});
const updateCapaianSchema = zod_1.z.object({
    nama: zod_1.z.string().min(3).optional(),
    jumlahPoin: zod_1.z.number().int().positive().optional(),
    urutan: zod_1.z.number().int().positive().optional(),
});
const updateSubCapaianSchema = zod_1.z.object({
    nama: zod_1.z.string().min(3).optional(),
    bobotPersen: zod_1.z.number().int().min(1).max(100).optional(),
});
// ==================== KURIKULUM CRUD ====================
// GET /api/kurikulum — Daftar semua kurikulum
const getAllKurikulum = async (req, res) => {
    try {
        const { status } = req.query;
        const where = { deletedAt: null };
        if (status)
            where.status = status;
        const data = await prisma_1.default.kurikulum.findMany({
            where,
            include: {
                pembuat: { select: { id: true, nama: true } },
                _count: { select: { capaian: true, matriksPoin: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ success: true, data });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.getAllKurikulum = getAllKurikulum;
// GET /api/kurikulum/aktif — Kurikulum yang sedang aktif
const getKurikulumAktif = async (req, res) => {
    try {
        const data = await prisma_1.default.kurikulum.findMany({
            where: { status: 'aktif', deletedAt: null },
            include: {
                capaian: {
                    where: { deletedAt: null },
                    include: {
                        subCapaian: {
                            where: { deletedAt: null },
                        },
                    },
                    orderBy: { urutan: 'asc' },
                },
            },
            orderBy: { id: 'asc' },
        });
        if (!data || data.length === 0) {
            res.status(404).json({ success: false, message: 'Belum ada kurikulum aktif' });
            return;
        }
        res.json({ success: true, data });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.getKurikulumAktif = getKurikulumAktif;
// GET /api/kurikulum/:id — Detail kurikulum + capaian + sub_capaian
const getKurikulumById = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await prisma_1.default.kurikulum.findFirst({
            where: { id: Number(id), deletedAt: null },
            include: {
                pembuat: { select: { id: true, nama: true } },
                capaian: {
                    where: { deletedAt: null },
                    include: {
                        subCapaian: {
                            where: { deletedAt: null },
                            orderBy: { id: 'asc' },
                        },
                    },
                    orderBy: { urutan: 'asc' },
                },
            },
        });
        if (!data) {
            res.status(404).json({ success: false, message: 'Kurikulum tidak ditemukan' });
            return;
        }
        res.json({ success: true, data });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.getKurikulumById = getKurikulumById;
// POST /api/kurikulum â€” Buat kurikulum baru (draft)
const createKurikulum = async (req, res) => {
    try {
        const dibuatOleh = BigInt(req.user.id);
        const data = createKurikulumSchema.parse(req.body);
        await assertAngkatanMulaiUnique(data.angkatanMulai);
        const newKurikulum = await prisma_1.default.$transaction(async (tx) => {
            const created = await tx.kurikulum.create({
                data: {
                    nama: data.nama,
                    tahunAkademik: data.tahunAkademik,
                    angkatanMulai: data.angkatanMulai,
                    versi: data.versi ?? 1,
                    status: 'draft',
                    dibuatOleh,
                },
            });
            await tx.auditLog.create({ data: {
                    entitas: 'kurikulum', entitasId: BigInt(created.id), aksi: 'create',
                    statusBaru: 'draft', aktorId: dibuatOleh,
                } });
            return created;
        });
        res.status(201).json({ success: true, data: newKurikulum });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: 'Validasi gagal', errors: error.issues });
        }
        else {
            console.error(error);
            res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
        }
    }
};
exports.createKurikulum = createKurikulum;
// PUT /api/kurikulum/:id/aktivasi — Aktifkan kurikulum tanpa menonaktifkan yang lama
const aktivasiKurikulum = async (req, res) => {
    try {
        const { id } = req.params;
        const aktorId = BigInt(req.user.id);
        const kurikulum = await prisma_1.default.kurikulum.findFirst({ where: { id: Number(id), deletedAt: null } });
        if (!kurikulum) {
            res.status(404).json({ success: false, message: 'Kurikulum tidak ditemukan' });
            return;
        }
        if (kurikulum.status === 'aktif') {
            res.status(400).json({ success: false, message: 'Kurikulum sudah aktif' });
            return;
        }
        const readiness = await getReadinessProblem(Number(id));
        if (readiness) {
            res.status(400).json({ success: false, message: readiness });
            return;
        }
        if (kurikulum.angkatanMulai != null) {
            await assertAngkatanMulaiUnique(kurikulum.angkatanMulai, Number(id));
        }
        const updated = await prisma_1.default.$transaction(async (tx) => {
            const row = await tx.kurikulum.update({
                where: { id: Number(id) },
                data: { status: 'aktif', activatedAt: new Date() },
            });
            await tx.auditLog.create({
                data: {
                    entitas: 'kurikulum',
                    entitasId: BigInt(row.id),
                    aksi: 'aktivasi',
                    statusLama: kurikulum.status,
                    statusBaru: 'aktif',
                    aktorId,
                },
            });
            return row;
        });
        res.json({ success: true, data: updated, message: 'Kurikulum berhasil diaktifkan' });
    }
    catch (error) {
        if (error?.message === 'ANGKATAN_MULAI_DUPLICATE') {
            res.status(400).json({ success: false, message: 'Angkatan mulai sudah dipakai kurikulum lain' });
            return;
        }
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.aktivasiKurikulum = aktivasiKurikulum;
// PUT /api/kurikulum/:id/non-aktif — Non-aktifkan kurikulum
const nonAktifKurikulum = async (req, res) => {
    try {
        const { id } = req.params;
        const aktorId = BigInt(req.user.id);
        const kurikulum = await prisma_1.default.kurikulum.findFirst({ where: { id: Number(id), deletedAt: null } });
        if (!kurikulum) {
            res.status(404).json({ success: false, message: 'Kurikulum tidak ditemukan' });
            return;
        }
        if (kurikulum.status !== 'aktif') {
            res.status(400).json({ success: false, message: 'Hanya kurikulum aktif yang bisa dinonaktifkan' });
            return;
        }
        const masihDipakai = await prisma_1.default.mahasiswa.count({ where: { kurikulumId: Number(id) } });
        if (masihDipakai > 0) {
            res.status(400).json({
                success: false,
                message: `Kurikulum masih digunakan ${masihDipakai} mahasiswa dan tidak dapat diarsipkan`,
            });
            return;
        }
        const updated = await prisma_1.default.$transaction(async (tx) => {
            const row = await tx.kurikulum.update({
                where: { id: Number(id) },
                data: { status: 'arsip' },
            });
            await tx.auditLog.create({
                data: {
                    entitas: 'kurikulum',
                    entitasId: BigInt(row.id),
                    aksi: 'non_aktif',
                    statusLama: 'aktif',
                    statusBaru: 'arsip',
                    aktorId,
                },
            });
            return row;
        });
        res.json({ success: true, data: updated, message: 'Kurikulum berhasil dinonaktifkan' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.nonAktifKurikulum = nonAktifKurikulum;
// DELETE /api/kurikulum/:id — Hapus kurikulum (Soft Delete)
const deleteKurikulum = async (req, res) => {
    try {
        const { id } = req.params;
        const aktorId = BigInt(req.user.id);
        const kurikulum = await prisma_1.default.kurikulum.findFirst({ where: { id: Number(id), deletedAt: null } });
        if (!kurikulum) {
            res.status(404).json({ success: false, message: 'Kurikulum tidak ditemukan' });
            return;
        }
        if (kurikulum.status === 'aktif') {
            res.status(400).json({ success: false, message: 'Kurikulum aktif TIDAK BOLEH dihapus. Nonaktifkan terlebih dahulu.' });
            return;
        }
        // Soft delete kurikulum
        await prisma_1.default.kurikulum.update({
            where: { id: Number(id) },
            data: { deletedAt: new Date() },
        });
        await (0, auditLog_1.logAudit)({
            entitas: 'kurikulum',
            entitasId: BigInt(id),
            aksi: 'soft_delete',
            statusLama: kurikulum.status,
            aktorId,
        });
        res.json({ success: true, message: 'Kurikulum berhasil dihapus' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.deleteKurikulum = deleteKurikulum;
// ==================== CAPAIAN CRUD ====================
// POST /api/kurikulum/:kurikulumId/capaian
const createCapaian = async (req, res) => {
    try {
        const { kurikulumId } = req.params;
        const data = createCapaianSchema.parse(req.body);
        const kurikulum = await prisma_1.default.kurikulum.findUnique({ where: { id: Number(kurikulumId) } });
        if (!kurikulum) {
            res.status(404).json({ success: false, message: 'Kurikulum tidak ditemukan' });
            return;
        }
        const newCapaian = await prisma_1.default.capaian.create({
            data: {
                kurikulumId: Number(kurikulumId),
                nama: data.nama,
                jumlahPoin: data.jumlahPoin,
                urutan: data.urutan,
            },
        });
        res.status(201).json({ success: true, data: newCapaian });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: 'Validasi gagal', errors: error.issues });
        }
        else {
            console.error(error);
            res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
        }
    }
};
exports.createCapaian = createCapaian;
// PUT /api/capaian/:id
const updateCapaian = async (req, res) => {
    try {
        const { id } = req.params;
        const data = updateCapaianSchema.parse(req.body);
        const updated = await prisma_1.default.capaian.update({
            where: { id: Number(id) },
            data,
        });
        res.json({ success: true, data: updated, message: 'Capaian berhasil diperbarui' });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: 'Validasi gagal', errors: error.issues });
        }
        else {
            console.error(error);
            res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
        }
    }
};
exports.updateCapaian = updateCapaian;
// DELETE /api/capaian/:id (Soft Delete)
const deleteCapaian = async (req, res) => {
    try {
        const { id } = req.params;
        // Pastikan kurikulum parent bukan 'aktif'
        const capaian = await prisma_1.default.capaian.findFirst({
            where: { id: Number(id), deletedAt: null },
            include: { kurikulum: true }
        });
        if (!capaian) {
            res.status(404).json({ success: false, message: 'Capaian tidak ditemukan' });
            return;
        }
        if (capaian.kurikulum.status === 'aktif') {
            res.status(400).json({ success: false, message: 'Tidak dapat menghapus capaian pada kurikulum yang sedang aktif' });
            return;
        }
        await prisma_1.default.capaian.update({
            where: { id: Number(id) },
            data: { deletedAt: new Date() },
        });
        res.json({ success: true, message: 'Capaian berhasil dihapus' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.deleteCapaian = deleteCapaian;
// ==================== SUB CAPAIAN CRUD ====================
// POST /api/capaian/:capaianId/sub-capaian
const createSubCapaian = async (req, res) => {
    try {
        const { capaianId } = req.params;
        const data = createSubCapaianSchema.parse(req.body);
        const capaian = await prisma_1.default.capaian.findFirst({
            where: { id: Number(capaianId), deletedAt: null },
            include: { subCapaian: { where: { deletedAt: null } } },
        });
        if (!capaian) {
            res.status(404).json({ success: false, message: 'Capaian tidak ditemukan' });
            return;
        }
        // Validasi: total bobot + yang baru <= 100% [BR-002]
        const totalBobotExisting = capaian.subCapaian.reduce((sum, sc) => sum + Number(sc.bobotPersen), 0);
        if (totalBobotExisting + data.bobotPersen > 100) {
            res.status(400).json({
                success: false,
                message: `Total bobot melebihi 100%. Saat ini: ${totalBobotExisting}%, maks tambahan: ${100 - totalBobotExisting}%`,
            });
            return;
        }
        const newSubCapaian = await prisma_1.default.subCapaian.create({
            data: {
                capaianId: Number(capaianId),
                nama: data.nama,
                bobotPersen: data.bobotPersen,
            },
        });
        res.status(201).json({ success: true, data: newSubCapaian });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: 'Validasi gagal', errors: error.issues });
        }
        else {
            console.error(error);
            res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
        }
    }
};
exports.createSubCapaian = createSubCapaian;
// PUT /api/sub-capaian/:id
const updateSubCapaian = async (req, res) => {
    try {
        const { id } = req.params;
        const data = updateSubCapaianSchema.parse(req.body);
        const subCapaian = await prisma_1.default.subCapaian.findFirst({
            where: { id: Number(id), deletedAt: null },
            include: { capaian: { include: { subCapaian: { where: { deletedAt: null } } } } }
        });
        if (!subCapaian) {
            res.status(404).json({ success: false, message: 'Sub Capaian tidak ditemukan' });
            return;
        }
        if (data.bobotPersen) {
            const totalBobotLain = subCapaian.capaian.subCapaian
                .filter(sc => sc.id !== Number(id))
                .reduce((sum, sc) => sum + Number(sc.bobotPersen), 0);
            if (totalBobotLain + data.bobotPersen > 100) {
                res.status(400).json({
                    success: false,
                    message: `Total bobot melebihi 100%. Saat ini sub capaian lain berjumlah: ${totalBobotLain}%, maks untuk ini: ${100 - totalBobotLain}%`,
                });
                return;
            }
        }
        const updated = await prisma_1.default.subCapaian.update({
            where: { id: Number(id) },
            data,
        });
        res.json({ success: true, data: updated, message: 'Sub Capaian berhasil diperbarui' });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: 'Validasi gagal', errors: error.issues });
        }
        else {
            console.error(error);
            res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
        }
    }
};
exports.updateSubCapaian = updateSubCapaian;
// DELETE /api/sub-capaian/:id (Soft Delete)
const deleteSubCapaian = async (req, res) => {
    try {
        const { id } = req.params;
        const subCapaian = await prisma_1.default.subCapaian.findFirst({
            where: { id: Number(id), deletedAt: null },
            include: { capaian: { include: { kurikulum: true } } }
        });
        if (!subCapaian) {
            res.status(404).json({ success: false, message: 'Sub Capaian tidak ditemukan' });
            return;
        }
        if (subCapaian.capaian.kurikulum.status === 'aktif') {
            res.status(400).json({ success: false, message: 'Tidak dapat menghapus sub capaian pada kurikulum yang sedang aktif' });
            return;
        }
        await prisma_1.default.subCapaian.update({
            where: { id: Number(id) },
            data: { deletedAt: new Date() },
        });
        res.json({
            success: true,
            message: 'Sub Capaian berhasil dihapus. PERINGATAN: Total presentase bobot untuk Capaian ini telah berkurang. Harap sesuaikan presentase sub capaian lainnya atau buat yang baru agar totalnya tetap 100%.'
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.deleteSubCapaian = deleteSubCapaian;
