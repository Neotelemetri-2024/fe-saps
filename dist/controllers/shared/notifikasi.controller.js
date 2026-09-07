"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLog = exports.bacaSemuaNotifikasi = exports.bacaNotifikasi = exports.getNotifikasi = void 0;
const prisma_1 = __importDefault(require("../../lib/prisma"));
function getAuthUserId(req) {
    const fromToken = req.user?.id;
    if (fromToken)
        return BigInt(fromToken);
    const fromQuery = req.query.userId;
    if (fromQuery)
        return BigInt(String(fromQuery));
    const fromBody = req.body?.userId;
    if (fromBody != null)
        return BigInt(fromBody);
    return null;
}
// GET /api/umum/notifikasi — Daftar notifikasi pengguna login
const getNotifikasi = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        if (!userId) {
            res
                .status(401)
                .json({ success: false, message: "User tidak terautentikasi" });
            return;
        }
        const { dibaca } = req.query;
        const where = { userId };
        if (dibaca !== undefined)
            where.dibaca = dibaca === "true";
        const data = await prisma_1.default.notifikasi.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: 50,
        });
        const unreadCount = await prisma_1.default.notifikasi.count({
            where: { userId, dibaca: false },
        });
        // BigInt → string agar JSON aman
        const normalized = data.map((n) => ({
            ...n,
            id: String(n.id),
            userId: String(n.userId),
            refId: n.refId != null ? String(n.refId) : null,
        }));
        res.json({ success: true, data: normalized, unreadCount });
    }
    catch (error) {
        console.error(error);
        res
            .status(500)
            .json({ success: false, message: "Terjadi kesalahan pada server" });
    }
};
exports.getNotifikasi = getNotifikasi;
// PUT /api/umum/notifikasi/:id/baca
const bacaNotifikasi = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        if (!userId) {
            res
                .status(401)
                .json({ success: false, message: "User tidak terautentikasi" });
            return;
        }
        const id = BigInt(req.params.id);
        const existing = await prisma_1.default.notifikasi.findFirst({
            where: { id, userId },
        });
        if (!existing) {
            res
                .status(404)
                .json({ success: false, message: "Notifikasi tidak ditemukan" });
            return;
        }
        const updated = await prisma_1.default.notifikasi.update({
            where: { id },
            data: { dibaca: true },
        });
        res.json({
            success: true,
            data: {
                ...updated,
                id: String(updated.id),
                userId: String(updated.userId),
                refId: updated.refId != null ? String(updated.refId) : null,
            },
        });
    }
    catch (error) {
        console.error(error);
        res
            .status(500)
            .json({ success: false, message: "Terjadi kesalahan pada server" });
    }
};
exports.bacaNotifikasi = bacaNotifikasi;
// PUT /api/umum/notifikasi/baca-semua
const bacaSemuaNotifikasi = async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        if (!userId) {
            res
                .status(401)
                .json({ success: false, message: "User tidak terautentikasi" });
            return;
        }
        await prisma_1.default.notifikasi.updateMany({
            where: { userId, dibaca: false },
            data: { dibaca: true },
        });
        res.json({ success: true, message: "Semua notifikasi ditandai dibaca" });
    }
    catch (error) {
        console.error(error);
        res
            .status(500)
            .json({ success: false, message: "Terjadi kesalahan pada server" });
    }
};
exports.bacaSemuaNotifikasi = bacaSemuaNotifikasi;
// ==================== AUDIT LOG ====================
const getAuditLog = async (req, res) => {
    try {
        const { entitas, aktorId, aksi } = req.query;
        const where = {};
        if (entitas)
            where.entitas = entitas;
        if (aktorId)
            where.aktorId = BigInt(aktorId);
        if (aksi)
            where.aksi = { contains: aksi };
        const data = await prisma_1.default.auditLog.findMany({
            where,
            include: {
                aktor: { select: { id: true, nama: true, peran: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
        });
        res.json({ success: true, data });
    }
    catch (error) {
        console.error(error);
        res
            .status(500)
            .json({ success: false, message: "Terjadi kesalahan pada server" });
    }
};
exports.getAuditLog = getAuditLog;
