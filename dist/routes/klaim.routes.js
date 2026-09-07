"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const klaim_controller_1 = require("../controllers/admin/ditmawa/klaim.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateJWT);
// Literal paths BEFORE /:id
router.get('/validasi', (0, auth_middleware_1.authorizeRole)('operator_org', 'admin_ditmawa', 'admin_fakultas', 'pimpinan_ditmawa', 'pimpinan_utama'), klaim_controller_1.getKlaimForValidasi);
router.get('/verifikasi-eksternal', (0, auth_middleware_1.authorizeRole)('pimpinan_ditmawa', 'admin_ditmawa', 'pimpinan_utama'), klaim_controller_1.getKlaimEksternalForVerifikasi);
router.put('/validasi-bulk', (0, auth_middleware_1.authorizeRole)('pimpinan_ditmawa', 'admin_ditmawa', 'pimpinan_utama'), klaim_controller_1.validasiKlaimBulk);
router.get('/:id', klaim_controller_1.getKlaimById);
router.put('/:id/validasi', (0, auth_middleware_1.authorizeRole)('operator_org', 'admin_ditmawa', 'pimpinan_ditmawa', 'pimpinan_utama'), klaim_controller_1.validasiKlaim);
exports.default = router;
