import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import path from 'path';
import fs from 'fs';

let isInitialized = false;

/**
 * Inisialisasi Firebase Admin SDK.
 * Membaca file firebase-adminsdk.json dari root project.
 * Jika file tidak ditemukan, FCM tidak akan aktif (graceful degradation).
 */
export function initializeFirebase(): void {
  if (isInitialized) return;

  const serviceAccountPath = path.resolve(process.cwd(), 'firebase-adminsdk.json');

  if (!fs.existsSync(serviceAccountPath)) {
    console.warn('[FCM] ⚠️  File firebase-adminsdk.json tidak ditemukan. Push notification TIDAK aktif.');
    console.warn('[FCM]    Letakkan file tersebut di root folder backend untuk mengaktifkan fitur ini.');
    return;
  }

  try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8')) as ServiceAccount;

    initializeApp({
      credential: cert(serviceAccount),
    });

    isInitialized = true;
    console.log('[FCM] ✅ Firebase Admin SDK berhasil diinisialisasi.');
  } catch (error) {
    console.error('[FCM] ❌ Gagal menginisialisasi Firebase:', error);
  }
}

/**
 * Mengirim push notification ke satu perangkat.
 * Jika Firebase belum diinisialisasi atau token kosong, fungsi ini akan skip secara aman.
 */
export async function sendPushNotification(
  fcmToken: string | null | undefined,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  if (!isInitialized || !fcmToken) return;

  try {
    await getMessaging().send({
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
  } catch (error: any) {
    // Jika token sudah tidak valid (user uninstall app, dll), skip saja
    if (error.code === 'messaging/registration-token-not-registered' ||
        error.code === 'messaging/invalid-registration-token') {
      console.warn(`[FCM] ⚠️  Token tidak valid, dilewati.`);
    } else {
      console.error('[FCM] ❌ Gagal mengirim notifikasi:', error.message);
    }
  }
}

/**
 * Mengirim push notification ke banyak perangkat sekaligus.
 */
export async function sendPushNotificationBatch(
  fcmTokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  if (!isInitialized || fcmTokens.length === 0) return;

  try {
    const messages = fcmTokens.map(token => ({
      token,
      notification: { title, body },
      data: data || {},
    }));

    const response = await getMessaging().sendEach(messages);
    console.log(`[FCM] 📨 Batch: ${response.successCount} berhasil, ${response.failureCount} gagal dari ${fcmTokens.length} perangkat.`);
  } catch (error: any) {
    console.error('[FCM] ❌ Gagal mengirim notifikasi batch:', error.message);
  }
}
