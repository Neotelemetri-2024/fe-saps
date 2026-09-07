"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKlaimById = exports.validasiKlaimBulk = exports.validasiKlaim = exports.getKlaimForValidasi = void 0;
// admin/fakultas/klaim.controller.ts
// Fungsi validasi klaim untuk Admin Fakultas (scope: klaim dari mahasiswa di fakultasnya)
var klaim_controller_1 = require("../ditmawa/klaim.controller");
Object.defineProperty(exports, "getKlaimForValidasi", { enumerable: true, get: function () { return klaim_controller_1.getKlaimForValidasi; } });
Object.defineProperty(exports, "validasiKlaim", { enumerable: true, get: function () { return klaim_controller_1.validasiKlaim; } });
Object.defineProperty(exports, "validasiKlaimBulk", { enumerable: true, get: function () { return klaim_controller_1.validasiKlaimBulk; } });
Object.defineProperty(exports, "getKlaimById", { enumerable: true, get: function () { return klaim_controller_1.getKlaimById; } });
