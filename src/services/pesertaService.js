const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

let pesertaMock = [
  { id: 1, kegiatanId: 1, no: 1, nim: '2111521001', nama: 'Mahasiswa A', fakultas: 'Teknik', prodi: 'Informatika', kehadiran: 'Hadir', peran: 'Peserta' },
  { id: 2, kegiatanId: 1, no: 2, nim: '2111521002', nama: 'Mahasiswa B', fakultas: 'Teknik', prodi: 'Sistem Informasi', kehadiran: 'Tidak Hadir', peran: 'Peserta' },
  { id: 3, kegiatanId: 1, no: 3, nim: '2111521003', nama: 'Mahasiswa C', fakultas: 'MIPA', prodi: 'Matematika', kehadiran: 'Hadir', peran: 'Peserta' },
  { id: 4, kegiatanId: 1, no: 4, nim: '2111521004', nama: 'Mahasiswa D', fakultas: 'Teknik', prodi: 'Informatika', kehadiran: 'Hadir', peran: 'Panitia' },
  { id: 5, kegiatanId: 1, no: 5, nim: '2111521005', nama: 'Mahasiswa E', fakultas: 'Teknik', prodi: 'Informatika', kehadiran: 'Tidak Hadir', peran: 'Peserta' },
  { id: 6, kegiatanId: 2, no: 1, nim: '2111522001', nama: 'Mahasiswa F', fakultas: 'Hukum', prodi: 'Ilmu Hukum', kehadiran: 'Hadir', peran: 'Peserta' },
  { id: 7, kegiatanId: 2, no: 2, nim: '2111522002', nama: 'Mahasiswa G', fakultas: 'Hukum', prodi: 'Ilmu Hukum', kehadiran: 'Hadir', peran: 'Panitia' },
  { id: 8, kegiatanId: 3, no: 1, nim: '2111523001', nama: 'Mahasiswa H', fakultas: 'Teknik', prodi: 'Informatika', kehadiran: 'Tidak Hadir', peran: 'Peserta' },
]

export async function getPesertaByKegiatanId(kegiatanId) {
  await delay()
  return pesertaMock.filter((p) => p.kegiatanId === Number(kegiatanId))
}

export async function updateKehadiran(pesertaId, kehadiran) {
  await delay()
  const idx = pesertaMock.findIndex((p) => p.id === Number(pesertaId))
  if (idx === -1) throw new Error('Peserta not found')
  pesertaMock[idx].kehadiran = kehadiran
  return pesertaMock[idx]
}

export async function updatePeran(pesertaId, peran) {
  await delay()
  const idx = pesertaMock.findIndex((p) => p.id === Number(pesertaId))
  if (idx === -1) throw new Error('Peserta not found')
  pesertaMock[idx].peran = peran
  return pesertaMock[idx]
}

export async function submitKlaimPoin(kegiatanId) {
  await delay()
  const pesertaList = pesertaMock.filter((p) => p.kegiatanId === Number(kegiatanId))
  const belumDiisi = pesertaList.filter((p) => !p.kehadiran || !p.peran)
  if (belumDiisi.length > 0) {
    throw new Error('Masih ada peserta yang belum diisi kehadiran/perannya')
  }
  return { success: true, message: 'Data peserta berhasil dikirim untuk klaim poin' }
}
