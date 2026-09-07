"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLog = exports.bacaSemuaNotifikasi = exports.bacaNotifikasi = exports.getNotifikasi = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// ==================== NOTIFIKASI ====================
// GET /api/notifikasi?userId=X — Daftar notifikasi pengguna
const getNotifikasi = async (req, res) => {
    try {
        const userId = BigInt(req.query.userId);
        const { dibaca } = req.query;
        const where = { userId };
        if (dibaca !== undefined)
            where.dibaca = dibaca === 'true';
        const data = await prisma_1.default.notifikasi.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        const unreadCount = await prisma_1.default.notifikasi.count({
            where: { userId, dibaca: false },
        });
        res.json({ success: true, data, unreadCount });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.getNotifikasi = getNotifikasi;
// PUT /api/notifikasi/:id/baca — Tandai notifikasi sebagai sudah dibaca
const bacaNotifikasi = async (req, res) => {
    try {
        const id = req.params.id;
        const updated = await prisma_1.default.notifikasi.update({
            where: { id: BigInt(id) },
            data: { dibaca: true },
        });
        res.json({ success: true, data: updated });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.bacaNotifikasi = bacaNotifikasi;
// PUT /api/notifikasi/baca-semua — Tandai semua notifikasi sebagai dibaca
const bacaSemuaNotifikasi = async (req, res) => {
    try {
        const userId = BigInt(req.body.userId);
        await prisma_1.default.notifikasi.updateMany({
            where: { userId, dibaca: false },
            data: { dibaca: true },
        });
        res.json({ success: true, message: 'Semua notifikasi ditandai dibaca' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.bacaSemuaNotifikasi = bacaSemuaNotifikasi;
// ==================== AUDIT LOG ====================
// GET /api/audit-log — Daftar audit log (filter: entitas, aktorId)
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
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        res.json({ success: true, data });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.getAuditLog = getAuditLog;
