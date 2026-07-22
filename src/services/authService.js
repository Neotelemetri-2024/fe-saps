const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

const USER_STORAGE_KEY = 'saps_current_user'

const loginMap = [
  { prefix: 'mahasiswa', role: 'mahasiswa', nama: 'Amara Marshinta', userRole: 'Mahasiswa' },
  { prefix: 'dosen', role: 'dosen-pa', nama: 'Dr. Efa Yonnedi, SE, MPPM, Akt, CA, CRGP', userRole: 'Dosen Pembimbing' },
  { prefix: 'pimpinan-ditmawa', role: 'pimpinan-ditmawa', nama: 'Dr. Dendi Adi Saputra', userRole: 'Pimpinan Ditmawa' },
  { prefix: 'pimpinan-fakultas', role: 'pimpinan-fakultas', nama: 'Dr. Andi Wijaya', userRole: 'Pimpinan Fakultas' },
  { prefix: 'admin-ditmawa', role: 'admin-ditmawa', nama: 'Admin Ditmawa', userRole: 'Admin Ditmawa' },
  { prefix: 'admin', role: 'admin-fakultas', nama: 'Nouval Rafiif Irwan', userRole: 'Admin Fakultas' },
  // ukmf harus sebelum ukm (karena matching pakai startsWith)
  { prefix: 'ukmf', role: 'ukmf', nama: 'Operator UKMF', userRole: 'Operator UKMF' },
  { prefix: 'ukm', role: 'ukm', nama: 'Naufal Rafiif Irwan', userRole: 'Operator UKM' },
  { prefix: 'pimpinan-utama', role: 'pimpinan-utama', nama: 'Pimpinan Utama', userRole: 'Pimpinan Utama' },
]

export async function login(email, password) {
  await delay()

  if (!password) {
    throw new Error('Password wajib diisi')
  }

  const localPart = email.split('@')[0].toLowerCase()
  const match = loginMap.find((m) => localPart.startsWith(m.prefix))

  if (!match) {
    throw new Error('Email tidak terdaftar')
  }

  const user = {
    email,
    role: match.role,
    nama: match.nama,
    userRole: match.userRole,
    token: 'mock-token-' + Date.now(),
  }

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  return user
}

export function logout() {
  localStorage.removeItem(USER_STORAGE_KEY)
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function isAuthenticated() {
  return getCurrentUser() !== null
}
