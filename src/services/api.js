import { getAuthToken } from './auth';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

function authHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await res.text();
  try {
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw { status: res.status, body: data };
    return data;
  } catch (err) {
    if (err instanceof SyntaxError) {
      if (!res.ok) throw { status: res.status, body: text };
      return text;
    }
    throw err;
  }
}

export const api = {
  get: (p, params) => { const qs = params ? '?' + new URLSearchParams(params).toString() : ''; return request(p + qs, { method: 'GET' }) },
  post: (p, body) => request(p, { method: 'POST', body: JSON.stringify(body) }),
  put: (p, body) => request(p, { method: 'PUT', body: JSON.stringify(body) }),
  del: (p) => request(p, { method: 'DELETE' }),

  // For file uploads (multipart/form-data)
  upload: async (p, formData) => {
    const res = await fetch(`${API_BASE}${p}`, {
      method: 'POST',
      headers: { ...authHeaders() },
      body: formData,
    });
    const text = await res.text();
    try {
      const data = text ? JSON.parse(text) : null;
      if (!res.ok) throw { status: res.status, body: data };
      return data;
    } catch (err) {
      if (err instanceof SyntaxError) {
        if (!res.ok) throw { status: res.status, body: text };
        return text;
      }
      throw err;
    }
  },
};

