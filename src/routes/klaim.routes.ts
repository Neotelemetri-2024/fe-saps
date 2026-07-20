import { Router } from 'express';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import {
  createKlaim,
  getMyKlaim,
  getKlaimForValidasi,
  getKlaimEksternalForVerifikasi,
  getKlaimById,
  validasiKlaim,
  validasiKlaimBulk,
} from '../controllers/klaim.controller';

const router = Router();

// Semua rute klaim membutuhkan login
router.use(authenticateJWT);

router.post('/', authorizeRole('mahasiswa'), createKlaim);                                                          // POST /api/klaim
router.get('/saya', authorizeRole('mahasiswa'), getMyKlaim);                                                        // GET /api/klaim/saya
router.get('/validasi', authorizeRole('operator_org', 'admin_ditmawa'), getKlaimForValidasi);                       // GET /api/klaim/validasi
router.get('/verifikasi-eksternal', authorizeRole('pimpinan_ditmawa', 'admin_ditmawa'), getKlaimEksternalForVerifikasi); // GET /api/klaim/verifikasi-eksternal
router.get('/:id', getKlaimById);                                                                                   // GET /api/klaim/:id (semua role)
router.put('/validasi-bulk', authorizeRole('pimpinan_ditmawa', 'admin_ditmawa'), validasiKlaimBulk); // PUT /api/klaim/validasi-bulk
router.put('/:id/validasi', authorizeRole('operator_org', 'admin_ditmawa', 'pimpinan_ditmawa'), validasiKlaim);     // PUT /api/klaim/:id/validasi

export default router;
