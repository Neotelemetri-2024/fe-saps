const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

let klaimMock = [
  { id: 1, userId: 'mahasiswa', kegiatan: 'SEMINAR AI & TEKNOLOGI', jenis: 'Kompetisi', peran: 'Peserta', penyelenggara: 'Hima FTI UNAND', tanggal: '12 Feb - 15 Feb 2026', skala: 'Nasional', status: 'pending' },
  { id: 2, userId: 'mahasiswa', kegiatan: 'WORKSHOP GRAPHIC DESIGN', jenis: 'Pelatihan', peran: 'Peserta', penyelenggara: 'Hima FTI UNAND', tanggal: '12 Feb - 15 Feb 2026', skala: 'Regional', status: 'pending' },
  { id: 3, userId: 'mahasiswa', kegiatan: 'LOMBA KARYA TULIS ILMIAH', jenis: 'Lomba', peran: 'Juara 1', penyelenggara: 'Universitas Indonesia', tanggal: '12 Feb - 15 Feb 2026', skala: 'Nasional', status: 'ditolak', alasan: 'Berkas tidak lengkap' },
]

let riwayatMock = [
  { id: 1, userId: 'mahasiswa', kegiatan: 'Seminar Nasional AI', poin: 50, tanggal: '10 Jun 2026', status: 'disetujui', kategori: 'Fondasi' },
  { id: 2, userId: 'mahasiswa', kegiatan: 'Bakti Sosial', poin: 30, tanggal: '5 Jun 2026', status: 'disetujui', kategori: 'Penguatan' },
  { id: 3, userId: 'mahasiswa', kegiatan: 'Pelatihan Kewirausahaan', poin: 20, tanggal: '20 Mei 2026', status: 'pending', kategori: 'Fondasi' },
]

export async function klaimPoin(data) {
  await delay()
  const newItem = {
    id: Date.now(),
    userId: 'mahasiswa',
    ...data,
    status: 'pending',
  }
  klaimMock.push(newItem)
  return newItem
}

export async function getKlaim(userId) {
  await delay()
  return klaimMock.filter((k) => k.userId === userId)
}

export async function getRiwayatPoin(userId) {
  await delay()
  return riwayatMock.filter((r) => r.userId === userId)
}

export async function verifikasiKlaim(klaimId, status, catatan) {
  await delay()
  const idx = klaimMock.findIndex((k) => k.id === Number(klaimId))
  if (idx === -1) throw new Error('Klaim not found')
  klaimMock[idx].status = status
  if (catatan) klaimMock[idx].alasan = catatan
  return klaimMock[idx]
}
