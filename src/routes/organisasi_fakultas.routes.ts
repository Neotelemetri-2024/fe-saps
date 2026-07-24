import { Router } from 'express';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import {
  getAkunUKMF,
  createAkunUKMF,
  toggleStatusAkunUKMF,
  resetPasswordUKMF,
  hapusAkunUKMF
} from '../controllers/admin/fakultas/organisasi.controller';

const router = Router();

router.use(authenticateJWT);
router.use(authorizeRole('admin_fakultas'));

router.get('/akun', getAkunUKMF);
router.post('/akun', createAkunUKMF);
router.put('/akun/:userId/toggle-status', toggleStatusAkunUKMF);
router.put('/akun/:userId/reset-password', resetPasswordUKMF);
router.delete('/akun/:userId', hapusAkunUKMF);

export default router;
