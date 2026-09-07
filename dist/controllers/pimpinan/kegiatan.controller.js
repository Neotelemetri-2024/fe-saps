"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.approvalKegiatan = exports.getKegiatanForApproval = void 0;
// pimpinan/kegiatan.controller.ts
// Re-exports fungsi approval kegiatan dari admin/kegiatan.controller
// Pimpinan Ditmawa & Pimpinan Fakultas adalah pihak yang memberikan PERSETUJUAN FINAL
var kegiatan_controller_1 = require("../admin/kegiatan.controller");
Object.defineProperty(exports, "getKegiatanForApproval", { enumerable: true, get: function () { return kegiatan_controller_1.getKegiatanForApproval; } });
Object.defineProperty(exports, "approvalKegiatan", { enumerable: true, get: function () { return kegiatan_controller_1.approvalKegiatan; } });
