"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardUKM = void 0;
const prisma_1 = __importDefault(require("../../lib/prisma"));
// ==================== DASHBOARD UKM ====================
const getDashboardUKM = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        // Dapatkan organisasi di mana user ini menjadi operator
        const operator = await prisma_1.default.organisasiOperator.findFirst({
            where: { userId: BigInt(userId) },
            include: {
                organisasi: { select: { nama: true } }
            }
        });
        const userRole = req.user?.peran === 'staff' && req.user?.jabatan ? req.user.jabatan : req.user?.peran;
        const isStaffOrAdmin = ['pimpinan_ditmawa', 'pimpinan_utama', 'admin_ditmawa', 'admin_fakultas'].includes(userRole);
        let organisasiId;
        let namaOrganisasi;
        if (isStaffOrAdmin && !operator) {
            const targetOrgId = req.query.organisasiId ? Number(req.query.organisasiId) : undefined;
            const org = targetOrgId
                ? await prisma_1.default.organisasi.findUnique({ where: { id: targetOrgId } })
                : await prisma_1.default.organisasi.findFirst({ where: { deletedAt: null } });
            if (!org) {
                return res.status(404).json({ success: false, message: 'Data organisasi tidak ditemukan.' });
            }
            organisasiId = org.id;
            namaOrganisasi = org.nama;
        }
        else {
            if (!operator) {
                return res.status(403).json({ success: false, message: 'Anda bukan operator organisasi/UKM manapun.' });
            }
            organisasiId = operator.organisasiId;
            namaOrganisasi = operator.organisasi.nama;
        }
        const draftCount = await prisma_1.default.kegiatan.count({
            where: {
                organisasiId,
                status: 'draft'
            }
        });
        const pendingCount = await prisma_1.default.kegiatan.count({
            where: {
                organisasiId,
                status: { in: ['diajukan', 'terverifikasi', 'perlu_revisi'] }
            }
        });
        const disetujuiCount = await prisma_1.default.kegiatan.count({
            where: {
                organisasiId,
                status: { in: ['disetujui', 'terpublikasi'] }
            }
        });
        const ditolakCount = await prisma_1.default.kegiatan.count({
            where: {
                organisasiId,
                status: 'ditolak'
            }
        });
        const currentDate = new Date();
        const eventAktifCount = await prisma_1.default.kegiatan.count({
            where: {
                organisasiId,
                status: { in: ['disetujui', 'terpublikasi'] },
                tanggalSelesai: { gte: currentDate }
            }
        });
        // Riwayat Terbaru Pengajuan Kegiatan
        const riwayatTerbaru = await prisma_1.default.kegiatan.findMany({
            where: { organisasiId },
            include: {
                kategori: { select: { nama: true } },
                skala: { select: { nama: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });
        const tabelRiwayat = riwayatTerbaru.map((k, i) => {
            return {
                no: i + 1,
                id: k.id,
                nama: k.nama,
                namaKegiatan: k.nama,
                jenis: k.kategori?.nama || '-',
                jenisKegiatan: k.kategori?.nama || '-',
                skala: k.skala?.nama || '-',
                tanggalMulai: k.tanggalMulai,
                tanggalSelesai: k.tanggalSelesai,
                diajukanPada: k.createdAt,
                createdAt: k.createdAt,
                status: k.status,
            };
        });
        res.status(200).json({
            success: true,
            data: {
                organisasi: {
                    id: organisasiId,
                    nama: namaOrganisasi
                },
                statistik: {
                    draft: draftCount,
                    pending: pendingCount,
                    disetujui: disetujuiCount,
                    ditolak: ditolakCount,
                    eventAktif: eventAktifCount
                },
                riwayatPengajuan: tabelRiwayat,
                // alias supaya FE lama tetap bisa baca
                riwayatKegiatan: tabelRiwayat,
                kegiatan: tabelRiwayat,
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboardUKM = getDashboardUKM;
