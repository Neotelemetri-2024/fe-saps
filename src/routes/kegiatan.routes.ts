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

// ─── BACA (Semua role) ────────────────────────────────────────────────────────
router.get('/', getAllKegiatan);
router.get('/:id', getKegiatanById);

// ─── BUAT KEGIATAN (UKM/UKMF, Admin Ditmawa, Admin Fakultas) ─────────────────
router.post('/', authorizeRole('operator_org', 'admin_ditmawa', 'admin_fakultas'), createKegiatan);
router.put('/:id', authorizeRole('operator_org', 'admin_ditmawa', 'admin_fakultas'), editKegiatan);

// ─── AJUKAN ke Admin (UKM/UKMF dan Admin yang buat kegiatan) ─────────────────
router.put('/:id/ajukan', authorizeRole('operator_org', 'admin_ditmawa', 'admin_fakultas'), ajukanKegiatan);

// ─── ADMIN DITMAWA / ADMIN FAKULTAS: Verifikasi ──────────────────────────────
// UKM → Admin Ditmawa verifikasi → Pimpinan Ditmawa approval
// UKMF → Admin Fakultas verifikasi → Pimpinan Fakultas approval
router.get('/verifikasi', authorizeRole('admin_ditmawa', 'admin_fakultas'), getKegiatanForVerifikasi);
router.put('/verifikasi-bulk', authorizeRole('admin_ditmawa', 'admin_fakultas'), verifikasiKegiatanBulk);
router.put('/:id/verifikasi', authorizeRole('admin_ditmawa', 'admin_fakultas'), verifikasiKegiatan);

// ─── PIMPINAN DITMAWA / PIMPINAN FAKULTAS: Approval Final ────────────────────
router.get('/approval', authorizeRole('pimpinan_ditmawa', 'pimpinan_fakultas'), getKegiatanForApproval);
router.put('/approval-bulk', authorizeRole('pimpinan_ditmawa', 'pimpinan_fakultas'), approvalKegiatanBulk);
router.put('/:id/approval', authorizeRole('pimpinan_ditmawa', 'pimpinan_fakultas'), approvalKegiatan);

// ─── PUBLIKASI & HAPUS ────────────────────────────────────────────────────────
router.put('/:id/publikasi', authorizeRole('operator_org', 'admin_ditmawa', 'admin_fakultas'), publikasiKegiatan);
router.delete('/:id', authorizeRole('admin_ditmawa', 'admin_fakultas'), hapusKegiatan);

export default router;
