import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut } from 'lucide-react'
import { logout } from '../../services/authService'
import logoUnand from '../../assets/logo_unand.png'

function Sidebar({ menuItems, userName, userRole }) {
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
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[260px] flex-col border-r border-[#e9ebf8] bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-[#e9ebf8] px-5 py-4">
        <img src={logoUnand} alt="Logo" className="h-10 w-auto object-contain" />
        <div>
          <p className="text-sm font-bold leading-tight text-brand-dark">
            MyUnand Student Connect
          </p>
          <p className="text-[10px] text-[#616161]">Universitas Andalas</p>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-4 py-4">
        {/* <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-brand-dark">
          Menu Utama
        </p> */}
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
                    className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm text-[#333] transition-all hover:bg-gradient-to-r hover:from-brand-dark hover:to-brand-light hover:text-white active:bg-gradient-to-r active:from-brand-dark active:to-brand-light active:text-white"
                  >
                    <span className="flex h-5 w-5 items-center justify-center">{item.icon}</span>
                    <span className="flex-1 text-left leading-snug">{item.label}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <ul className="mt-1 space-y-1 pl-8">
                      {item.children.map((child) => {
                        const childHash = child.path === '#'
                        if (childHash) {
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
                  <button className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm text-[#333] transition-all hover:bg-gradient-to-r hover:from-brand-dark hover:to-brand-light hover:text-white active:bg-gradient-to-r active:from-brand-dark active:to-brand-light active:text-white">
                    <span className="flex h-5 w-5 items-center justify-center">
                      {item.icon}
                    </span>
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
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-brand-dark to-brand-light font-semibold text-white shadow-md'
                        : 'text-[#333] hover:bg-gradient-to-r hover:from-brand-dark hover:to-brand-light hover:text-white active:bg-gradient-to-r active:from-brand-dark active:to-brand-light active:text-white'
                    }`
                  }
                >
                  <span className="flex h-5 w-5 items-center justify-center">
                    {item.icon}
                  </span>
                  <span className="flex-1 text-left leading-snug">{item.label}</span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="border-t border-[#e9ebf8] px-4 py-4">
        <button
          onClick={() => { logout(); navigate('/login') }}
          className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm text-[#333] transition-all hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
