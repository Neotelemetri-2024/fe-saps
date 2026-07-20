import { Router } from 'express';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import {
  getNotifikasi,
  bacaNotifikasi,
  bacaSemuaNotifikasi,
  getAuditLog,
} from '../controllers/notifikasi.controller';
import {
  dashboardMahasiswa,
  dashboardDosenPA,
  dashboardAdminDitmawa,
  dashboardPimpinanDitmawa,
  dashboardPimpinanFakultas,
  getPortofolio,
} from '../controllers/dashboard.controller';

const router = Router();

// Semua rute umum membutuhkan login
router.use(authenticateJWT);

// Notifikasi (semua role bisa baca notifikasi masing-masing)
router.get('/notifikasi', getNotifikasi);                                                         // GET /api/umum/notifikasi
router.put('/notifikasi/:id/baca', bacaNotifikasi);                                               // PUT /api/umum/notifikasi/:id/baca
router.put('/notifikasi/baca-semua', bacaSemuaNotifikasi);                                        // PUT /api/umum/notifikasi/baca-semua

// Audit Log (hanya Pimpinan & Admin)
router.get('/audit-log', authorizeRole('pimpinan_ditmawa', 'admin_ditmawa'), getAuditLog);        // GET /api/umum/audit-log

// Dashboard per-role
router.get('/dashboard/mahasiswa', authorizeRole('mahasiswa'), dashboardMahasiswa);
router.get('/dashboard/dosen-pa', authorizeRole('dosen'), dashboardDosenPA);
router.get('/dashboard/admin-ditmawa', authorizeRole('admin_ditmawa'), dashboardAdminDitmawa);
router.get('/dashboard/pimpinan-ditmawa', authorizeRole('pimpinan_ditmawa'), dashboardPimpinanDitmawa);
router.get('/dashboard/pimpinan-fakultas', authorizeRole('pimpinan_fakultas'), dashboardPimpinanFakultas);

// Portofolio / CV (mahasiswa + dosen PA + admin bisa lihat)
router.get('/portofolio/:mahasiswaId', authorizeRole('mahasiswa', 'dosen', 'admin_ditmawa'), getPortofolio);

export default router;
