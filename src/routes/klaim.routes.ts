import { Router } from 'express';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import {
  getKlaimForValidasi, getKlaimEksternalForVerifikasi, getKlaimById,
  validasiKlaim, validasiKlaimBulk,
} from '../controllers/admin/ditmawa/klaim.controller';

const router = Router();

router.use(authenticateJWT);

// GET /api/klaim/verifikasi-eksternal — Klaim eksternal menunggu verifikasi Pimpinan
router.get('/verifikasi-eksternal', authorizeRole('pimpinan_ditmawa', 'admin_ditmawa'), getKlaimEksternalForVerifikasi);

// GET /api/klaim/:id — Detail klaim (semua role)
router.get('/:id', getKlaimById);

// PUT /api/klaim/validasi-bulk — Bulk validasi klaim
router.put('/validasi-bulk', authorizeRole('pimpinan_ditmawa', 'admin_ditmawa'), validasiKlaimBulk);

// PUT /api/klaim/:id/validasi — Validasi satu klaim
router.put('/:id/validasi', authorizeRole('operator_org', 'admin_ditmawa', 'pimpinan_ditmawa'), validasiKlaim);

export default router;
