"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotifikasiService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const fcm_1 = require("../lib/fcm");
/**
 * NotifikasiService: Layanan terpusat untuk mengirim notifikasi.
 * Melakukan 2 hal sekaligus:
 * 1. Menyimpan notifikasi ke database (tabel `notifikasi`).
 * 2. Mengirim push notification via Firebase Cloud Messaging (jika FCM aktif).
 */
exports.NotifikasiService = {
    /**
     * Kirim notifikasi ke SATU user.
     */
    async kirim({ userId, judul, isi, refType, refId }) {
        try {
            // 1. Simpan ke database
            await prisma_1.default.notifikasi.create({
                data: {
                    userId,
                    judul,
                    isi: isi || null,
                    refType: refType || null,
                    refId: refId || null,
                },
            });
            console.log(`[NotifikasiService] Notifikasi in-app tersimpan untuk userId=${userId}: "${judul}"`);
            // 2. Kirim push notification via FCM
            const user = await prisma_1.default.user.findUnique({
                where: { id: userId },
                select: { fcmToken: true },
            });
            if (user?.fcmToken) {
                console.log(`[NotifikasiService] Mengirim push FCM ke userId=${userId}...`);
                await (0, fcm_1.sendPushNotification)(user.fcmToken, judul, isi || judul);
            }
            else {
                console.warn(`[NotifikasiService] userId=${userId} tidak punya fcmToken, push notification dilewati.`);
            }
        }
        catch (error) {
            console.error('[NotifikasiService] Gagal mengirim notifikasi:', error);
        }
    },
    /**
     * Kirim notifikasi ke BANYAK user sekaligus.
     */
    async kirimBatch({ userIds, judul, isi, refType, refId }) {
        if (userIds.length === 0)
            return;
        try {
            // 1. Simpan ke database (batch insert)
            await prisma_1.default.notifikasi.createMany({
                data: userIds.map(uid => ({
                    userId: uid,
                    judul,
                    isi: isi || null,
                    refType: refType || null,
                    refId: refId || null,
                })),
            });
            console.log(`[NotifikasiService] Notifikasi in-app tersimpan untuk ${userIds.length} user: "${judul}"`);
            // 2. Kirim push notification via FCM (batch)
            const users = await prisma_1.default.user.findMany({
                where: { id: { in: userIds } },
                select: { fcmToken: true },
            });
            const tokens = users
                .map(u => u.fcmToken)
                .filter((t) => !!t);
            if (tokens.length > 0) {
                console.log(`[NotifikasiService] Mengirim push FCM batch ke ${tokens.length} dari ${userIds.length} user...`);
                await (0, fcm_1.sendPushNotificationBatch)(tokens, judul, isi || judul);
            }
            else {
                console.warn(`[NotifikasiService] Tidak ada user dari batch ini yang punya fcmToken, push notification dilewati.`);
            }
        }
        catch (error) {
            console.error('[NotifikasiService] Gagal mengirim notifikasi batch:', error);
        }
    },
};
