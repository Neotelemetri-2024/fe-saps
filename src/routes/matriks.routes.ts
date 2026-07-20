import { Router } from 'express';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import {
  getMatriksPoin,
  upsertMatriksPoin,
  getMatriksHistori,
  getKategori,
  createKategori,
  getSkala,
  createSkala,
  getPeran,
  createPeran,
} from '../controllers/matriks.controller';

const router = Router();

// Semua rute matriks membutuhkan login
router.use(authenticateJWT);

router.get('/', authorizeRole('pimpinan_ditmawa'), getMatriksPoin);                               // GET /api/matriks
router.post('/', authorizeRole('pimpinan_ditmawa'), upsertMatriksPoin);                           // POST /api/matriks
router.get('/histori/:matriksPoinId', authorizeRole('pimpinan_ditmawa'), getMatriksHistori);       // GET /api/matriks/histori/:id

// Master data lookup (Pimpinan Ditmawa)
router.get('/kategori', authorizeRole('pimpinan_ditmawa'), getKategori);                           // GET /api/matriks/kategori
router.post('/kategori', authorizeRole('pimpinan_ditmawa'), createKategori);                       // POST /api/matriks/kategori
router.get('/skala', authorizeRole('pimpinan_ditmawa'), getSkala);                                 // GET /api/matriks/skala
router.post('/skala', authorizeRole('pimpinan_ditmawa'), createSkala);                             // POST /api/matriks/skala
router.get('/peran', authorizeRole('pimpinan_ditmawa'), getPeran);                                 // GET /api/matriks/peran
router.post('/peran', authorizeRole('pimpinan_ditmawa'), createPeran);                             // POST /api/matriks/peran

export default router;
