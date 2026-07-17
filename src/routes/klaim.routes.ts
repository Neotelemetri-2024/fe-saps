import { Router } from 'express';
import {
  createKlaim,
  getMyKlaim,
  getKlaimForValidasi,
  getKlaimById,
  validasiKlaim,
} from '../controllers/klaim.controller';

const router = Router();

router.post('/', createKlaim);                             // POST /api/klaim
router.get('/saya', getMyKlaim);                           // GET /api/klaim/saya?mahasiswaId=X
router.get('/validasi', getKlaimForValidasi);              // GET /api/klaim/validasi?validatorId=X
router.get('/:id', getKlaimById);                          // GET /api/klaim/:id
router.put('/:id/validasi', validasiKlaim);                // PUT /api/klaim/:id/validasi

export default router;
