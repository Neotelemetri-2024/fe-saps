import { get, post } from './apiClient'

export async function getCv() {
  const res = await get('/api/mahasiswa/cv')
  return res?.data || res || {}
}

export async function generateCvPublicLink() {
  const res = await post('/api/mahasiswa/cv/generate-link')
  return res?.data || res || {}
}

export async function getPublicCv(token) {
  const res = await get(`/api/umum/cv/public/${token}`)
  return res?.data || res || {}
}
