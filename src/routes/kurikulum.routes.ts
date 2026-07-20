import { Router } from 'express';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import {
  getAllKurikulum,
  getKurikulumAktif,
  getKurikulumById,
  createKurikulum,
  aktivasiKurikulum,
  createCapaian,
  createSubCapaian,
  nonAktifKurikulum,
  deleteKurikulum,
  updateCapaian,
  deleteCapaian,
  updateSubCapaian,
  deleteSubCapaian,
} from '../controllers/kurikulum.controller';

const router = Router();

// Semua rute kurikulum membutuhkan login
router.use(authenticateJWT);

router.get('/', authorizeRole('pimpinan_ditmawa'), getAllKurikulum);                             // GET /api/kurikulum
router.get('/aktif', getKurikulumAktif);                                                         // GET /api/kurikulum/aktif (semua role)
router.get('/:id', authorizeRole('pimpinan_ditmawa'), getKurikulumById);                         // GET /api/kurikulum/:id
router.post('/', authorizeRole('pimpinan_ditmawa'), createKurikulum);                            // POST /api/kurikulum
router.put('/:id/aktivasi', authorizeRole('pimpinan_ditmawa'), aktivasiKurikulum);               // PUT /api/kurikulum/:id/aktivasi
router.post('/:kurikulumId/capaian', authorizeRole('pimpinan_ditmawa'), createCapaian);          // POST /api/kurikulum/:kurikulumId/capaian
router.post('/capaian/:capaianId/sub-capaian', authorizeRole('pimpinan_ditmawa'), createSubCapaian); // POST /api/kurikulum/capaian/:capaianId/sub-capaian

// New endpoints for Edit & Delete
router.put('/:id/non-aktif', authorizeRole('pimpinan_ditmawa'), nonAktifKurikulum);                // PUT /api/kurikulum/:id/non-aktif
router.delete('/:id', authorizeRole('pimpinan_ditmawa'), deleteKurikulum);                         // DELETE /api/kurikulum/:id

router.put('/capaian/:id', authorizeRole('pimpinan_ditmawa'), updateCapaian);                      // PUT /api/kurikulum/capaian/:id
router.delete('/capaian/:id', authorizeRole('pimpinan_ditmawa'), deleteCapaian);                   // DELETE /api/kurikulum/capaian/:id

router.put('/sub-capaian/:id', authorizeRole('pimpinan_ditmawa'), updateSubCapaian);               // PUT /api/kurikulum/sub-capaian/:id
router.delete('/sub-capaian/:id', authorizeRole('pimpinan_ditmawa'), deleteSubCapaian);            // DELETE /api/kurikulum/sub-capaian/:id
export default router;
