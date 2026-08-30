import { Router } from 'express';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import {
  getPreviewLaporan,
  downloadExcelLaporan,
  downloadPdfLaporan,
} from '../controllers/pimpinan/laporan.controller';

const router = Router();

// Proteksi: Hanya role Pimpinan dan Admin Struktural yang diizinkan
const allowedRoles = [
  'pimpinan_utama',
  'pimpinan_ditmawa',
  'pimpinan_fakultas',
  'admin_ditmawa',
  'admin_fakultas',
];

// GET /api/pimpinan/laporan/preview — Preview ringkasan data laporan JSON
router.get(
  '/preview',
  authenticateJWT,
  authorizeRole(...allowedRoles),
  getPreviewLaporan
);

// GET /api/pimpinan/laporan/excel — Download Laporan Format Excel (.xlsx)
router.get(
  '/excel',
  authenticateJWT,
  authorizeRole(...allowedRoles),
  downloadExcelLaporan
);

// GET /api/pimpinan/laporan/pdf — Download Laporan Format PDF (.pdf)
router.get(
  '/pdf',
  authenticateJWT,
  authorizeRole(...allowedRoles),
  downloadPdfLaporan
);

export default router;
