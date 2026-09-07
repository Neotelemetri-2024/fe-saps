"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hapusKegiatan = exports.publikasiKegiatan = exports.approvalKegiatan = exports.getKegiatanForApproval = exports.verifikasiKegiatan = exports.getKegiatanForVerifikasi = exports.ajukanKegiatan = exports.createKegiatan = exports.getKegiatanById = exports.getAllKegiatan = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const zod_1 = require("zod");
const auditLog_1 = require("../lib/auditLog");
// ==================== VALIDASI ====================
const createKegiatanSchema = zod_1.z.object({
    nama: zod_1.z.string().min(3),
    kategoriId: zod_1.z.number().int().positive(),
    skalaId: zod_1.z.number().int().positive(),
    asal: zod_1.z.enum(['kurikuler_ukm', 'kurikuler_ukmf', 'universitas', 'eksternal']),
    deskripsi: zod_1.z.string().optional(),
    tanggalMulai: zod_1.z.string().refine(v => !isNaN(Date.parse(v))),
    tanggalSelesai: zod_1.z.string().refine(v => !isNaN(Date.parse(v))),
    lokasi: zod_1.z.string().optional(),
    kuota: zod_1.z.number().int().positive().optional(),
    organisasiId: zod_1.z.number().int().positive().optional(),
    penyelenggaraExt: zod_1.z.string().optional(),
    // Alokasi capaian
    alokasi: zod_1.z.array(zod_1.z.object({
        subCapaianId: zod_1.z.number().int().positive(),
        alokasiPersen: zod_1.z.number().min(0.01).max(100),
    })).min(1),
});
const approvalSchema = zod_1.z.object({
    keputusan: zod_1.z.enum(['setuju', 'revisi', 'tolak']),
    alasan: zod_1.z.string().max(500, 'Alasan maksimal 500 karakter').optional(),
});
// ==================== KEGIATAN CRUD ====================
// GET /api/kegiatan — Daftar kegiatan (filter: status, asal, kategoriId)
const getAllKegiatan = async (req, res) => {
    try {
        const { status, asal, kategoriId, search } = req.query;
        const where = {};
        if (status)
            where.status = status;
        if (asal)
            where.asal = asal;
        if (kategoriId)
            where.kategoriId = Number(kategoriId);
        if (search) {
            where.OR = [
                { nama: { contains: search } },
                { lokasi: { contains: search } },
                { penyelenggaraExt: { contains: search } },
            ];
        }
        const data = await prisma_1.default.kegiatan.findMany({
            where,
            include: {
                kategori: true,
                skala: true,
                organisasi: { select: { id: true, nama: true, tipe: true } },
                kurikulum: { select: { id: true, nama: true } },
                pembuat: { select: { id: true, nama: true } },
                _count: { select: { partisipasi: true, kegiatanCapaian: true } },
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
exports.getAllKegiatan = getAllKegiatan;
// GET /api/kegiatan/:id — Detail kegiatan + alokasi + approval history
const getKegiatanById = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await prisma_1.default.kegiatan.findUnique({
            where: { id: Number(id) },
            include: {
                kategori: true,
                skala: true,
                organisasi: true,
                kurikulum: { select: { id: true, nama: true, status: true } },
                pembuat: { select: { id: true, nama: true } },
                kegiatanCapaian: {
                    include: { subCapaian: { include: { capaian: true } } },
                },
                kegiatanApproval: {
                    include: { aktor: { select: { id: true, nama: true } } },
                    orderBy: { createdAt: 'desc' },
                },
                _count: { select: { partisipasi: true } },
            },
        });
        if (!data) {
            res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan' });
            return;
        }
        res.json({ success: true, data });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.getKegiatanById = getKegiatanById;
// POST /api/kegiatan — Buat kegiatan baru
// Alur approval berbeda tergantung pembuat:
//   Admin Ditmawa   → langsung disetujui (tidak perlu izin)
//   Operator UKM    → diajukan → Admin Ditmawa → Pimpinan Ditmawa
//   Operator UKMF   → diajukan → Admin Fakultas → Pimpinan Fakultas
const createKegiatan = async (req, res) => {
    try {
        const dibuatOleh = BigInt(req.user.id);
        const userPeran = req.user.peran;
        const userJabatan = req.user.jabatan;
        const body = createKegiatanSchema.parse(req.body);
        // Validasi kurikulum aktif [BR-001]
        const kurikulumAktif = await prisma_1.default.kurikulum.findFirst({ where: { status: 'aktif' } });
        if (!kurikulumAktif) {
            res.status(400).json({ success: false, message: 'Tidak ada kurikulum aktif. Kegiatan tidak bisa dibuat.' });
            return;
        }
        // Validasi total alokasi = 100% [BR-032]
        const totalAlokasi = body.alokasi.reduce((sum, a) => sum + a.alokasiPersen, 0);
        if (Math.abs(totalAlokasi - 100) > 0.01) {
            res.status(400).json({
                success: false,
                message: `Total alokasi harus tepat 100%. Saat ini: ${totalAlokasi}%`,
            });
            return;
        }
        // ======== Tentukan status awal & jalur approval berdasarkan pembuat ========
        let statusAwal;
        let pesanResponse;
        let notifTargets = [];
        let notifJudul = '';
        let notifIsi = '';
        const effectiveRole = userPeran === 'staff' && userJabatan ? userJabatan : userPeran;
        if (effectiveRole === 'admin_ditmawa' || effectiveRole === 'admin_fakultas') {
            // ── Admin Ditmawa / Admin Fakultas: langsung disetujui, tidak perlu verifikasi ──
            statusAwal = 'disetujui';
            pesanResponse = 'Kegiatan berhasil dibuat dan langsung disetujui.';
        }
        else if (effectiveRole === 'operator_org') {
            // Cek organisasi operator → UKM atau UKMF?
            const operatorData = await prisma_1.default.organisasiOperator.findUnique({
                where: { userId: dibuatOleh },
                include: { organisasi: true },
            });
            if (!operatorData) {
                res.status(400).json({ success: false, message: 'Anda belum terdaftar sebagai operator organisasi.' });
                return;
            }
            const org = operatorData.organisasi;
            if (org.tipe === 'UKMF' && org.fakultasId) {
                // ── UKMF: ajukan ke Admin Fakultas ──
                statusAwal = 'diajukan';
                pesanResponse = 'Kegiatan berhasil dibuat dan diajukan ke Admin Fakultas.';
                // Cari Admin Fakultas yang sesuai
                const adminFakultas = await prisma_1.default.staff.findMany({
                    where: {
                        jabatan: 'admin_fakultas',
                        fakultasId: org.fakultasId,
                        user: { aktif: true },
                    },
                    select: { userId: true },
                });
                notifTargets = adminFakultas.map(a => ({ userId: a.userId }));
                notifJudul = 'Pengajuan Kegiatan UKMF Baru 📋';
                notifIsi = `Kegiatan "%NAMA%" dari ${org.nama} telah diajukan dan menunggu verifikasi Anda.`;
            }
            else {
                // ── UKM: ajukan ke Admin Ditmawa ──
                statusAwal = 'diajukan';
                pesanResponse = 'Kegiatan berhasil dibuat dan diajukan ke Admin Ditmawa.';
                // Cari semua Admin Ditmawa (staff tanpa fakultasId)
                const adminDitmawa = await prisma_1.default.staff.findMany({
                    where: {
                        jabatan: 'admin_ditmawa',
                        user: { aktif: true },
                    },
                    select: { userId: true },
                });
                notifTargets = adminDitmawa.map(a => ({ userId: a.userId }));
                notifJudul = 'Pengajuan Kegiatan UKM Baru 📋';
                notifIsi = `Kegiatan "%NAMA%" dari ${org.nama} telah diajukan dan menunggu verifikasi Anda.`;
            }
        }
        else {
            res.status(403).json({ success: false, message: 'Role Anda tidak diizinkan membuat kegiatan.' });
            return;
        }
        // ======== Buat kegiatan + alokasi capaian ========
        const kegiatan = await prisma_1.default.kegiatan.create({
            data: {
                nama: body.nama,
                kategoriId: body.kategoriId,
                skalaId: body.skalaId,
                asal: body.asal,
                deskripsi: body.deskripsi,
                tanggalMulai: new Date(body.tanggalMulai),
                tanggalSelesai: new Date(body.tanggalSelesai),
                lokasi: body.lokasi,
                kuota: body.kuota,
                organisasiId: body.organisasiId,
                penyelenggaraExt: body.penyelenggaraExt,
                kurikulumId: kurikulumAktif.id,
                dibuatOleh,
                status: statusAwal,
                kegiatanCapaian: {
                    create: body.alokasi.map(a => ({
                        subCapaianId: a.subCapaianId,
                        alokasiPersen: a.alokasiPersen,
                    })),
                },
            },
            include: { kegiatanCapaian: true },
        });
        // ======== Kirim notifikasi ke approver yang tepat ========
        if (notifTargets.length > 0) {
            const isiFormatted = notifIsi.replace('%NAMA%', kegiatan.nama);
            await prisma_1.default.notifikasi.createMany({
                data: notifTargets.map(target => ({
                    userId: target.userId,
                    judul: notifJudul,
                    isi: isiFormatted,
                    refType: 'kegiatan',
                    refId: BigInt(kegiatan.id),
                })),
            });
        }
        await (0, auditLog_1.logAudit)({
            entitas: 'kegiatan',
            entitasId: kegiatan.id,
            aksi: statusAwal === 'disetujui' ? 'create_langsung_setuju' : 'create_dan_ajukan',
            statusBaru: statusAwal,
            aktorId: dibuatOleh,
        });
        res.status(201).json({
            success: true,
            message: pesanResponse,
            data: kegiatan,
        });
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
exports.createKegiatan = createKegiatan;
// PUT /api/kegiatan/:id/ajukan — Ajukan ulang kegiatan setelah revisi
const ajukanKegiatan = async (req, res) => {
    try {
        const { id } = req.params;
        const aktorId = BigInt(req.user.id);
        const kegiatan = await prisma_1.default.kegiatan.findUnique({
            where: { id: Number(id) },
            include: { organisasi: true },
        });
        if (!kegiatan) {
            res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan' });
            return;
        }
        if (kegiatan.status !== 'perlu_revisi') {
            res.status(400).json({ success: false, message: 'Kegiatan hanya bisa diajukan ulang dari status perlu_revisi' });
            return;
        }
        const updated = await prisma_1.default.kegiatan.update({
            where: { id: Number(id) },
            data: { status: 'diajukan' },
        });
        // Kirim notifikasi ke approver yang tepat berdasarkan organisasi
        let notifTargets = [];
        let notifLabel = 'Admin';
        if (kegiatan.organisasi?.tipe === 'UKMF' && kegiatan.organisasi.fakultasId) {
            // UKMF → kirim ke Admin Fakultas
            const adminFakultas = await prisma_1.default.staff.findMany({
                where: { jabatan: 'admin_fakultas', fakultasId: kegiatan.organisasi.fakultasId, user: { aktif: true } },
                select: { userId: true },
            });
            notifTargets = adminFakultas.map(a => ({ userId: a.userId }));
            notifLabel = 'Admin Fakultas';
        }
        else {
            // UKM → kirim ke Admin Ditmawa
            const adminDitmawa = await prisma_1.default.staff.findMany({
                where: { jabatan: 'admin_ditmawa', user: { aktif: true } },
                select: { userId: true },
            });
            notifTargets = adminDitmawa.map(a => ({ userId: a.userId }));
            notifLabel = 'Admin Ditmawa';
        }
        if (notifTargets.length > 0) {
            await prisma_1.default.notifikasi.createMany({
                data: notifTargets.map(t => ({
                    userId: t.userId,
                    judul: 'Pengajuan Ulang Kegiatan 🔄',
                    isi: `Kegiatan "${kegiatan.nama}" telah diajukan ulang setelah revisi. Silakan verifikasi kembali.`,
                    refType: 'kegiatan',
                    refId: BigInt(kegiatan.id),
                })),
            });
        }
        await (0, auditLog_1.logAudit)({
            entitas: 'kegiatan',
            entitasId: updated.id,
            aksi: 'ajukan_ulang',
            statusLama: 'perlu_revisi',
            statusBaru: 'diajukan',
            aktorId,
        });
        res.json({ success: true, message: `Kegiatan berhasil diajukan ulang ke ${notifLabel}.`, data: updated });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.ajukanKegiatan = ajukanKegiatan;
// ==================== VERIFIKASI & APPROVAL [BR-009] ====================
// GET /api/kegiatan/verifikasi — Kegiatan untuk verifikasi Admin (Ditmawa atau Fakultas)
// Admin Ditmawa → melihat kegiatan UKM (tingkat universitas)
// Admin Fakultas → melihat kegiatan UKMF dari fakultasnya
const getKegiatanForVerifikasi = async (req, res) => {
    try {
        const { search, kategoriId, skalaId, status, tahun, page = '1', limit = '10' } = req.query;
        const userJabatan = req.user.jabatan;
        const where = {};
        // Filter status: default hanya yang diajukan, bisa tampilkan semua
        if (status && status !== 'semua') {
            where.status = status;
        }
        else {
            where.status = { in: ['diajukan', 'terverifikasi', 'perlu_revisi', 'ditolak'] };
        }
        // ── Filter berdasarkan jabatan Admin ──
        if (userJabatan === 'admin_fakultas') {
            // Admin Fakultas: hanya kegiatan UKMF dari fakultas yang sama
            const staffData = await prisma_1.default.staff.findUnique({
                where: { userId: BigInt(req.user.id) },
            });
            if (staffData?.fakultasId) {
                where.organisasi = { fakultasId: staffData.fakultasId };
                where.asal = 'kurikuler_ukmf';
            }
        }
        else {
            // Admin Ditmawa: hanya kegiatan UKM (tingkat universitas) + universitas
            where.asal = { in: ['kurikuler_ukm', 'universitas'] };
        }
        if (kategoriId)
            where.kategoriId = Number(kategoriId);
        if (skalaId)
            where.skalaId = Number(skalaId);
        if (tahun) {
            const year = Number(tahun);
            where.tanggalMulai = {
                gte: new Date(`${year}-01-01`),
                lt: new Date(`${year + 1}-01-01`),
            };
        }
        if (search) {
            where.OR = [
                { nama: { contains: search } },
                { organisasi: { nama: { contains: search } } },
                { penyelenggaraExt: { contains: search } },
            ];
        }
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(50, Math.max(1, Number(limit)));
        const skip = (pageNum - 1) * limitNum;
        const total = await prisma_1.default.kegiatan.count({ where });
        const data = await prisma_1.default.kegiatan.findMany({
            where,
            include: {
                kategori: true,
                skala: true,
                organisasi: { select: { id: true, nama: true, tipe: true, fakultasId: true } },
                pembuat: { select: { id: true, nama: true } },
                kegiatanCapaian: {
                    include: { subCapaian: { include: { capaian: true } } },
                },
                kegiatanApproval: {
                    include: { aktor: { select: { id: true, nama: true } } },
                    orderBy: { createdAt: 'desc' },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum,
        });
        res.json({
            success: true,
            data,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.getKegiatanForVerifikasi = getKegiatanForVerifikasi;
// PUT /api/kegiatan/:id/verifikasi — Admin verifikasi (setuju/revisi/tolak)
// Setelah disetujui → notifikasi ke Pimpinan yang tepat (Ditmawa atau Fakultas)
const verifikasiKegiatan = async (req, res) => {
    try {
        const { id } = req.params;
        const aktorId = BigInt(req.user.id);
        const body = approvalSchema.parse(req.body);
        const kegiatan = await prisma_1.default.kegiatan.findUnique({
            where: { id: Number(id) },
            include: { organisasi: true },
        });
        if (!kegiatan) {
            res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan' });
            return;
        }
        if (kegiatan.status !== 'diajukan') {
            res.status(400).json({ success: false, message: 'Kegiatan tidak dalam status diajukan' });
            return;
        }
        // Maker ≠ checker [BR-012]
        if (kegiatan.dibuatOleh === aktorId) {
            res.status(403).json({ success: false, message: 'Pembuat kegiatan tidak boleh memverifikasi sendiri [BR-012]' });
            return;
        }
        if (body.keputusan === 'revisi' || body.keputusan === 'tolak') {
            if (!body.alasan) {
                res.status(400).json({ success: false, message: 'Alasan wajib diisi untuk revisi/tolak' });
                return;
            }
        }
        const statusBaru = body.keputusan === 'setuju' ? 'terverifikasi' :
            body.keputusan === 'revisi' ? 'perlu_revisi' : 'ditolak';
        // Simpan catatan approval
        await prisma_1.default.kegiatanApproval.create({
            data: {
                kegiatanId: Number(id),
                tahap: 'verifikasi',
                aktorId,
                keputusan: body.keputusan,
                alasan: body.alasan,
            },
        });
        const updated = await prisma_1.default.kegiatan.update({
            where: { id: Number(id) },
            data: { status: statusBaru },
        });
        // Notifikasi ke pembuat kegiatan
        await prisma_1.default.notifikasi.create({
            data: {
                userId: kegiatan.dibuatOleh,
                judul: `Kegiatan ${body.keputusan === 'setuju' ? 'Terverifikasi ✅' : body.keputusan === 'revisi' ? 'Perlu Revisi ⚠️' : 'Ditolak ❌'}`,
                isi: `Kegiatan "${kegiatan.nama}" telah ${body.keputusan} oleh Admin.${body.alasan ? ` Alasan: ${body.alasan}` : ''}`,
                refType: 'kegiatan',
                refId: BigInt(id),
            },
        });
        // Jika disetujui (terverifikasi), notifikasi ke Pimpinan yang tepat
        if (body.keputusan === 'setuju') {
            let pimpinanTargets = [];
            if (kegiatan.organisasi?.tipe === 'UKMF' && kegiatan.organisasi.fakultasId) {
                // UKMF → notifikasi ke Pimpinan Fakultas
                const pimpinanFakultas = await prisma_1.default.staff.findMany({
                    where: { jabatan: 'pimpinan_fakultas', fakultasId: kegiatan.organisasi.fakultasId, user: { aktif: true } },
                    select: { userId: true },
                });
                pimpinanTargets = pimpinanFakultas.map(p => ({ userId: p.userId }));
            }
            else {
                // UKM / universitas → notifikasi ke Pimpinan Ditmawa
                const pimpinanDitmawa = await prisma_1.default.staff.findMany({
                    where: { jabatan: 'pimpinan_ditmawa', user: { aktif: true } },
                    select: { userId: true },
                });
                pimpinanTargets = pimpinanDitmawa.map(p => ({ userId: p.userId }));
            }
            if (pimpinanTargets.length > 0) {
                await prisma_1.default.notifikasi.createMany({
                    data: pimpinanTargets.map(t => ({
                        userId: t.userId,
                        judul: 'Kegiatan Menunggu Approval 📋',
                        isi: `Kegiatan "${kegiatan.nama}" telah terverifikasi dan menunggu persetujuan Anda.`,
                        refType: 'kegiatan',
                        refId: BigInt(kegiatan.id),
                    })),
                });
            }
        }
        await (0, auditLog_1.logAudit)({
            entitas: 'kegiatan',
            entitasId: Number(id),
            aksi: `verifikasi.${body.keputusan}`,
            statusLama: 'diajukan',
            statusBaru,
            aktorId,
        });
        res.json({ success: true, data: updated });
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
exports.verifikasiKegiatan = verifikasiKegiatan;
// GET /api/kegiatan/approval — Kegiatan untuk approval Pimpinan (Ditmawa atau Fakultas)
const getKegiatanForApproval = async (req, res) => {
    try {
        const { search, kategoriId, skalaId, status, tahun, page = '1', limit = '10' } = req.query;
        const userJabatan = req.user.jabatan;
        const where = {};
        // Jika tidak ada filter status spesifik, tampilkan semua yang relevan untuk Pimpinan
        // (terverifikasi = menunggu approval, disetujui = sudah disetujui, perlu_revisi, ditolak)
        if (status && status !== 'semua') {
            where.status = status;
        }
        else {
            // Default: tampilkan kegiatan yang sudah melewati tahap verifikasi Admin
            where.status = { in: ['terverifikasi', 'disetujui', 'perlu_revisi', 'ditolak'] };
        }
        // ── Filter berdasarkan jabatan Pimpinan ──
        if (userJabatan === 'pimpinan_fakultas') {
            // Pimpinan Fakultas: hanya kegiatan UKMF dari fakultas yang sama
            const staffData = await prisma_1.default.staff.findUnique({
                where: { userId: BigInt(req.user.id) },
            });
            if (staffData?.fakultasId) {
                where.organisasi = { fakultasId: staffData.fakultasId };
                where.asal = 'kurikuler_ukmf';
            }
        }
        else {
            // Pimpinan Ditmawa: hanya kegiatan UKM (tingkat universitas) + universitas
            where.asal = { in: ['kurikuler_ukm', 'universitas'] };
        }
        if (kategoriId)
            where.kategoriId = Number(kategoriId);
        if (skalaId)
            where.skalaId = Number(skalaId);
        // Filter berdasarkan tahun (dari tanggalMulai)
        if (tahun) {
            const year = Number(tahun);
            where.tanggalMulai = {
                gte: new Date(`${year}-01-01`),
                lt: new Date(`${year + 1}-01-01`),
            };
        }
        // Pencarian berdasarkan nama kegiatan atau nama organisasi
        if (search) {
            where.OR = [
                { nama: { contains: search } },
                { organisasi: { nama: { contains: search } } },
                { penyelenggaraExt: { contains: search } },
            ];
        }
        // Pagination
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(50, Math.max(1, Number(limit)));
        const skip = (pageNum - 1) * limitNum;
        // Hitung total data (untuk pagination)
        const total = await prisma_1.default.kegiatan.count({ where });
        const data = await prisma_1.default.kegiatan.findMany({
            where,
            include: {
                kategori: true,
                skala: true,
                organisasi: { select: { id: true, nama: true, tipe: true } },
                pembuat: { select: { id: true, nama: true } },
                kegiatanCapaian: {
                    include: { subCapaian: { include: { capaian: true } } },
                },
                kegiatanApproval: {
                    include: { aktor: { select: { id: true, nama: true } } },
                    orderBy: { createdAt: 'desc' },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum,
        });
        res.json({
            success: true,
            data,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.getKegiatanForApproval = getKegiatanForApproval;
// PUT /api/kegiatan/:id/approval — Pimpinan approval (setuju/revisi/tolak)
const approvalKegiatan = async (req, res) => {
    try {
        const { id } = req.params;
        const aktorId = BigInt(req.user.id);
        const userJabatan = req.user.jabatan;
        const body = approvalSchema.parse(req.body);
        const kegiatan = await prisma_1.default.kegiatan.findUnique({
            where: { id: Number(id) },
            include: { organisasi: true },
        });
        if (!kegiatan) {
            res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan' });
            return;
        }
        if (kegiatan.status !== 'terverifikasi') {
            res.status(400).json({ success: false, message: 'Kegiatan belum diverifikasi Admin' });
            return;
        }
        // ── Otorisasi Pimpinan Fakultas ──
        if (userJabatan === 'pimpinan_fakultas') {
            const staffData = await prisma_1.default.staff.findUnique({
                where: { userId: aktorId },
            });
            if (!staffData?.fakultasId || kegiatan.organisasi?.fakultasId !== staffData.fakultasId) {
                res.status(403).json({ success: false, message: 'Anda tidak berhak menyetujui kegiatan dari fakultas lain.' });
                return;
            }
        }
        if ((body.keputusan === 'revisi' || body.keputusan === 'tolak') && !body.alasan) {
            res.status(400).json({ success: false, message: 'Alasan wajib diisi untuk revisi/tolak' });
            return;
        }
        const statusBaru = body.keputusan === 'setuju' ? 'disetujui' :
            body.keputusan === 'revisi' ? 'perlu_revisi' : 'ditolak';
        await prisma_1.default.kegiatanApproval.create({
            data: {
                kegiatanId: Number(id),
                tahap: 'approval',
                aktorId,
                keputusan: body.keputusan,
                alasan: body.alasan,
            },
        });
        const updated = await prisma_1.default.kegiatan.update({
            where: { id: Number(id) },
            data: { status: statusBaru },
        });
        await prisma_1.default.notifikasi.create({
            data: {
                userId: kegiatan.dibuatOleh,
                judul: `Kegiatan ${body.keputusan === 'setuju' ? 'Disetujui ✅' : body.keputusan === 'revisi' ? 'Perlu Revisi ⚠️' : 'Ditolak ❌'}`,
                isi: `Kegiatan "${kegiatan.nama}" telah ${body.keputusan} oleh Pimpinan.${body.alasan ? ` Alasan: ${body.alasan}` : ''}`,
                refType: 'kegiatan',
                refId: BigInt(id),
            },
        });
        await (0, auditLog_1.logAudit)({
            entitas: 'kegiatan',
            entitasId: Number(id),
            aksi: `approval.${body.keputusan}`,
            statusLama: 'terverifikasi',
            statusBaru,
            aktorId,
        });
        res.json({ success: true, data: updated });
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
exports.approvalKegiatan = approvalKegiatan;
// PUT /api/kegiatan/:id/publikasi — Publikasikan kegiatan yang sudah disetujui
const publikasiKegiatan = async (req, res) => {
    try {
        const { id } = req.params;
        const aktorId = BigInt(req.user.id);
        const userJabatan = req.user.jabatan;
        const userPeran = req.user.peran;
        const kegiatan = await prisma_1.default.kegiatan.findUnique({
            where: { id: Number(id) },
            include: { organisasi: true },
        });
        if (!kegiatan || kegiatan.status !== 'disetujui') {
            res.status(400).json({ success: false, message: 'Kegiatan belum disetujui atau tidak ditemukan' });
            return;
        }
        // ── Otorisasi Publikasi ──
        const effectiveRole = userPeran === 'staff' && userJabatan ? userJabatan : userPeran;
        if (effectiveRole === 'operator_org') {
            // Operator hanya boleh mempublikasikan kegiatannya sendiri
            if (kegiatan.dibuatOleh !== aktorId) {
                res.status(403).json({ success: false, message: 'Anda hanya dapat mempublikasikan kegiatan yang Anda buat.' });
                return;
            }
        }
        else if (effectiveRole === 'admin_fakultas') {
            // Admin Fakultas hanya boleh mempublikasikan kegiatan UKMF di fakultasnya
            const staffData = await prisma_1.default.staff.findUnique({ where: { userId: aktorId } });
            if (!staffData?.fakultasId || kegiatan.organisasi?.fakultasId !== staffData.fakultasId) {
                res.status(403).json({ success: false, message: 'Anda tidak berhak mempublikasikan kegiatan dari fakultas lain.' });
                return;
            }
        } // Admin Ditmawa bisa publish kegiatan apapun secara default (atau terbatas pada non-UKMF)
        const updated = await prisma_1.default.kegiatan.update({
            where: { id: Number(id) },
            data: { status: 'terpublikasi' },
        });
        await (0, auditLog_1.logAudit)({
            entitas: 'kegiatan',
            entitasId: Number(id),
            aksi: 'publikasi',
            statusLama: 'disetujui',
            statusBaru: 'terpublikasi',
            aktorId,
        });
        res.json({ success: true, data: updated, message: 'Kegiatan dipublikasikan' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.publikasiKegiatan = publikasiKegiatan;
// DELETE /api/kegiatan/:id — Hapus Kegiatan (Hanya jika belum berjalan/ada partisipan)
const hapusKegiatan = async (req, res) => {
    try {
        const { id } = req.params;
        const aktorId = BigInt(req.user.id);
        const userJabatan = req.user.jabatan;
        const kegiatan = await prisma_1.default.kegiatan.findUnique({
            where: { id: Number(id) },
            include: {
                _count: { select: { partisipasi: true } },
                organisasi: true,
            },
        });
        if (!kegiatan) {
            res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan' });
            return;
        }
        // ── Otorisasi Hapus ──
        if (userJabatan === 'admin_fakultas') {
            const staffData = await prisma_1.default.staff.findUnique({ where: { userId: aktorId } });
            if (!staffData?.fakultasId || kegiatan.organisasi?.fakultasId !== staffData.fakultasId) {
                res.status(403).json({ success: false, message: 'Anda tidak berhak menghapus kegiatan dari fakultas lain.' });
                return;
            }
        }
        // Proteksi Keamanan (Aturan Bisnis)
        const deletableStatuses = ['draft', 'diajukan', 'perlu_revisi', 'ditolak', 'terverifikasi', 'disetujui', 'terpublikasi'];
        const nonDeletableStatuses = ['berlangsung', 'selesai', 'diarsipkan', 'dibatalkan'];
        if (nonDeletableStatuses.includes(kegiatan.status)) {
            res.status(400).json({
                success: false,
                message: `Kegiatan tidak bisa dihapus karena sudah dalam status '${kegiatan.status}'. Gunakan fitur batalkan/arsipkan.`
            });
            return;
        }
        // Proteksi Lapis 2: Jika sudah ada mahasiswa yang mendaftar (partisipasi > 0), tidak boleh dihapus!
        if (kegiatan._count.partisipasi > 0) {
            res.status(400).json({
                success: false,
                message: 'Kegiatan tidak bisa dihapus secara permanen karena sudah ada mahasiswa yang mendaftar partisipasi.',
            });
            return;
        }
        // Gunakan transaksi untuk menghapus data terkait yang terhubung (KegiatanCapaian, KegiatanApproval)
        // Walaupun Cascade OnDelete di Prisma biasa di-setting, ini lebih aman secara eksplisit
        await prisma_1.default.$transaction([
            prisma_1.default.kegiatanApproval.deleteMany({ where: { kegiatanId: Number(id) } }),
            prisma_1.default.kegiatanCapaian.deleteMany({ where: { kegiatanId: Number(id) } }),
            prisma_1.default.kegiatan.delete({ where: { id: Number(id) } }),
        ]);
        await (0, auditLog_1.logAudit)({
            entitas: 'kegiatan',
            entitasId: Number(id),
            aksi: 'delete',
            statusLama: kegiatan.status,
            statusBaru: 'deleted',
            aktorId,
        });
        res.json({ success: true, message: 'Kegiatan beserta alokasi capaiannya berhasil dihapus permanen' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat menghapus kegiatan' });
    }
};
exports.hapusKegiatan = hapusKegiatan;
