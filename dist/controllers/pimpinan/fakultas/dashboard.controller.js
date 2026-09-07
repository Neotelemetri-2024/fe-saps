"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardPimpinanFakultas = exports.buildPimpinanDashboard = void 0;
const prisma_1 = __importDefault(require("../../../lib/prisma"));
// Helper untuk Pimpinan Fakultas / Pimpinan Utama
const buildPimpinanDashboard = async (fakultasId) => {
    const whereFakultas = fakultasId ? { fakultasId } : {};
    const whereMahasiswa = fakultasId ? { prodi: { fakultasId } } : {};
    const totalMahasiswa = await prisma_1.default.mahasiswa.count({ where: whereMahasiswa });
    const kurikulumAktif = await prisma_1.default.kurikulum.findFirst({
        where: { status: 'aktif' },
        include: { capaian: true }
    });
    const totalTargetPoinKurikulum = kurikulumAktif?.capaian.reduce((acc, c) => acc + c.jumlahPoin, 0) || 1;
    let kegiatanPending = 0;
    if (fakultasId) {
        kegiatanPending = await prisma_1.default.kegiatan.count({
            where: { status: 'terverifikasi', organisasi: { fakultasId } }
        });
    }
    else {
        kegiatanPending = await prisma_1.default.kegiatan.count({ where: { status: 'terverifikasi' } });
    }
    const kurikulumCount = await prisma_1.default.kurikulum.count({ where: { status: 'aktif' } });
    const prodiList = await prisma_1.default.programStudi.findMany({
        where: whereFakultas,
        include: {
            mahasiswa: {
                include: {
                    perolehanPoin: {
                        where: { status: 'sah' },
                        include: { kegiatan: { include: { kategori: true, skala: true } } }
                    }
                }
            }
        }
    });
    let totalKeseluruhanPoin = 0;
    let sumPersentaseMhs = 0;
    const skalaGlobalMap = {};
    const prodiStats = prodiList.map((prodi) => {
        let totalPoinProdi = 0;
        const kategoriMap = {};
        prodi.mahasiswa.forEach((mhs) => {
            let poinMhs = 0;
            mhs.perolehanPoin.forEach((pp) => {
                poinMhs += pp.totalPoin;
                totalPoinProdi += pp.totalPoin;
                const kategoriName = (pp.kegiatan?.kategori?.nama ?? 'lainnya').toLowerCase();
                if (!kategoriMap[kategoriName])
                    kategoriMap[kategoriName] = 0;
                kategoriMap[kategoriName] += pp.totalPoin;
                const skalaName = pp.kegiatan?.skala?.nama ?? 'Lainnya';
                if (!skalaGlobalMap[skalaName])
                    skalaGlobalMap[skalaName] = 0;
                skalaGlobalMap[skalaName] += pp.totalPoin;
            });
            sumPersentaseMhs += Math.min((poinMhs / totalTargetPoinKurikulum) * 100, 100);
        });
        totalKeseluruhanPoin += totalPoinProdi;
        const avgProdi = prodi.mahasiswa.length > 0
            ? Math.round(prodi.mahasiswa.reduce((sum, m) => sum + Math.min((m.perolehanPoin.reduce((s, p) => s + p.totalPoin, 0) / totalTargetPoinKurikulum) * 100, 100), 0)
                / prodi.mahasiswa.length)
            : 0;
        return { prodiId: prodi.id, nama: prodi.nama, totalPoinAbsolut: totalPoinProdi, rataRataCapaianPersen: avgProdi, kategoriPoin: kategoriMap, jumlahMahasiswa: prodi.mahasiswa.length };
    });
    prodiStats.sort((a, b) => b.rataRataCapaianPersen - a.rataRataCapaianPersen);
    const peringkatProdi = prodiStats.map((p, index) => ({
        ranking: index + 1,
        programStudi: p.nama,
        rataRataCapaian: p.rataRataCapaianPersen,
        totalPoin: p.totalPoinAbsolut,
        kategoriPoin: p.kategoriPoin
    }));
    const distribusiPoin = prodiStats.map((p) => ({
        programStudi: p.nama, totalPoin: p.totalPoinAbsolut,
        persentaseDariTotal: totalKeseluruhanPoin > 0 ? Math.round((p.totalPoinAbsolut / totalKeseluruhanPoin) * 100) : 0,
        jumlahMahasiswa: p.jumlahMahasiswa
    }));
    const poinBerdasarkanSkala = Object.entries(skalaGlobalMap).map(([nama, totalPoin]) => ({
        skala: nama,
        totalPoin,
        persentaseDariTotal: totalKeseluruhanPoin > 0 ? Math.round((totalPoin / totalKeseluruhanPoin) * 100) : 0
    }));
    const rataRataCapaianGlobal = totalMahasiswa > 0 ? Math.round(sumPersentaseMhs / totalMahasiswa) : 0;
    return {
        statistik: { totalMahasiswa, rataRataCapaian: rataRataCapaianGlobal, kegiatanPending, kurikulumAktif: kurikulumCount },
        peringkatProdi,
        distribusiPoin,
        poinBerdasarkanSkala
    };
};
exports.buildPimpinanDashboard = buildPimpinanDashboard;
// GET /api/pimpinan/dashboard — Pimpinan Fakultas (scope per fakultas)
const dashboardPimpinanFakultas = async (req, res) => {
    try {
        const userJabatan = req.user.jabatan;
        const isSuperAdmin = userJabatan === 'pimpinan_ditmawa' || userJabatan === 'pimpinan_utama';
        let targetFakultasId = null;
        if (isSuperAdmin) {
            if (req.query.fakultasId) {
                targetFakultasId = Number(req.query.fakultasId);
            }
            else {
                const firstFak = await prisma_1.default.fakultas.findFirst({ select: { id: true } });
                targetFakultasId = firstFak?.id || 1;
            }
        }
        else if (userJabatan === 'pimpinan_fakultas') {
            const staffData = await prisma_1.default.staff.findUnique({
                where: { userId: BigInt(req.user.id) },
                select: { fakultasId: true }
            });
            targetFakultasId = staffData?.fakultasId || null;
        }
        else {
            res.status(403).json({ success: false, message: 'Akses ditolak' });
            return;
        }
        if (!targetFakultasId) {
            res.status(400).json({ success: false, message: 'Fakultas tidak ditemukan untuk user ini' });
            return;
        }
        const data = await (0, exports.buildPimpinanDashboard)(targetFakultasId);
        res.json({ success: true, data });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.dashboardPimpinanFakultas = dashboardPimpinanFakultas;
