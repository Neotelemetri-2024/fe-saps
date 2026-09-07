"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReferensiBuatKegiatan = exports.ajukanUlangKegiatanUKM = exports.editKegiatanUKM = exports.createKegiatanUKM = exports.getDetailKegiatanDibuat = exports.getListKegiatanDibuat = void 0;
const prisma_1 = __importDefault(require("../../lib/prisma"));
const zod_1 = require("zod");
const auditLog_1 = require("../../lib/auditLog");
// ==================== VALIDASI ====================
const createKegiatanUKMSchema = zod_1.z.object({
    nama: zod_1.z.string().min(3, 'Nama kegiatan minimal 3 karakter'),
    kategoriId: zod_1.z.number().int().positive('Jenis kegiatan wajib dipilih'),
    skalaId: zod_1.z.number().int().positive('Skala kegiatan wajib dipilih'),
    deskripsi: zod_1.z.string().min(10, 'Deskripsi minimal 10 karakter').max(500),
    tanggalMulai: zod_1.z.string().refine(v => !isNaN(Date.parse(v)), 'Format tanggal tidak valid'),
    tanggalSelesai: zod_1.z.string().refine(v => !isNaN(Date.parse(v)), 'Format tanggal tidak valid'),
    lokasi: zod_1.z.string().min(3, 'Lokasi wajib diisi'),
    kuota: zod_1.z.number().int().positive().optional(),
    // Pemetaan Capaian Kurikulum (section 2 pada UI)
    alokasi: zod_1.z.array(zod_1.z.object({
        subCapaianId: zod_1.z.number().int().positive(),
        alokasiPersen: zod_1.z.number().min(0.01).max(100),
    })).min(1, 'Minimal 1 sub capaian harus dipilih'),
});
const editKegiatanUKMSchema = createKegiatanUKMSchema.partial();
// Helper: dapatkan info operator UKM yang login
async function getOperatorInfo(userId) {
    return prisma_1.default.organisasiOperator.findFirst({
        where: { userId },
        include: { organisasi: { include: { fakultas: { select: { id: true, nama: true } } } } }
    });
}
// ==================== LIST KEGIATAN UKM (dengan alasan) ====================
// GET /api/ukm/buat-kegiatan — Daftar kegiatan yang dibuat UKM ini + riwayat approval
const getListKegiatanDibuat = async (req, res, next) => {
    try {
        const userId = BigInt(req.user.id);
        const { search, skalaId, kategoriId, status, page = '1', limit = '10' } = req.query;
        const operator = await getOperatorInfo(userId);
        if (!operator) {
            return res.status(403).json({ success: false, message: 'Anda bukan operator UKM manapun.' });
        }
        const where = {
            organisasiId: operator.organisasiId,
        };
        if (search)
            where.nama = { contains: search };
        if (skalaId)
            where.skalaId = parseInt(skalaId);
        if (kategoriId)
            where.kategoriId = parseInt(kategoriId);
        if (status)
            where.status = status;
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(50, Math.max(1, Number(limit)));
        const skip = (pageNum - 1) * limitNum;
        const total = await prisma_1.default.kegiatan.count({ where });
        const kegiatan = await prisma_1.default.kegiatan.findMany({
            where,
            include: {
                kategori: { select: { nama: true } },
                skala: { select: { nama: true } },
                // Ambil riwayat approval untuk "Lihat Alasan" pada status ditolak/revisi
                kegiatanApproval: {
                    orderBy: { createdAt: 'desc' },
                    take: 1, // Ambil approval terakhir (paling relevan)
                    include: { aktor: { select: { nama: true } } },
                },
                _count: { select: { partisipasi: true } }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum
        });
        const tabel = kegiatan.map((k, i) => {
            const approvalTerakhir = k.kegiatanApproval[0];
            return {
                no: skip + i + 1,
                id: k.id,
                namaKegiatan: k.nama,
                jenis: k.kategori?.nama || '-',
                skala: k.skala?.nama || '-',
                tanggalMulai: k.tanggalMulai,
                tanggalSelesai: k.tanggalSelesai,
                status: k.status,
                // Data untuk modal "Lihat Alasan"
                alasan: (k.status === 'ditolak' || k.status === 'perlu_revisi') && approvalTerakhir
                    ? {
                        keputusan: approvalTerakhir.keputusan,
                        alasan: approvalTerakhir.alasan,
                        oleh: approvalTerakhir.aktor.nama,
                        tanggal: approvalTerakhir.createdAt,
                    }
                    : null,
                bisaDiajukanUlang: k.status === 'perlu_revisi',
                bisaDiedit: k.status === 'draft' || k.status === 'perlu_revisi',
            };
        });
        res.status(200).json({
            success: true,
            data: {
                organisasi: { id: operator.organisasiId, nama: operator.organisasi.nama },
                kegiatan: tabel,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum)
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getListKegiatanDibuat = getListKegiatanDibuat;
// ==================== DETAIL KEGIATAN (termasuk alasan lengkap) ====================
// GET /api/ukm/buat-kegiatan/:kegiatanId — Detail kegiatan + riwayat approval lengkap
const getDetailKegiatanDibuat = async (req, res, next) => {
    try {
        const userId = BigInt(req.user.id);
        const kegiatanId = parseInt(req.params.kegiatanId);
        const operator = await getOperatorInfo(userId);
        if (!operator) {
            return res.status(403).json({ success: false, message: 'Anda bukan operator UKM manapun.' });
        }
        const kegiatan = await prisma_1.default.kegiatan.findFirst({
            where: { id: kegiatanId, organisasiId: operator.organisasiId },
            include: {
                kategori: true,
                skala: true,
                kurikulum: { select: { id: true, nama: true } },
                kegiatanCapaian: {
                    include: {
                        subCapaian: {
                            include: {
                                capaian: { select: { id: true, nama: true } }
                            }
                        }
                    }
                },
                // Riwayat approval lengkap — untuk timeline "perjalanan" pengajuan
                kegiatanApproval: {
                    orderBy: { createdAt: 'desc' },
                    include: { aktor: { select: { nama: true } } }
                }
            }
        });
        if (!kegiatan) {
            return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan atau bukan milik UKM Anda.' });
        }
        // Ambil alasan terbaru (untuk ditampilkan di modal)
        const approvalTerakhir = kegiatan.kegiatanApproval[0];
        const alasanTerbaru = (kegiatan.status === 'ditolak' || kegiatan.status === 'perlu_revisi') && approvalTerakhir
            ? {
                keputusan: approvalTerakhir.keputusan,
                alasan: approvalTerakhir.alasan || '-',
                oleh: approvalTerakhir.aktor.nama,
                tanggal: approvalTerakhir.createdAt,
            }
            : null;
        res.status(200).json({
            success: true,
            data: {
                id: kegiatan.id,
                nama: kegiatan.nama,
                jenis: kegiatan.kategori?.nama,
                skala: kegiatan.skala?.nama,
                deskripsi: kegiatan.deskripsi,
                tanggalMulai: kegiatan.tanggalMulai,
                tanggalSelesai: kegiatan.tanggalSelesai,
                lokasi: kegiatan.lokasi,
                kuota: kegiatan.kuota,
                status: kegiatan.status,
                kurikulum: kegiatan.kurikulum,
                pemetaanCapaian: kegiatan.kegiatanCapaian.map(kc => ({
                    subCapaianId: kc.subCapaianId,
                    namaSubCapaian: kc.subCapaian.nama,
                    namaCapaian: kc.subCapaian.capaian.nama,
                    capaianId: kc.subCapaian.capaian.id,
                    alokasiPersen: Number(kc.alokasiPersen),
                })),
                alasanTerbaru,
                riwayatApproval: kegiatan.kegiatanApproval.map(a => ({
                    keputusan: a.keputusan,
                    alasan: a.alasan,
                    oleh: a.aktor.nama,
                    tanggal: a.createdAt
                })),
                bisaDiajukanUlang: kegiatan.status === 'perlu_revisi',
                bisaDiedit: kegiatan.status === 'draft' || kegiatan.status === 'perlu_revisi',
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDetailKegiatanDibuat = getDetailKegiatanDibuat;
// ==================== BUAT KEGIATAN ====================
// POST /api/ukm/buat-kegiatan — Buat kegiatan + pemetaan capaian, otomatis ajukan ke Admin
const createKegiatanUKM = async (req, res, next) => {
    try {
        const userId = BigInt(req.user.id);
        const body = createKegiatanUKMSchema.parse(req.body);
        const operator = await getOperatorInfo(userId);
        if (!operator) {
            return res.status(403).json({ success: false, message: 'Anda belum terdaftar sebagai operator UKM.' });
        }
        const org = operator.organisasi;
        // Validasi kurikulum aktif
        const kurikulumAktif = await prisma_1.default.kurikulum.findFirst({ where: { status: 'aktif' } });
        if (!kurikulumAktif) {
            return res.status(400).json({ success: false, message: 'Tidak ada kurikulum aktif. Kegiatan tidak bisa dibuat.' });
        }
        // Validasi total alokasi = 100%
        const totalAlokasi = body.alokasi.reduce((sum, a) => sum + a.alokasiPersen, 0);
        if (Math.abs(totalAlokasi - 100) > 0.01) {
            return res.status(400).json({
                success: false,
                message: `Total bobot persentase harus tepat 100%. Saat ini: ${totalAlokasi}%`,
            });
        }
        // Tentukan asal & jalur approval
        const isUKMF = org.tipe === 'UKMF' && !!org.fakultasId;
        const asal = isUKMF ? 'kurikuler_ukmf' : 'kurikuler_ukm';
        // Cari target notifikasi (Admin yang bertanggung jawab)
        let notifTargets = [];
        let pesanApprover = '';
        if (isUKMF) {
            const adminFakultas = await prisma_1.default.staff.findMany({
                where: { jabatan: 'admin_fakultas', fakultasId: org.fakultasId, user: { aktif: true } },
                select: { userId: true }
            });
            notifTargets = adminFakultas.map(a => a.userId);
            pesanApprover = 'Admin Fakultas';
        }
        else {
            const adminDitmawa = await prisma_1.default.staff.findMany({
                where: { jabatan: 'admin_ditmawa', user: { aktif: true } },
                select: { userId: true }
            });
            notifTargets = adminDitmawa.map(a => a.userId);
            pesanApprover = 'Admin Ditmawa';
        }
        // Buat kegiatan
        const kegiatan = await prisma_1.default.kegiatan.create({
            data: {
                nama: body.nama,
                kategoriId: body.kategoriId,
                skalaId: body.skalaId,
                asal: asal,
                deskripsi: body.deskripsi,
                tanggalMulai: new Date(body.tanggalMulai),
                tanggalSelesai: new Date(body.tanggalSelesai),
                lokasi: body.lokasi,
                kuota: body.kuota,
                organisasiId: org.id,
                kurikulumId: kurikulumAktif.id,
                dibuatOleh: userId,
                status: 'diajukan',
                kegiatanCapaian: {
                    create: body.alokasi.map(a => ({
                        subCapaianId: a.subCapaianId,
                        alokasiPersen: a.alokasiPersen,
                    }))
                }
            },
            include: { kategori: true, skala: true, kegiatanCapaian: true }
        });
        // Kirim notifikasi ke admin
        if (notifTargets.length > 0) {
            await prisma_1.default.notifikasi.createMany({
                data: notifTargets.map(uid => ({
                    userId: uid,
                    judul: `Pengajuan Kegiatan ${org.tipe} Baru 📋`,
                    isi: `Kegiatan "${kegiatan.nama}" dari ${org.nama} menunggu verifikasi Anda.`,
                    refType: 'kegiatan',
                    refId: BigInt(kegiatan.id),
                }))
            });
        }
        await (0, auditLog_1.logAudit)({
            entitas: 'kegiatan',
            entitasId: kegiatan.id,
            aksi: 'create_dan_ajukan',
            statusBaru: 'diajukan',
            aktorId: userId,
        });
        res.status(201).json({
            success: true,
            message: `Kegiatan berhasil dibuat dan diajukan ke ${pesanApprover}. Silakan tunggu verifikasi.`,
            data: { id: kegiatan.id, nama: kegiatan.nama, status: kegiatan.status }
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ success: false, message: 'Validasi gagal', errors: error.issues });
        }
        next(error);
    }
};
exports.createKegiatanUKM = createKegiatanUKM;
// ==================== EDIT KEGIATAN (setelah diminta revisi) ====================
// PUT /api/ukm/buat-kegiatan/:kegiatanId — Edit kegiatan (hanya saat draft atau perlu_revisi)
const editKegiatanUKM = async (req, res, next) => {
    try {
        const userId = BigInt(req.user.id);
        const kegiatanId = parseInt(req.params.kegiatanId);
        const body = editKegiatanUKMSchema.parse(req.body);
        const operator = await getOperatorInfo(userId);
        if (!operator) {
            return res.status(403).json({ success: false, message: 'Anda bukan operator UKM manapun.' });
        }
        const kegiatan = await prisma_1.default.kegiatan.findFirst({
            where: { id: kegiatanId, organisasiId: operator.organisasiId }
        });
        if (!kegiatan) {
            return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan.' });
        }
        if (!['draft', 'perlu_revisi'].includes(kegiatan.status)) {
            return res.status(400).json({
                success: false,
                message: `Kegiatan dengan status "${kegiatan.status}" tidak bisa diedit.`
            });
        }
        // Update dalam transaksi (update kegiatan + hapus & buat ulang alokasi capaian)
        await prisma_1.default.$transaction(async (tx) => {
            await tx.kegiatan.update({
                where: { id: kegiatanId },
                data: {
                    nama: body.nama,
                    kategoriId: body.kategoriId,
                    skalaId: body.skalaId,
                    deskripsi: body.deskripsi,
                    tanggalMulai: body.tanggalMulai ? new Date(body.tanggalMulai) : undefined,
                    tanggalSelesai: body.tanggalSelesai ? new Date(body.tanggalSelesai) : undefined,
                    lokasi: body.lokasi,
                    kuota: body.kuota,
                }
            });
            // Jika alokasi dikirim, update pemetaan capaian
            if (body.alokasi && body.alokasi.length > 0) {
                const totalAlokasi = body.alokasi.reduce((sum, a) => sum + a.alokasiPersen, 0);
                if (Math.abs(totalAlokasi - 100) > 0.01) {
                    throw new Error(`Total bobot persentase harus 100%. Saat ini: ${totalAlokasi}%`);
                }
                await tx.kegiatanCapaian.deleteMany({ where: { kegiatanId } });
                await tx.kegiatanCapaian.createMany({
                    data: body.alokasi.map(a => ({
                        kegiatanId,
                        subCapaianId: a.subCapaianId,
                        alokasiPersen: a.alokasiPersen,
                    }))
                });
            }
        });
        await (0, auditLog_1.logAudit)({
            entitas: 'kegiatan',
            entitasId: kegiatanId,
            aksi: 'edit_kegiatan',
            statusLama: kegiatan.status,
            statusBaru: kegiatan.status,
            aktorId: userId,
        });
        res.status(200).json({ success: true, message: 'Kegiatan berhasil diupdate.' });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ success: false, message: 'Validasi gagal', errors: error.issues });
        }
        if (error.message?.includes('Total bobot')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};
exports.editKegiatanUKM = editKegiatanUKM;
// ==================== AJUKAN ULANG (setelah revisi) ====================
// PUT /api/ukm/buat-kegiatan/:kegiatanId/ajukan — Ajukan ulang setelah edit
const ajukanUlangKegiatanUKM = async (req, res, next) => {
    try {
        const userId = BigInt(req.user.id);
        const kegiatanId = parseInt(req.params.kegiatanId);
        const operator = await getOperatorInfo(userId);
        if (!operator) {
            return res.status(403).json({ success: false, message: 'Anda bukan operator UKM manapun.' });
        }
        const kegiatan = await prisma_1.default.kegiatan.findFirst({
            where: { id: kegiatanId, organisasiId: operator.organisasiId },
            include: { organisasi: true }
        });
        if (!kegiatan) {
            return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan.' });
        }
        if (kegiatan.status !== 'perlu_revisi') {
            return res.status(400).json({
                success: false,
                message: 'Kegiatan hanya bisa diajukan ulang jika berstatus "perlu_revisi".'
            });
        }
        await prisma_1.default.kegiatan.update({
            where: { id: kegiatanId },
            data: { status: 'diajukan' }
        });
        // Notifikasi ke admin yang sesuai
        const isUKMF = kegiatan.organisasi?.tipe === 'UKMF' && !!kegiatan.organisasi.fakultasId;
        let notifTargets = [];
        if (isUKMF) {
            const admins = await prisma_1.default.staff.findMany({
                where: { jabatan: 'admin_fakultas', fakultasId: kegiatan.organisasi.fakultasId, user: { aktif: true } },
                select: { userId: true }
            });
            notifTargets = admins.map(a => a.userId);
        }
        else {
            const admins = await prisma_1.default.staff.findMany({
                where: { jabatan: 'admin_ditmawa', user: { aktif: true } },
                select: { userId: true }
            });
            notifTargets = admins.map(a => a.userId);
        }
        if (notifTargets.length > 0) {
            await prisma_1.default.notifikasi.createMany({
                data: notifTargets.map(uid => ({
                    userId: uid,
                    judul: 'Pengajuan Ulang Kegiatan 🔄',
                    isi: `Kegiatan "${kegiatan.nama}" telah diajukan ulang setelah revisi. Silakan verifikasi kembali.`,
                    refType: 'kegiatan',
                    refId: BigInt(kegiatan.id),
                }))
            });
        }
        await (0, auditLog_1.logAudit)({
            entitas: 'kegiatan',
            entitasId: kegiatanId,
            aksi: 'ajukan_ulang',
            statusLama: 'perlu_revisi',
            statusBaru: 'diajukan',
            aktorId: userId,
        });
        res.status(200).json({
            success: true,
            message: 'Kegiatan berhasil diajukan ulang. Admin akan segera memverifikasi.'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.ajukanUlangKegiatanUKM = ajukanUlangKegiatanUKM;
// ==================== DATA REFERENSI UNTUK FORM ====================
// GET /api/ukm/buat-kegiatan/referensi — Data dropdown untuk form buat kegiatan
// (Kategori, Skala, Capaian & Sub Capaian aktif)
const getReferensiBuatKegiatan = async (req, res, next) => {
    try {
        const [kategori, skala, kurikulumAktif] = await Promise.all([
            prisma_1.default.mpKategori.findMany({ orderBy: { nama: 'asc' } }),
            prisma_1.default.mpSkala.findMany({ orderBy: { nama: 'asc' } }),
            prisma_1.default.kurikulum.findFirst({
                where: { status: 'aktif' },
                include: {
                    capaian: {
                        orderBy: { nama: 'asc' },
                        include: {
                            subCapaian: { orderBy: { nama: 'asc' } }
                        }
                    }
                }
            })
        ]);
        if (!kurikulumAktif) {
            return res.status(400).json({
                success: false,
                message: 'Tidak ada kurikulum aktif. Kegiatan tidak bisa dibuat saat ini.'
            });
        }
        res.status(200).json({
            success: true,
            data: {
                kategori,
                skala,
                kurikulum: {
                    id: kurikulumAktif.id,
                    nama: kurikulumAktif.nama,
                    capaian: kurikulumAktif.capaian.map(c => ({
                        id: c.id,
                        nama: c.nama,
                        subCapaian: c.subCapaian.map(sc => ({
                            id: sc.id,
                            nama: sc.nama,
                        }))
                    }))
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getReferensiBuatKegiatan = getReferensiBuatKegiatan;
