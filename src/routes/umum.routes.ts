import { Router } from 'express';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import { getNotifikasi, bacaNotifikasi, bacaSemuaNotifikasi, getAuditLog } from '../controllers/shared/notifikasi.controller';
import { dashboardAdminDitmawa } from '../controllers/admin/ditmawa/dashboard.controller';
import { dashboardPimpinanDitmawa } from '../controllers/pimpinan/ditmawa/dashboard.controller';
import { dashboardPimpinanFakultas } from '../controllers/pimpinan/fakultas/dashboard.controller';
import { getDashboardPimpinanUtama, getDetailFakultasPimpinanUtama } from '../controllers/pimpinan/utama/dashboard.controller';
import { getDashboardFakultas } from '../controllers/admin/fakultas/dashboard.controller';
import { getPortofolio } from '../controllers/shared/portofolio.controller';

const router = Router();

router.use(authenticateJWT);

// ─── NOTIFIKASI (semua role) ──────────────────────────────────────────────────
router.get('/notifikasi', getNotifikasi);
router.put('/notifikasi/:id/baca', bacaNotifikasi);
router.put('/notifikasi/baca-semua', bacaSemuaNotifikasi);

// ─── AUDIT LOG (Pimpinan & Admin) ────────────────────────────────────────────
router.get('/audit-log', authorizeRole('pimpinan_ditmawa', 'admin_ditmawa'), getAuditLog);

// ─── DASHBOARD per ROLE ───────────────────────────────────────────────────────
router.get('/dashboard/admin-ditmawa', authorizeRole('admin_ditmawa'), dashboardAdminDitmawa);
router.get('/dashboard/pimpinan-ditmawa', authorizeRole('pimpinan_ditmawa'), dashboardPimpinanDitmawa);
router.get('/dashboard/pimpinan-fakultas', authorizeRole('pimpinan_fakultas'), dashboardPimpinanFakultas);
router.get('/dashboard/pimpinan-utama', authorizeRole('pimpinan_utama'), getDashboardPimpinanUtama);
router.get('/dashboard/pimpinan-utama/fakultas/:id', authorizeRole('pimpinan_utama'), getDetailFakultasPimpinanUtama);
router.get('/dashboard/admin-fakultas', authorizeRole('admin_fakultas'), getDashboardFakultas);

// ─── PORTOFOLIO / CV ──────────────────────────────────────────────────────────
router.get('/portofolio/:mahasiswaId', authorizeRole('mahasiswa', 'dosen', 'admin_ditmawa'), getPortofolio);

export default router;
