import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'saps-secret-key-change-in-production';

// Extend Express Request type to include user payload
export interface AuthPayload {
  id: string;       // BigInt userId as string
  peran: string;    // RoleUser enum value
  jabatan?: string; // JabatanStaff for staff roles (admin_ditmawa, pimpinan_ditmawa, etc.)
  nama: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

/**
 * Middleware: Verifikasi JWT Token dari Header Authorization.
 * Jika valid, payload token disimpan di req.user.
 * Jika tidak valid atau tidak ada, akan menolak dengan 401.
 */
export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token tidak ditemukan. Silakan login terlebih dahulu.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token tidak valid atau sudah kadaluarsa. Silakan login ulang.',
    });
  }
};

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
export const authorizeRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
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

    if (!allowedRoles.includes(effectiveRole)) {
      res.status(403).json({
        success: false,
        message: `Akses ditolak. Role Anda (${effectiveRole}) tidak memiliki izin untuk mengakses fitur ini.`,
      });
      return;
    }

    next();
  };
};

export { JWT_SECRET };
