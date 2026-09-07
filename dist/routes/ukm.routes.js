"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const dashboard_controller_1 = require("../controllers/ukm/dashboard.controller");
const kegiatan_controller_1 = require("../controllers/ukm/kegiatan.controller");
const router = (0, express_1.Router)();
const uploadXlsx = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
// Middleware: Role operator_org (UKM/UKMF), Admin Ditmawa/Fakultas, dan Pimpinan Ditmawa (Superadmin)
router.use(auth_middleware_1.authenticateJWT);
router.use((0, auth_middleware_1.authorizeRole)('operator_org', 'admin_ditmawa', 'admin_fakultas', 'pimpinan_ditmawa', 'pimpinan_utama'));
// Dashboard UKM
router.get('/dashboard', dashboard_controller_1.getDashboardUKM);
// Daftar Kegiatan UKM
router.get('/kegiatan', kegiatan_controller_1.getDaftarKegiatanUKM);
// Manajemen Peserta per Kegiatan
router.get('/kegiatan/:kegiatanId/peserta', kegiatan_controller_1.getManajemenPeserta);
router.get('/kegiatan/:kegiatanId/peserta/template', kegiatan_controller_1.downloadTemplatePesertaUKM);
router.post('/kegiatan/:kegiatanId/peserta/import', uploadXlsx.single('file'), kegiatan_controller_1.importPesertaUKM);
router.put('/kegiatan/:kegiatanId/peserta', kegiatan_controller_1.updatePesertaUKM);
router.post('/kegiatan/:kegiatanId/peserta/submit', kegiatan_controller_1.submitPoinPesertaUKM);
router.delete('/kegiatan/:kegiatanId/peserta/:partisipasiId', kegiatan_controller_1.hapusPesertaUKM);
router.delete('/kegiatan/:kegiatanId/peserta', kegiatan_controller_1.hapusPesertaUKM);
exports.default = router;
