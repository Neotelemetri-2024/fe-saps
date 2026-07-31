import { useState, useEffect, useRef } from 'react'
import { Menu, Settings, LogOut, Bell, UserCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, logout } from '../../services/authService'
import { getUnreadCount } from '../../services/notifikasiService'
import Sidebar, { MobileSidebar } from './Sidebar'
import * as menuConfig from '../../config/menuItems'

const roleMenuMap = {
  mahasiswa: menuConfig.mahasiswaMenu,
  dosen: menuConfig.dosenPAMenu,
  dosen_pa: menuConfig.dosenPAMenu,
  pimpinan_ditmawa: menuConfig.pimpinanDitmawaMenu,
  pimpinan_fakultas: menuConfig.pimpinanFakultasMenu,
  pimpinan_utama: menuConfig.pimpinanUtamaMenu,
  admin_ditmawa: menuConfig.adminDitmawaMenu,
  admin_fakultas: menuConfig.adminFakultasMenu,
  operator_ukm: menuConfig.ukmMenu,
  operator_ukmf: menuConfig.ukmfMenu,
}

const notifikasiPathMap = {
  mahasiswa: '/mahasiswa/notifikasi',
  dosen: '/dosen/notifikasi',
  dosen_pa: '/dosen/notifikasi',
  pimpinan_ditmawa: '/pimpinan_ditmawa/notifikasi',
  pimpinan_fakultas: '/pimpinan_fakultas/notifikasi',
  pimpinan_utama: '/pimpinan_utama/notifikasi',
  admin_ditmawa: '/admin_ditmawa/notifikasi',
  admin_fakultas: '/admin_fakultas/notifikasi',
  operator_ukm: '/operator_ukm/notifikasi',
  operator_ukmf: '/operator_ukmf/notifikasi',
}

const pengaturanPathMap = {
  mahasiswa: '/mahasiswa/pengaturan',
  dosen: '/dosen/pengaturan',
  dosen_pa: '/dosen/pengaturan',
  pimpinan_ditmawa: '/pimpinan_ditmawa/pengaturan',
  pimpinan_fakultas: '/pimpinan_fakultas/pengaturan',
  pimpinan_utama: '/pimpinan_utama/pengaturan',
  admin_ditmawa: '/admin_ditmawa/pengaturan',
  admin_fakultas: '/admin_fakultas/pengaturan',
  operator_ukm: '/operator_ukm/pengaturan',
  operator_ukmf: '/operator_ukmf/pengaturan',
}

const SIDEBAR_FULL = 260
const SIDEBAR_COLLAPSED = 68

function DashboardLayout({ role, userName, userRole, children }) {
  const user = getCurrentUser()
  const resolvedRole = role || user?.role
  const resolvedName = userName || user?.nama || 'User'
  const resolvedUserRole = userRole || user?.userRole || ''
  const menuItems = roleMenuMap[resolvedRole] || []
  const pengaturanPath = pengaturanPathMap[resolvedRole] || null
  const notifikasiPath = notifikasiPathMap[resolvedRole] || null

  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024)
  const [profileOpen, setProfileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const profileRef = useRef(null)

  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    getUnreadCount().then(setUnreadCount).catch(() => {})
    const interval = setInterval(() => {
      getUnreadCount().then(setUnreadCount).catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

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

            <div className={`flex items-center gap-3 sm:gap-4 ${isDesktop ? 'ml-auto' : ''}`}>
              {/* Bell notifikasi */}
              {notifikasiPath && (
                <button
                  type="button"
                  onClick={() => navigate(notifikasiPath)}
                  className="relative rounded-lg p-2 text-[#616161] outline-none transition hover:bg-[#f0f4f0] focus:outline-none focus-visible:outline-none"
                  title="Notifikasi"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              )}

              {/* Divider */}
              <div className="h-8 w-px bg-[#e9ebf8]" />

              {/* Profile button + dropdown */}
              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-3 rounded-xl px-2 py-1.5 outline-none transition hover:bg-[#f0f4f0] focus:outline-none focus-visible:outline-none"
                >
                  <div className="text-right">
                    <p className="text-xs font-medium text-black sm:text-sm">{resolvedName}</p>
                    <p className="text-[10px] text-[#616161] sm:text-xs">{resolvedUserRole}</p>
                  </div>
                  <UserCircle className="h-8 w-8 text-[#616161] sm:h-9 sm:w-9" />
                </button>

                {/* Dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-[#e9ebf8] bg-white shadow-lg">
                    {/* Info user */}
                    <div className="border-b border-[#e9ebf8] px-4 py-3">
                      <p className="text-sm font-semibold text-[#111]">{resolvedName}</p>
                      <p className="text-xs text-[#616161]">{resolvedUserRole}</p>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      {pengaturanPath && (
                        <button
                          type="button"
                          onClick={() => { setProfileOpen(false); navigate(pengaturanPath) }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[#333] transition hover:bg-[#f5f6f8]"
                        >
                          <Settings className="h-4 w-4 text-[#616161]" />
                          Akun dan Pengaturan
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="shrink-0 border-t border-[#e9ebf8] bg-white px-2 py-3">
          <p className="px-3 py-2.5 text-center text-sm text-[#616161]">
            © {new Date().getFullYear()} Developed by Neo Telemetri
          </p>
        </footer>
      </div>
    </div>
  )
}

export default DashboardLayout
