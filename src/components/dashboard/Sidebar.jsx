import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, Menu, X, ChevronRight } from 'lucide-react'
import { logout } from '../../services/authService'
import logoUnand from '../../assets/logo_unand.png'

function Sidebar({ menuItems, userName, userRole, collapsed, onToggle }) {
  const navigate = useNavigate()
  const [openMenus, setOpenMenus] = useState(() =>
    menuItems.reduce((acc, item) => {
      if (item.children?.length) acc[item.label] = true
      return acc
    }, {})
  )

  const toggleMenu = (label) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <aside
      className={`fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-[#e9ebf8] bg-white transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-[260px]'
      }`}
    >
      {/* Logo + toggle */}
      <div className="flex h-[86px] shrink-0 items-center border-b border-[#e9ebf8] px-3">
        {!collapsed && (
          <div className="flex flex-1 items-center gap-3 overflow-hidden">
            <img src={logoUnand} alt="Logo" className="h-10 w-auto shrink-0 object-contain" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight text-brand-dark">
                MyUnand Student Connect
              </p>
              <p className="text-[10px] text-[#616161]">Universitas Andalas</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex flex-1 justify-center">
            <img src={logoUnand} alt="Logo" className="h-9 w-auto object-contain" />
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="ml-1 shrink-0 rounded-lg p-1.5 text-[#616161] transition hover:bg-[#f0f4f0] hover:text-brand-dark"
          title={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isHash = item.path === '#'
            const hasChildren = item.children?.length > 0
            const isOpen = openMenus[item.label]

            if (hasChildren) {
              return (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => !collapsed && toggleMenu(item.label)}
                    title={collapsed ? item.label : undefined}
                    className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm text-[#333] transition-all hover:bg-gradient-to-r hover:from-brand-dark hover:to-brand-light hover:text-white"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center">{item.icon}</span>
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate text-left leading-snug">{item.label}</span>
                        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </>
                    )}
                  </button>
                  {!collapsed && isOpen && (
                    <ul className="mt-1 space-y-1 pl-8">
                      {item.children.map((child) => {
                        if (child.path === '#') {
                          return (
                            <li key={child.label}>
                              <button className="w-full rounded-[10px] px-3 py-2 text-left text-sm leading-snug text-[#333] transition hover:bg-[#f0f4f0] hover:text-brand-dark">
                                {child.label}
                              </button>
                            </li>
                          )
                        }
                        return (
                          <li key={child.path}>
                            <NavLink
                              to={child.path}
                              end={child.end}
                              className={({ isActive }) =>
                                `block rounded-[10px] px-3 py-2 text-left text-sm leading-snug transition ${
                                  isActive
                                    ? 'bg-[#f0f4f0] font-semibold text-brand-dark'
                                    : 'text-[#333] hover:bg-[#f0f4f0] hover:text-brand-dark'
                                }`
                              }
                            >
                              {child.label}
                            </NavLink>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </li>
              )
            }

            if (isHash) {
              return (
                <li key={item.label}>
                  <button
                    title={collapsed ? item.label : undefined}
                    className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm text-[#333] transition-all hover:bg-gradient-to-r hover:from-brand-dark hover:to-brand-light hover:text-white"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center">{item.icon}</span>
                    {!collapsed && <span className="flex-1 truncate text-left leading-snug">{item.label}</span>}
                  </button>
                </li>
              )
            }

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.end}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-brand-dark to-brand-light font-semibold text-white shadow-md'
                        : 'text-[#333] hover:bg-gradient-to-r hover:from-brand-dark hover:to-brand-light hover:text-white'
                    }`
                  }
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center">{item.icon}</span>
                  {!collapsed && <span className="flex-1 truncate text-left leading-snug">{item.label}</span>}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="shrink-0 border-t border-[#e9ebf8] px-2 py-3">
        <button
          onClick={() => { logout(); navigate('/login') }}
          title={collapsed ? 'Logout' : undefined}
          className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm text-[#333] transition-all hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}

/* Mobile overlay sidebar */
function MobileSidebar({ menuItems, isOpen, onClose }) {
  const navigate = useNavigate()
  const [openMenus, setOpenMenus] = useState(() =>
    menuItems.reduce((acc, item) => {
      if (item.children?.length) acc[item.label] = true
      return acc
    }, {})
  )

  const toggleMenu = (label) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        onClick={onClose}
      />
      {/* Panel */}
      <aside className="fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-[#e9ebf8] bg-white lg:hidden">
        <div className="flex h-[70px] shrink-0 items-center justify-between border-b border-[#e9ebf8] px-4">
          <div className="flex items-center gap-3">
            <img src={logoUnand} alt="Logo" className="h-9 w-auto object-contain" />
            <div>
              <p className="text-sm font-bold leading-tight text-brand-dark">MyUnand Student Connect</p>
              <p className="text-[10px] text-[#616161]">Universitas Andalas</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-[#616161] hover:bg-[#f0f4f0]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isHash = item.path === '#'
              const hasChildren = item.children?.length > 0
              const isOpen = openMenus[item.label]

              if (hasChildren) {
                return (
                  <li key={item.label}>
                    <button
                      type="button"
                      onClick={() => toggleMenu(item.label)}
                      className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm text-[#333] transition-all hover:bg-gradient-to-r hover:from-brand-dark hover:to-brand-light hover:text-white"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center">{item.icon}</span>
                      <span className="flex-1 text-left leading-snug">{item.label}</span>
                      <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <ul className="mt-1 space-y-1 pl-8">
                        {item.children.map((child) => {
                          if (child.path === '#') {
                            return (
                              <li key={child.label}>
                                <button className="w-full rounded-[10px] px-3 py-2 text-left text-sm text-[#333] hover:bg-[#f0f4f0] hover:text-brand-dark">
                                  {child.label}
                                </button>
                              </li>
                            )
                          }
                          return (
                            <li key={child.path}>
                              <NavLink
                                to={child.path}
                                onClick={onClose}
                                className={({ isActive }) =>
                                  `block rounded-[10px] px-3 py-2 text-sm transition ${
                                    isActive ? 'bg-[#f0f4f0] font-semibold text-brand-dark' : 'text-[#333] hover:bg-[#f0f4f0] hover:text-brand-dark'
                                  }`
                                }
                              >
                                {child.label}
                              </NavLink>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </li>
                )
              }

              if (isHash) {
                return (
                  <li key={item.label}>
                    <button className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm text-[#333] hover:bg-gradient-to-r hover:from-brand-dark hover:to-brand-light hover:text-white">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center">{item.icon}</span>
                      <span className="flex-1 text-left leading-snug">{item.label}</span>
                    </button>
                  </li>
                )
              }

              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-brand-dark to-brand-light font-semibold text-white shadow-md'
                          : 'text-[#333] hover:bg-gradient-to-r hover:from-brand-dark hover:to-brand-light hover:text-white'
                      }`
                    }
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center">{item.icon}</span>
                    <span className="flex-1 text-left leading-snug">{item.label}</span>
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-[#e9ebf8] px-2 py-3">
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm text-[#333] hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export { MobileSidebar }
export default Sidebar
