import { get, post, put, del } from './apiClient'

function normalizeAkun(item, i = 0) {
  const statusRaw = item.status
  const aktif = statusRaw === true || statusRaw === 'aktif' || statusRaw === 'Aktif'
  return {
    ...item,
    id: item.userId ?? item.id ?? i,
    userId: item.userId ?? item.id,
    nama: item.namaUkm || item.nama || '-',
    namaUkm: item.namaUkm || item.nama || '-',
    email: item.email || '-',
    status: aktif ? 'aktif' : 'nonaktif',
    aktif,
  }
}

/** GET /api/organisasi/akun */
export async function getAkunUKM() {
  const res = await get('/api/organisasi/akun')
  const data = res?.data || res || []
  return Array.isArray(data) ? data.map(normalizeAkun) : []
}

/**
 * POST /api/organisasi/akun
 * @param {{ namaUkm: string, email: string, password: string, status: boolean }} data
 */
export async function createAkunUKM(data) {
  const res = await post('/api/organisasi/akun', {
    namaUkm: data.namaUkm,
    email: data.email,
    password: data.password,
    status: data.status === true || data.status === 'aktif',
  })
  return res?.data || res
}

/** PUT /api/organisasi/akun/:userId/toggle-status */
export async function toggleStatusAkunUKM(userId) {
  const res = await put(`/api/organisasi/akun/${userId}/toggle-status`)
  return res?.data || res
}

/** PUT /api/organisasi/akun/:userId/reset-password — body `{ passwordBaru }` */
export async function resetPasswordAkunUKM(userId, passwordBaru) {
  const res = await put(`/api/organisasi/akun/${userId}/reset-password`, { passwordBaru })
  return res?.data || res
}

/** DELETE /api/organisasi/akun/:userId */
export async function hapusAkunUKM(userId) {
  const res = await del(`/api/organisasi/akun/${userId}`)
  return res?.data || res
}

// ─── UKMF (Admin Fakultas) ───────────────────────────────────────────────────

export async function getAkunUKMF() {
  const res = await get('/api/organisasi-fakultas/akun')
  const data = res?.data || res || []
  return Array.isArray(data) ? data.map(normalizeAkun) : []
}

export async function createAkunUKMF(data) {
  const res = await post('/api/organisasi-fakultas/akun', {
    namaUkm: data.namaUkm || data.nama,
    email: data.email,
    password: data.password,
    status: data.status === true || data.status === 'aktif' || data.status === 'Aktif',
  })
  return res?.data || res
}

export async function toggleStatusAkunUKMF(userId) {
  const res = await put(`/api/organisasi-fakultas/akun/${userId}/toggle-status`)
  return res?.data || res
}

export async function resetPasswordAkunUKMF(userId, passwordBaru) {
  const res = await put(`/api/organisasi-fakultas/akun/${userId}/reset-password`, { passwordBaru })
  return res?.data || res
}

export async function hapusAkunUKMF(userId) {
  const res = await del(`/api/organisasi-fakultas/akun/${userId}`)
  return res?.data || res
}
