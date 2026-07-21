const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

let kegiatanMock = [
  { id: 1, nama: 'Seminar AI', jenis: 'Seminar', skala: 'Universitas', tanggal: '25 Jun 2026', tgl: '25 Jun 2026', status: 'dipublikasikan', peserta: 50, penyelenggara: 'Hima TI', no: 1, kegiatan: 'Seminar AI' },
  { id: 2, nama: 'Pelatihan Arduino', jenis: 'Pelatihan', skala: 'Universitas', tanggal: '25 Jun 2026', tgl: '25 Jun 2026', status: 'dipublikasikan', peserta: 73, penyelenggara: 'HME', no: 2, kegiatan: 'Pelatihan Arduino' },
  { id: 3, nama: 'Workshop UI/UX', jenis: 'Workshop', skala: 'Universitas', tanggal: '25 Jun 2026', tgl: '25 Jun 2026', status: 'belum tercatat', peserta: 32, penyelenggara: 'Hima TI', no: 3, kegiatan: 'Workshop UI/UX' },
  { id: 4, nama: 'Seminar Kewirausahaan', jenis: 'Seminar', skala: 'Nasional', tanggal: '25 Jun 2026', tgl: '25 Jun 2026', status: 'sudah tercatat', peserta: 18, penyelenggara: 'BEM', no: 4, kegiatan: 'Seminar Kewirausahaan' },
  { id: 5, nama: 'Workshop Elektronika dasar', jenis: 'Workshop', skala: 'Universitas', tanggal: '25 Jun 2026', tgl: '25 Jun 2026', status: 'belum tercatat', peserta: 32, penyelenggara: 'HME', no: 5, kegiatan: 'Workshop Elektronika dasar' },
]

export async function getKegiatan(params = {}) {
  await delay()
  let result = [...kegiatanMock]
  if (params.role) {
    // filter by role-specific logic if needed
  }
  if (params.search) {
    const q = params.search.toLowerCase()
    result = result.filter((k) => k.nama?.toLowerCase().includes(q) || k.kegiatan?.toLowerCase().includes(q))
  }
  return result
}

export async function getKegiatanById(id) {
  await delay()
  return kegiatanMock.find((k) => k.id === Number(id)) || null
}

export async function createKegiatan(data) {
  await delay()
  const newItem = {
    id: Date.now(),
    no: kegiatanMock.length + 1,
    ...data,
    status: data.status || 'pending',
    tgl: data.tgl || data.tanggal || '',
  }
  kegiatanMock.push(newItem)
  return newItem
}

export async function updateKegiatan(id, data) {
  await delay()
  const idx = kegiatanMock.findIndex((k) => k.id === Number(id))
  if (idx === -1) throw new Error('Kegiatan not found')
  kegiatanMock[idx] = { ...kegiatanMock[idx], ...data }
  return kegiatanMock[idx]
}

export async function deleteKegiatan(id) {
  await delay()
  kegiatanMock = kegiatanMock.filter((k) => k.id !== Number(id))
  return true
}
