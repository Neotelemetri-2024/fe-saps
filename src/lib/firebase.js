// Firebase Messaging (FCM) untuk push notification browser
// Isi nilai dari Firebase Console > Project settings > General > Your apps > Web app (</>)
// Di .env frontend:
//   VITE_FIREBASE_API_KEY=...
//   VITE_FIREBASE_AUTH_DOMAIN=...
//   VITE_FIREBASE_PROJECT_ID=saps-1ff5c
//   VITE_FIREBASE_STORAGE_BUCKET=...
//   VITE_FIREBASE_MESSAGING_SENDER_ID=...
//   VITE_FIREBASE_APP_ID=...
//   VITE_FIREBASE_VAPID_KEY=...  (Project settings > Cloud Messaging > Web Push certificates)
//   VITE_API_BASE=...            (sudah ada)

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'saps-1ff5c',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
}

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || ''

export function isFirebaseConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.messagingSenderId && VAPID_KEY)
}

let messagingInstance = null

/**
 * Registrasi service worker + ambil FCM token, lalu kirim ke backend.
 * Dipanggil setelah user login. Gagal diam-diam (tidak mengganggu UX),
 * tapi selalu log ke console supaya mudah didiagnosa.
 */
export async function setupFirebaseMessaging() {
  if (!isFirebaseConfigured()) {
    console.warn('[FCM] Konfigurasi Firebase belum lengkap di .env, setup dilewati.')
    return null
  }
  if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    console.warn('[FCM] Browser tidak mendukung service worker / Notification API.')
    return null
  }
  if (Notification.permission === 'denied') {
    console.warn('[FCM] Izin notifikasi ditolak oleh pengguna sebelumnya.')
    return null
  }

  try {
    const { initializeApp } = await import('firebase/app')
    const { getMessaging, getToken, onMessage } = await import('firebase/messaging')

    const app = initializeApp(firebaseConfig)
    const messaging = getMessaging(app)
    messagingInstance = messaging

    // Service worker adalah file statis, tidak bisa baca import.meta.env langsung,
    // jadi config Firebase dikirim lewat query string saat registrasi.
    const swParams = new URLSearchParams({
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId,
    })
    const registration = await navigator.serviceWorker.register(
      `/firebase-messaging-sw.js?${swParams.toString()}`,
    )
    await navigator.serviceWorker.ready
    console.log('[FCM] Service worker terdaftar.', registration)

    // Minta izin notifikasi kalau belum diminta/ditentukan.
    if (Notification.permission === 'default') {
      const perm = await Notification.requestPermission()
      console.log('[FCM] Hasil permintaan izin notifikasi:', perm)
      if (perm !== 'granted') return null
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    })
    console.log('[FCM] Token perangkat didapat:', token ? `${token.slice(0, 20)}...` : null)

    // Handler untuk notifikasi yang masuk saat tab sedang aktif (foreground).
    // Tanpa ini, notifikasi FCM tidak akan tampil sama sekali saat tab dibuka.
    onMessage(messaging, async (payload) => {
      console.log('[FCM] Notifikasi masuk (foreground):', payload)
      const title = payload?.notification?.title || payload?.data?.title || 'SAPS'
      const body = payload?.notification?.body || payload?.data?.body || ''

      // Tampilkan sebagai toast (sonner) karena tab sedang aktif dilihat user.
      try {
        const { toast } = await import('sonner')
        toast.info(title, { description: body })
      } catch (e) {
        console.warn('[FCM] Gagal menampilkan toast:', e)
      }

      // Sekaligus tampilkan sebagai OS notification kalau tab tidak sedang difokuskan.
      if (Notification.permission === 'granted' && document.visibilityState !== 'visible') {
        try {
          new Notification(title, { body, icon: '/favicon.svg' })
        } catch (e) {
          console.warn('[FCM] Gagal menampilkan Notification foreground:', e)
        }
      }
    })

    return token || null
  } catch (err) {
    console.error('[FCM] Gagal setup FCM:', err)
    return null
  }
}
