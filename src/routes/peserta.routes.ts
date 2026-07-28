import { Router } from 'express';
import multer from 'multer';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import {
  getManajemenPeserta as getPesertaKegiatan,
  importPesertaUKM as importPeserta,
  submitPoinPesertaUKM as submitPoinPeserta,
  downloadTemplatePesertaUKM as downloadTemplatePeserta,
  updatePesertaUKM as updatePeserta,
} from '../controllers/ukm/kegiatan.controller';

const router = Router();
const uploadXlsx = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Semua rute peserta membutuhkan login
router.use(authenticateJWT);

// GET /api/kegiatan/:id/peserta — Daftar peserta kegiatan
router.get(
  '/:id/peserta',
  authorizeRole('operator_org', 'admin_ditmawa', 'admin_fakultas'),
  getPesertaKegiatan
);

// GET /api/kegiatan/:id/peserta/template — Download CSV template
router.get(
  '/:id/peserta/template',
  authorizeRole('operator_org', 'admin_ditmawa', 'admin_fakultas'),
  downloadTemplatePeserta
);

// POST /api/kegiatan/:id/peserta/import — Import peserta dari Excel (.xlsx)
router.post(
  '/:id/peserta/import',
  authorizeRole('operator_org', 'admin_ditmawa', 'admin_fakultas'),
  uploadXlsx.single('file'),
  importPeserta
);

// POST /api/kegiatan/:id/peserta/submit-poin — Submit & cetak poin otomatis
router.post(
  '/:id/peserta/submit-poin',
  authorizeRole('operator_org', 'admin_ditmawa', 'admin_fakultas'),
  submitPoinPeserta
);

// PUT /api/kegiatan/:id/peserta/update — Update kehadiran & peran peserta
router.put(
  '/:id/peserta/update',
  authorizeRole('operator_org', 'admin_ditmawa', 'admin_fakultas'),
  updatePeserta
);

export default router;
