/** Base URL backend — set di .env: VITE_API_BASE=... */
const API_BASE = (import.meta.env.VITE_API_BASE || 'https://api.saps.neotelemetri.id').replace(/\/$/, '')

function getToken() {
  try {
    const raw = localStorage.getItem('saps_current_user')
    if (!raw) return null
    return JSON.parse(raw)?.token || null
  } catch {
    return null
  }
}

function buildHeaders(extra = {}) {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

function extractErrorMessage(text, body, status) {
  if (body?.message && typeof body.message === 'string' && !body.message.trim().startsWith('<')) {
    return body.message
  }
  if (body?.error && typeof body.error === 'string' && !body.error.trim().startsWith('<')) {
    return body.error
  }
  const pre = text?.match(/<pre>([\s\S]*?)<\/pre>/i)
  if (pre?.[1]) return pre[1].trim()
  const plain = text?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (plain && plain.length < 200) return plain
  return `HTTP ${status}`
}

async function handleResponse(res) {
  const text = await res.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = { message: text }
  }

  if (res.status === 401) {
    localStorage.removeItem('saps_current_user')
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login'
    }
    throw new Error('Email atau password yang Anda masukkan salah.')
  }

  if (!res.ok) {
    throw new Error(extractErrorMessage(text, body, res.status))
  }
  return body
}

function buildUrl(path, params) {
  let url = `${API_BASE}${path}`
  if (params && Object.keys(params).length) {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => [k, String(v)]),
      ),
    ).toString()
    if (qs) url += `?${qs}`
  }
  return url
}

export async function get(path, params) {
  const res = await fetch(buildUrl(path, params), { headers: buildHeaders() })
  return handleResponse(res)
}

export async function post(path, data) {
  const res = await fetch(buildUrl(path), {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(data ?? {}),
  })
  return handleResponse(res)
}

export async function put(path, data) {
  const res = await fetch(buildUrl(path), {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(data ?? {}),
  })
  return handleResponse(res)
}

export async function del(path) {
  const res = await fetch(buildUrl(path), {
    method: 'DELETE',
    headers: buildHeaders(),
  })
  return handleResponse(res)
}

export async function postFormData(path, formData) {
  const token = getToken()
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const res = await fetch(buildUrl(path), {
    method: 'POST',
    headers,
    body: formData,
  })
  return handleResponse(res)
}

export function getApiBase() {
  return API_BASE
}
