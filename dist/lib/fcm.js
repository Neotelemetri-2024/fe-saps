"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeFirebase = initializeFirebase;
exports.sendPushNotification = sendPushNotification;
exports.sendPushNotificationBatch = sendPushNotificationBatch;
const app_1 = require("firebase-admin/app");
const messaging_1 = require("firebase-admin/messaging");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
let isInitialized = false;
/**
 * Inisialisasi Firebase Admin SDK.
 * Membaca file firebase-adminsdk.json dari root project.
 * Jika file tidak ditemukan, FCM tidak akan aktif (graceful degradation).
 */
function initializeFirebase() {
    if (isInitialized)
        return;
    const serviceAccountPath = path_1.default.resolve(process.cwd(), 'firebase-adminsdk.json');
    if (!fs_1.default.existsSync(serviceAccountPath)) {
        console.warn('[FCM] ⚠️  File firebase-adminsdk.json tidak ditemukan. Push notification TIDAK aktif.');
        console.warn('[FCM]    Letakkan file tersebut di root folder backend untuk mengaktifkan fitur ini.');
        return;
    }
    try {
        const serviceAccount = JSON.parse(fs_1.default.readFileSync(serviceAccountPath, 'utf8'));
        (0, app_1.initializeApp)({
            credential: (0, app_1.cert)(serviceAccount),
        });
        isInitialized = true;
        console.log('[FCM] ✅ Firebase Admin SDK berhasil diinisialisasi.');
    }
    catch (error) {
        console.error('[FCM] ❌ Gagal menginisialisasi Firebase:', error);
    }
}
/**
 * Mengirim push notification ke satu perangkat.
 * Jika Firebase belum diinisialisasi atau token kosong, fungsi ini akan skip secara aman.
 */
async function sendPushNotification(fcmToken, title, body, data) {
    if (!isInitialized) {
        console.warn('[FCM] Dilewati: Firebase Admin SDK belum terinisialisasi (cek firebase-adminsdk.json).');
        return;
    }
    if (!fcmToken) {
        console.warn('[FCM] Dilewati: user penerima tidak punya fcmToken tersimpan di database.');
        return;
    }
    try {
        await (0, messaging_1.getMessaging)().send({
            token: fcmToken,
            notification: { title, body },
            data: data || {},
            webpush: {
                notification: {
                    icon: '/favicon.ico',
                    badge: '/favicon.ico',
                },
            },
        });
        console.log(`[FCM] 📨 Notifikasi terkirim ke token: ${fcmToken.substring(0, 20)}...`);
    }
    catch (error) {
        // Jika token sudah tidak valid (user uninstall app, dll), skip saja
        if (error.code === 'messaging/registration-token-not-registered' ||
            error.code === 'messaging/invalid-registration-token') {
            console.warn(`[FCM] ⚠️  Token tidak valid, dilewati.`);
        }
        else {
            console.error('[FCM] ❌ Gagal mengirim notifikasi:', error.message);
        }
    }
}
/**
 * Mengirim push notification ke banyak perangkat sekaligus.
 */
async function sendPushNotificationBatch(fcmTokens, title, body, data) {
    if (!isInitialized || fcmTokens.length === 0)
        return;
    try {
        const messages = fcmTokens.map(token => ({
            token,
            notification: { title, body },
            data: data || {},
        }));
        const response = await (0, messaging_1.getMessaging)().sendEach(messages);
        console.log(`[FCM] 📨 Batch: ${response.successCount} berhasil, ${response.failureCount} gagal dari ${fcmTokens.length} perangkat.`);
    }
    catch (error) {
        console.error('[FCM] ❌ Gagal mengirim notifikasi batch:', error.message);
    }
}
