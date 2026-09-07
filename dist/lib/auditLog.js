"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = logAudit;
const prisma_1 = __importDefault(require("./prisma"));
/**
 * Helper: Mencatat setiap transisi status ke tabel audit_log [BR-027]
 */
async function logAudit(input) {
    try {
        await prisma_1.default.auditLog.create({
            data: {
                entitas: input.entitas,
                entitasId: BigInt(input.entitasId),
                aksi: input.aksi,
                statusLama: input.statusLama ?? null,
                statusBaru: input.statusBaru ?? null,
                aktorId: input.aktorId ? BigInt(input.aktorId) : null,
            },
        });
    }
    catch (error) {
        console.error('[AuditLog] Gagal mencatat audit log:', error);
        // Jangan throw — audit log failure tidak boleh menggagalkan transaksi utama
    }
}
