"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardAdminDitmawa = void 0;
const prisma_1 = __importDefault(require("../../../lib/prisma"));
// GET /api/admin/dashboard â€” Dashboard Admin Ditmawa
const dashboardAdminDitmawa = async (req, res) => {
    try {
        const currentDate = new Date();
        const [disetujuiCount, pendingCount, ditolakCount, eventGlobalAktifCount] = await Promise.all([
            prisma_1.default.kegiatan.count({ where: { status: 'disetujui' } }),
            prisma_1.default.kegiatan.count({ where: { status: 'diajukan' } }),
            prisma_1.default.kegiatan.count({ where: { status: 'ditolak' } }),
            prisma_1.default.kegiatan.count({
                where: {
                    status: 'disetujui',
                    tanggalSelesai: { gte: currentDate },
                    skala: {
                        nama: {
                            in: ['Internasional', 'Nasional']
                        }
                    }
                }
            })
        ]);
        const riwayatTerbaru = await prisma_1.default.kegiatan.findMany({
            where: {
                status: { notIn: ['draft'] }
            },
            include: {
                kategori: { select: { nama: true } },
                skala: { select: { nama: true } },
                _count: {
                    select: { partisipasi: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });
        const tabelRiwayat = riwayatTerbaru.map((k) => {
            let statusStr = 'Pending';
            if (k.status === 'disetujui' || k.status === 'terpublikasi')
                statusStr = 'Aktif';
            else if (k.status === 'ditolak')
                statusStr = 'Ditolak';
            else if (k.status === 'perlu_revisi')
                statusStr = 'Revisi';
            else if (k.status === 'draft')
                statusStr = 'Draft';
            return {
                id: k.id,
                namaKegiatan: k.nama,
                kategori: k.kategori?.nama || '-',
                skala: k.skala?.nama || '-',
                tanggalMulai: k.tanggalMulai,
                tanggalSelesai: k.tanggalSelesai,
                diajukanPada: k.createdAt,
                peserta: k._count.partisipasi,
                poin: 50, // default fallback sesuai UI
                status: statusStr
            };
        });
        res.json({
            success: true,
            data: {
                statistik: {
                    disetujui: disetujuiCount,
                    pending: pendingCount,
                    ditolak: ditolakCount,
                    eventGlobalAktif: eventGlobalAktifCount
                },
                kegiatanTerbaru: tabelRiwayat,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.dashboardAdminDitmawa = dashboardAdminDitmawa;
