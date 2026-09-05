import { Outlet } from 'react-router-dom'
import DashboardLayout from '../components/dashboard/DashboardLayout'
import { getCurrentUser } from '../services/authService'

/**
 * Shared persistent layout untuk semua halaman pimpinan_ditmawa.
 * Dengan layout ini sidebar tidak di-unmount saat navigasi antar halaman,
 * sehingga tidak ada "flicker" / perubahan sidebar.
 */
function PimpinanDitmawaLayout() {
  const user = getCurrentUser()
  return (
    <DashboardLayout
      role="pimpinan_ditmawa"
      userName={user?.nama || 'Pimpinan Ditmawa'}
      userRole="Pimpinan Ditmawa"
    >
      <Outlet />
    </DashboardLayout>
  )
}

export default PimpinanDitmawaLayout
