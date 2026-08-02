import { Router } from 'express';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import {
  getMatriksPoin, upsertMatriksPoin, syncMatriksPoin, getMatriksHistori, getAllMatriksHistori,
  getKategori, createKategori, deleteKategori,
  getSkala, createSkala, updateSkala, deleteSkala, 
  getPeran, createPeran, updatePeran, deletePeran
} from '../controllers/pimpinan/ditmawa/matriks.controller';

const router = Router();

router.use(authenticateJWT);

// Matriks CRUD — hanya Pimpinan Ditmawa
router.get('/', authorizeRole('pimpinan_ditmawa'), getMatriksPoin);
router.post('/', authorizeRole('pimpinan_ditmawa'), upsertMatriksPoin);
router.post('/sync', authorizeRole('pimpinan_ditmawa'), syncMatriksPoin);
router.get('/histori', authorizeRole('pimpinan_ditmawa'), getAllMatriksHistori);
router.get('/histori/:matriksPoinId', authorizeRole('pimpinan_ditmawa'), getMatriksHistori);

// Master data READ — semua role terautentikasi (untuk dropdown FE)
// Filter: GET /skala?kategoriId=X , GET /peran?kategoriId=X
router.get('/kategori', getKategori);
router.get('/skala', getSkala);
router.get('/peran', getPeran);

// Master data WRITE — hanya Pimpinan Ditmawa
router.post('/kategori', authorizeRole('pimpinan_ditmawa'), createKategori);
router.delete('/kategori/:id', authorizeRole('pimpinan_ditmawa'), deleteKategori);
router.post('/skala', authorizeRole('pimpinan_ditmawa'), createSkala);
router.put('/skala/:id', authorizeRole('pimpinan_ditmawa'), updateSkala);
router.delete('/skala/:id', authorizeRole('pimpinan_ditmawa'), deleteSkala);

router.post('/peran', authorizeRole('pimpinan_ditmawa'), createPeran);
router.put('/peran/:id', authorizeRole('pimpinan_ditmawa'), updatePeran);
router.delete('/peran/:id', authorizeRole('pimpinan_ditmawa'), deletePeran);

export default router;
