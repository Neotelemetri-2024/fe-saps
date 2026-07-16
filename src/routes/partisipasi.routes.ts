import { Router } from 'express';
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

// Partisipasi
router.post('/', daftarKegiatan);                          // POST /api/partisipasi
router.get('/saya', getMyPartisipasi);                     // GET /api/partisipasi/saya?mahasiswaId=X
router.post('/:id/minta-izin', mintaIzinPA);               // POST /api/partisipasi/:id/minta-izin

// Izin PA (Dosen)
router.get('/izin-pa', getIzinForDosen);                   // GET /api/partisipasi/izin-pa?dosenPaId=X
router.put('/izin-pa/:id', putuskanIzinPA);                // PUT /api/partisipasi/izin-pa/:id

// Saran PA
router.post('/saran-pa', createSaranPA);                   // POST /api/partisipasi/saran-pa
router.get('/saran-pa', getSaranPA);                       // GET /api/partisipasi/saran-pa?mahasiswaId=X

export default router;
