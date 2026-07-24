import { Router } from 'express';
import { ajukanIzinPA, getRiwayatIzin, getCatatanPA } from '../controllers/mahasiswa/izin_pa.controller';
import { ajukanKegiatanEksternal, getRiwayatPengajuan } from '../controllers/mahasiswa/kegiatan_eksternal.controller';
import { getKegiatanTersedia, ajukanKlaimEksternal, getRiwayatKlaimEksternal } from '../controllers/mahasiswa/klaim_eksternal.controller';
import { getDashboard, getRiwayatPoin } from '../controllers/mahasiswa/dashboard.controller';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

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
router.post('/klaim-eksternal', ajukanKlaimEksternal);
router.get('/klaim-eksternal', getRiwayatKlaimEksternal);

export default router;
