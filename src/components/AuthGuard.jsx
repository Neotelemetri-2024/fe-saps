import { Navigate } from 'react-router-dom'
import { isAuthenticated, getCurrentUser } from '../services/authService'

/** Prefix URL dashboard per role BE (jabatan / peran) */
const rolePrefixes = {
  mahasiswa: '/mahasiswa',
  dosen: '/dosen',
  dosen_pa: '/dosen',
  pimpinan_fakultas: '/pimpinan_fakultas',
  pimpinan_ditmawa: '/pimpinan_ditmawa',
  admin_ditmawa: '/admin_ditmawa',
  admin_fakultas: '/admin_fakultas',
  operator_ukm: '/operator_ukm',
  operator_ukmf: '/operator_ukmf',
  pimpinan_utama: '/pimpinan_utama',
}

function AuthGuard({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return children
}

export function RoleGuard({ allowedRoles, children }) {
  const user = getCurrentUser()
  if (!user) return <Navigate to="/login" replace />
  if (!allowedRoles.includes(user.role)) {
    const prefix = rolePrefixes[user.role]
    const redirect = prefix ? `${prefix}/dashboard` : '/login'
    return <Navigate to={redirect} replace />
  }
  return children
}

export default AuthGuard
