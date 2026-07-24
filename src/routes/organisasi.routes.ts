import { Router } from 'express';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import {
  getAkunUKM, toggleStatusAkun, createAkunLengkap, resetPasswordAkun, hapusAkun
} from '../controllers/admin/ditmawa/organisasi.controller';

const router = Router();

router.use(authenticateJWT);
router.use(authorizeRole('admin_ditmawa'));

router.get('/akun', getAkunUKM);
router.post('/akun', createAkunLengkap);
router.put('/akun/:userId/toggle-status', toggleStatusAkun);
router.put('/akun/:userId/reset-password', resetPasswordAkun);
router.delete('/akun/:userId', hapusAkun);

export default router;
