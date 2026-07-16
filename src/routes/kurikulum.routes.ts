import { Router } from 'express';
import {
  getAllKurikulum,
  getKurikulumAktif,
  getKurikulumById,
  createKurikulum,
  aktivasiKurikulum,
  createCapaian,
  createSubCapaian,
} from '../controllers/kurikulum.controller';

const router = Router();

router.get('/', getAllKurikulum);                         // GET /api/kurikulum
router.get('/aktif', getKurikulumAktif);                  // GET /api/kurikulum/aktif
router.get('/:id', getKurikulumById);                     // GET /api/kurikulum/:id
router.post('/', createKurikulum);                        // POST /api/kurikulum
router.put('/:id/aktivasi', aktivasiKurikulum);           // PUT /api/kurikulum/:id/aktivasi
router.post('/:kurikulumId/capaian', createCapaian);      // POST /api/kurikulum/:kurikulumId/capaian
router.post('/capaian/:capaianId/sub-capaian', createSubCapaian); // POST /api/kurikulum/capaian/:capaianId/sub-capaian

export default router;
