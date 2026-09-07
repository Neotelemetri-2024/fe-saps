"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardAdminDitmawa = void 0;
const prisma_1 = __importDefault(require("../../lib/prisma"));
// GET /api/admin/dashboard — Dashboard Admin Ditmawa
const dashboardAdminDitmawa = async (req, res) => {
    try {
        const [kegiatanPending, klaimPending, totalKegiatan, totalMahasiswa] = await Promise.all([
            prisma_1.default.kegiatan.count({ where: { status: 'diajukan' } }),
            prisma_1.default.klaimPoin.count({ where: { status: 'menunggu_validasi' } }),
            prisma_1.default.kegiatan.count(),
            prisma_1.default.mahasiswa.count(),
        ]);
        const kegiatanTerbaru = await prisma_1.default.kegiatan.findMany({
            include: { kategori: true, skala: true },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });
        res.json({
            success: true,
            data: {
                statistik: { kegiatanPending, klaimPending, totalKegiatan, totalMahasiswa },
                kegiatanTerbaru,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.dashboardAdminDitmawa = dashboardAdminDitmawa;
