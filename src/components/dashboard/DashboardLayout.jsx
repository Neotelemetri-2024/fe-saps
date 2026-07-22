import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import { getCurrentUser } from '../../services/authService'
import Sidebar, { MobileSidebar } from './Sidebar'
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

const SIDEBAR_FULL = 260
const SIDEBAR_COLLAPSED = 68

function DashboardLayout({ role, userName, userRole, children }) {
  const user = getCurrentUser()
  const resolvedRole = role || user?.role
  const resolvedName = userName || user?.nama || 'User'
  const resolvedUserRole = userRole || user?.userRole || ''
  const menuItems = roleMenuMap[resolvedRole] || []

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024)

  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const marginLeft = isDesktop ? (collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_FULL) : 0

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Desktop sidebar */}
      {isDesktop && (
        <Sidebar
          menuItems={menuItems}
          userName={resolvedName}
          userRole={resolvedUserRole}
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
        />
      )}

      {/* Mobile sidebar overlay */}
      {!isDesktop && (
        <MobileSidebar
          menuItems={menuItems}
          isOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <div
        className="flex min-h-screen flex-col transition-all duration-300"
        style={{ marginLeft }}
      >
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-[#e9ebf8] bg-white">
          <div className="flex h-[70px] items-center justify-between px-4 sm:px-6 lg:h-[86px] lg:px-8">
            {/* Hamburger — mobile only */}
            {!isDesktop && (
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-lg p-2 text-[#333] transition hover:bg-[#f0f4f0]"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}

            {/* User info — push to right on desktop */}
            <div className={`flex items-center gap-3 ${isDesktop ? 'ml-auto' : ''}`}>
              <div className="text-right">
                <p className="text-xs font-medium text-black sm:text-sm">{resolvedName}</p>
                <p className="text-[10px] text-[#616161] sm:text-xs">{resolvedUserRole}</p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-dark text-sm font-bold text-white sm:h-[50px] sm:w-[50px] sm:text-base">
                {resolvedName ? resolvedName.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
