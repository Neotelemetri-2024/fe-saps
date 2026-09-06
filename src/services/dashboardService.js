import { get } from './apiClient'

export async function getDashboardAdminDitmawa() {
  const res = await get('/api/umum/dashboard/admin-ditmawa')
  return res?.data || res || {}
}

export async function getDashboardDosen(kurikulumId) {
  const params = kurikulumId ? { kurikulumId: Number(kurikulumId) } : {}
  const res = await get('/api/dosen/dashboard', params)
  return res?.data || res || {}
}

export async function getDashboardPimpinanFakultas(kurikulumId) {
  const params = kurikulumId ? { kurikulumId: Number(kurikulumId) } : {}
  const res = await get('/api/umum/dashboard/pimpinan-fakultas', params)
  return res?.data || res || {}
}

export async function getDashboardPimpinanUtama(kurikulumId) {
  const params = kurikulumId ? { kurikulumId: Number(kurikulumId) } : {}
  const res = await get('/api/umum/dashboard/pimpinan-utama', params)
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
