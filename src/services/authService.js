import { post, get, put } from './apiClient'
import { setupFirebaseMessaging, isFirebaseConfigured } from '../lib/firebase'

const USER_STORAGE_KEY = 'saps_current_user'

/**
 * BE memakai peran generik:
 *   "operator_org" → UKM atau UKMF (dibedakan dari /api/auth/me)
 *   "admin_org"    → admin_ditmawa atau admin_fakultas
 *
 * Tipe organisasi (UKM/UKMF) dikembalikan oleh GET /api/auth/me di path
 * bertingkat: data.organisasiOperator.organisasi.tipe (enum "UKM" | "UKMF").
 * Fallback ke field flat (tipeOrganisasi/tipe/organisasi.tipe/tingkat) untuk
 * jaga-jaga bila bentuk respons backend berubah di kemudian hari.
 */
function resolveRoleFromMe(peranRaw, meData) {
  const tipe = (
    meData?.organisasiOperator?.organisasi?.tipe ||
    meData?.tipeOrganisasi ||
    meData?.tipe ||
    meData?.organisasi?.tipe ||
    meData?.organisasi?.tingkat ||
    meData?.tingkat ||
    ''
  ).toLowerCase()

  if (peranRaw === 'operator_org') {
    // ukmf identifiers
    if (['ukmf', 'fakultas', 'ukmf_org'].includes(tipe)) return 'operator_ukmf'
    return 'operator_ukm'
  }

  if (peranRaw === 'staff') {
    // fallback: jabatan staff langsung dari getMe (mis. admin_ditmawa, pimpinan_fakultas, dst)
    const jabatan = (meData?.staff?.jabatan || '').toLowerCase()
    if (jabatan) return jabatan
  }

  if (peranRaw === 'admin_org') {
    if (tipe === 'fakultas') return 'admin_fakultas'
    return 'admin_ditmawa'
  }

  return peranRaw
}

export async function login(email, password) {
  if (!password) throw new Error('Password wajib diisi')

  const emailLower = email.trim().toLowerCase()
  const res = await post('/api/auth/login', { email: emailLower, password })

  if (!res?.success) {
    throw new Error('Username atau password yang Anda masukkan salah.')
  }

  const token = res.data?.token
  const userData = res.data?.user || {}

  // Simpan token sementara agar get() bisa pakai Authorization header
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ token }))

  // Ambil detail profil untuk resolve role generik
  let meData = {}
  try {
    const meRes = await get('/api/auth/me')
    meData = meRes?.data || meRes || {}
    console.log('[DEBUG /api/auth/me]', JSON.stringify(meData, null, 2))
  } catch (e) {
    console.warn('[DEBUG /api/auth/me] gagal:', e?.message)
  }

  const peranRaw = (userData.jabatan || userData.peran || '').trim()
  const role = resolveRoleFromMe(peranRaw, meData) || peranRaw

  if (!role) {
    localStorage.removeItem(USER_STORAGE_KEY)
    throw new Error('Role tidak dikenali dari respons server. Hubungi administrator.')
  }

  const user = {
    id: userData.id,
    email: userData.email || emailLower,
    nama: userData.nama || meData.nama || emailLower,
    peran: userData.peran || null,
    jabatan: userData.jabatan || null,
    organisasiId: userData.organisasiId ?? meData.organisasiOperator?.organisasi?.id ?? null,
    namaOrganisasi: userData.namaOrganisasi ?? meData.organisasiOperator?.organisasi?.nama ?? null,
    tipeOrganisasi: meData.organisasiOperator?.organisasi?.tipe ?? meData.tipeOrganisasi ?? meData.tipe ?? meData.organisasi?.tipe ?? null,
    role,
    userRole: userData.jabatan || userData.peran || role,
    token,
  }
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))

  // Registrasi FCM token setelah login sukses (non-blocking, gagal diam-diam).
  if (isFirebaseConfigured()) {
    setupFirebaseMessaging()
      .then((fcmToken) => {
        if (!fcmToken) {
          console.warn('[FCM] Tidak ada token FCM didapat, token TIDAK dikirim ke backend.')
          return
        }
        return put('/api/auth/fcm-token', { fcmToken }).then(() => {
          console.log('[FCM] Token berhasil disimpan ke backend.')
        })
      })
      .catch((err) => {
        console.error('[FCM] Gagal registrasi/simpan token FCM:', err)
      })
  } else {
    console.warn('[FCM] isFirebaseConfigured() = false, cek VITE_FIREBASE_* di .env.')
  }

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
  const u = getCurrentUser()
  return u !== null && !!u.role
}

/** PUT /api/auth/profil — perbarui profil (nama, email, nomorTelepon, alamat) */
export async function updateProfil(payload) {
  const res = await put('/api/auth/profil', payload)
  return res?.data || res
}

/** PUT /api/auth/ganti-password — ganti password sendiri */
export async function gantiPassword(payload) {
  const res = await put('/api/auth/ganti-password', payload)
  return res?.data || res
}
