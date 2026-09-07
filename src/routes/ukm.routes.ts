import { Router } from 'express';
import multer from 'multer';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import { getDashboardUKM } from '../controllers/ukm/dashboard.controller';
import {
  getDaftarKegiatanUKM,
  getManajemenPeserta,
  importPesertaUKM,
  downloadTemplatePesertaUKM,
  updatePesertaUKM,
  submitPoinPesertaUKM,
  hapusPesertaUKM,
} from '../controllers/ukm/kegiatan.controller';

const router = Router();
const uploadXlsx = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Middleware: Role operator_org (UKM/UKMF), Admin Ditmawa/Fakultas, dan Pimpinan Ditmawa (Superadmin)
router.use(authenticateJWT);
router.use(authorizeRole('operator_org', 'admin_ditmawa', 'admin_fakultas', 'pimpinan_ditmawa', 'pimpinan_utama'));

// Dashboard UKM
router.get('/dashboard', getDashboardUKM);

// Daftar Kegiatan UKM
router.get('/kegiatan', getDaftarKegiatanUKM);

// Manajemen Peserta per Kegiatan
router.get('/kegiatan/:kegiatanId/peserta', getManajemenPeserta);
router.get('/kegiatan/:kegiatanId/peserta/template', downloadTemplatePesertaUKM);
router.post('/kegiatan/:kegiatanId/peserta/import', uploadXlsx.single('file'), importPesertaUKM);
router.put('/kegiatan/:kegiatanId/peserta', updatePesertaUKM);
router.post('/kegiatan/:kegiatanId/peserta/submit', submitPoinPesertaUKM);
router.delete('/kegiatan/:kegiatanId/peserta/:partisipasiId', hapusPesertaUKM);
router.delete('/kegiatan/:kegiatanId/peserta', hapusPesertaUKM);


export default router;
