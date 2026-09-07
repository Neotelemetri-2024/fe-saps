import { Router } from 'express';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import {
  getKlaimForValidasi, getKlaimEksternalForVerifikasi, getKlaimById,
  validasiKlaim, validasiKlaimBulk,
} from '../controllers/admin/ditmawa/klaim.controller';

const router = Router();

router.use(authenticateJWT);

// Literal paths BEFORE /:id
router.get('/validasi', authorizeRole('operator_org', 'admin_ditmawa', 'admin_fakultas', 'pimpinan_ditmawa', 'pimpinan_utama'), getKlaimForValidasi);
router.get('/verifikasi-eksternal', authorizeRole('pimpinan_ditmawa', 'admin_ditmawa', 'pimpinan_utama'), getKlaimEksternalForVerifikasi);
router.put('/validasi-bulk', authorizeRole('pimpinan_ditmawa', 'admin_ditmawa', 'pimpinan_utama'), validasiKlaimBulk);

router.get('/:id', getKlaimById);
router.put('/:id/validasi', authorizeRole('operator_org', 'admin_ditmawa', 'pimpinan_ditmawa', 'pimpinan_utama'), validasiKlaim);

export default router;
