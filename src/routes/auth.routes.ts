import { Router } from 'express';
import { login, getMe, updateProfil, gantiPassword, updateFcmToken, ssoLogin, ssoCallback, ssoLogout } from '../controllers/auth.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

// Autentikasi Internal (Email/Username + Password) — Pimpinan, Admin, Operator UKM/UKMF
router.post('/login', login);                      // POST /api/auth/login        — Publik

// Autentikasi SSO UNAND (OAuth2 / Keycloak) — Mahasiswa & Dosen
router.get('/sso', ssoLogin);                       // GET  /api/auth/sso          — Inisiasi SSO Keycloak
router.get('/callback', ssoCallback);              // GET  /api/auth/callback     — Callback SSO Keycloak
router.get('/sso/logout', ssoLogout);              // GET  /api/auth/sso/logout   — Logout SSO Keycloak

// Sesi & Profil (Butuh Token)
router.get('/me', authenticateJWT, getMe);          // GET  /api/auth/me           — Butuh token
router.put('/profil', authenticateJWT, updateProfil);            // PUT  /api/auth/profil        — Butuh token
router.put('/ganti-password', authenticateJWT, gantiPassword);   // PUT  /api/auth/ganti-password — Butuh token
router.put('/fcm-token', authenticateJWT, updateFcmToken);        // PUT  /api/auth/fcm-token       — Butuh token

export default router;
