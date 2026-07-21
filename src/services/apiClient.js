let API_BASE = '/api'

export function setApiBase(base) {
  API_BASE = base
}

export async function get(path) {
  // nanti: return fetch(`${API_BASE}${path}`).then(r => r.json())
  throw new Error('Direct API call not implemented — use service layer')
}

export async function post(path, data) {
  throw new Error('Direct API call not implemented — use service layer')
}

export async function put(path, data) {
  throw new Error('Direct API call not implemented — use service layer')
}

export async function del(path) {
  throw new Error('Direct API call not implemented — use service layer')
}
