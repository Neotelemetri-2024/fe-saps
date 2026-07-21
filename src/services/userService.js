const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

const profileMock = {
  mahasiswa: {
    nama: 'AMARA MARSHINTA',
    nim: '2311121017',
    prodi: 'Teknologi Pangan',
    fakultas: 'Teknologi Pertanian',
    angkatan: '2021',
    telepon: '',
    alamat: '',
    email: 'mahasiswa@unand.ac.id',
  },
}

export async function getProfile(userId) {
  await delay()
  return profileMock[userId] || profileMock.mahasiswa
}

export async function updateProfile(userId, data) {
  await delay()
  if (!profileMock[userId]) profileMock[userId] = { ...profileMock.mahasiswa }
  profileMock[userId] = { ...profileMock[userId], ...data }
  return profileMock[userId]
}
