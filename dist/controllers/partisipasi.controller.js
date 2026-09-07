"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSaranPA = exports.createSaranPA = exports.putuskanIzinPA = exports.getIzinForDosen = exports.getMyPartisipasi = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const zod_1 = require("zod");
const auditLog_1 = require("../lib/auditLog");
// ==================== VALIDASI ====================
const daftarPartisipasiSchema = zod_1.z.object({
    kegiatanId: zod_1.z.number().int().positive(),
});
const izinDecisionSchema = zod_1.z.object({
    status: zod_1.z.enum(['disetujui', 'ditolak']),
    alasan: zod_1.z.string().optional(),
});
// ==================== PARTISIPASI ====================
// POST /api/partisipasi — Mahasiswa mendaftar kegiatan
// GET /api/partisipasi/saya?mahasiswaId=X — Daftar partisipasi mahasiswa
const getMyPartisipasi = async (req, res) => {
    try {
        const mahasiswaId = BigInt(req.query.mahasiswaId);
        const data = await prisma_1.default.partisipasi.findMany({
            where: { mahasiswaId },
            include: {
                kegiatan: {
                    include: {
                        kategori: true,
                        skala: true,
                        organisasi: { select: { nama: true } },
                    },
                },
                peranVerif: true,
                izinPA: { orderBy: { createdAt: 'desc' }, take: 1 },
                klaimPoin: { select: { id: true, status: true } },
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
exports.getMyPartisipasi = getMyPartisipasi;
// ==================== IZIN PA ====================
// POST /api/partisipasi/:id/minta-izin — Mahasiswa minta izin PA
// GET /api/izin-pa/dosen?dosenPaId=X — Daftar izin PA untuk dosen
const getIzinForDosen = async (req, res) => {
    try {
        const dosenPaId = BigInt(req.query.dosenPaId);
        const { status } = req.query;
        const where = { dosenPaId };
        if (status)
            where.status = status;
        const data = await prisma_1.default.izinPA.findMany({
            where,
            include: {
                partisipasi: {
                    include: {
                        kegiatan: { include: { kategori: true, skala: true } },
                        mahasiswa: {
                            include: { user: { select: { nama: true } } },
                        },
                    },
                },
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
exports.getIzinForDosen = getIzinForDosen;
// PUT /api/izin-pa/:id — Dosen PA putuskan izin (setujui/tolak) [BR-016, BR-019]
const putuskanIzinPA = async (req, res) => {
    try {
        const id = req.params.id;
        const dosenPaId = BigInt(req.user.id);
        const body = izinDecisionSchema.parse(req.body);
        const izin = await prisma_1.default.izinPA.findUnique({
            where: { id: BigInt(id) },
            include: {
                partisipasi: {
                    include: { mahasiswa: true },
                },
            },
        });
        if (!izin) {
            res.status(404).json({ success: false, message: 'Izin tidak ditemukan' });
            return;
        }
        if (izin.status !== 'diajukan') {
            res.status(400).json({ success: false, message: 'Izin sudah diproses' });
            return;
        }
        // Scope check: PA hanya atas bimbingannya [BR-016]
        if (izin.dosenPaId !== dosenPaId) {
            res.status(403).json({ success: false, message: 'Anda bukan Dosen PA mahasiswa ini [BR-016]' });
            return;
        }
        if (body.status === 'ditolak' && !body.alasan) {
            res.status(400).json({ success: false, message: 'Alasan penolakan wajib diisi' });
            return;
        }
        // Update izin
        const updatedIzin = await prisma_1.default.izinPA.update({
            where: { id: BigInt(id) },
            data: {
                status: body.status,
                alasan: body.alasan,
                decidedAt: new Date(),
            },
        });
        // Update status partisipasi
        const statusPartisipasi = body.status === 'disetujui' ? 'disetujui_pa' : 'ditolak_pa';
        await prisma_1.default.partisipasi.update({
            where: { id: izin.partisipasiId },
            data: { status: statusPartisipasi },
        });
        // Notifikasi ke mahasiswa
        const statusText = body.status === 'disetujui' ? 'disetujui ✅' : 'ditolak ❌';
        await prisma_1.default.notifikasi.create({
            data: {
                userId: izin.partisipasi.mahasiswaId,
                judul: `Izin Kegiatan ${statusText}`,
                isi: `Izin Anda untuk mengikuti kegiatan telah ${statusText} oleh Dosen PA.${body.alasan ? ` Alasan: ${body.alasan}` : ''}`,
                refType: 'izin_pa',
                refId: BigInt(id),
            },
        });
        await (0, auditLog_1.logAudit)({
            entitas: 'izin_pa',
            entitasId: BigInt(id),
            aksi: body.status === 'disetujui' ? 'setujui' : 'tolak',
            statusLama: 'diajukan',
            statusBaru: body.status,
            aktorId: dosenPaId,
        });
        res.json({ success: true, data: updatedIzin });
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
exports.putuskanIzinPA = putuskanIzinPA;
// ==================== SARAN PA ====================
// POST /api/saran-pa — Dosen PA memberikan saran
const createSaranPA = async (req, res) => {
    try {
        const dosenPaId = BigInt(req.user.id);
        const mahasiswaId = BigInt(req.body.mahasiswaId);
        const isi = req.body.isi;
        if (!isi || isi.length < 3) {
            res.status(400).json({ success: false, message: 'Isi saran minimal 3 karakter' });
            return;
        }
        // Verifikasi relasi bimbingan [BR-016]
        const mahasiswa = await prisma_1.default.mahasiswa.findUnique({ where: { userId: mahasiswaId } });
        if (!mahasiswa || mahasiswa.dosenPaId !== dosenPaId) {
            res.status(403).json({ success: false, message: 'Bukan mahasiswa bimbingan Anda' });
            return;
        }
        const saran = await prisma_1.default.saranPA.create({
            data: { dosenPaId, mahasiswaId, isi },
        });
        await prisma_1.default.notifikasi.create({
            data: {
                userId: mahasiswaId,
                judul: 'Saran dari Dosen PA',
                isi: `Dosen PA Anda memberikan saran baru.`,
                refType: 'saran_pa',
                refId: saran.id,
            },
        });
        res.status(201).json({ success: true, data: saran });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.createSaranPA = createSaranPA;
// GET /api/saran-pa?mahasiswaId=X — Daftar saran PA
const getSaranPA = async (req, res) => {
    try {
        const mahasiswaId = BigInt(req.query.mahasiswaId);
        const data = await prisma_1.default.saranPA.findMany({
            where: { mahasiswaId },
            include: {
                dosenPA: {
                    include: { user: { select: { nama: true } } },
                },
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
exports.getSaranPA = getSaranPA;
