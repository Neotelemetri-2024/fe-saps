import { Router } from 'express';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import {
  getDashboardIku3,
  getTrendIku3,
  getFacultiesIku3,
  getActivitiesIku3,
  getTargetsIku3,
  upsertTargetIku3,
  getRulesIku3,
  updateRuleIku3,
} from '../controllers/iku3/iku3.controller';

const router = Router();

// Seluruh endpoint IKU 3 wajib autentikasi JWT
router.use(authenticateJWT);

const VIEW_ROLES = [
  'pimpinan_utama',
  'pimpinan_ditmawa',
  'admin_ditmawa',
  'pimpinan_fakultas',
  'admin_fakultas',
];

// 1. Dashboard, Tren, Peringkat Fakultas, & Detail Kegiatan
router.get('/dashboard', authorizeRole(...VIEW_ROLES), getDashboardIku3);
router.get('/trend', authorizeRole(...VIEW_ROLES), getTrendIku3);
router.get('/faculties', authorizeRole(...VIEW_ROLES), getFacultiesIku3);
router.get('/activities', authorizeRole(...VIEW_ROLES), getActivitiesIku3);

// 2. Pembacaan Target & Aturan Bobot
router.get('/targets', authorizeRole(...VIEW_ROLES), getTargetsIku3);
router.get('/rules', authorizeRole(...VIEW_ROLES), getRulesIku3);

// 3. Manajemen Target Tahunan (Khusus Ditmawa)
router.post('/targets', authorizeRole('pimpinan_ditmawa', 'admin_ditmawa'), upsertTargetIku3);

// 4. Manajemen Bobot Dinamis (Khusus Super Admin Pimpinan Ditmawa)
router.put('/rules/:id', authorizeRole('pimpinan_ditmawa'), updateRuleIku3);

export default router;
