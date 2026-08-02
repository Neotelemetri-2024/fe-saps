import { Router } from 'express';
import { login, getMe, updateProfil, gantiPassword, updateFcmToken } from '../controllers/auth.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', login);                      // POST /api/auth/login        — Publik
router.get('/me', authenticateJWT, getMe);          // GET  /api/auth/me           — Butuh token
router.put('/profil', authenticateJWT, updateProfil);            // PUT  /api/auth/profil        — Butuh token
router.put('/ganti-password', authenticateJWT, gantiPassword);   // PUT  /api/auth/ganti-password — Butuh token
router.put('/fcm-token', authenticateJWT, updateFcmToken);        // PUT  /api/auth/fcm-token       — Butuh token

export default router;
