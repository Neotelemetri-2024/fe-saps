"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKegiatanById = exports.getAllKegiatan = exports.verifikasiKegiatan = exports.getKegiatanForVerifikasi = void 0;
// admin/fakultas/kegiatan.controller.ts
// Fungsi verifikasi kegiatan untuk Admin Fakultas (scope: kegiatan dari UKMF di fakultasnya)
var kegiatan_controller_1 = require("../ditmawa/kegiatan.controller");
Object.defineProperty(exports, "getKegiatanForVerifikasi", { enumerable: true, get: function () { return kegiatan_controller_1.getKegiatanForVerifikasi; } });
Object.defineProperty(exports, "verifikasiKegiatan", { enumerable: true, get: function () { return kegiatan_controller_1.verifikasiKegiatan; } });
Object.defineProperty(exports, "getAllKegiatan", { enumerable: true, get: function () { return kegiatan_controller_1.getAllKegiatan; } });
Object.defineProperty(exports, "getKegiatanById", { enumerable: true, get: function () { return kegiatan_controller_1.getKegiatanById; } });
