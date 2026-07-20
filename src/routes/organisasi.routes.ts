import { Router } from 'express';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import {
  getOrganisasi,
  createOrganisasi,
  getOperatorOrg,
  createOperatorOrg,
  toggleStatusAkun,
  createAkunLengkap,
  resetPasswordAkun,
  hapusAkun
} from '../controllers/organisasi.controller';

const router = Router();

// Semua rute organisasi membutuhkan login
router.use(authenticateJWT);

// Organisasi (UKM/UKMF)
router.get('/', authorizeRole('admin_ditmawa'), getOrganisasi);                                     // GET /api/organisasi
router.post('/', authorizeRole('admin_ditmawa'), createOrganisasi);                                 // POST /api/organisasi

// Akun Operator Organisasi
router.get('/operator', authorizeRole('admin_ditmawa'), getOperatorOrg);                            // GET /api/organisasi/operator
router.post('/operator', authorizeRole('admin_ditmawa'), createOperatorOrg);                        // POST /api/organisasi/operator
router.put('/operator/:userId/status', authorizeRole('admin_ditmawa'), toggleStatusAkun);           // PUT /api/organisasi/operator/:userId/status

// Fitur Terpadu (Sesuai Wireframe)
router.post('/akun', authorizeRole('admin_ditmawa'), createAkunLengkap);                            // POST /api/organisasi/akun
router.put('/akun/:userId/reset', authorizeRole('admin_ditmawa'), resetPasswordAkun);               // PUT /api/organisasi/akun/:userId/reset
router.delete('/akun/:userId', authorizeRole('admin_ditmawa'), hapusAkun);                          // DELETE /api/organisasi/akun/:userId

export default router;
