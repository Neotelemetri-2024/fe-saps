import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ajukanIzinPA, getRiwayatIzin, getCatatanPA } from '../controllers/mahasiswa/izin_pa.controller';
import { ajukanKegiatanEksternal, getRiwayatPengajuan } from '../controllers/mahasiswa/kegiatan_eksternal.controller';
import { getKegiatanTersedia, ajukanKlaimEksternal, getRiwayatKlaimEksternal } from '../controllers/mahasiswa/klaim_eksternal.controller';
import { getDashboard, getRiwayatPoin } from '../controllers/mahasiswa/dashboard.controller';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Setup Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Maks 10MB
});

// Middleware: Hanya role mahasiswa yang bisa mengakses rute ini
router.use(authenticateJWT);
router.use(authorizeRole('mahasiswa'));

// Dashboard
router.get('/dashboard', getDashboard);

// Riwayat Poin
router.get('/riwayat-poin', getRiwayatPoin);

// Izin Dosen PA
router.post('/izin-pa', ajukanIzinPA);
router.get('/izin-pa', getRiwayatIzin);
router.get('/saran-pa', getCatatanPA);


// Pengajuan Kegiatan Eksternal
router.post('/kegiatan-eksternal', ajukanKegiatanEksternal);
router.get('/kegiatan-eksternal', getRiwayatPengajuan);

// Klaim Poin Eksternal
router.get('/klaim-eksternal/kegiatan-tersedia', getKegiatanTersedia);
router.post('/klaim-eksternal', upload.single('bukti'), ajukanKlaimEksternal);
router.get('/klaim-eksternal', getRiwayatKlaimEksternal);

export default router;
