"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const kegiatan_controller_1 = require("../controllers/ukm/kegiatan.controller");
const router = (0, express_1.Router)();
const uploadXlsx = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
// Semua rute peserta membutuhkan login
router.use(auth_middleware_1.authenticateJWT);
// GET /api/kegiatan/:id/peserta — Daftar peserta kegiatan
router.get('/:id/peserta', (0, auth_middleware_1.authorizeRole)('operator_org', 'admin_ditmawa', 'admin_fakultas', 'pimpinan_ditmawa', 'pimpinan_utama'), kegiatan_controller_1.getManajemenPeserta);
// GET /api/kegiatan/:id/peserta/search — Cari mahasiswa yang belum terdaftar
router.get('/:id/peserta/search', (0, auth_middleware_1.authorizeRole)('operator_org', 'admin_ditmawa', 'admin_fakultas', 'pimpinan_ditmawa', 'pimpinan_utama'), kegiatan_controller_1.cariMahasiswaPeserta);
// POST /api/kegiatan/:id/peserta — Tambah peserta manual
router.post('/:id/peserta', (0, auth_middleware_1.authorizeRole)('operator_org', 'admin_ditmawa', 'admin_fakultas', 'pimpinan_ditmawa', 'pimpinan_utama'), kegiatan_controller_1.tambahPesertaManual);
// GET /api/kegiatan/:id/peserta/template — Download CSV template
router.get('/:id/peserta/template', (0, auth_middleware_1.authorizeRole)('operator_org', 'admin_ditmawa', 'admin_fakultas', 'pimpinan_ditmawa', 'pimpinan_utama'), kegiatan_controller_1.downloadTemplatePesertaUKM);
// POST /api/kegiatan/:id/peserta/import — Import peserta dari Excel (.xlsx)
router.post('/:id/peserta/import', (0, auth_middleware_1.authorizeRole)('operator_org', 'admin_ditmawa', 'admin_fakultas', 'pimpinan_ditmawa', 'pimpinan_utama'), uploadXlsx.single('file'), kegiatan_controller_1.importPesertaUKM);
// POST /api/kegiatan/:id/peserta/submit-poin — Submit & cetak poin otomatis
router.post('/:id/peserta/submit-poin', (0, auth_middleware_1.authorizeRole)('operator_org', 'admin_ditmawa', 'admin_fakultas', 'pimpinan_ditmawa', 'pimpinan_utama'), kegiatan_controller_1.submitPoinPesertaUKM);
// POST /api/kegiatan/:id/peserta/submit — Alias untuk submit poin
router.post('/:id/peserta/submit', (0, auth_middleware_1.authorizeRole)('operator_org', 'admin_ditmawa', 'admin_fakultas', 'pimpinan_ditmawa', 'pimpinan_utama'), kegiatan_controller_1.submitPoinPesertaUKM);
// PUT /api/kegiatan/:id/peserta/update — Update kehadiran & peran peserta
router.put('/:id/peserta/update', (0, auth_middleware_1.authorizeRole)('operator_org', 'admin_ditmawa', 'admin_fakultas', 'pimpinan_ditmawa', 'pimpinan_utama'), kegiatan_controller_1.updatePesertaUKM);
// PUT /api/kegiatan/:id/peserta — Alias untuk update kehadiran & peran peserta
router.put('/:id/peserta', (0, auth_middleware_1.authorizeRole)('operator_org', 'admin_ditmawa', 'admin_fakultas', 'pimpinan_ditmawa', 'pimpinan_utama'), kegiatan_controller_1.updatePesertaUKM);
// POST /api/kegiatan/:id/peserta/tambah — Tambah peserta satu per satu (manual, alias)
router.post('/:id/peserta/tambah', (0, auth_middleware_1.authorizeRole)('operator_org', 'admin_ditmawa', 'admin_fakultas', 'pimpinan_ditmawa', 'pimpinan_utama'), kegiatan_controller_1.tambahPesertaManual);
// DELETE /api/kegiatan/:id/peserta/:partisipasiId — Hapus peserta dari kegiatan
router.delete('/:id/peserta/:partisipasiId', (0, auth_middleware_1.authorizeRole)('operator_org', 'admin_ditmawa', 'admin_fakultas', 'pimpinan_ditmawa', 'pimpinan_utama'), kegiatan_controller_1.hapusPeserta);
// DELETE /api/kegiatan/:id/peserta — Hapus peserta (query / body)
router.delete('/:id/peserta', (0, auth_middleware_1.authorizeRole)('operator_org', 'admin_ditmawa', 'admin_fakultas', 'pimpinan_ditmawa', 'pimpinan_utama'), kegiatan_controller_1.hapusPeserta);
exports.default = router;
