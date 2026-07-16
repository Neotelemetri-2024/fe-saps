import { Router } from 'express';
import {
  getMatriksPoin,
  upsertMatriksPoin,
  getMatriksHistori,
  getKategori,
  getSkala,
  getPeran,
} from '../controllers/matriks.controller';

const router = Router();

router.get('/', getMatriksPoin);                          // GET /api/matriks
router.post('/', upsertMatriksPoin);                      // POST /api/matriks
router.get('/histori/:matriksPoinId', getMatriksHistori);  // GET /api/matriks/histori/:id

// Master data lookup
router.get('/kategori', getKategori);                     // GET /api/matriks/kategori
router.get('/skala', getSkala);                           // GET /api/matriks/skala
router.get('/peran', getPeran);                           // GET /api/matriks/peran

export default router;
