"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPeran = exports.createSkala = exports.getSkala = exports.createPeran = exports.createKategori = exports.getKategori = exports.getMatriksHistori = exports.upsertMatriksPoin = exports.getMatriksPoin = void 0;
const prisma_1 = __importDefault(require("../../lib/prisma"));
const zod_1 = require("zod");
const auditLog_1 = require("../../lib/auditLog");
// ==================== VALIDASI ====================
const upsertMatriksSchema = zod_1.z.object({
    kurikulumId: zod_1.z.number().int().positive(),
    kategoriId: zod_1.z.number().int().positive(),
    skalaId: zod_1.z.number().int().positive(),
    peranId: zod_1.z.number().int().positive(),
    poin: zod_1.z.number().int().positive(),
});
// ==================== MATRIKS POIN CRUD ====================
// GET /api/matriks — Daftar matriks poin berdasarkan kurikulum
const getMatriksPoin = async (req, res) => {
    try {
        const { kurikulumId, kategoriId, skalaId } = req.query;
        const where = {};
        if (kurikulumId)
            where.kurikulumId = Number(kurikulumId);
        if (kategoriId)
            where.kategoriId = Number(kategoriId);
        if (skalaId)
            where.skalaId = Number(skalaId);
        const data = await prisma_1.default.matriksPoin.findMany({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.getMatriksPoin = getMatriksPoin;
// POST /api/matriks — Tambah/update entri matriks (upsert) [BR-031]
const upsertMatriksPoin = async (req, res) => {
    try {
        const aktorId = BigInt(req.user.id);
        const data = upsertMatriksSchema.parse(req.body);
        // Cek apakah sudah ada
        const existing = await prisma_1.default.matriksPoin.findUnique({
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
            // Update — catat histori dulu [BR-031]
            await prisma_1.default.matriksPoinHistori.create({
                data: {
                    matriksPoinId: existing.id,
                    poinLama: existing.poin,
                    poinBaru: data.poin,
                    diubahOleh: aktorId,
                },
            });
            const updated = await prisma_1.default.matriksPoin.update({
                where: { id: existing.id },
                data: { poin: data.poin },
            });
            await (0, auditLog_1.logAudit)({
                entitas: 'matriks_poin',
                entitasId: existing.id,
                aksi: 'update_poin',
                statusLama: String(existing.poin),
                statusBaru: String(data.poin),
                aktorId,
            });
            res.json({ success: true, data: updated, message: 'Poin diperbarui' });
        }
        else {
            // Buat baru
            const created = await prisma_1.default.matriksPoin.create({ data });
            await prisma_1.default.matriksPoinHistori.create({
                data: {
                    matriksPoinId: created.id,
                    poinLama: null,
                    poinBaru: data.poin,
                    diubahOleh: aktorId,
                },
            });
            await (0, auditLog_1.logAudit)({
                entitas: 'matriks_poin',
                entitasId: created.id,
                aksi: 'create',
                statusBaru: String(data.poin),
                aktorId,
            });
            res.status(201).json({ success: true, data: created });
        }
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
exports.upsertMatriksPoin = upsertMatriksPoin;
// GET /api/matriks/histori/:matriksPoinId — Histori perubahan nilai
const getMatriksHistori = async (req, res) => {
    try {
        const matriksPoinId = req.params.matriksPoinId;
        const data = await prisma_1.default.matriksPoinHistori.findMany({
            where: { matriksPoinId: BigInt(matriksPoinId) },
            include: { pengubah: { select: { id: true, nama: true } } },
            orderBy: { diubahPada: 'desc' },
        });
        res.json({ success: true, data });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.getMatriksHistori = getMatriksHistori;
// ==================== MASTER DATA LOOKUP ====================
// GET /api/matriks/kategori
const getKategori = async (req, res) => {
    try {
        const data = await prisma_1.default.mpKategori.findMany({ orderBy: { id: 'asc' } });
        res.json({ success: true, data });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.getKategori = getKategori;
// POST /api/matriks/kategori
const createKategori = async (req, res) => {
    try {
        const { nama, peran, skala } = req.body; // Peran dan Skala adalah array of string opsional
        if (!nama) {
            res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });
            return;
        }
        const data = await prisma_1.default.mpKategori.create({
            data: {
                nama,
                peran: peran && Array.isArray(peran) ? {
                    create: peran.map((p, idx) => ({
                        nama: p,
                        urutan: idx + 1
                    }))
                } : undefined,
                skala: skala && Array.isArray(skala) ? {
                    create: skala.map((s, idx) => ({
                        nama: s,
                        urutan: idx + 1
                    }))
                } : undefined
            },
            include: { peran: true, skala: true }
        });
        res.status(201).json({ success: true, data });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.createKategori = createKategori;
// POST /api/matriks/peran
const createPeran = async (req, res) => {
    try {
        const { kategoriId, nama, urutan } = req.body;
        if (!kategoriId || !nama) {
            res.status(400).json({ success: false, message: 'Kategori ID dan Nama Peran wajib diisi' });
            return;
        }
        const urutanToUse = urutan || 99; // Default urutan paling akhir jika tidak diisi
        const data = await prisma_1.default.mpPeran.create({
            data: {
                kategoriId: Number(kategoriId),
                nama,
                urutan: Number(urutanToUse)
            }
        });
        res.status(201).json({ success: true, data });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.createPeran = createPeran;
// GET /api/master/skala
const getSkala = async (req, res) => {
    try {
        const { kategoriId } = req.query;
        const where = {};
        if (kategoriId)
            where.kategoriId = Number(kategoriId);
        const data = await prisma_1.default.mpSkala.findMany({
            where,
            include: { kategori: true },
            orderBy: [{ kategoriId: 'asc' }, { urutan: 'asc' }]
        });
        res.json({ success: true, data });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.getSkala = getSkala;
// POST /api/matriks/skala
const createSkala = async (req, res) => {
    try {
        const { kategoriId, nama, urutan } = req.body;
        if (!kategoriId || !nama) {
            res.status(400).json({ success: false, message: 'Kategori ID dan Nama Skala wajib diisi' });
            return;
        }
        const urutanToUse = urutan || 99;
        const data = await prisma_1.default.mpSkala.create({
            data: {
                kategoriId: Number(kategoriId),
                nama,
                urutan: Number(urutanToUse)
            }
        });
        res.status(201).json({ success: true, data });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.createSkala = createSkala;
// GET /api/master/peran?kategoriId=1
const getPeran = async (req, res) => {
    try {
        const { kategoriId } = req.query;
        const where = {};
        if (kategoriId)
            where.kategoriId = Number(kategoriId);
        const data = await prisma_1.default.mpPeran.findMany({
            where,
            include: { kategori: true },
            orderBy: [{ kategoriId: 'asc' }, { urutan: 'asc' }],
        });
        res.json({ success: true, data });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.getPeran = getPeran;
