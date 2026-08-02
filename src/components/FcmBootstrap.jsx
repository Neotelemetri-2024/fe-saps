import { useEffect, useRef } from 'react'
import { setupFirebaseMessaging, isFirebaseConfigured } from '../lib/firebase'
import { put } from '../services/apiClient'

/**
 * Bootstrap FCM: setelah user login, daftarkan service worker,
 * ambil FCM token, lalu simpan ke backend via PUT /api/auth/fcm-token.
 * Tidak mengganggu UX — semua kegagalan ditangani diam-diam.
 */
export default function FcmBootstrap() {
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    let raw = null
    try {
      raw = JSON.parse(localStorage.getItem('saps_current_user') || 'null')
    } catch {
      raw = null
    }
    if (!raw?.token) return
    if (!isFirebaseConfigured()) return

    let cancelled = false
    ;(async () => {
      const token = await setupFirebaseMessaging()
      if (cancelled || !token) return
      try {
        await put('/api/auth/fcm-token', { fcmToken: token })
      } catch {
        // Non-fatal: token gagal disimpan, coba lagi di kunjungan berikutnya
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return null
}
