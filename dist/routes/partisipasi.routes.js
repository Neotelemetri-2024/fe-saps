"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const partisipasi_controller_1 = require("../controllers/partisipasi.controller");
const router = (0, express_1.Router)();
// Semua rute partisipasi membutuhkan login
router.use(auth_middleware_1.authenticateJWT);
// GET /api/partisipasi/saya telah dipindahkan ke endpoint spesifik di /api/mahasiswa/*
// Izin PA (Dosen)
router.get('/izin-pa', (0, auth_middleware_1.authorizeRole)('dosen'), partisipasi_controller_1.getIzinForDosen); // GET /api/partisipasi/izin-pa
router.put('/izin-pa/:id', (0, auth_middleware_1.authorizeRole)('dosen'), partisipasi_controller_1.putuskanIzinPA); // PUT /api/partisipasi/izin-pa/:id
// Saran PA (Dosen menulis, Mahasiswa membaca)
router.post('/saran-pa', (0, auth_middleware_1.authorizeRole)('dosen'), partisipasi_controller_1.createSaranPA); // POST /api/partisipasi/saran-pa
router.get('/saran-pa', (0, auth_middleware_1.authorizeRole)('dosen'), partisipasi_controller_1.getSaranPA); // GET /api/partisipasi/saran-pa (mahasiswa pakai /api/mahasiswa/saran-pa)
exports.default = router;
