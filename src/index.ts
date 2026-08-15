import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

// Fix BigInt serialization in JSON
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// Import Routes
import authRoutes from './routes/auth.routes';
import kurikulumRoutes from './routes/kurikulum.routes';
import matriksRoutes from './routes/matriks.routes';
import kegiatanRoutes from './routes/kegiatan.routes';
import klaimRoutes from './routes/klaim.routes';
import umumRoutes from './routes/umum.routes';
import organisasiRoutes from './routes/organisasi.routes';
import organisasiFakultasRoutes from './routes/organisasi_fakultas.routes';
import pesertaRoutes from './routes/peserta.routes';
import { getPublicCvOgPage, getPublicCvImage } from './controllers/mahasiswa/cv.controller';
import { linkedinCallback } from './controllers/mahasiswa/linkedin.controller';
import { initializeFirebase } from './lib/fcm';

dotenv.config();

// Inisialisasi Firebase Cloud Messaging (Push Notification)
initializeFirebase();

const app = express();
const port = process.env.PORT || 3000;

// ==================== SECURITY MIDDLEWARES ====================
app.use(helmet());

app.use(cors({
  origin: function (origin, callback) {
    callback(null, true); // Allow all origins during development & testing
  },
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 200 : 2000,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', limiter);

// Mencegah hacker mengirim payload raksasa yang membuat server down (DoS)
app.use(express.json({ limit: '10kb' }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// ==================== ROUTES ====================
// Health Check
app.get('/', (req: Request, res: Response) => {
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
app.get('/cv/public/:token', getPublicCvOgPage);
// Gambar kartu ringkasan CV (og:image) yang dirujuk dari halaman og-page di atas.
app.get('/cv/public/:token/image.png', getPublicCvImage);

// OAuth callback LinkedIn — publik, karena LinkedIn redirect browser tidak membawa JWT.
app.get('/api/mahasiswa/linkedin/callback', linkedinCallback);

// ==================== SWAGGER API DOCS ====================
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Auth (Login — Publik, tanpa middleware)
app.use('/api/auth', authRoutes);

// Kurikulum & Matriks Poin (Pimpinan Ditmawa)
app.use('/api/kurikulum', kurikulumRoutes);
app.use('/api/matriks', matriksRoutes);

// Kegiatan & Approval (UKM/UKMF, Admin, Pimpinan)
app.use('/api/kegiatan', kegiatanRoutes);

// Manajemen Peserta Kegiatan (UKM/UKMF, Admin)
app.use('/api/kegiatan', pesertaRoutes);

// Manajemen Organisasi & Akun UKM (Admin)
app.use('/api/organisasi', organisasiRoutes);
app.use('/api/organisasi-fakultas', organisasiFakultasRoutes);

// (Rute partisipasi telah dipindahkan ke dosen.routes.ts dan mahasiswa.routes.ts)

import mahasiswaRoutes from './routes/mahasiswa.routes';
import dosenRoutes from './routes/dosen.routes';
import ukmRoutes from './routes/ukm.routes';

// Klaim Poin & Perolehan (Mahasiswa, Validator, Admin)
app.use('/api/klaim', klaimRoutes);

// Khusus Mahasiswa
app.use('/api/mahasiswa', mahasiswaRoutes);

// Khusus Dosen PA
app.use('/api/dosen', dosenRoutes);

// Khusus Operator UKM
app.use('/api/ukm', ukmRoutes);

// Umum: Notifikasi, Audit Log, Dashboard, Portofolio
app.use('/api/umum', umumRoutes);

// ==================== GLOBAL ERROR HANDLER ====================
app.use((err: any, req: Request, res: Response, next: any) => {
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
