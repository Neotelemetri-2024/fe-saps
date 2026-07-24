import { getCurrentUser } from './authService'

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms))

const PERSETUJUAN_KEY = 'saps_persetujuan_dosen'
const PENGAJUAN_KEY = 'saps_pengajuan_eksternal'
const EVENT_NAME = 'saps-data-updated'

function emitUpdate(type) {
  try {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { type } }))
  } catch {
    // ignore (non-browser)
  }
}

function readJson(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeJson(key, list) {
  localStorage.setItem(key, JSON.stringify(list))
}

function formatTanggal(value) {
  if (!value) return '-'
  if (typeof value === 'string') return value
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }
  return String(value)
}

function sortPersetujuan(list) {
  return [...list].sort((a, b) => {
    const rank = (s) => (s === 'pending' ? 0 : s === 'revisi' ? 1 : 2)
    const byStatus = rank(a.status) - rank(b.status)
    if (byStatus !== 0) return byStatus
    return Number(b.id) - Number(a.id)
  })
}

/** Bersihkan seed lama yang sempat membuat bingung */
function sanitizePersetujuan(list) {
  return list.filter((item) => {
    if (!item?.kegiatan) return false
    const isOldSeed =
      item.kegiatan === 'LOMBA AI & TEKNOLOGI' &&
      item.penyelenggara === 'Hima FTI UNAND' &&
      Number(item.id) <= 3
    return !isOldSeed
  })
}

const JENIS_LABEL = {
  prestasi: 'Kompetisi',
  organisasi: 'Organisasi',
  pelatihan: 'Pelatihan',
}

const SKALA_LABEL = {
  internasional: 'Internasional',
  nasional: 'Nasional',
  regional: 'Regional',
  lokal: 'Internal (UNAND)',
}

function buildKategori(jenis, skala) {
  const j = JENIS_LABEL[jenis] || jenis || 'Kegiatan'
  const s = SKALA_LABEL[skala] || skala || ''
  return s ? `${j} ${s}` : j
}

function formatDiajukanPada(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export async function ajukanKegiatan(data) {
  await delay()
  const user = getCurrentUser()
  const list = readJson(PENGAJUAN_KEY)
  const dibuatPada = new Date().toISOString()
  const newItem = {
    id: Date.now(),
    userId: 'mahasiswa',
    namaMahasiswa: user?.nama || 'Amara Marshinta',
    nim: data.nim || '2311121017',
    prodi: data.prodi || 'Teknik Komputer, S1',
    kegiatan: data.kegiatan,
    jenis: data.jenis,
    peran: data.peran,
    skala: data.skala,
    kategori: buildKategori(data.jenis, data.skala),
    penyelenggara: data.penyelenggara,
    deskripsi: data.deskripsi || '',
    linkWebsite: data.linkWebsite || '',
    emailPenyelenggara: data.emailPenyelenggara || '',
    tanggal: formatTanggal(data.tanggal),
    status: 'pending',
    dibuatPada,
    diajukanPada: formatDiajukanPada(dibuatPada),
  }
  list.unshift(newItem)
  writeJson(PENGAJUAN_KEY, list)
  emitUpdate('pengajuan')
  return newItem
}

export async function getPengajuan(userId) {
  await delay()
  return readJson(PENGAJUAN_KEY)
    .filter((p) => !userId || p.userId === userId)
    .sort((a, b) => Number(b.id) - Number(a.id))
}

/** Semua pengajuan kegiatan eksternal (untuk admin ditmawa) */
export async function getPengajuanEksternal(params = {}) {
  await delay()
  let list = readJson(PENGAJUAN_KEY).sort((a, b) => Number(b.id) - Number(a.id))

  if (params.status) list = list.filter((p) => p.status === params.status)
  if (params.q) {
    const q = params.q.toLowerCase()
    list = list.filter(
      (p) =>
        (p.namaMahasiswa || '').toLowerCase().includes(q) ||
        (p.nim || '').toLowerCase().includes(q) ||
        (p.kegiatan || '').toLowerCase().includes(q) ||
        (p.kategori || '').toLowerCase().includes(q),
    )
  }
  if (params.kategori) list = list.filter((p) => p.kategori === params.kategori)
  if (params.skala) list = list.filter((p) => p.skala === params.skala)
  if (params.tahun) {
    list = list.filter((p) => String(p.dibuatPada || '').startsWith(String(params.tahun)))
  }

  return list
}

export async function verifikasiPengajuanEksternal(pengajuanId, status, alasan) {
  await delay()
  const list = readJson(PENGAJUAN_KEY)
  const idx = list.findIndex((p) => String(p.id) === String(pengajuanId))
  if (idx === -1) throw new Error('Pengajuan tidak ditemukan')

  list[idx] = {
    ...list[idx],
    status,
    ...(alasan ? { alasan } : {}),
    diverifikasiPada: new Date().toISOString(),
  }
  writeJson(PENGAJUAN_KEY, list)
  emitUpdate('pengajuan')
  return list[idx]
}

/** Admin Ditmawa meneruskan pengajuan ke Pimpinan Ditmawa */
export async function teruskanKePimpinanDitmawa(pengajuanId) {
  await delay()
  const list = readJson(PENGAJUAN_KEY)
  const idx = list.findIndex((p) => String(p.id) === String(pengajuanId))
  if (idx === -1) throw new Error('Pengajuan tidak ditemukan')

  list[idx] = {
    ...list[idx],
    status: 'diteruskan',
    tahap: 'pimpinan-ditmawa',
    diteruskanPada: new Date().toISOString(),
  }
  writeJson(PENGAJUAN_KEY, list)
  emitUpdate('pengajuan')
  return list[idx]
}

/** Antrian verifikasi di sisi Pimpinan Ditmawa */
export async function getPengajuanPimpinanDitmawa() {
  await delay()
  return readJson(PENGAJUAN_KEY)
    .filter((p) => p.tahap === 'pimpinan-ditmawa' || p.status === 'diteruskan')
    .sort((a, b) => Number(b.id) - Number(a.id))
}

export async function getPengajuanEksternalById(id) {
  await delay()
  const item = readJson(PENGAJUAN_KEY).find((p) => String(p.id) === String(id))
  if (!item) throw new Error('Pengajuan tidak ditemukan')
  return item
}

export async function mintaPersetujuanDosen(data) {
  await delay()
  const user = getCurrentUser()
  const list = sanitizePersetujuan(readJson(PERSETUJUAN_KEY))

  const newItem = {
    id: Date.now(),
    userId: 'mahasiswa',
    namaMahasiswa: user?.nama || 'Amara Marshinta',
    nim: '2311121017',
    kegiatan: data.kegiatan,
    jenis: data.jenis,
    peran: data.peran,
    penyelenggara: data.penyelenggara,
    tanggal: formatTanggal(data.tanggal),
    status: 'pending',
    dibuatPada: new Date().toISOString(),
  }

  list.unshift(newItem)
  writeJson(PERSETUJUAN_KEY, list)
  // hapus key v2 lama supaya tidak bentrok
  localStorage.removeItem('saps_persetujuan_dosen_v2')
  emitUpdate('persetujuan')
  return newItem
}

export async function getPersetujuanDosen(params = {}) {
  await delay()
  let list = sanitizePersetujuan(readJson(PERSETUJUAN_KEY))
  writeJson(PERSETUJUAN_KEY, list)

  if (params.status) list = list.filter((item) => item.status === params.status)
  if (params.userId) list = list.filter((item) => item.userId === params.userId)

  return sortPersetujuan(list)
}

export async function getPendingPersetujuanCount() {
  await delay()
  return sanitizePersetujuan(readJson(PERSETUJUAN_KEY)).filter((i) => i.status === 'pending').length
}

export async function setujuiTolak(pengajuanId, status, alasan) {
  await delay()
  const list = sanitizePersetujuan(readJson(PERSETUJUAN_KEY))
  const idx = list.findIndex((p) => String(p.id) === String(pengajuanId))
  if (idx === -1) throw new Error('Pengajuan not found')

  list[idx] = {
    ...list[idx],
    status,
    ...(alasan ? { alasan } : {}),
  }
  writeJson(PERSETUJUAN_KEY, list)
  emitUpdate('persetujuan')
  return list[idx]
}

/** Pimpinan Ditmawa menyetujui pengajuan eksternal — status jadi 'disetujui' final */
export async function setujuiPengajuanEksternalPimpinan(pengajuanId) {
  await delay()
  const list = readJson(PENGAJUAN_KEY)
  const idx = list.findIndex((p) => String(p.id) === String(pengajuanId))
  if (idx === -1) throw new Error('Pengajuan tidak ditemukan')
  list[idx] = {
    ...list[idx],
    status: 'disetujui',
    tahap: 'selesai',
    disetujuiPimpinanPada: new Date().toISOString(),
  }
  writeJson(PENGAJUAN_KEY, list)
  emitUpdate('pengajuan')
  return list[idx]
}

/** Pimpinan Ditmawa menolak / merevisi pengajuan eksternal */
export async function tolakPengajuanEksternalPimpinan(pengajuanId, status, alasan) {
  await delay()
  const list = readJson(PENGAJUAN_KEY)
  const idx = list.findIndex((p) => String(p.id) === String(pengajuanId))
  if (idx === -1) throw new Error('Pengajuan tidak ditemukan')
  list[idx] = {
    ...list[idx],
    status,
    alasan,
    tahap: status === 'revisi' ? 'mahasiswa' : 'selesai',
    diverifikasiPimpinanPada: new Date().toISOString(),
  }
  writeJson(PENGAJUAN_KEY, list)
  emitUpdate('pengajuan')
  return list[idx]
}

export function subscribeDataUpdate(callback) {
  const handler = (e) => callback(e?.detail)
  window.addEventListener(EVENT_NAME, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(EVENT_NAME, handler)
    window.removeEventListener('storage', handler)
  }
}
