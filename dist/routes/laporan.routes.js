"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const laporan_controller_1 = require("../controllers/pimpinan/laporan.controller");
const router = (0, express_1.Router)();
// Proteksi: Hanya role Pimpinan dan Admin Struktural yang diizinkan
const allowedRoles = [
    'pimpinan_utama',
    'pimpinan_ditmawa',
    'pimpinan_fakultas',
    'admin_ditmawa',
    'admin_fakultas',
];
// GET /api/pimpinan/laporan/preview — Preview ringkasan data laporan JSON
router.get('/preview', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.authorizeRole)(...allowedRoles), laporan_controller_1.getPreviewLaporan);
// GET /api/pimpinan/laporan/excel — Download Laporan Format Excel (.xlsx)
router.get('/excel', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.authorizeRole)(...allowedRoles), laporan_controller_1.downloadExcelLaporan);
// GET /api/pimpinan/laporan/pdf — Download Laporan Format PDF (.pdf)
router.get('/pdf', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.authorizeRole)(...allowedRoles), laporan_controller_1.downloadPdfLaporan);
exports.default = router;
