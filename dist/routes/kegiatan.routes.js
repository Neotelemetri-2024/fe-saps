"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const kegiatan_controller_1 = require("../controllers/admin/ditmawa/kegiatan.controller");
const kegiatan_controller_2 = require("../controllers/pimpinan/ditmawa/kegiatan.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateJWT);
// ─── BACA ─────────────────────────────────────────────────────────────────────
router.get('/', kegiatan_controller_1.getAllKegiatan);
// Literal paths BEFORE /:id agar tidak tertangkap sebagai id
router.get('/verifikasi', (0, auth_middleware_1.authorizeRole)('admin_ditmawa', 'admin_fakultas', 'pimpinan_ditmawa', 'pimpinan_utama'), kegiatan_controller_1.getKegiatanForVerifikasi);
router.put('/verifikasi-bulk', (0, auth_middleware_1.authorizeRole)('admin_ditmawa', 'admin_fakultas', 'pimpinan_ditmawa', 'pimpinan_utama'), kegiatan_controller_1.verifikasiKegiatanBulk);
router.get('/approval', (0, auth_middleware_1.authorizeRole)('pimpinan_ditmawa', 'pimpinan_fakultas', 'pimpinan_utama'), kegiatan_controller_2.getKegiatanForApproval);
router.put('/approval-bulk', (0, auth_middleware_1.authorizeRole)('pimpinan_ditmawa', 'pimpinan_fakultas', 'pimpinan_utama'), kegiatan_controller_2.approvalKegiatanBulk);
router.get('/:id', kegiatan_controller_1.getKegiatanById);
// ─── BUAT / EDIT ──────────────────────────────────────────────────────────────
router.post('/', (0, auth_middleware_1.authorizeRole)('operator_org', 'admin_ditmawa', 'admin_fakultas', 'pimpinan_ditmawa', 'pimpinan_utama'), kegiatan_controller_1.createKegiatan);
router.put('/:id', (0, auth_middleware_1.authorizeRole)('operator_org', 'admin_ditmawa', 'admin_fakultas', 'pimpinan_ditmawa', 'pimpinan_utama'), kegiatan_controller_1.editKegiatan);
router.put('/:id/ajukan', (0, auth_middleware_1.authorizeRole)('operator_org', 'admin_ditmawa', 'admin_fakultas', 'pimpinan_ditmawa', 'pimpinan_utama'), kegiatan_controller_1.ajukanKegiatan);
// ─── VERIFIKASI / APPROVAL PER-ID ─────────────────────────────────────────────
router.put('/:id/verifikasi', (0, auth_middleware_1.authorizeRole)('admin_ditmawa', 'admin_fakultas', 'pimpinan_ditmawa', 'pimpinan_utama'), kegiatan_controller_1.verifikasiKegiatan);
router.put('/:id/approval', (0, auth_middleware_1.authorizeRole)('pimpinan_ditmawa', 'pimpinan_fakultas', 'pimpinan_utama'), kegiatan_controller_2.approvalKegiatan);
// ─── PUBLIKASI & HAPUS ────────────────────────────────────────────────────────
router.put('/:id/publikasi', (0, auth_middleware_1.authorizeRole)('operator_org', 'admin_ditmawa', 'admin_fakultas', 'pimpinan_ditmawa', 'pimpinan_utama'), kegiatan_controller_1.publikasiKegiatan);
router.delete('/:id', (0, auth_middleware_1.authorizeRole)('admin_ditmawa', 'admin_fakultas', 'pimpinan_ditmawa', 'pimpinan_utama'), kegiatan_controller_1.hapusKegiatan);
exports.default = router;
