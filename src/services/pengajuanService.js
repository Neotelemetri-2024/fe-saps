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

export async function ajukanKegiatan(data) {
  await delay()
  const list = readJson(PENGAJUAN_KEY)
  const newItem = {
    id: Date.now(),
    userId: 'mahasiswa',
    kegiatan: data.kegiatan,
    jenis: data.jenis,
    peran: data.peran,
    skala: data.skala,
    penyelenggara: data.penyelenggara,
    tanggal: formatTanggal(data.tanggal),
    status: 'pending',
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

export function subscribeDataUpdate(callback) {
  const handler = (e) => callback(e?.detail)
  window.addEventListener(EVENT_NAME, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(EVENT_NAME, handler)
    window.removeEventListener('storage', handler)
  }
}
