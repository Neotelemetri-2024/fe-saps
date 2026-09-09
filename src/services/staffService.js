import { get, post, put } from './apiClient'

function normalizeStaff(item, index = 0) {
  return {
    ...item,
    id: String(item.id ?? item.userId ?? index),
    nama: item.nama || '-',
    nip: item.nip || '-',
    namaJabatan: item.namaJabatan || item.nama_jabatan || '',
    email: item.email || '-',
    jabatan: item.jabatan || '-',
    fakultasId: item.fakultasId ?? null,
    fakultasNama: item.fakultasNama || item.fakultas?.nama || '-',
    aktif: Boolean(item.aktif),
    status: item.aktif ? 'aktif' : 'nonaktif',
  }
}

export async function getStaffAccounts() {
  const response = await get('/api/staff')
  return (Array.isArray(response?.data) ? response.data : []).map(normalizeStaff)
}

export async function createStaffAccount(payload) {
  const response = await post('/api/staff', payload)
  return response?.data ? normalizeStaff(response.data) : response
}

export async function updateStaffAccount(id, payload) {
  return put(`/api/staff/${id}`, payload)
}
