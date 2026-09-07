"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMahasiswaPerluPerhatian = exports.getDetailMahasiswa = exports.getDaftarMahasiswaBimbingan = exports.getDashboardDosen = void 0;
const prisma_1 = __importDefault(require("../../lib/prisma"));
const dashboard_controller_1 = require("../mahasiswa/dashboard.controller");
const kurikulumResolver_service_1 = require("../../services/kurikulumResolver.service");
// ==================== DASHBOARD DOSEN PA ====================
const getDashboardDosen = async (req, res, next) => {
    try {
        const dosenUserId = req.user?.id;
        if (!dosenUserId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        // Ambil dosen + semua mahasiswa bimbingan
        const dosen = await prisma_1.default.dosen.findUnique({
            where: { userId: BigInt(dosenUserId) },
            include: {
                user: { select: { nama: true } },
                fakultas: { select: { nama: true } }
            }
        });
        if (!dosen) {
            return res.status(404).json({ success: false, message: 'Profil dosen tidak ditemukan' });
        }
        // Total Mahasiswa Bimbingan
        const mahasiswaBimbingan = await prisma_1.default.mahasiswa.findMany({
            where: { dosenPaId: BigInt(dosenUserId) },
            include: {
                user: { select: { nama: true } },
                prodi: { select: { nama: true } },
                perolehanPoin: {
                    where: { status: 'sah' },
                    include: {
                        detail: {
                            include: { subCapaian: { include: { capaian: true } } }
                        }
                    }
                }
            }
        });
        const totalMahasiswa = mahasiswaBimbingan.length;
        // Pending Approval (izin PA yang masih diajukan)
        const pendingApproval = await prisma_1.default.izinPA.count({
            where: {
                dosenPaId: BigInt(dosenUserId),
                status: 'diajukan'
            }
        });
        // Permintaan persetujuan terbaru (3 terbaru)
        const permintaanTerbaru = await prisma_1.default.izinPA.findMany({
            where: {
                dosenPaId: BigInt(dosenUserId),
                status: 'diajukan'
            },
            include: {
                partisipasi: {
                    include: {
                        mahasiswa: { include: { user: { select: { nama: true } } } },
                        kegiatan: { select: { nama: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 3
        });
        const permintaanPersetujuan = permintaanTerbaru.map(izin => ({
            id: izin.id.toString(),
            namaMahasiswa: izin.partisipasi?.mahasiswa?.user?.nama || '-',
            namaKegiatan: izin.partisipasi?.kegiatan?.nama || '-',
            tanggal: izin.createdAt
        }));
        // Progres Capaian per mahasiswa berbasis kurikulum & identifikasi "perlu perhatian"
        const progresMahasiswa = [];
        let totalPoinSemua = 0;
        let perluPerhatianCount = 0;
        const kategoriPoinMap = {};
        for (const mhs of mahasiswaBimbingan) {
            let kurikulumMhs = null;
            try {
                kurikulumMhs = await (0, kurikulumResolver_service_1.resolveKurikulumMahasiswa)(mhs);
            }
            catch {
                kurikulumMhs = null;
            }
            const poinKurikulum = kurikulumMhs ? (0, kurikulumResolver_service_1.perolehanUntukKurikulum)(mhs.perolehanPoin, kurikulumMhs.id) : [];
            const prog = kurikulumMhs
                ? (0, dashboard_controller_1.hitungProgresKurikulumMahasiswa)(kurikulumMhs, poinKurikulum)
                : { totalPoin: 0, totalPoinProgres: 0, totalTarget: 0, persentaseTotal: 0, isLulus: false, statusKelulusan: 'Belum Memenuhi Syarat' };
            totalPoinSemua += prog.totalPoin;
            const persentase = prog.persentaseTotal;
            // Perlu perhatian: belum lulus dan capaian target < 50%
            const perluPerhatian = !prog.isLulus && persentase < 50;
            if (perluPerhatian)
                perluPerhatianCount++;
            progresMahasiswa.push({
                mahasiswaId: mhs.userId.toString(),
                nama: mhs.user.nama,
                nim: mhs.nim,
                prodi: mhs.prodi.nama,
                angkatan: mhs.angkatan,
                ipk: '-', // IPK tidak ada di schema, placeholder
                capaianPersen: persentase,
                totalPoin: prog.totalPoin, // Total riil
                totalPoinProgres: prog.totalPoinProgres, // Poin masuk progres (capped)
                totalTarget: prog.totalTarget,
                isLulus: prog.isLulus,
                statusKelulusan: prog.statusKelulusan,
                status: prog.isLulus ? 'lulus' : perluPerhatian ? 'perlu_perhatian' : 'on_track'
            });
        }
        // Rata-rata capaian per jenis kegiatan (bar chart)
        const klaimBimbingan = await prisma_1.default.klaimPoin.findMany({
            where: {
                status: 'disetujui',
                partisipasi: {
                    mahasiswa: { dosenPaId: BigInt(dosenUserId) }
                }
            },
            include: {
                perolehanPoin: { select: { totalPoin: true } },
                partisipasi: {
                    include: {
                        kegiatan: {
                            include: { kategori: { select: { nama: true } } }
                        }
                    }
                }
            }
        });
        for (const kl of klaimBimbingan) {
            const kategoriNama = kl.partisipasi?.kegiatan?.kategori?.nama || 'Lainnya';
            const poin = kl.perolehanPoin?.totalPoin || 0;
            kategoriPoinMap[kategoriNama] = (kategoriPoinMap[kategoriNama] || 0) + poin;
        }
        const chartKategori = Object.entries(kategoriPoinMap).map(([label, value]) => ({
            label,
            value
        }));
        res.status(200).json({
            success: true,
            data: {
                namaDosen: dosen.user.nama,
                fakultas: dosen.fakultas?.nama,
                totalMahasiswa,
                rataRataIpk: '-', // Tidak ada field IPK di schema
                pendingApproval,
                perluPerhatian: perluPerhatianCount,
                permintaanPersetujuan,
                chartKategori,
                progresMahasiswa
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboardDosen = getDashboardDosen;
// ==================== DAFTAR MAHASISWA BIMBINGAN ====================
const getDaftarMahasiswaBimbingan = async (req, res, next) => {
    try {
        const dosenUserId = req.user?.id;
        if (!dosenUserId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const search = req.query.search;
        const whereClause = { dosenPaId: BigInt(dosenUserId) };
        if (search) {
            whereClause.OR = [
                { user: { nama: { contains: search } } },
                { nim: { contains: search } }
            ];
        }
        const mahasiswaBimbingan = await prisma_1.default.mahasiswa.findMany({
            where: whereClause,
            include: {
                user: { select: { nama: true } },
                prodi: { select: { nama: true } },
                perolehanPoin: {
                    where: { status: 'sah' },
                    include: {
                        detail: {
                            include: { subCapaian: { include: { capaian: true } } }
                        }
                    }
                }
            }
        });
        const result = await Promise.all(mahasiswaBimbingan.map(async (mhs) => {
            let kurikulumMhs = null;
            try {
                kurikulumMhs = await (0, kurikulumResolver_service_1.resolveKurikulumMahasiswa)(mhs);
            }
            catch {
                kurikulumMhs = null;
            }
            const poinKurikulum = kurikulumMhs ? (0, kurikulumResolver_service_1.perolehanUntukKurikulum)(mhs.perolehanPoin, kurikulumMhs.id) : [];
            const prog = kurikulumMhs
                ? (0, dashboard_controller_1.hitungProgresKurikulumMahasiswa)(kurikulumMhs, poinKurikulum)
                : { totalPoin: 0, totalPoinProgres: 0, totalTarget: 0, persentaseTotal: 0, isLulus: false, statusKelulusan: 'Belum Memenuhi Syarat' };
            const persentase = prog.persentaseTotal;
            const perluPerhatian = !prog.isLulus && persentase < 50;
            return {
                mahasiswaId: mhs.userId.toString(),
                nama: mhs.user.nama,
                nim: mhs.nim,
                prodi: mhs.prodi.nama,
                angkatan: mhs.angkatan,
                ipk: '-', // IPK not in schema
                capaianPersen: persentase,
                totalPoin: prog.totalPoin, // Total riil
                totalPoinProgres: prog.totalPoinProgres, // Poin target kelulusan (capped)
                totalTarget: prog.totalTarget,
                isLulus: prog.isLulus,
                statusKelulusan: prog.statusKelulusan,
                status: prog.isLulus ? 'lulus' : perluPerhatian ? 'perlu_perhatian' : 'on_track'
            };
        }));
        res.status(200).json({
            success: true,
            data: result,
            total: result.length
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDaftarMahasiswaBimbingan = getDaftarMahasiswaBimbingan;
// ==================== DETAIL MAHASISWA BIMBINGAN ====================
const getDetailMahasiswa = async (req, res, next) => {
    try {
        const dosenUserId = req.user?.id;
        if (!dosenUserId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const mahasiswaId = BigInt(req.params.mahasiswaId);
        // Validasi: mahasiswa ini harus bimbingan dosen ini
        const mahasiswa = await prisma_1.default.mahasiswa.findUnique({
            where: { userId: mahasiswaId },
            include: {
                user: { select: { nama: true } },
                prodi: { select: { nama: true } }
            }
        });
        if (!mahasiswa || mahasiswa.dosenPaId !== BigInt(dosenUserId)) {
            return res.status(403).json({ success: false, message: 'Bukan mahasiswa bimbingan Anda' });
        }
        // Ambil kurikulum assignment mahasiswa
        let kurikulumAktif;
        try {
            kurikulumAktif = await (0, kurikulumResolver_service_1.resolveKurikulumMahasiswa)(mahasiswa);
        }
        catch {
            return res.status(400).json({ success: false, message: 'Kurikulum mahasiswa tidak dapat ditentukan' });
        }
        // Perolehan poin mahasiswa dengan detail sub capaian & capaian
        const perolehanPoin = await prisma_1.default.perolehanPoin.findMany({
            where: { mahasiswaId, status: 'sah' },
            include: {
                detail: {
                    include: {
                        subCapaian: { include: { capaian: true } }
                    }
                }
            }
        });
        const poinKurikulum = (0, kurikulumResolver_service_1.perolehanUntukKurikulum)(perolehanPoin, kurikulumAktif.id);
        const prog = (0, dashboard_controller_1.hitungProgresKurikulumMahasiswa)(kurikulumAktif, poinKurikulum);
        // Timeline Aktivitas (partisipasi + izin PA terbaru)
        const aktivitas = await prisma_1.default.partisipasi.findMany({
            where: { mahasiswaId },
            include: {
                kegiatan: {
                    include: {
                        kategori: { select: { nama: true } }
                    }
                },
                izinPA: { orderBy: { createdAt: 'desc' }, take: 1 },
                klaimPoin: {
                    select: { status: true },
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });
        const timeline = aktivitas.map(a => {
            let statusAktivitas = 'Pending';
            if (a.izinPA[0]?.status === 'disetujui')
                statusAktivitas = 'Disetujui Dosen PA';
            else if (a.izinPA[0]?.status === 'ditolak')
                statusAktivitas = 'Ditolak';
            if (a.klaimPoin?.status === 'disetujui')
                statusAktivitas = 'Disetujui Universitas';
            return {
                namaKegiatan: a.kegiatan.nama,
                jenisKegiatan: a.kegiatan.kategori?.nama,
                tanggal: a.kegiatan.tanggalMulai,
                status: statusAktivitas
            };
        });
        // Riwayat Saran/Catatan dari Dosen PA ini ke mahasiswa ini
        const riwayatCatatan = await prisma_1.default.saranPA.findMany({
            where: {
                dosenPaId: BigInt(dosenUserId),
                mahasiswaId
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({
            success: true,
            data: {
                profil: {
                    nama: mahasiswa.user.nama,
                    nim: mahasiswa.nim,
                    prodi: mahasiswa.prodi.nama,
                    angkatan: mahasiswa.angkatan,
                    ipk: '-'
                },
                kurikulumNama: prog.kurikulumNama,
                totalPoin: prog.totalPoin, // Total riil mahasiswa (termasuk kelebihan)
                totalPoinProgres: prog.totalPoinProgres, // Poin target kelulusan (capped)
                totalTarget: prog.totalTarget,
                persentaseTotal: prog.persentaseTotal,
                isLulus: prog.isLulus,
                statusKelulusan: prog.statusKelulusan,
                totalPoinPerCapaian: prog.progresTahunan.map((c) => ({
                    id: c.id,
                    nama: c.nama,
                    targetPoin: c.targetPoin,
                    poinTerkumpul: c.poinTerkumpul,
                    poinProgres: c.poinProgres,
                    poinLebih: c.poinLebih,
                    persentase: c.persentase,
                    status: c.status
                })),
                subCapaianData: prog.progresTahunan.map((c) => ({
                    capaianId: c.id,
                    capaianNama: c.nama,
                    subCapaian: (c.subCapaian || []).map((sc) => ({
                        id: sc.id,
                        nama: sc.nama,
                        bobotPersen: sc.bobotPersen,
                        targetPoin: sc.targetPoin,
                        poinTerkumpul: sc.poinTerkumpul,
                        poinProgres: sc.poinProgres,
                        poinLebih: sc.poinLebih,
                        isTuntas: sc.isTuntas
                    }))
                })),
                radarData: prog.radarData,
                timeline,
                riwayatCatatan: riwayatCatatan.map(s => ({
                    id: s.id.toString(),
                    isi: s.isi,
                    tanggal: s.createdAt
                }))
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDetailMahasiswa = getDetailMahasiswa;
// ==================== MAHASISWA PERLU PERHATIAN ====================
const getMahasiswaPerluPerhatian = async (req, res, next) => {
    try {
        const dosenUserId = req.user?.id;
        if (!dosenUserId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const allKurikulumAktif = await prisma_1.default.kurikulum.findMany({
            where: { status: 'aktif' },
            include: {
                capaian: {
                    orderBy: { urutan: 'asc' },
                    include: { subCapaian: true }
                }
            }
        });
        const mahasiswaBimbingan = await prisma_1.default.mahasiswa.findMany({
            where: { dosenPaId: BigInt(dosenUserId) },
            include: {
                user: { select: { nama: true } },
                prodi: { select: { nama: true } },
                perolehanPoin: {
                    where: { status: 'sah' },
                    include: {
                        detail: {
                            include: { subCapaian: { include: { capaian: true } } }
                        }
                    }
                }
            }
        });
        // Filter hanya mahasiswa yang belum lulus dan capaian target < 50%
        const result = [];
        for (const mhs of mahasiswaBimbingan) {
            let kurikulumMhs = null;
            try {
                kurikulumMhs = await (0, kurikulumResolver_service_1.resolveKurikulumMahasiswa)(mhs);
            }
            catch {
                kurikulumMhs = allKurikulumAktif[0] || null;
            }
            const poinKurikulum = kurikulumMhs ? (0, kurikulumResolver_service_1.perolehanUntukKurikulum)(mhs.perolehanPoin, kurikulumMhs.id) : [];
            const prog = kurikulumMhs
                ? (0, dashboard_controller_1.hitungProgresKurikulumMahasiswa)(kurikulumMhs, poinKurikulum)
                : { totalPoin: 0, totalPoinProgres: 0, totalTarget: 0, persentaseTotal: 0, isLulus: false, statusKelulusan: 'Belum Memenuhi Syarat' };
            result.push({
                mahasiswaId: mhs.userId.toString(),
                nama: mhs.user.nama,
                nim: mhs.nim,
                prodi: mhs.prodi.nama,
                angkatan: mhs.angkatan,
                ipk: '-',
                capaianPersen: prog.persentaseTotal,
                totalPoin: prog.totalPoin,
                totalPoinProgres: prog.totalPoinProgres,
                totalTarget: prog.totalTarget,
                isLulus: prog.isLulus,
                statusKelulusan: prog.statusKelulusan,
                status: 'perlu_perhatian'
            });
        }
        const filtered = result.filter((m) => !m.isLulus && m.capaianPersen < 50);
        res.status(200).json({
            success: true,
            data: filtered,
            total: filtered.length
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMahasiswaPerluPerhatian = getMahasiswaPerluPerhatian;
