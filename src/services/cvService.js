import { get, post, del, getApiBase, getAuthToken } from './apiClient'

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

export async function shareCvToLinkedIn(caption) {
  return post('/api/mahasiswa/linkedin/share', { caption: caption || '' })
}

export async function getLinkedInStatus() {
  const res = await get('/api/mahasiswa/linkedin/status')
  return res?.data || res || {}
}

export async function disconnectLinkedIn() {
  const res = await del('/api/mahasiswa/linkedin/disconnect')
  return res?.data || res || {}
}

/**
 * @param {'generate-cv' | 'pengaturan'} [returnTo='generate-cv']
 */
export function getLinkedInConnectUrl(returnTo = 'generate-cv') {
  const token = getAuthToken()
  const params = new URLSearchParams()
  if (token) params.set('token', token)
  if (returnTo === 'pengaturan') params.set('returnTo', 'pengaturan')
  const qs = params.toString()
  const base = `${getApiBase()}/api/mahasiswa/linkedin/connect`
  return qs ? `${base}?${qs}` : base
}
