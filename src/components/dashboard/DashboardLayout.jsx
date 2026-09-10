import { createContext, useContext, useEffect, useState } from 'react'
import { Menu, Settings, LogOut, Bell, UserCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, logout } from '../../services/authService'
import { getUnreadCount } from '../../services/notifikasiService'
import { subscribeDataUpdate } from '../../services/pengajuanService'
import Sidebar, { MobileSidebar } from './Sidebar'
import AccessibilityMenu from './AccessibilityMenu'
import { NavSearchModal, NavSearchTrigger } from './NavSearch'
import * as menuConfig from '../../config/menuItems'

export const DashboardChromeContext = createContext(false)

export function useDashboardChrome() {
  return useContext(DashboardChromeContext)
}

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
  const nested = useContext(DashboardChromeContext)
  if (nested) return children

  return (
    <DashboardChromeContext.Provider value={true}>
      <DashboardChrome role={role} userName={userName} userRole={userRole}>
        {children}
      </DashboardChrome>
    </DashboardChromeContext.Provider>
  )
}

function DashboardChrome({ role, userName, userRole, children }) {
  const user = getCurrentUser()
  const resolvedRole = role || user?.role
  const rawName = userName || user?.nama || 'User'
  const resolvedName = rawName.replace(/\s*\([^)]*\)\s*$/, '').trim() || rawName
  const isOperatorOrg = resolvedRole === 'operator_ukm' || resolvedRole === 'operator_ukmf'
  const resolvedUserRole = (isOperatorOrg && user?.namaOrganisasi) || userRole || user?.userRole || ''
  const menuItems = roleMenuMap[resolvedRole] || []
  const pengaturanPath = pengaturanPathMap[resolvedRole] || null
  const notifikasiPath = notifikasiPathMap[resolvedRole] || null

  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024)
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    const updateCount = () => {
      getUnreadCount().then(setUnreadCount).catch(() => {})
    }
    updateCount()

    // Real-time listener saat notifikasi dibaca atau permohonan disetujui
    const unsub = subscribeDataUpdate((detail) => {
      if (!detail?.type || detail.type === 'notifikasi' || detail.type === 'persetujuan' || detail.type === 'klaim') {
        updateCount()
      }
    })

    const interval = setInterval(updateCount, 30000)
    return () => {
      unsub()
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (e) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'
      const isSlash = e.key === '/'
      if ((isCmdK || isSlash) && !searchOpen) {
        const tag = document.activeElement?.tagName
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && !document.activeElement?.isContentEditable) {
          e.preventDefault()
          setSearchOpen(true)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [searchOpen])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const marginLeft = isDesktop ? (collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_FULL) : 0
  const searchExtras = [
    notifikasiPath && { label: 'Notifikasi', path: notifikasiPath },
    pengaturanPath && { label: 'Akun dan Pengaturan', path: pengaturanPath },
  ]

  return (
    <div className="min-h-screen bg-base-200">
      {isDesktop && (
        <Sidebar
          menuItems={menuItems}
          userName={resolvedName}
          userRole={resolvedUserRole}
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
        />
      )}

      {!isDesktop && (
        <MobileSidebar
          menuItems={menuItems}
          isOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
      )}

      <div
        className="flex min-h-screen flex-col transition-all duration-300"
        style={{ marginLeft }}
      >
        <nav className="navbar sticky top-0 z-20 min-h-16 border-b border-base-300 bg-base-100 px-4 sm:px-6">
          <div className="navbar-start gap-2">
            {!isDesktop && (
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="btn btn-ghost btn-square btn-sm"
                aria-label="Buka menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <NavSearchTrigger onOpen={() => setSearchOpen(true)} />
          </div>

          <div className="navbar-end gap-1">
            <NavSearchTrigger iconOnly onOpen={() => setSearchOpen(true)} />
            <AccessibilityMenu />

            {notifikasiPath && (
              <button
                type="button"
                onClick={() => navigate(notifikasiPath)}
                className="btn btn-ghost btn-square btn-sm"
                title="Notifikasi"
              >
                <span className="indicator">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="indicator-item badge badge-error badge-xs">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </span>
              </button>
            )}

            <div className="dropdown dropdown-end">
              <button type="button" tabIndex={0} className="btn btn-ghost h-auto gap-2 px-2 py-1.5">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium text-base-content">{resolvedName}</p>
                  <p className="text-xs font-normal text-base-content/60">{resolvedUserRole}</p>
                </div>
                <UserCircle className="h-8 w-8 text-base-content/60" />
              </button>
              <ul
                tabIndex={0}
                className="dropdown-content menu z-30 mt-2 w-56 rounded-md border border-base-300 bg-base-100 p-1 shadow-md"
              >
                <li className="menu-title px-3 py-2">
                  <span className="text-sm font-semibold text-base-content">{resolvedName}</span>
                  <span className="text-xs font-normal text-base-content/60">{resolvedUserRole}</span>
                </li>
                {pengaturanPath && (
                  <li>
                    <button type="button" onClick={() => navigate(pengaturanPath)}>
                      <Settings className="h-4 w-4" />
                      Akun dan Pengaturan
                    </button>
                  </li>
                )}
                <li>
                  <button type="button" className="text-error" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        <footer className="shrink-0 border-t border-base-300 bg-base-100 px-2 py-3">
          <p className="px-3 py-2.5 text-center text-sm text-base-content/60">
            &copy; {new Date().getFullYear()} Universitas Andalas. Sistem Aktivitas dan Poin Mahasiswa.
          </p>
        </footer>
      </div>

      <NavSearchModal
        isOpen={searchOpen}
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        menuItems={menuItems}
        extraItems={searchExtras}
        extras={searchExtras}
      />
    </div>
  )
}

export default DashboardLayout
