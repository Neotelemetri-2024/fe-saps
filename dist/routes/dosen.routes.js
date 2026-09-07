"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dosen/dashboard.controller");
const persetujuan_controller_1 = require("../controllers/dosen/persetujuan.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Middleware: Hanya role dosen yang bisa mengakses rute ini
router.use(auth_middleware_1.authenticateJWT);
router.use((0, auth_middleware_1.authorizeRole)('dosen'));
// Dashboard
router.get('/dashboard', dashboard_controller_1.getDashboardDosen);
// Mahasiswa Bimbingan - Daftar
router.get('/mahasiswa-bimbingan', dashboard_controller_1.getDaftarMahasiswaBimbingan);
// Mahasiswa Bimbingan - Detail
router.get('/mahasiswa-bimbingan/:mahasiswaId', dashboard_controller_1.getDetailMahasiswa);
// Mahasiswa Perlu Perhatian
router.get('/mahasiswa-perlu-perhatian', dashboard_controller_1.getMahasiswaPerluPerhatian);
// Persetujuan Mahasiswa (izin PA) - dipindahkan dari partisipasi.routes
router.get('/persetujuan', persetujuan_controller_1.getIzinForDosen);
router.put('/persetujuan-bulk', persetujuan_controller_1.putuskanIzinPABulk);
router.put('/persetujuan/:id', persetujuan_controller_1.putuskanIzinPA);
// Saran PA
router.post('/saran', persetujuan_controller_1.createSaranPA);
router.get('/saran', persetujuan_controller_1.getSaranPA);
exports.default = router;
