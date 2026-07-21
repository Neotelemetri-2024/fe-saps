const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

let pengajuanMock = [
  { id: 1, userId: 'mahasiswa', kegiatan: 'LOMBA AI & TEKNOLOGI', jenis: 'Kompetisi', peran: 'Juara 1', penyelenggara: 'Hima FTI UNAND', tanggal: '12 Feb - 15 Feb 2026', skala: 'Nasional', status: 'pending' },
  { id: 2, userId: 'mahasiswa', kegiatan: 'SEMINAR AI & TEKNOLOGI', jenis: 'Kompetisi', peran: 'Peserta', penyelenggara: 'Hima FTI UNAND', tanggal: '12 Feb - 15 Feb 2026', skala: 'Nasional', status: 'pending' },
  { id: 3, userId: 'mahasiswa', kegiatan: 'LOMBA KARYA TULIS ILMIAH', jenis: 'Lomba', peran: 'Juara 1', penyelenggara: 'Universitas Indonesia', tanggal: '12 Feb - 15 Feb 2026', skala: 'Nasional', status: 'ditolak', alasan: 'Berkas persyaratan tidak lengkap.' },
]

let persetujuanDosenMock = [
  { id: 1, userId: 'mahasiswa', kegiatan: 'LOMBA AI & TEKNOLOGI', jenis: 'Kompetisi', peran: 'Juara 1', penyelenggara: 'Hima FTI UNAND', tanggal: '12 Feb - 15 Feb 2026', status: 'pending' },
  { id: 2, userId: 'mahasiswa', kegiatan: 'LOMBA AI & TEKNOLOGI', jenis: 'Kompetisi', peran: 'Juara 1', penyelenggara: 'Hima FTI UNAND', tanggal: '12 Feb - 15 Feb 2026', status: 'disetujui' },
  { id: 3, userId: 'mahasiswa', kegiatan: 'LOMBA AI & TEKNOLOGI', jenis: 'Kompetisi', peran: 'Juara 1', penyelenggara: 'Hima FTI UNAND', tanggal: '12 Feb - 15 Feb 2026', status: 'ditolak', alasan: 'Bukti tidak sesuai' },
]

export async function ajukanKegiatan(data) {
  await delay()
  const newItem = {
    id: Date.now(),
    userId: 'mahasiswa',
    ...data,
    status: 'pending',
    no: pengajuanMock.length + 1,
  }
  pengajuanMock.push(newItem)
  return newItem
}

export async function getPengajuan(userId) {
  await delay()
  return pengajuanMock.filter((p) => p.userId === userId)
}

export async function mintaPersetujuanDosen(data) {
  await delay()
  const newItem = {
    id: Date.now(),
    userId: 'mahasiswa',
    ...data,
    status: 'pending',
  }
  persetujuanDosenMock.push(newItem)
  return newItem
}

export async function getPersetujuanDosen() {
  await delay()
  return [...persetujuanDosenMock]
}

export async function setujuiTolak(pengajuanId, status, alasan) {
  await delay()
  const idx = persetujuanDosenMock.findIndex((p) => p.id === Number(pengajuanId))
  if (idx === -1) {
    // fallback ke pengajuanMock
    const idx2 = pengajuanMock.findIndex((p) => p.id === Number(pengajuanId))
    if (idx2 === -1) throw new Error('Pengajuan not found')
    pengajuanMock[idx2].status = status
    if (alasan) pengajuanMock[idx2].alasan = alasan
    return pengajuanMock[idx2]
  }
  persetujuanDosenMock[idx].status = status
  if (alasan) persetujuanDosenMock[idx].alasan = alasan
  return persetujuanDosenMock[idx]
}
