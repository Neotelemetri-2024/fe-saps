"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKegiatanById = exports.getAllKegiatan = void 0;
// shared/kegiatan.controller.ts
// Re-exports fungsi read-only kegiatan yang dipakai semua role
var kegiatan_controller_1 = require("../admin/ditmawa/kegiatan.controller");
Object.defineProperty(exports, "getAllKegiatan", { enumerable: true, get: function () { return kegiatan_controller_1.getAllKegiatan; } });
Object.defineProperty(exports, "getKegiatanById", { enumerable: true, get: function () { return kegiatan_controller_1.getKegiatanById; } });
