import { get, put } from './apiClient'

export async function getProfile() {
  const res = await get('/api/auth/me')
  return res?.data || res
}

export async function updateProfile(data) {
  const res = await put('/api/auth/me', data)
  return res?.data || res
}
