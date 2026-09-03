import { get, getApiBase, getAuthToken } from './apiClient'

/**
 * Service untuk integrasi data Laporan Evaluasi & Riset Pimpinan
 * Mendukung filter: angkatan, fakultasId, prodiId, tahunAkademik
 */

export async function getPreviewLaporan(filter = {}) {
  return get('/api/pimpinan/laporan/preview', filter)
}

function buildQueryString(params = {}) {
  const cleanParams = Object.fromEntries(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => [k, String(v)])
  )
  const qs = new URLSearchParams(cleanParams).toString()
  return qs ? `?${qs}` : ''
}

export async function downloadExcelLaporan(filter = {}) {
  const token = getAuthToken()
  const apiBase = getApiBase()
  const url = `${apiBase}/api/pimpinan/laporan/excel${buildQueryString(filter)}`

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'ngrok-skip-browser-warning': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!res.ok) {
    let errorMsg = 'Gagal mengunduh file Excel'
    try {
      const errJson = await res.json()
      if (errJson.message) errorMsg = errJson.message
    } catch {
      // ignore
    }
    throw new Error(errorMsg)
  }

  const blob = await res.blob()
  const contentDisposition = res.headers.get('Content-Disposition')
  let filename = 'Laporan_Evaluasi_SAPS.xlsx'
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^";]+)"?/)
    if (match && match[1]) {
      filename = match[1]
    }
  }

  const blobUrl = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(blobUrl)
}

export async function downloadPdfLaporan(filter = {}) {
  const token = getAuthToken()
  const apiBase = getApiBase()
  const url = `${apiBase}/api/pimpinan/laporan/pdf${buildQueryString(filter)}`

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'ngrok-skip-browser-warning': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!res.ok) {
    let errorMsg = 'Gagal mengunduh file PDF'
    try {
      const errJson = await res.json()
      if (errJson.message) errorMsg = errJson.message
    } catch {
      // ignore
    }
    throw new Error(errorMsg)
  }

  const blob = await res.blob()
  const contentDisposition = res.headers.get('Content-Disposition')
  let filename = 'Laporan_Resmi_SAPS.pdf'
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="?([^";]+)"?/)
    if (match && match[1]) {
      filename = match[1]
    }
  }

  const blobUrl = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(blobUrl)
}

export async function getFakultasList() {
  try {
    const res = await get('/api/umum/fakultas')
    return res?.data || []
  } catch (error) {
    console.error('Gagal mengambil daftar fakultas:', error)
    return []
  }
}

export async function getProdiList(fakultasId) {
  try {
    const params = fakultasId ? { fakultasId } : {}
    const res = await get('/api/umum/prodi', params)
    return res?.data || []
  } catch (error) {
    console.error('Gagal mengambil daftar program studi:', error)
    return []
  }
}
