import { get, put } from './apiClient'

const EVENT_NAME = 'saps-data-updated'

export function emitNotifUpdate() {
  try {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { type: 'notifikasi' } }))
  } catch {
    /* ignore */
  }
}

export async function getNotifikasi() {
  const res = await get('/api/umum/notifikasi')
  if (Array.isArray(res?.data)) return res.data
  if (Array.isArray(res)) return res
  return []
}

export async function getUnreadCount() {
  const res = await get('/api/umum/notifikasi')
  return res?.unreadCount ?? 0
}

export async function bacaNotifikasi(id) {
  const res = await put(`/api/umum/notifikasi/${id}/baca`)
  emitNotifUpdate()
  return res?.data || res
}

export async function bacaSemua() {
  const res = await put('/api/umum/notifikasi/baca-semua', {})
  emitNotifUpdate()
  return res?.data || res
}
