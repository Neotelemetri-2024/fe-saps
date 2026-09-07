"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const izin_pa_controller_1 = require("../controllers/mahasiswa/izin_pa.controller");
const kegiatan_eksternal_controller_1 = require("../controllers/mahasiswa/kegiatan_eksternal.controller");
const klaim_eksternal_controller_1 = require("../controllers/mahasiswa/klaim_eksternal.controller");
const dashboard_controller_1 = require("../controllers/mahasiswa/dashboard.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const cv_controller_1 = require("../controllers/mahasiswa/cv.controller");
const linkedin_controller_1 = require("../controllers/mahasiswa/linkedin.controller");
const router = (0, express_1.Router)();
// Setup Multer storage
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        const dir = path_1.default.join(__dirname, '../../uploads');
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // Maks 10MB
});
// Middleware: Hanya role mahasiswa yang bisa mengakses rute ini
router.use(auth_middleware_1.authenticateJWT);
router.use((0, auth_middleware_1.authorizeRole)('mahasiswa'));
// Dashboard
router.get('/dashboard', dashboard_controller_1.getDashboard);
// Riwayat Poin
router.get('/riwayat-poin', dashboard_controller_1.getRiwayatPoin);
// Riwayat Kegiatan Internal
router.get('/riwayat-kegiatan-internal', dashboard_controller_1.getRiwayatKegiatanInternal);
// Izin Dosen PA
router.post('/izin-pa', izin_pa_controller_1.ajukanIzinPA);
router.get('/izin-pa', izin_pa_controller_1.getRiwayatIzin);
router.get('/saran-pa', izin_pa_controller_1.getCatatanPA);
// Pengajuan Kegiatan Eksternal
router.get('/kegiatan-eksternal', kegiatan_eksternal_controller_1.getRiwayatPengajuan);
router.post('/kegiatan-eksternal', kegiatan_eksternal_controller_1.ajukanKegiatanEksternal);
router.post('/kegiatan-eksternal/draft', kegiatan_eksternal_controller_1.simpanDraftKegiatanEksternal);
router.put('/kegiatan-eksternal/:id/draft', kegiatan_eksternal_controller_1.editDraftKegiatanEksternal);
router.delete('/kegiatan-eksternal/:id/draft', kegiatan_eksternal_controller_1.hapusDraftKegiatanEksternal);
router.put('/kegiatan-eksternal/:id/ajukan', kegiatan_eksternal_controller_1.ajukanDraftKegiatanEksternal);
// Klaim Poin Eksternal
router.get('/klaim-eksternal/kegiatan-tersedia', klaim_eksternal_controller_1.getKegiatanTersedia);
router.post('/klaim-eksternal', upload.single('bukti'), klaim_eksternal_controller_1.ajukanKlaimEksternal);
router.get('/klaim-eksternal', klaim_eksternal_controller_1.getRiwayatKlaimEksternal);
// CV & Portofolio
router.get('/cv', cv_controller_1.getPrivateCv);
router.post('/cv/generate-link', cv_controller_1.generatePublicCvToken);
// Share native ke LinkedIn (OAuth + Posts API)
router.get('/linkedin/status', linkedin_controller_1.getLinkedInStatus);
router.get('/linkedin/connect', linkedin_controller_1.connectLinkedIn);
router.delete('/linkedin/disconnect', linkedin_controller_1.disconnectLinkedIn);
router.post('/linkedin/share', linkedin_controller_1.shareCvToLinkedIn);
exports.default = router;
