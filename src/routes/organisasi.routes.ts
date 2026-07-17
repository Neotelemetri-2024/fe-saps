import { Router } from 'express';
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

// Organisasi (UKM/UKMF)
router.get('/', getOrganisasi);                          // GET /api/organisasi
router.post('/', createOrganisasi);                        // POST /api/organisasi

// Akun Operator Organisasi (Jalur Lama)
router.get('/operator', getOperatorOrg);                 // GET /api/organisasi/operator
router.post('/operator', createOperatorOrg);               // POST /api/organisasi/operator
router.put('/operator/:userId/status', toggleStatusAkun);  // PUT /api/organisasi/operator/:userId/status

// Fitur Terpadu (Sesuai Wireframe)
router.post('/akun', createAkunLengkap);
router.put('/akun/:userId/reset', resetPasswordAkun);
router.delete('/akun/:userId', hapusAkun);

export default router;
