import { Router } from 'express';
import { login, getMe } from '../controllers/auth.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', login);                      // POST /api/auth/login   — Publik
router.get('/me', authenticateJWT, getMe);          // GET  /api/auth/me      — Butuh token

export default router;
