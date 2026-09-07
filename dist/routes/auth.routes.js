"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post('/login', auth_controller_1.login); // POST /api/auth/login        — Publik
router.get('/me', auth_middleware_1.authenticateJWT, auth_controller_1.getMe); // GET  /api/auth/me           — Butuh token
router.put('/profil', auth_middleware_1.authenticateJWT, auth_controller_1.updateProfil); // PUT  /api/auth/profil        — Butuh token
router.put('/ganti-password', auth_middleware_1.authenticateJWT, auth_controller_1.gantiPassword); // PUT  /api/auth/ganti-password — Butuh token
router.put('/fcm-token', auth_middleware_1.authenticateJWT, auth_controller_1.updateFcmToken); // PUT  /api/auth/fcm-token       — Butuh token
exports.default = router;
