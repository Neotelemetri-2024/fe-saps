"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const matriks_controller_1 = require("../controllers/pimpinan/ditmawa/matriks.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateJWT);
// Matriks CRUD — hanya Pimpinan Ditmawa
router.get('/', (0, auth_middleware_1.authorizeRole)('pimpinan_ditmawa'), matriks_controller_1.getMatriksPoin);
router.post('/', (0, auth_middleware_1.authorizeRole)('pimpinan_ditmawa'), matriks_controller_1.upsertMatriksPoin);
router.post('/sync', (0, auth_middleware_1.authorizeRole)('pimpinan_ditmawa'), matriks_controller_1.syncMatriksPoin);
router.get('/histori', (0, auth_middleware_1.authorizeRole)('pimpinan_ditmawa'), matriks_controller_1.getAllMatriksHistori);
router.get('/histori/:matriksPoinId', (0, auth_middleware_1.authorizeRole)('pimpinan_ditmawa'), matriks_controller_1.getMatriksHistori);
// Master data READ — semua role terautentikasi (untuk dropdown FE)
// Filter: GET /skala?kategoriId=X , GET /peran?kategoriId=X
router.get('/kategori', matriks_controller_1.getKategori);
router.get('/skala', matriks_controller_1.getSkala);
router.get('/peran', matriks_controller_1.getPeran);
// Master data WRITE — hanya Pimpinan Ditmawa
router.post('/kategori', (0, auth_middleware_1.authorizeRole)('pimpinan_ditmawa'), matriks_controller_1.createKategori);
router.delete('/kategori/:id', (0, auth_middleware_1.authorizeRole)('pimpinan_ditmawa'), matriks_controller_1.deleteKategori);
router.post('/skala', (0, auth_middleware_1.authorizeRole)('pimpinan_ditmawa'), matriks_controller_1.createSkala);
router.put('/skala/:id', (0, auth_middleware_1.authorizeRole)('pimpinan_ditmawa'), matriks_controller_1.updateSkala);
router.delete('/skala/:id', (0, auth_middleware_1.authorizeRole)('pimpinan_ditmawa'), matriks_controller_1.deleteSkala);
router.post('/peran', (0, auth_middleware_1.authorizeRole)('pimpinan_ditmawa'), matriks_controller_1.createPeran);
router.put('/peran/:id', (0, auth_middleware_1.authorizeRole)('pimpinan_ditmawa'), matriks_controller_1.updatePeran);
router.delete('/peran/:id', (0, auth_middleware_1.authorizeRole)('pimpinan_ditmawa'), matriks_controller_1.deletePeran);
exports.default = router;
