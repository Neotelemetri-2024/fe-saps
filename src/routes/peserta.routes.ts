import { Router } from 'express';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import {
  getPesertaKegiatan,
  importPeserta,
  submitPoinPeserta,
  downloadTemplatePeserta,
  updatePeserta,
} from '../controllers/peserta.controller';

const router = Router();

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

// POST /api/kegiatan/:id/peserta/import — Import peserta dari CSV
router.post(
  '/:id/peserta/import',
  authorizeRole('operator_org', 'admin_ditmawa', 'admin_fakultas'),
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
