import { Router } from 'express';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import {
  getAllKegiatan,
  getKegiatanById,
  createKegiatan,
  ajukanKegiatan,
  getKegiatanForVerifikasi,
  verifikasiKegiatan,
  getKegiatanForApproval,
  approvalKegiatan,
  publikasiKegiatan,
  hapusKegiatan,
} from '../controllers/kegiatan.controller';

const router = Router();

// Semua rute kegiatan membutuhkan login
router.use(authenticateJWT);

router.get('/', getAllKegiatan);                                                                    // GET /api/kegiatan (semua role)
router.get('/verifikasi', authorizeRole('admin_ditmawa', 'admin_fakultas'), getKegiatanForVerifikasi); // GET /api/kegiatan/verifikasi
router.get('/approval', authorizeRole('pimpinan_ditmawa', 'pimpinan_fakultas'), getKegiatanForApproval); // GET /api/kegiatan/approval
router.get('/:id', getKegiatanById);                                                               // GET /api/kegiatan/:id (semua role)
router.post('/', authorizeRole('operator_org', 'admin_ditmawa', 'admin_fakultas'), createKegiatan);                   // POST /api/kegiatan
router.put('/:id/ajukan', authorizeRole('operator_org'), ajukanKegiatan);                           // PUT /api/kegiatan/:id/ajukan
router.put('/:id/verifikasi', authorizeRole('admin_ditmawa', 'admin_fakultas'), verifikasiKegiatan);                  // PUT /api/kegiatan/:id/verifikasi
router.put('/:id/approval', authorizeRole('pimpinan_ditmawa', 'pimpinan_fakultas'), approvalKegiatan);                   // PUT /api/kegiatan/:id/approval
router.put('/:id/publikasi', authorizeRole('operator_org', 'admin_ditmawa', 'admin_fakultas'), publikasiKegiatan);    // PUT /api/kegiatan/:id/publikasi
router.delete('/:id', authorizeRole('admin_ditmawa', 'admin_fakultas'), hapusKegiatan);                               // DELETE /api/kegiatan/:id

export default router;
