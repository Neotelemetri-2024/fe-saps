"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.approvalKegiatan = exports.getKegiatanForApproval = void 0;
// pimpinan/fakultas/kegiatan.controller.ts
// Fungsi approval kegiatan untuk Pimpinan Fakultas (scope: UKMF di fakultasnya + Admin Fakultas)
var kegiatan_controller_1 = require("../ditmawa/kegiatan.controller");
Object.defineProperty(exports, "getKegiatanForApproval", { enumerable: true, get: function () { return kegiatan_controller_1.getKegiatanForApproval; } });
Object.defineProperty(exports, "approvalKegiatan", { enumerable: true, get: function () { return kegiatan_controller_1.approvalKegiatan; } });
