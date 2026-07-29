import { get, post, put, del } from './apiClient'

export async function getKurikulum() {
  const res = await get('/api/kurikulum')
  return res?.data || res || []
}

export async function getKurikulumById(id) {
  const res = await get(`/api/kurikulum/${id}`)
  return res?.data || res
}

export async function getKurikulumAktif() {
  try {
    const res = await get('/api/kurikulum/aktif')
    return res?.data || res
  } catch {
    return null
  }
}

export async function createKurikulum(data) {
  const res = await post('/api/kurikulum', data)
  return res?.data || res
}

export async function aktivasiKurikulum(id) {
  const res = await put(`/api/kurikulum/${id}/aktivasi`)
  return res?.data || res
}

export async function nonaktifkanKurikulum(id) {
  const res = await put(`/api/kurikulum/${id}/nonaktifkan`)
  return res?.data || res
}

export async function hapusKurikulum(id) {
  await del(`/api/kurikulum/${id}/delete`)
  return true
}

export async function tambahCapaian(kurikulumId, data) {
  const res = await post(`/api/kurikulum/${kurikulumId}/capaian`, data)
  return res?.data || res
}

export async function updateCapaian(capaianId, data) {
  const res = await put(`/api/kurikulum/capaian/${capaianId}`, data)
  return res?.data || res
}

export async function hapusCapaian(capaianId) {
  await del(`/api/kurikulum/capaian/${capaianId}`)
  return true
}

export async function tambahSubCapaian(capaianId, data) {
  const res = await post(`/api/kurikulum/capaian/${capaianId}/sub-capaian`, data)
  return res?.data || res
}

export async function updateSubCapaian(subCapaianId, data) {
  const res = await put(`/api/kurikulum/sub-capaian/${subCapaianId}`, data)
  return res?.data || res
}

export async function hapusSubCapaian(subCapaianId) {
  await del(`/api/kurikulum/sub-capaian/${subCapaianId}`)
  return true
}

export async function getMatriks() {
  const res = await get('/api/matriks')
  return res?.data || res || []
}

export async function updateMatriks(data) {
  const res = await post('/api/matriks', data)
  return res?.data || res
}

export async function getMatriksKategori() {
  const res = await get('/api/matriks/kategori')
  return res?.data || res || []
}

export async function tambahKategori(data) {
  const res = await post('/api/matriks/kategori', data)
  return res?.data || res
}

export async function getMatriksSkala() {
  const res = await get('/api/matriks/skala')
  return res?.data || res || []
}

export async function tambahSkala(data) {
  const res = await post('/api/matriks/skala', data)
  return res?.data || res
}

export async function updateSkala(id, data) {
  const res = await put(`/api/matriks/skala/${id}`, data)
  return res?.data || res
}

export async function hapusSkala(id) {
  await del(`/api/matriks/skala/${id}`)
  return true
}

export async function getMatriksPeran() {
  const res = await get('/api/matriks/peran')
  return res?.data || res || []
}

export async function tambahPeran(data) {
  const res = await post('/api/matriks/peran', data)
  return res?.data || res
}

export async function updatePeran(id, data) {
  const res = await put(`/api/matriks/peran/${id}`, data)
  return res?.data || res
}

export async function hapusPeran(id) {
  await del(`/api/matriks/peran/${id}`)
  return true
}

export async function getHistoriMatriks(matriksPoinId) {
  const res = await get(`/api/matriks/histori/${matriksPoinId}`)
  return res?.data || res || []
}
