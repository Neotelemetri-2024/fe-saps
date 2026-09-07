"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const yamljs_1 = __importDefault(require("yamljs"));
const path_1 = __importDefault(require("path"));
// Fix BigInt serialization in JSON
BigInt.prototype.toJSON = function () {
    return this.toString();
};
// Import Routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const kurikulum_routes_1 = __importDefault(require("./routes/kurikulum.routes"));
const matriks_routes_1 = __importDefault(require("./routes/matriks.routes"));
const kegiatan_routes_1 = __importDefault(require("./routes/kegiatan.routes"));
const klaim_routes_1 = __importDefault(require("./routes/klaim.routes"));
const umum_routes_1 = __importDefault(require("./routes/umum.routes"));
const organisasi_routes_1 = __importDefault(require("./routes/organisasi.routes"));
const organisasi_fakultas_routes_1 = __importDefault(require("./routes/organisasi_fakultas.routes"));
const peserta_routes_1 = __importDefault(require("./routes/peserta.routes"));
const cv_controller_1 = require("./controllers/mahasiswa/cv.controller");
const linkedin_controller_1 = require("./controllers/mahasiswa/linkedin.controller");
const fcm_1 = require("./lib/fcm");
dotenv_1.default.config();
// Inisialisasi Firebase Cloud Messaging (Push Notification)
(0, fcm_1.initializeFirebase)();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Di balik proxy/ngrok, header X-Forwarded-For dipakai rate-limit untuk IP client
app.set('trust proxy', 1);
// ==================== SECURITY MIDDLEWARES ====================
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        callback(null, true); // Allow all origins during development & testing
    },
    credentials: true
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 200 : 2000,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);
// Mencegah hacker mengirim payload raksasa yang membuat server down (DoS)
app.use(express_1.default.json({ limit: '10kb' }));
// Serve uploaded files statically
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// ==================== ROUTES ====================
// Health Check
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to MyUnand Student Connect API!',
        version: '2.0.0',
        schema: '29 tabel — arsitektur baru',
        endpoints: {
            auth: '/api/auth',
            kurikulum: '/api/kurikulum',
            matriks: '/api/matriks',
            kegiatan: '/api/kegiatan',
            partisipasi: '/api/partisipasi',
            klaim: '/api/klaim',
            notifikasi: '/api/umum/notifikasi',
            auditLog: '/api/umum/audit-log',
            dashboard: '/api/umum/dashboard/{role}',
            portofolio: '/api/umum/portofolio/{mahasiswaId}',
        },
    });
});
// Halaman "og-page" CV publik — target link share LinkedIn (lihat cv.controller.ts).
// Didaftarkan di root (bukan /api) karena URL ini yang di-crawl LinkedIn/Facebook/dll
// dan dibagikan langsung ke pengguna. Bot dilayani HTML + meta OG; manusia di-redirect ke SPA.
app.get('/cv/public/:token', cv_controller_1.getPublicCvOgPage);
// Gambar kartu ringkasan CV (og:image) yang dirujuk dari halaman og-page di atas.
app.get('/cv/public/:token/image.png', cv_controller_1.getPublicCvImage);
// OAuth callback LinkedIn — publik, karena LinkedIn redirect browser tidak membawa JWT.
app.get('/api/mahasiswa/linkedin/callback', linkedin_controller_1.linkedinCallback);
// ==================== SWAGGER API DOCS ====================
const swaggerDocument = yamljs_1.default.load(path_1.default.join(__dirname, 'swagger.yaml'));
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocument));
// Auth (Login — Publik, tanpa middleware)
app.use('/api/auth', auth_routes_1.default);
// Kurikulum & Matriks Poin (Pimpinan Ditmawa)
app.use('/api/kurikulum', kurikulum_routes_1.default);
app.use('/api/matriks', matriks_routes_1.default);
// Kegiatan & Approval (UKM/UKMF, Admin, Pimpinan)
app.use('/api/kegiatan', kegiatan_routes_1.default);
// Manajemen Peserta Kegiatan (UKM/UKMF, Admin)
app.use('/api/kegiatan', peserta_routes_1.default);
// Manajemen Organisasi & Akun UKM (Admin)
app.use('/api/organisasi', organisasi_routes_1.default);
app.use('/api/organisasi-fakultas', organisasi_fakultas_routes_1.default);
// (Rute partisipasi telah dipindahkan ke dosen.routes.ts dan mahasiswa.routes.ts)
const mahasiswa_routes_1 = __importDefault(require("./routes/mahasiswa.routes"));
const dosen_routes_1 = __importDefault(require("./routes/dosen.routes"));
const ukm_routes_1 = __importDefault(require("./routes/ukm.routes"));
// Klaim Poin & Perolehan (Mahasiswa, Validator, Admin)
app.use('/api/klaim', klaim_routes_1.default);
// Khusus Mahasiswa
app.use('/api/mahasiswa', mahasiswa_routes_1.default);
// Khusus Dosen PA
app.use('/api/dosen', dosen_routes_1.default);
// Khusus Operator UKM
app.use('/api/ukm', ukm_routes_1.default);
// Umum: Notifikasi, Audit Log, Dashboard, Portofolio
app.use('/api/umum', umum_routes_1.default);
// Laporan & Evaluasi Pimpinan (Excel, PDF, Preview)
const laporan_routes_1 = __importDefault(require("./routes/laporan.routes"));
app.use('/api/pimpinan/laporan', laporan_routes_1.default);
// Monitoring IKU 3 Kemdiktisaintek Berdampak 2026
const iku3_routes_1 = __importDefault(require("./routes/iku3.routes"));
app.use('/api/iku3', iku3_routes_1.default); // Prisma client must include Iku3Target / Iku3BobotRule
// ==================== GLOBAL ERROR HANDLER ====================
app.use((err, req, res, next) => {
    console.error('[ERROR]', err?.stack || err?.message || err);
    res.status(err?.status || 500).json({
        success: false,
        message: err?.message || 'Terjadi kesalahan internal server',
    });
});
// ==================== START SERVER ====================
app.listen(port, () => {
    console.log(`[server]: MyUnand Student Connect API v2.0`);
    console.log(`[server]: Running at http://localhost:${port}`);
    console.log(`[server]: Swagger UI at http://localhost:${port}/api-docs`);
    console.log(`[server]: Schema: 29 tabel (MySQL)`);
});
