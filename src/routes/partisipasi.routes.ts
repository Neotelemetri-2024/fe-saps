import { Router } from 'express';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import {
  daftarKegiatan,
  getMyPartisipasi,
  mintaIzinPA,
  getIzinForDosen,
  putuskanIzinPA,
  createSaranPA,
  getSaranPA,
} from '../controllers/partisipasi.controller';

const router = Router();

// Semua rute partisipasi membutuhkan login
router.use(authenticateJWT);

// Partisipasi (Mahasiswa)
router.post('/', authorizeRole('mahasiswa'), daftarKegiatan);                          // POST /api/partisipasi
router.get('/saya', authorizeRole('mahasiswa'), getMyPartisipasi);                     // GET /api/partisipasi/saya
router.post('/:id/minta-izin', authorizeRole('mahasiswa'), mintaIzinPA);              // POST /api/partisipasi/:id/minta-izin

// Izin PA (Dosen)
router.get('/izin-pa', authorizeRole('dosen'), getIzinForDosen);                      // GET /api/partisipasi/izin-pa
router.put('/izin-pa/:id', authorizeRole('dosen'), putuskanIzinPA);                   // PUT /api/partisipasi/izin-pa/:id

// Saran PA (Dosen menulis, Mahasiswa membaca)
router.post('/saran-pa', authorizeRole('dosen'), createSaranPA);                      // POST /api/partisipasi/saran-pa
router.get('/saran-pa', authorizeRole('mahasiswa', 'dosen'), getSaranPA);             // GET /api/partisipasi/saran-pa

export default router;
