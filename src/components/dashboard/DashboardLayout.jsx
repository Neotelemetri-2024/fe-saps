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
  const menuItems = roleMenuMap[role] || []

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Sidebar
        menuItems={menuItems}
        userName={userName}
        userRole={userRole}
      />
      <div className="ml-[260px] min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-[#e9ebf8] bg-white">
          <div className="flex h-[86px] items-center justify-end px-8">
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-black">{userName || 'User'}</p>
                <p className="text-xs text-[#616161]">{userRole || ''}</p>
              </div>
              <div className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-brand-dark text-base font-bold text-white">
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
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
