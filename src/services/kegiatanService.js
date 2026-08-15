import { get, post, put, del, postFormData } from './apiClient'

export async function getKegiatan(params = {}) {
  const res = await get('/api/kegiatan', params)
  return res?.data || res || []
}

export async function getKegiatanById(id) {
  const res = await get(`/api/kegiatan/${id}`)
  return res?.data || res
}

export async function createKegiatan(data) {
  const res = await post('/api/kegiatan', data)
  return res?.data || res
}

export async function updateKegiatan(id, data) {
  const res = await put(`/api/kegiatan/${id}`, data)
  return res?.data || res
}

export async function deleteKegiatan(id) {
  await del(`/api/kegiatan/${id}`)
  return true
}

export async function ajukanKegiatan(id) {
  // PUT /api/kegiatan/{id}/ajukan — kirim draft atau ajukan ulang revisi
  const res = await put(`/api/kegiatan/${id}/ajukan`)
  return res?.data || res
}

/** @deprecated gunakan ajukanKegiatan */
export async function ajukanUlangKegiatan(id) {
  return ajukanKegiatan(id)
}

export async function publikasiKegiatan(id) {
  const res = await put(`/api/kegiatan/${id}/publikasi`)
  return res?.data || res
}

export async function getKegiatanVerifikasi(params = {}) {
  const res = await get('/api/kegiatan/verifikasi', params)
  return res?.data || res || []
}

export async function verifikasiKegiatan(id, data) {
  const res = await put(`/api/kegiatan/${id}/verifikasi`, data)
  return res?.data || res
}

function toKeputusan(status) {
  const s = String(status || '').toLowerCase()
  if (['setuju', 'disetujui', 'diteruskan', 'approve', 'terverifikasi'].includes(s)) return 'setuju'
  if (['revisi', 'perlu_revisi'].includes(s)) return 'revisi'
  return 'tolak'
}

export async function verifikasiBulk(ids, status, catatan, alokasiBulk) {
  const res = await put('/api/kegiatan/verifikasi-bulk', {
    kegiatanIds: (ids || []).map(Number),
    keputusan: toKeputusan(status),
    alasan: catatan,
    ...(alokasiBulk && alokasiBulk.length > 0 ? { alokasiBulk } : {}),
  })
  return res?.data || res
}

export async function getKegiatanApproval(params = {}) {
  const res = await get('/api/kegiatan/approval', params)
  return res?.data || res || []
}

export async function approvalKegiatan(id, data) {
  const res = await put(`/api/kegiatan/${id}/approval`, data)
  return res?.data || res
}

export async function approvalBulk(ids, status, catatan) {
  const res = await put('/api/kegiatan/approval-bulk', {
    kegiatanIds: (ids || []).map(Number),
    keputusan: toKeputusan(status),
    alasan: catatan,
  })
  return res?.data || res
}

export async function getPesertaKegiatan(kegiatanId, params = {}) {
  const res = await get(`/api/kegiatan/${kegiatanId}/peserta`, {
    limit: 9999,
    ...params,
  })
  const data = res?.data || res
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.peserta)) return data.peserta
  return []
}

/**
 * Cari mahasiswa (NIM/nama) yang belum terdaftar sebagai peserta kegiatan.
 * Returns [{ userId, nim, nama, fakultas, prodi }]
 */
export async function cariMahasiswaPeserta(kegiatanId, q) {
  const res = await get(`/api/kegiatan/${kegiatanId}/peserta/search`, { q })
  return res?.data || res || []
}

/**
 * Tambah mahasiswa menjadi peserta kegiatan secara manual.
 * @param {number|string} kegiatanId
 * @param {string|number} mahasiswaId (userId mahasiswa)
 */
export async function tambahPesertaManual(kegiatanId, mahasiswaId) {
  const res = await post(`/api/kegiatan/${kegiatanId}/peserta`, { mahasiswaId: String(mahasiswaId) })
  return res?.data || res
}

/**
 * Ambil data peserta lengkap dengan statusSubmit dari backend.
 * Returns { peserta: [], statusSubmit: 'belum_submit'|'sudah_submit', peranTersedia: [] }
 */
export async function getPesertaKegiatanFull(kegiatanId, params = {}) {
  const res = await get(`/api/kegiatan/${kegiatanId}/peserta`, {
    limit: 9999,
    ...params,
  })
  const data = res?.data || res
  return {
    peserta: Array.isArray(data?.peserta) ? data.peserta : (Array.isArray(data) ? data : []),
    statusSubmit: data?.statusSubmit || 'belum_submit',
    peranTersedia: data?.peranTersedia || [],
  }
}

/**
 * Update kehadiran & peran peserta massal.
 * BE expects: [{ partisipasiId, hadir, peranId? }]
 * FE may pass peranVerifId — mapped to peranId.
 */
export async function updatePesertaKegiatan(kegiatanId, peserta) {
  const normalized = (peserta || []).map((p) => {
    const item = {
      partisipasiId: Number(p.partisipasiId ?? p.id),
      hadir: p.hadir === true || p.hadir === 'Hadir' || p.kehadiran === true || p.kehadiran === 'Hadir',
    }
    const peranId = p.peranId ?? p.peranVerifId
    if (peranId != null && peranId !== '') {
      item.peranId = Number(peranId)
    }
    return item
  })
  const res = await put(`/api/kegiatan/${kegiatanId}/peserta/update`, { peserta: normalized })
  return res?.data || res
}

export async function importPesertaCSV(kegiatanId, file) {
  const form = new FormData()
  form.append('file', file)
  const res = await postFormData(`/api/kegiatan/${kegiatanId}/peserta/import`, form)
  return res?.data || res
}


export async function submitPoinPeserta(kegiatanId) {
  // Body utuh dikembalikan agar pemanggil bisa membaca ringkasan & daftar gagal.
  return post(`/api/kegiatan/${kegiatanId}/peserta/submit-poin`)
}

export async function getRiwayatKegiatanInternal(params = {}) {
  const res = await get('/api/mahasiswa/riwayat-kegiatan-internal', params)
  return res?.data || res || {}
}

export async function downloadTemplatePeserta(kegiatanId) {
  const base = (import.meta.env.VITE_API_BASE || 'https://api.saps.neotelemetri.id').replace(/\/$/, '')
  const url = `${base}/api/kegiatan/${kegiatanId}/peserta/template`
  let token = null
  try {
    const raw = localStorage.getItem('saps_current_user')
    if (raw) token = JSON.parse(raw)?.token || null
  } catch { /* ignore */ }
  const res = await fetch(url, {
    headers: {
      'ngrok-skip-browser-warning': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(errText || `Gagal download template (${res.status})`)
  }
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = `template_peserta_${kegiatanId}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(objectUrl)
}
