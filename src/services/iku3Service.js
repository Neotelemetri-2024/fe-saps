import { get, post, put } from './apiClient'

export async function getIku3Dashboard(params = {}) {
  const res = await get('/api/iku3/dashboard', params)
  return res?.data || res || {}
}

export async function getIku3Trend(params = {}) {
  const res = await get('/api/iku3/trend', params)
  return Array.isArray(res?.data) ? res.data : []
}

export async function getIku3QuarterlyTrend(params = {}) {
  const res = await get('/api/iku3/trend/quarterly', params)
  return Array.isArray(res?.data) ? res.data : []
}

export async function getIku3Faculties(params = {}) {
  const res = await get('/api/iku3/faculties', params)
  return Array.isArray(res?.data) ? res.data : []
}

export async function getIku3Activities(params = {}) {
  const res = await get('/api/iku3/activities', params)
  return {
    total: res?.total ?? 0,
    page: res?.page ?? 1,
    totalPages: res?.totalPages ?? 1,
    data: Array.isArray(res?.data) ? res.data : [],
  }
}

export async function getIku3Targets() {
  const res = await get('/api/iku3/targets')
  return Array.isArray(res?.data) ? res.data : []
}

export async function saveIku3Target(body) {
  return post('/api/iku3/targets', body)
}

export async function getIku3Rules(params = {}) {
  const res = await get('/api/iku3/rules', params)
  return Array.isArray(res?.data) ? res.data : []
}

export async function updateIku3Rule(id, body) {
  const res = await put(`/api/iku3/rules/${id}`, body)
  return res?.data || res || {}
}
