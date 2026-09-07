"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPortofolio = void 0;
const prisma_1 = __importDefault(require("../../lib/prisma"));
// GET /api/shared/portofolio/:mahasiswaId — Portofolio lengkap mahasiswa (diakses dosen & admin)
const getPortofolio = async (req, res) => {
    try {
        const mahasiswaId = BigInt(req.params.mahasiswaId);
        const mahasiswa = await prisma_1.default.mahasiswa.findUnique({
            where: { userId: mahasiswaId },
            include: {
                user: { select: { nama: true, email: true } },
                prodi: { include: { fakultas: true } },
            },
        });
        if (!mahasiswa) {
            res.status(404).json({ success: false, message: 'Mahasiswa tidak ditemukan' });
            return;
        }
        const perolehan = await prisma_1.default.perolehanPoin.findMany({
            where: { mahasiswaId, status: 'sah' },
            include: {
                kegiatan: { include: { kategori: true, skala: true } },
                detail: { include: { subCapaian: { include: { capaian: true } } } },
            },
            orderBy: { createdAt: 'desc' },
        });
        const totalPoin = perolehan.reduce((s, p) => s + p.totalPoin, 0);
        const capaianMap = new Map();
        for (const p of perolehan) {
            for (const d of p.detail) {
                const capId = d.subCapaian.capaianId;
                if (!capaianMap.has(capId)) {
                    capaianMap.set(capId, { nama: d.subCapaian.capaian.nama, target: d.subCapaian.capaian.jumlahPoin, diperoleh: 0 });
                }
                capaianMap.get(capId).diperoleh += d.poin;
            }
        }
        const riwayatPerKategori = {};
        for (const p of perolehan) {
            if (!p.kegiatan)
                continue;
            const kat = p.kegiatan.kategori?.nama || 'Lainnya';
            if (!riwayatPerKategori[kat])
                riwayatPerKategori[kat] = [];
            riwayatPerKategori[kat].push({
                kegiatan: p.kegiatan.nama,
                skala: p.kegiatan.skala?.nama || '-',
                totalPoin: p.totalPoin,
                tanggal: p.kegiatan.tanggalMulai,
            });
        }
        res.json({
            success: true,
            data: {
                generatedAt: new Date().toISOString(),
                mahasiswa: {
                    nim: mahasiswa.nim, nama: mahasiswa.user.nama, email: mahasiswa.user.email,
                    prodi: mahasiswa.prodi?.nama || '-', fakultas: mahasiswa.prodi?.fakultas?.nama || '-', angkatan: mahasiswa.angkatan,
                },
                ringkasan: { totalPoin, totalKegiatan: perolehan.length },
                capaianProgress: Array.from(capaianMap.entries()).map(([id, c]) => ({
                    capaianId: id, nama: c.nama, target: c.target, diperoleh: c.diperoleh,
                    persentase: Math.round((c.diperoleh / c.target) * 100),
                })),
                riwayatPerKategori,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.getPortofolio = getPortofolio;
