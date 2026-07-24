import { Router } from 'express';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import { getDashboardUKM } from '../controllers/ukm/dashboard.controller';
import {
  getDaftarKegiatanUKM,
  getManajemenPeserta,
  importPesertaUKM,
  downloadTemplatePesertaUKM,
  updatePesertaUKM,
  submitPoinPesertaUKM
} from '../controllers/ukm/kegiatan.controller';

const router = Router();

// Middleware: Hanya role operator_org (UKM/UKMF) yang bisa mengakses rute ini
router.use(authenticateJWT);
router.use(authorizeRole('operator_org'));

// Dashboard UKM
router.get('/dashboard', getDashboardUKM);

// Daftar Kegiatan UKM
router.get('/kegiatan', getDaftarKegiatanUKM);

// Manajemen Peserta per Kegiatan
router.get('/kegiatan/:kegiatanId/peserta', getManajemenPeserta);
router.get('/kegiatan/:kegiatanId/peserta/template', downloadTemplatePesertaUKM);
router.post('/kegiatan/:kegiatanId/peserta/import', importPesertaUKM);
router.put('/kegiatan/:kegiatanId/peserta', updatePesertaUKM);
router.post('/kegiatan/:kegiatanId/peserta/submit', submitPoinPesertaUKM);

export default router;
