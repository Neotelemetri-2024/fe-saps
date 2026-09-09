import { get } from './apiClient'

export async function getFakultasList() {
  try {
    const res = await get('/api/umum/fakultas')
    return res.data || []
  } catch (error) {
    console.error('Gagal mengambil daftar fakultas:', error)
    return []
  }
}

export async function getProdiList(fakultasId) {
  try {
    const params = fakultasId ? { fakultasId } : {}
    const res = await get('/api/umum/prodi', params)
    return res.data || []
  } catch (error) {
    console.error('Gagal mengambil daftar prodi:', error)
    return []
  }
}
