import { Router } from 'express';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import {
  getAllKurikulum, getKurikulumAktif, getKurikulumById, createKurikulum,
  aktivasiKurikulum, nonAktifKurikulum, deleteKurikulum,
  createCapaian, updateCapaian, deleteCapaian,
  createSubCapaian, updateSubCapaian, deleteSubCapaian,
} from '../controllers/pimpinan/ditmawa/kurikulum.controller';

const router = Router();

router.use(authenticateJWT);

router.get('/', authorizeRole('pimpinan_ditmawa'), getAllKurikulum);
router.get('/aktif', getKurikulumAktif);   // semua role bisa baca kurikulum aktif
router.get('/:id', authorizeRole('pimpinan_ditmawa'), getKurikulumById);
router.post('/', authorizeRole('pimpinan_ditmawa'), createKurikulum);
router.put('/:id/aktivasi', authorizeRole('pimpinan_ditmawa'), aktivasiKurikulum);
router.put('/:id/non-aktif', authorizeRole('pimpinan_ditmawa'), nonAktifKurikulum);
router.delete('/:id', authorizeRole('pimpinan_ditmawa'), deleteKurikulum);

router.post('/:kurikulumId/capaian', authorizeRole('pimpinan_ditmawa'), createCapaian);
router.put('/capaian/:id', authorizeRole('pimpinan_ditmawa'), updateCapaian);
router.delete('/capaian/:id', authorizeRole('pimpinan_ditmawa'), deleteCapaian);

router.post('/capaian/:capaianId/sub-capaian', authorizeRole('pimpinan_ditmawa'), createSubCapaian);
router.put('/sub-capaian/:id', authorizeRole('pimpinan_ditmawa'), updateSubCapaian);
router.delete('/sub-capaian/:id', authorizeRole('pimpinan_ditmawa'), deleteSubCapaian);

export default router;
