import { get, put, postFormData } from './apiClient'

/** Kegiatan eksternal siap diklaim — GET /api/mahasiswa/klaim-eksternal/kegiatan-tersedia */
export async function getKegiatanTersediaKlaim() {
  const res = await get('/api/mahasiswa/klaim-eksternal/kegiatan-tersedia')
  return res?.data || res || []
}

/**
 * Ajukan klaim eksternal — POST /api/mahasiswa/klaim-eksternal (multipart)
 * @param {{ partisipasiId: number|string, peranUsulanId: number|string, bukti: File }}
 */
export async function klaimPoin({ partisipasiId, peranUsulanId, bukti }) {
  const fd = new FormData()
  fd.append('partisipasiId', String(partisipasiId))
  fd.append('peranUsulanId', String(peranUsulanId))
  if (bukti) fd.append('bukti', bukti)
  const res = await postFormData('/api/mahasiswa/klaim-eksternal', fd)
  return res?.data || res
}

/** Riwayat klaim mahasiswa — GET /api/mahasiswa/klaim-eksternal */
export async function getKlaim() {
  const res = await get('/api/mahasiswa/klaim-eksternal')
  return res?.data || res || []
}

/** Detail klaim — GET /api/klaim/:id */
export async function getKlaimById(id) {
  const res = await get(`/api/klaim/${id}`)
  return res?.data || res
}

/**
 * Daftar klaim menunggu validasi admin — GET /api/klaim/validasi
 * (fallback: verifikasi-eksternal?status=menunggu_validasi)
 */
export async function getKlaimForValidasi(params = {}) {
  try {
    const res = await get('/api/klaim/validasi', { limit: 50, ...params })
    return res?.data || res || []
  } catch {
    const res = await get('/api/klaim/verifikasi-eksternal', {
      status: 'menunggu_validasi',
      limit: 50,
      ...params,
    })
    return res?.data || res || []
  }
}

export async function getKlaimEksternal(params = {}) {
  const res = await get('/api/klaim/verifikasi-eksternal', params)
  return res?.data || res || []
}

/** PUT /api/klaim/:id/validasi — { keputusan, alasan? } */
export async function verifikasiKlaim(id, data) {
  const keputusan = data?.keputusan || mapKeputusan(data?.status)
  const res = await put(`/api/klaim/${id}/validasi`, {
    keputusan,
    ...(data?.alasan ? { alasan: data.alasan } : {}),
    ...(data?.peranVerifId ? { peranVerifId: Number(data.peranVerifId) } : {}),
  })
  return res?.data || res
}

/** PUT /api/klaim/validasi-bulk — { klaimIds, keputusan, alasan? } */
export async function validasiBulk(ids, status, catatan) {
  const res = await put('/api/klaim/validasi-bulk', {
    klaimIds: (ids || []).map(Number),
    keputusan: mapKeputusan(status),
    ...(catatan ? { alasan: catatan } : {}),
  })
  return res?.data || res
}

export async function getRiwayatPoin(params = {}) {
  const res = await get('/api/mahasiswa/riwayat-poin', params)
  return res?.data || res || {}
}

function mapKeputusan(status) {
  const s = String(status || '').toLowerCase()
  if (['disetujui', 'setujui', 'approved', 'setuju'].includes(s)) return 'disetujui'
  if (['revisi', 'perlu_revisi'].includes(s)) return 'perlu_revisi'
  return 'ditolak'
}
