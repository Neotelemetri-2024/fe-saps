import { get, put } from './apiClient'

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
  return res?.data || res
}

export async function bacaSemua() {
  const res = await put('/api/umum/notifikasi/baca-semua', {})
  return res?.data || res
}
