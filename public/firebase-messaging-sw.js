// Service Worker Firebase Messaging — menampilkan push notification di latar belakang.
// Config di-inject saat registrasi dari src/lib/firebase.js lewat query string
// (service worker adalah file statis, tidak bisa baca import.meta.env / .env langsung).
importScripts('https://www.gstatic.com/firebasejs/11.5.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/11.5.0/firebase-messaging-compat.js')

const swQuery = new URLSearchParams(self.location.search)

const firebaseConfig = {
  apiKey: swQuery.get('apiKey') || '',
  authDomain: swQuery.get('authDomain') || '',
  projectId: swQuery.get('projectId') || 'saps-1ff5c',
  storageBucket: swQuery.get('storageBucket') || '',
  messagingSenderId: swQuery.get('messagingSenderId') || '',
  appId: swQuery.get('appId') || '',
}

if (firebaseConfig.apiKey && firebaseConfig.messagingSenderId) {
  firebase.initializeApp(firebaseConfig)

  const messaging = firebase.messaging()

  messaging.onBackgroundMessage((payload) => {
    console.log('[FCM][SW] Notifikasi masuk (background):', payload)
    const notification = payload?.notification || {}
    const data = payload?.data || {}
    const title = notification.title || data.title || 'SAPS'
    const body = notification.body || data.body || ''
    const icon = notification.icon || data.icon || '/favicon.svg'

    self.registration.showNotification(title, {
      body,
      icon,
      badge: '/favicon.svg',
      data: { url: data.url || '/' },
    })
  })
} else {
  console.warn('[FCM][SW] Config Firebase kosong saat registrasi service worker, FCM tidak diinisialisasi.')
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus()
      }
      return clients.openWindow(url)
    }),
  )
})
