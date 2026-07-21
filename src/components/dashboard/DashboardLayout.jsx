import { getCurrentUser } from '../../services/authService'
import Sidebar from './Sidebar'
import * as menuConfig from '../../config/menuItems'

const roleMenuMap = {
  mahasiswa: menuConfig.mahasiswaMenu,
  'dosen-pa': menuConfig.dosenPAMenu,
  'pimpinan-ditmawa': menuConfig.pimpinanDitmawaMenu,
  'pimpinan-fakultas': menuConfig.pimpinanFakultasMenu,
  'pimpinan-utama': menuConfig.pimpinanUtamaMenu,
  'admin-ditmawa': menuConfig.adminDitmawaMenu,
  'admin-fakultas': menuConfig.adminFakultasMenu,
  ukm: menuConfig.ukmMenu,
  ukmf: menuConfig.ukmfMenu,
}

function DashboardLayout({ role, userName, userRole, children }) {
  const user = getCurrentUser()
  const resolvedRole = role || user?.role
  const resolvedName = userName || user?.nama || 'User'
  const resolvedUserRole = userRole || user?.userRole || ''
  const menuItems = roleMenuMap[resolvedRole] || []

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Sidebar
        menuItems={menuItems}
        userName={resolvedName}
        userRole={resolvedUserRole}
      />
      <div className="ml-[260px] min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-[#e9ebf8] bg-white">
          <div className="flex h-[86px] items-center justify-end px-8">
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-black">{resolvedName}</p>
                <p className="text-xs text-[#616161]">{resolvedUserRole}</p>
              </div>
              <div className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-brand-dark text-base font-bold text-white">
                {resolvedName ? resolvedName.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
