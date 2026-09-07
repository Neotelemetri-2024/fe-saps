"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDetailFakultasPimpinanUtama = exports.getDashboardPimpinanUtama = void 0;
const prisma_1 = __importDefault(require("../../../lib/prisma"));
const dashboard_controller_1 = require("../fakultas/dashboard.controller");
// ==================== DASHBOARD PIMPINAN UTAMA ====================
// Pimpinan Utama: hanya bisa melihat laporan & statistik universitas (read-only)
// GET /api/pimpinan-utama/dashboard
const getDashboardPimpinanUtama = async (req, res) => {
    try {
        const totalMahasiswa = await prisma_1.default.mahasiswa.count();
        const totalFakultas = await prisma_1.default.fakultas.count();
        const kurikulumAktif = await prisma_1.default.kurikulum.count({ where: { status: 'aktif' } });
        const kurikulumDoc = await prisma_1.default.kurikulum.findFirst({
            where: { status: 'aktif' },
            include: { capaian: true }
        });
        const totalTargetPoinKurikulum = kurikulumDoc?.capaian.reduce((acc, c) => acc + c.jumlahPoin, 0) || 1;
        // Ambil semua fakultas beserta mahasiswanya dan perolehan poin sah
        const fakultasList = await prisma_1.default.fakultas.findMany({
            include: {
                programStudi: {
                    include: {
                        mahasiswa: {
                            include: {
                                perolehanPoin: {
                                    where: { status: 'sah' },
                                    include: { kegiatan: { include: { kategori: true } } }
                                }
                            }
                        }
                    }
                }
            }
        });
        let sumPersentaseMhsGlobal = 0;
        const fakultasStats = fakultasList.map(fakultas => {
            let totalPoinFakultas = 0;
            let mhsCountFakultas = 0;
            let sumPersentaseMhsFakultas = 0;
            const kategoriMap = {};
            fakultas.programStudi.forEach(prodi => {
                mhsCountFakultas += prodi.mahasiswa.length;
                prodi.mahasiswa.forEach(mhs => {
                    let poinMhs = 0;
                    mhs.perolehanPoin.forEach(pp => {
                        poinMhs += pp.totalPoin;
                        totalPoinFakultas += pp.totalPoin;
                        const kategoriName = pp.kegiatan?.kategori?.nama?.toLowerCase() || 'lainnya';
                        if (!kategoriMap[kategoriName])
                            kategoriMap[kategoriName] = 0;
                        kategoriMap[kategoriName] += pp.totalPoin;
                    });
                    const persentaseMhs = Math.min((poinMhs / totalTargetPoinKurikulum) * 100, 100);
                    sumPersentaseMhsFakultas += persentaseMhs;
                    sumPersentaseMhsGlobal += persentaseMhs;
                });
            });
            const avgFakultas = mhsCountFakultas > 0 ? Math.round(sumPersentaseMhsFakultas / mhsCountFakultas) : 0;
            return {
                fakultasId: fakultas.id,
                fakultas: fakultas.nama,
                rataRataCapaian: avgFakultas,
                totalPoin: totalPoinFakultas,
                kategoriPoin: kategoriMap
            };
        });
        // Urutkan berdasarkan persentase
        fakultasStats.sort((a, b) => b.rataRataCapaian - a.rataRataCapaian);
        const peringkatFakultas = fakultasStats.map((f, index) => ({
            ...f,
            ranking: index + 1
        }));
        const rataRataCapaianGlobal = totalMahasiswa > 0 ? Math.round(sumPersentaseMhsGlobal / totalMahasiswa) : 0;
        res.json({
            success: true,
            data: {
                statistik: {
                    totalMahasiswa,
                    rataRataCapaian: rataRataCapaianGlobal,
                    totalFakultas,
                    kurikulumAktif: kurikulumDoc ? kurikulumDoc.nama : '-'
                },
                peringkatFakultas
            }
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.getDashboardPimpinanUtama = getDashboardPimpinanUtama;
// GET /api/pimpinan-utama/fakultas/:id
const getDetailFakultasPimpinanUtama = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(Number(id))) {
            res.status(400).json({ success: false, message: 'ID Fakultas tidak valid' });
            return;
        }
        const data = await (0, dashboard_controller_1.buildPimpinanDashboard)(Number(id));
        res.json({ success: true, data });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.getDetailFakultasPimpinanUtama = getDetailFakultasPimpinanUtama;
