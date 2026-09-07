"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const notifikasi_controller_1 = require("../controllers/shared/notifikasi.controller");
const dashboard_controller_1 = require("../controllers/admin/ditmawa/dashboard.controller");
const dashboard_controller_2 = require("../controllers/pimpinan/ditmawa/dashboard.controller");
const dashboard_controller_3 = require("../controllers/pimpinan/fakultas/dashboard.controller");
const dashboard_controller_4 = require("../controllers/pimpinan/utama/dashboard.controller");
const dashboard_controller_5 = require("../controllers/admin/fakultas/dashboard.controller");
const portofolio_controller_1 = require("../controllers/shared/portofolio.controller");
const referensi_controller_1 = require("../controllers/shared/referensi.controller");
const cv_controller_1 = require("../controllers/mahasiswa/cv.controller");
const router = (0, express_1.Router)();
// Public CV Route (No JWT required)
router.get("/cv/public/:token", cv_controller_1.getPublicCv);
router.use(auth_middleware_1.authenticateJWT);
// ─── REFERENSI MASTER (semua role) ────────────────────────────────────────────
router.get("/fakultas", referensi_controller_1.getFakultas);
router.get("/prodi", referensi_controller_1.getProdi);
router.get("/organisasi", referensi_controller_1.getOrganisasi);
// ─── NOTIFIKASI (semua role) ──────────────────────────────────────────────────
router.get("/notifikasi", notifikasi_controller_1.getNotifikasi);
router.put("/notifikasi/baca-semua", notifikasi_controller_1.bacaSemuaNotifikasi);
router.put("/notifikasi/:id/baca", notifikasi_controller_1.bacaNotifikasi);
// ─── AUDIT LOG (Dinonaktifkan sementara — un-comment jika client meminta diaktifkan kembali) ───
// router.get("/audit-log", authorizeRole("admin_ditmawa", "pimpinan_ditmawa"), getAuditLog);
// ─── DASHBOARD per ROLE ───────────────────────────────────────────────────────
router.get("/dashboard/admin-ditmawa", (0, auth_middleware_1.authorizeRole)("admin_ditmawa"), dashboard_controller_1.dashboardAdminDitmawa);
router.get("/dashboard/pimpinan-ditmawa", (0, auth_middleware_1.authorizeRole)("pimpinan_ditmawa"), dashboard_controller_2.dashboardPimpinanDitmawa);
router.get("/dashboard/pimpinan-fakultas", (0, auth_middleware_1.authorizeRole)("pimpinan_fakultas"), dashboard_controller_3.dashboardPimpinanFakultas);
router.get("/dashboard/pimpinan-utama", (0, auth_middleware_1.authorizeRole)("pimpinan_utama"), dashboard_controller_4.getDashboardPimpinanUtama);
router.get("/dashboard/pimpinan-utama/fakultas/:id", (0, auth_middleware_1.authorizeRole)("pimpinan_utama"), dashboard_controller_4.getDetailFakultasPimpinanUtama);
router.get("/dashboard/admin-fakultas", (0, auth_middleware_1.authorizeRole)("admin_fakultas"), dashboard_controller_5.getDashboardFakultas);
// ─── PORTOFOLIO / CV ──────────────────────────────────────────────────────────
router.get("/portofolio/:mahasiswaId", (0, auth_middleware_1.authorizeRole)("mahasiswa", "dosen", "admin_ditmawa", "pimpinan_ditmawa", "pimpinan_utama"), portofolio_controller_1.getPortofolio);
exports.default = router;
