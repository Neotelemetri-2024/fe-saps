"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hapusAkun = exports.resetPasswordAkun = exports.toggleStatusAkun = exports.createAkunLengkap = exports.getAkunUKM = void 0;
const prisma_1 = __importDefault(require("../../../lib/prisma"));
const zod_1 = require("zod");
const auditLog_1 = require("../../../lib/auditLog");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// ==================== VALIDASI ====================
const createAkunLengkapSchema = zod_1.z.object({
    namaUkm: zod_1.z.string().min(3),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    status: zod_1.z.boolean(), // true = Aktif, false = Non Aktif
});
const resetPasswordSchema = zod_1.z.object({
    passwordBaru: zod_1.z.string().min(6),
});
// ==================== OPERATOR UKM CRUD (ADMIN DITMAWA) ====================
// GET /api/organisasi/akun â€” Daftar akun operator UKM
const getAkunUKM = async (req, res) => {
    try {
        const data = await prisma_1.default.organisasiOperator.findMany({
            where: {
                organisasi: {
                    tipe: 'UKM', // Admin Ditmawa hanya mengurus UKM
                    deletedAt: null,
                },
                user: {
                    deletedAt: null,
                },
            },
            include: {
                user: { select: { id: true, nama: true, email: true, aktif: true } },
                organisasi: { select: { id: true, nama: true, tipe: true } },
            },
            orderBy: {
                organisasi: { nama: 'asc' },
            },
        });
        // Formatting agar lebih mudah dikonsumsi frontend sesuai UI
        const formattedData = data.map((d, index) => ({
            no: index + 1,
            userId: d.user.id.toString(),
            organisasiId: d.organisasiId,
            namaUkm: d.organisasi.nama,
            email: d.user.email,
            status: d.user.aktif,
        }));
        res.json({ success: true, data: formattedData });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.getAkunUKM = getAkunUKM;
// POST /api/organisasi/akun â€” Buat Organisasi (UKM) sekaligus User Operatornya
const createAkunLengkap = async (req, res) => {
    try {
        const aktorId = BigInt(req.user.id);
        const body = createAkunLengkapSchema.parse(req.body);
        const email = body.email.trim().toLowerCase();
        const checkExistingUser = await prisma_1.default.user.findFirst({
            where: { email }
        });
        if (checkExistingUser) {
            res.status(400).json({ success: false, message: 'Email sudah digunakan' });
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(body.password, 10);
        const newAkun = await prisma_1.default.$transaction(async (tx) => {
            // 1. Buat Organisasi tipe UKM
            const org = await tx.organisasi.create({
                data: {
                    nama: body.namaUkm,
                    tipe: 'UKM',
                    fakultasId: null, // UKM universitas tidak punya fakultas
                },
            });
            // 2. Buat User (Operator UKM)
            const user = await tx.user.create({
                data: {
                    nama: `Operator ${body.namaUkm}`,
                    email,
                    passwordHash,
                    peran: 'operator_org', // Role umum untuk semua organisasi
                    aktif: body.status,
                },
            });
            // 3. Tautkan User ke Organisasi
            const op = await tx.organisasiOperator.create({
                data: {
                    userId: user.id,
                    organisasiId: org.id,
                },
            });
            return { org, user, op };
        });
        await (0, auditLog_1.logAudit)({
            entitas: 'organisasi',
            entitasId: newAkun.org.id,
            aksi: 'create',
            statusBaru: 'UKM',
            aktorId,
        });
        res.status(201).json({
            success: true,
            message: 'Akun UKM berhasil dibuat'
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
exports.createAkunLengkap = createAkunLengkap;
// PUT /api/organisasi/akun/:userId/toggle-status â€” Aktifkan/Nonaktifkan akun UKM
const toggleStatusAkun = async (req, res) => {
    try {
        const { userId } = req.params;
        const aktorId = BigInt(req.user.id);
        const operator = await prisma_1.default.organisasiOperator.findUnique({
            where: { userId: BigInt(userId) },
            include: { user: true, organisasi: true },
        });
        if (!operator) {
            res.status(404).json({ success: false, message: 'Akun UKM tidak ditemukan' });
            return;
        }
        const userRole = req.user?.peran === 'staff' && req.user?.jabatan ? req.user.jabatan : req.user?.peran;
        const isSuperAdmin = userRole === 'pimpinan_ditmawa' || userRole === 'pimpinan_utama';
        if (!isSuperAdmin && operator.organisasi.tipe !== 'UKM') {
            res.status(403).json({ success: false, message: 'Akses ditolak. Anda hanya dapat mengatur UKM.' });
            return;
        }
        const newStatus = !operator.user.aktif;
        await prisma_1.default.user.update({
            where: { id: BigInt(userId) },
            data: { aktif: newStatus },
        });
        await (0, auditLog_1.logAudit)({
            entitas: 'user',
            entitasId: operator.userId,
            aksi: 'toggle_status',
            statusLama: operator.user.aktif ? 'aktif' : 'nonaktif',
            statusBaru: newStatus ? 'aktif' : 'nonaktif',
            aktorId,
        });
        res.json({
            success: true,
            message: `Akun UKM berhasil di${newStatus ? 'aktifkan' : 'nonaktifkan'}`
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.toggleStatusAkun = toggleStatusAkun;
// PUT /api/organisasi/akun/:userId/reset-password — Reset password akun UKM
const resetPasswordAkun = async (req, res) => {
    try {
        const { userId } = req.params;
        const body = resetPasswordSchema.parse(req.body);
        const userRole = req.user?.peran === 'staff' && req.user?.jabatan ? req.user.jabatan : req.user?.peran;
        const isSuperAdmin = userRole === 'pimpinan_ditmawa' || userRole === 'pimpinan_utama';
        const operator = await prisma_1.default.organisasiOperator.findUnique({
            where: { userId: BigInt(userId) },
            include: { organisasi: true },
        });
        if (!operator || (!isSuperAdmin && operator.organisasi.tipe !== 'UKM')) {
            res.status(403).json({ success: false, message: 'Akses ditolak atau akun tidak ditemukan.' });
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(body.passwordBaru, 10);
        await prisma_1.default.user.update({
            where: { id: BigInt(userId) },
            data: { passwordHash },
        });
        res.json({ success: true, message: 'Password berhasil direset' });
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
exports.resetPasswordAkun = resetPasswordAkun;
// DELETE /api/organisasi/akun/:userId — Hapus Akun & UKM
const hapusAkun = async (req, res) => {
    try {
        const { userId } = req.params;
        const aktorId = BigInt(req.user.id);
        const userRole = req.user?.peran === 'staff' && req.user?.jabatan ? req.user.jabatan : req.user?.peran;
        const isSuperAdmin = userRole === 'pimpinan_ditmawa' || userRole === 'pimpinan_utama';
        const operator = await prisma_1.default.organisasiOperator.findUnique({
            where: { userId: BigInt(userId) },
            include: { organisasi: true },
        });
        if (!operator || (!isSuperAdmin && operator.organisasi.tipe !== 'UKM')) {
            res.status(403).json({ success: false, message: 'Akses ditolak atau akun tidak ditemukan.' });
            return;
        }
        await prisma_1.default.$transaction(async (tx) => {
            await tx.organisasi.update({
                where: { id: operator.organisasiId },
                data: { deletedAt: new Date() },
            });
            await tx.user.update({
                where: { id: BigInt(userId) },
                data: { aktif: false, deletedAt: new Date() },
            });
        });
        await (0, auditLog_1.logAudit)({
            entitas: 'organisasi',
            entitasId: operator.organisasiId,
            aksi: 'soft_delete',
            statusBaru: 'deleted',
            aktorId,
        });
        res.json({ success: true, message: 'Akun UKM berhasil dihapus' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.hapusAkun = hapusAkun;
