import { Router } from 'express';
import { getDashboardDosen, getDaftarMahasiswaBimbingan, getDetailMahasiswa, getMahasiswaPerluPerhatian } from '../controllers/dosen/dashboard.controller';
import { getIzinForDosen, putuskanIzinPA, createSaranPA, getSaranPA } from '../controllers/dosen/persetujuan.controller';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Middleware: Hanya role dosen yang bisa mengakses rute ini
router.use(authenticateJWT);
router.use(authorizeRole('dosen'));

// Dashboard
router.get('/dashboard', getDashboardDosen);

// Mahasiswa Bimbingan - Daftar
router.get('/mahasiswa-bimbingan', getDaftarMahasiswaBimbingan);

// Mahasiswa Bimbingan - Detail
router.get('/mahasiswa-bimbingan/:mahasiswaId', getDetailMahasiswa);

// Mahasiswa Perlu Perhatian
router.get('/mahasiswa-perlu-perhatian', getMahasiswaPerluPerhatian);

// Persetujuan Mahasiswa (izin PA) - dipindahkan dari partisipasi.routes
router.get('/persetujuan', getIzinForDosen);
router.put('/persetujuan/:id', putuskanIzinPA);

// Saran PA
router.post('/saran', createSaranPA);
router.get('/saran', getSaranPA);

export default router;
