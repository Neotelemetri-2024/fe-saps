"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWT_SECRET = exports.authorizeRole = exports.authenticateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'saps-secret-key-change-in-production';
exports.JWT_SECRET = JWT_SECRET;
/**
 * Middleware: Verifikasi JWT Token dari Header Authorization.
 * Jika valid, payload token disimpan di req.user.
 * Jika tidak valid atau tidak ada, akan menolak dengan 401.
 */
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    // OAuth start (GET /linkedin/connect) memakai full-page redirect, jadi JWT
    // tidak bisa dikirim via Authorization header — izinkan ?token= hanya di rute itu.
    const queryToken = req.path.includes('linkedin/connect') && typeof req.query.token === 'string'
        ? req.query.token
        : null;
    const token = headerToken || queryToken;
    if (!token) {
        res.status(401).json({
            success: false,
            message: 'Akses ditolak. Token tidak ditemukan. Silakan login terlebih dahulu.',
        });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token tidak valid atau sudah kadaluarsa. Silakan login ulang.',
        });
    }
};
exports.authenticateJWT = authenticateJWT;
/**
 * Middleware: Otorisasi berdasarkan Role.
 *
 * Cara kerja:
 * - Untuk role `staff`, pengecekan dilakukan berdasarkan `jabatan` (admin_ditmawa, pimpinan_ditmawa).
 * - Untuk role lainnya (mahasiswa, dosen, operator_org), pengecekan berdasarkan `peran`.
 *
 * Contoh penggunaan:
 *   authorizeRole('pimpinan_ditmawa')          → hanya Pimpinan Ditmawa
 *   authorizeRole('admin_ditmawa')             → hanya Admin Ditmawa
 *   authorizeRole('mahasiswa')                 → hanya Mahasiswa
 *   authorizeRole('mahasiswa', 'dosen')        → Mahasiswa ATAU Dosen
 *   authorizeRole('admin_ditmawa', 'operator_org') → Admin Ditmawa ATAU Operator UKM
 */
const authorizeRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Akses ditolak. Silakan login terlebih dahulu.',
            });
            return;
        }
        // Determine effective role: for staff, use jabatan; otherwise use peran
        const effectiveRole = req.user.peran === 'staff' && req.user.jabatan
            ? req.user.jabatan
            : req.user.peran;
        // Super Admin: Pimpinan Ditmawa dan Pimpinan Utama memiliki wewenang penuh
        // untuk mengakses semua fitur administratif & operasional
        const isSuperAdmin = effectiveRole === 'pimpinan_ditmawa' || effectiveRole === 'pimpinan_utama';
        const isStaffOrAdminFeature = allowedRoles.some(r => ['admin_ditmawa', 'admin_fakultas', 'operator_org', 'pimpinan_fakultas', 'pimpinan_ditmawa', 'pimpinan_utama', 'staff'].includes(r));
        if (allowedRoles.includes(effectiveRole) || (isSuperAdmin && isStaffOrAdminFeature)) {
            return next();
        }
        res.status(403).json({
            success: false,
            message: `Akses ditolak. Role Anda (${effectiveRole}) tidak memiliki izin untuk mengakses fitur ini.`,
        });
        return;
    };
};
exports.authorizeRole = authorizeRole;
