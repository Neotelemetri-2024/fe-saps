import { get } from './apiClient'

export async function getKategoriKegiatan() {
  const res = await get('/api/matriks/kategori')
  return res?.data || res || []
}

/** @param {string|number} [kategoriId] filter skala per kategori */
export async function getSkalaKegiatan(kategoriId) {
  const params = kategoriId ? { kategoriId: Number(kategoriId) || kategoriId } : {}
  const res = await get('/api/matriks/skala', params)
  const data = res?.data ?? res
  const list = Array.isArray(data) ? data : []
  return list.filter((s) => s.nama && !s.nama.startsWith('(tidak digunakan)'))
}

/** @param {string|number} [kategoriId] filter peran per kategori */
export async function getPeranKegiatan(kategoriId) {
  const params = kategoriId ? { kategoriId: Number(kategoriId) || kategoriId } : {}
  const res = await get('/api/matriks/peran', params)
  const data = res?.data ?? res
  const list = Array.isArray(data) ? data : []
  return list.filter((p) => p.nama && !p.nama.startsWith('(tidak digunakan)'))
}

/** Filter kategori yg valid (bukan data dummy) */
export async function getKategoriKegiatanValid() {
  const list = await getKategoriKegiatan()
  return list.filter((k) => k.nama && !k.nama.startsWith('(tidak digunakan)'))
}

export async function getFakultas() {
  const res = await get('/api/umum/fakultas')
  return res?.data || res || []
}

export async function getProdi(fakultasId) {
  const params = fakultasId ? { fakultasId } : {}
  const res = await get('/api/umum/prodi', params)
  return res?.data || res || []
}

export async function getOrganisasi(tipe) {
  const params = tipe ? { tipe } : {}
  const res = await get('/api/umum/organisasi', params)
  return res?.data || res || []
}
