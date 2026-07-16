import { Router } from 'express';
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
} from '../controllers/kegiatan.controller';

const router = Router();

router.get('/', getAllKegiatan);                           // GET /api/kegiatan
router.get('/verifikasi', getKegiatanForVerifikasi);       // GET /api/kegiatan/verifikasi
router.get('/approval', getKegiatanForApproval);           // GET /api/kegiatan/approval
router.get('/:id', getKegiatanById);                       // GET /api/kegiatan/:id
router.post('/', createKegiatan);                          // POST /api/kegiatan
router.put('/:id/ajukan', ajukanKegiatan);                 // PUT /api/kegiatan/:id/ajukan
router.put('/:id/verifikasi', verifikasiKegiatan);         // PUT /api/kegiatan/:id/verifikasi
router.put('/:id/approval', approvalKegiatan);             // PUT /api/kegiatan/:id/approval
router.put('/:id/publikasi', publikasiKegiatan);           // PUT /api/kegiatan/:id/publikasi

export default router;
