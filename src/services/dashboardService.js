import { get } from './apiClient'

export async function getDashboardAdminDitmawa() {
  const res = await get('/api/umum/dashboard/admin-ditmawa')
  return res?.data || res || {}
}

export async function getDashboardDosen() {
  const res = await get('/api/dosen/dashboard')
  return res?.data || res || {}
}

export async function getDashboardPimpinanFakultas() {
  const res = await get('/api/umum/dashboard/pimpinan-fakultas')
  return res?.data || res || {}
}

export async function getDashboardPimpinanUtama() {
  const res = await get('/api/umum/dashboard/pimpinan-utama')
  return res?.data || res || {}
}

export async function getDashboardFakultasDetail(fakultasId) {
  const res = await get(`/api/umum/dashboard/pimpinan-utama/fakultas/${fakultasId}`)
  return res?.data || res || {}
}

export async function getPortofolio(mahasiswaId) {
  const res = await get(`/api/umum/portofolio/${mahasiswaId}`)
  return res?.data || res || {}
}
