import { Router } from 'express';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import {
  getMatriksPoin, upsertMatriksPoin, getMatriksHistori,
  getKategori, createKategori, 
  getSkala, createSkala, updateSkala, deleteSkala, 
  getPeran, createPeran, updatePeran, deletePeran
} from '../controllers/pimpinan/ditmawa/matriks.controller';

const router = Router();

router.use(authenticateJWT);

// Matriks CRUD — hanya Pimpinan Ditmawa
router.get('/', authorizeRole('pimpinan_ditmawa'), getMatriksPoin);
router.post('/', authorizeRole('pimpinan_ditmawa'), upsertMatriksPoin);
router.get('/histori/:matriksPoinId', authorizeRole('pimpinan_ditmawa'), getMatriksHistori);

// Master data (Pimpinan Ditmawa)
router.get('/kategori', authorizeRole('pimpinan_ditmawa'), getKategori);
router.post('/kategori', authorizeRole('pimpinan_ditmawa'), createKategori);
router.get('/skala', authorizeRole('pimpinan_ditmawa'), getSkala);
router.post('/skala', authorizeRole('pimpinan_ditmawa'), createSkala);
router.put('/skala/:id', authorizeRole('pimpinan_ditmawa'), updateSkala);
router.delete('/skala/:id', authorizeRole('pimpinan_ditmawa'), deleteSkala);

router.get('/peran', authorizeRole('pimpinan_ditmawa'), getPeran);
router.post('/peran', authorizeRole('pimpinan_ditmawa'), createPeran);
router.put('/peran/:id', authorizeRole('pimpinan_ditmawa'), updatePeran);
router.delete('/peran/:id', authorizeRole('pimpinan_ditmawa'), deletePeran);

export default router;
