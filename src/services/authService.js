import { post, get, put } from './apiClient'
import { setupFirebaseMessaging, isFirebaseConfigured } from '../lib/firebase'

const USER_STORAGE_KEY = 'saps_current_user'
const SSO_LOGOUT_URL = 'https://sso.unand.ac.id/auth/realms/unand/protocol/openid-connect/logout'

function decodeJwtPayload(token) {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return {}
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonStr)
  } catch (err) {
    console.warn('[JWT Decode Warning]', err)
    return {}
  }
}

/**
 * BE memakai peran generik:
 *   'operator_org' (UKM atau UKMF, dibedakan dari /api/auth/me)
 *   'admin_org'    (admin_ditmawa atau admin_fakultas)
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
    if (['ukmf', 'fakultas', 'ukmf_org'].includes(tipe)) return 'operator_ukmf'
    return 'operator_ukm'
  }

  if (peranRaw === 'staff') {
    const jabatan = (meData?.staff?.jabatan || '').toLowerCase()
    if (jabatan) return jabatan
  }

  if (peranRaw === 'admin_org') {
    if (tipe === 'fakultas') return 'admin_fakultas'
    return 'admin_ditmawa'
  }

  return peranRaw
}

/**
 * Login Akun Internal (Email/Username + Password)
 * Digunakan untuk: Pimpinan Ditmawa, Pimpinan Utama, Pimpinan Fakultas,
 * Admin Ditmawa/Fakultas, Operator UKM & UKMF.
 */
export async function login(email, password) {
  if (!password) throw new Error('Password wajib diisi')

  const emailLower = email.trim().toLowerCase()
  const res = await post('/api/auth/login', { email: emailLower, password })

  if (!res?.success) {
    throw new Error('Username atau password yang Anda masukkan salah.')
  }

  const token = res.data?.token
  const userData = res.data?.user || {}

  // Simpan token sementara
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ token, authProvider: 'internal' }))

  // Ambil detail profil
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
    kurikulumId: meData.mahasiswa?.kurikulum?.id ?? null,
    kurikulumNama: meData.mahasiswa?.kurikulum?.nama ?? null,
    role,
    userRole: userData.jabatan || userData.peran || role,
    token,
    authProvider: 'internal',
  }
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))

  // Registrasi FCM token setelah login sukses (non-blocking).
  if (isFirebaseConfigured()) {
    setupFirebaseMessaging()
      .then((fcmToken) => {
        if (!fcmToken) return
        return put('/api/auth/fcm-token', { fcmToken })
      })
      .catch((err) => {
        console.error('[FCM] Gagal registrasi/simpan token FCM:', err)
      })
  }

  return user
}

/**
 * Login SSO UNAND (OAuth2 Keycloak)
 * Digunakan untuk: Mahasiswa & Dosen umum kampus.
 * Menggunakan session claim SSO & auto-provisioning tanpa gatekeeper database internal.
 */
export async function handleSsoLogin(token) {
  if (!token) throw new Error('Token SSO tidak ditemukan.')

  // Simpan token sementara
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ token, authProvider: 'sso' }))

  const tokenPayload = decodeJwtPayload(token)
  console.log('[SSO Token Payload]', tokenPayload)

  // Ambil detail profil jika sudah ada di internal DB (enrichment)
  let meData = {}
  try {
    const meRes = await get('/api/auth/me')
    meData = meRes?.data || meRes || {}
    console.log('[SSO /api/auth/me]', JSON.stringify(meData, null, 2))
  } catch (e) {
    console.warn('[SSO /api/auth/me] menggunakan fallback token payload:', e?.message)
  }

  const peranRaw = (
    meData?.staff?.jabatan ||
    meData?.peran ||
    tokenPayload?.jabatan ||
    tokenPayload?.peran ||
    tokenPayload?.role ||
    'mahasiswa'
  ).toString().trim()

  const role = resolveRoleFromMe(peranRaw, meData) || peranRaw || 'mahasiswa'

  const user = {
    id: meData.id || tokenPayload.id || tokenPayload.sub || null,
    email: meData.email || tokenPayload.email || '',
    nama: meData.nama || tokenPayload.nama || tokenPayload.name || 'Pengguna UNAND',
    peran: meData.peran || tokenPayload.peran || peranRaw,
    jabatan: meData.staff?.jabatan || tokenPayload.jabatan || null,
    organisasiId: meData.organisasiOperator?.organisasi?.id ?? tokenPayload.organisasiId ?? null,
    namaOrganisasi: meData.organisasiOperator?.organisasi?.nama ?? tokenPayload.namaOrganisasi ?? null,
    tipeOrganisasi: meData.organisasiOperator?.organisasi?.tipe ?? meData.tipeOrganisasi ?? null,
    kurikulumId: meData.mahasiswa?.kurikulum?.id ?? null,
    kurikulumNama: meData.mahasiswa?.kurikulum?.nama ?? null,
    role,
    userRole: meData.staff?.jabatan || meData.peran || role,
    token,
    authProvider: 'sso',
  }

  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))

  if (isFirebaseConfigured()) {
    setupFirebaseMessaging()
      .then((fcmToken) => {
        if (!fcmToken) return
        return put('/api/auth/fcm-token', { fcmToken })
      })
      .catch((err) => {
        console.error('[FCM SSO] error:', err)
      })
  }

  return user
}

/**
 * Logout Cerdas (Smart Logout)
 * - Jika akun SSO: redirect ke Keycloak logout endpoint
 * - Jika akun internal (Pimpinan, Admin, UKM/UKMF): kembali ke /login
 */
export function logout() {
  const user = getCurrentUser()
  const isSso = user?.authProvider === 'sso'
  localStorage.removeItem(USER_STORAGE_KEY)

  if (isSso) {
    // Selalu logout dari server Keycloak SSO UNAND agar sesi kredensial direset
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    const postLogout = encodeURIComponent(
      isLocal
        ? 'https://studentconnect.unand.ac.id/login'
        : window.location.origin + '/login'
    )
    window.location.href = SSO_LOGOUT_URL + '?post_logout_redirect_uri=' + postLogout + '&client_id=saps-unand'
  } else {
    window.location.href = '/login'
  }
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

/** GET /api/mahasiswa/kurikulum */
export async function getKurikulumMahasiswa() {
  try {
    const res = await get('/api/mahasiswa/kurikulum')
    const data = res?.data ?? res
    if (data) {
      const kurikulumId = data.id ?? null
      const kurikulumNama = data.nama ?? null
      try {
        const raw = localStorage.getItem(USER_STORAGE_KEY)
        if (raw) {
          const current = JSON.parse(raw)
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ ...current, kurikulumId, kurikulumNama }))
        }
      } catch { /* ignore */ }
      return { id: kurikulumId, nama: kurikulumNama }
    }
    return null
  } catch {
    return null
  }
}

/** PUT /api/auth/profil */
export async function updateProfil(payload) {
  const res = await put('/api/auth/profil', payload)
  const data = res?.data || res

  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY)
    if (raw && data) {
      const current = JSON.parse(raw)
      const next = {
        ...current,
        ...(data.nama != null ? { nama: data.nama } : {}),
        ...(data.email != null ? { email: data.email } : {}),
      }
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(next))
      window.dispatchEvent(new Event('saps-user-updated'))
    }
  } catch {
    /* ignore */
  }

  return data
}

/** PUT /api/auth/ganti-password */
export async function gantiPassword(payload) {
  const res = await put('/api/auth/ganti-password', payload)
  return res?.data || res
}