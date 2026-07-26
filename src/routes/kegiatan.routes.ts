import { Router } from 'express';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import {
  getAllKegiatan,
  getKegiatanById,
  createKegiatan,
  editKegiatan,
  ajukanKegiatan,
  getKegiatanForVerifikasi,
  verifikasiKegiatan,
  verifikasiKegiatanBulk,
  publikasiKegiatan,
  hapusKegiatan,
} from '../controllers/admin/ditmawa/kegiatan.controller';
import {
  getKegiatanForApproval,
  approvalKegiatan,
  approvalKegiatanBulk,
} from '../controllers/pimpinan/ditmawa/kegiatan.controller';

const router = Router();

router.use(authenticateJWT);

// ─── BACA ─────────────────────────────────────────────────────────────────────
router.get('/', getAllKegiatan);

// Literal paths BEFORE /:id agar tidak tertangkap sebagai id
router.get('/verifikasi', authorizeRole('admin_ditmawa', 'admin_fakultas'), getKegiatanForVerifikasi);
router.put('/verifikasi-bulk', authorizeRole('admin_ditmawa', 'admin_fakultas'), verifikasiKegiatanBulk);
router.get('/approval', authorizeRole('pimpinan_ditmawa', 'pimpinan_fakultas'), getKegiatanForApproval);
router.put('/approval-bulk', authorizeRole('pimpinan_ditmawa', 'pimpinan_fakultas'), approvalKegiatanBulk);

router.get('/:id', getKegiatanById);

// ─── BUAT / EDIT ──────────────────────────────────────────────────────────────
router.post('/', authorizeRole('operator_org', 'admin_ditmawa', 'admin_fakultas'), createKegiatan);
router.put('/:id', authorizeRole('operator_org', 'admin_ditmawa', 'admin_fakultas'), editKegiatan);
router.put('/:id/ajukan', authorizeRole('operator_org', 'admin_ditmawa', 'admin_fakultas'), ajukanKegiatan);

// ─── VERIFIKASI / APPROVAL PER-ID ─────────────────────────────────────────────
router.put('/:id/verifikasi', authorizeRole('admin_ditmawa', 'admin_fakultas'), verifikasiKegiatan);
router.put('/:id/approval', authorizeRole('pimpinan_ditmawa', 'pimpinan_fakultas'), approvalKegiatan);

// ─── PUBLIKASI & HAPUS ────────────────────────────────────────────────────────
router.put('/:id/publikasi', authorizeRole('operator_org', 'admin_ditmawa', 'admin_fakultas'), publikasiKegiatan);
router.delete('/:id', authorizeRole('admin_ditmawa', 'admin_fakultas'), hapusKegiatan);

export default router;
