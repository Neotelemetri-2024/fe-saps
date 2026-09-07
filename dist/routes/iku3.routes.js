"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const iku3_controller_1 = require("../controllers/iku3/iku3.controller");
const router = (0, express_1.Router)();
// Seluruh endpoint IKU 3 wajib autentikasi JWT
router.use(auth_middleware_1.authenticateJWT);
const VIEW_ROLES = [
    'pimpinan_utama',
    'pimpinan_ditmawa',
    'admin_ditmawa',
    'pimpinan_fakultas',
    'admin_fakultas',
];
// 1. Dashboard, Tren, Peringkat Fakultas, & Detail Kegiatan
router.get('/dashboard', (0, auth_middleware_1.authorizeRole)(...VIEW_ROLES), iku3_controller_1.getDashboardIku3);
router.get('/trend', (0, auth_middleware_1.authorizeRole)(...VIEW_ROLES), iku3_controller_1.getTrendIku3);
router.get('/faculties', (0, auth_middleware_1.authorizeRole)(...VIEW_ROLES), iku3_controller_1.getFacultiesIku3);
router.get('/activities', (0, auth_middleware_1.authorizeRole)(...VIEW_ROLES), iku3_controller_1.getActivitiesIku3);
// 2. Pembacaan Target & Aturan Bobot
router.get('/targets', (0, auth_middleware_1.authorizeRole)(...VIEW_ROLES), iku3_controller_1.getTargetsIku3);
router.get('/rules', (0, auth_middleware_1.authorizeRole)(...VIEW_ROLES), iku3_controller_1.getRulesIku3);
// 3. Manajemen Target Tahunan (Khusus Ditmawa)
router.post('/targets', (0, auth_middleware_1.authorizeRole)('pimpinan_ditmawa', 'admin_ditmawa'), iku3_controller_1.upsertTargetIku3);
// 4. Manajemen Bobot Dinamis (Khusus Super Admin Pimpinan Ditmawa)
router.put('/rules/:id', (0, auth_middleware_1.authorizeRole)('pimpinan_ditmawa'), iku3_controller_1.updateRuleIku3);
exports.default = router;
