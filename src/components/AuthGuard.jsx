import { Navigate } from 'react-router-dom'
import { isAuthenticated, getCurrentUser } from '../services/authService'

const rolePrefixes = {
  mahasiswa: '/mahasiswa',
  'dosen-pa': '/dosen-pa',
  'pimpinan-fakultas': '/pimpinan-fakultas',
  'admin-ditmawa': '/admin-ditmawa',
  'admin-fakultas': '/admin-fakultas',
  ukm: '/ukm',
  ukmf: '/ukmf',
  'pimpinan-utama': '/pimpinan-utama',
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
    const redirect = rolePrefixes[user.role] + '/dashboard' || '/login'
    return <Navigate to={redirect} replace />
  }
  return children
}

export default AuthGuard
