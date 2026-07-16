import { Router } from 'express';
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
  getPortofolio,
} from '../controllers/dashboard.controller';

const router = Router();

// Notifikasi
router.get('/notifikasi', getNotifikasi);                      // GET /api/umum/notifikasi?userId=X
router.put('/notifikasi/:id/baca', bacaNotifikasi);            // PUT /api/umum/notifikasi/:id/baca
router.put('/notifikasi/baca-semua', bacaSemuaNotifikasi);     // PUT /api/umum/notifikasi/baca-semua

// Audit Log
router.get('/audit-log', getAuditLog);                         // GET /api/umum/audit-log

// Dashboard per-role
router.get('/dashboard/mahasiswa', dashboardMahasiswa);        // GET /api/umum/dashboard/mahasiswa
router.get('/dashboard/dosen-pa', dashboardDosenPA);           // GET /api/umum/dashboard/dosen-pa
router.get('/dashboard/admin-ditmawa', dashboardAdminDitmawa); // GET /api/umum/dashboard/admin-ditmawa
router.get('/dashboard/pimpinan-ditmawa', dashboardPimpinanDitmawa);

// Portofolio / CV
router.get('/portofolio/:mahasiswaId', getPortofolio);         // GET /api/umum/portofolio/:mahasiswaId

export default router;
