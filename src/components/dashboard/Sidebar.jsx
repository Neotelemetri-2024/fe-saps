import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, Menu, X, ChevronRight } from 'lucide-react'
import logoUnand from '../../assets/logo_unand.png'

function menuHasActiveChild(item, pathname) {
  return item.children?.some(
    (child) => child.path !== '#' && (pathname === child.path || pathname.startsWith(`${child.path}/`)),
  )
}

function navClass(isActive) {
  return `flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-xs font-semibold transition-colors ${
    isActive
      ? 'bg-primary text-primary-content shadow-xs'
      : 'text-base-content/80 hover:bg-base-200 hover:text-base-content'
  }`
}

function parentClass(isExpanded) {
  return `flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-xs font-semibold transition-colors ${
    isExpanded
      ? 'bg-primary/10 text-primary'
      : 'text-base-content/80 hover:bg-base-200 hover:text-base-content'
  }`
}

function childClass(isActive) {
  return `block rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
    isActive
      ? 'bg-primary text-primary-content'
      : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
  }`
}

function MenuList({ menuItems, collapsed, onNavigate }) {
  const location = useLocation()
  const [openMenus, setOpenMenus] = useState(() => {
    const initial = {}
    menuItems.forEach((item) => {
      if (menuHasActiveChild(item, location.pathname)) initial[item.label] = true
    })
    return initial
  })

  useEffect(() => {
    setOpenMenus((prev) => {
      const next = { ...prev }
      menuItems.forEach((item) => {
        if (menuHasActiveChild(item, location.pathname)) next[item.label] = true
      })
      return next
    })
  }, [location.pathname, menuItems])

  const toggleMenu = (label) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <ul className="space-y-1">
      {menuItems.map((item) => {
        const isHash = item.path === '#'
        const hasChildren = item.children?.length > 0
        const isMenuExpanded = openMenus[item.label]

        if (hasChildren) {
          return (
            <li key={item.label}>
              <button
                type="button"
                onClick={() => !collapsed && toggleMenu(item.label)}
                title={collapsed ? item.label : undefined}
                className={parentClass(isMenuExpanded && !collapsed)}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center">{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className="min-w-0 flex-1 truncate text-left leading-snug">{item.label}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isMenuExpanded ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>
              {!collapsed && isMenuExpanded && (
                <ul className="mt-1 space-y-1 pl-8">
                  {item.children.map((child) => {
                    if (child.path === '#') {
                      return (
                        <li key={child.label}>
                          <button type="button" className={childClass(false)}>{child.label}</button>
                        </li>
                      )
                    }
                    return (
                      <li key={child.path}>
                        <NavLink
                          to={child.path}
                          end={child.end}
                          onClick={onNavigate}
                          className={({ isActive }) => childClass(isActive)}
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
              <button type="button" title={collapsed ? item.label : undefined} className={navClass(false)}>
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
              onClick={onNavigate}
              className={({ isActive }) => navClass(isActive)}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">{item.icon}</span>
              {!collapsed && <span className="flex-1 truncate text-left leading-snug">{item.label}</span>}
            </NavLink>
          </li>
        )
      })}
    </ul>
  )
}

function Sidebar({ menuItems, collapsed, onToggle }) {
  return (
    <aside
      className={`fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-base-300 bg-base-100 transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-[260px]'
      }`}
    >
      <div className="flex h-16 shrink-0 items-center border-b border-base-300 px-3">
        {!collapsed && (
          <div className="flex flex-1 items-center gap-2.5 overflow-hidden min-w-0 pr-1">
            <img src={logoUnand} alt="Logo" className="h-9 w-auto shrink-0 object-contain" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold leading-tight tracking-tight text-base-content whitespace-nowrap">
                MY UNAND
              </p>
              <p className="text-[11px] font-bold leading-tight text-base-content/85 whitespace-nowrap">
                STUDENT CONNECT
              </p>
              <p className="text-[9px] text-base-content/50 leading-none mt-0.5 whitespace-nowrap">
                Universitas Andalas
              </p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex flex-1 justify-center">
            <img src={logoUnand} alt="Logo" className="h-8 w-auto object-contain" />
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="btn btn-ghost btn-square btn-xs shrink-0"
          title={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4">
        <MenuList menuItems={menuItems} collapsed={collapsed} />
      </nav>
    </aside>
  )
}

function MobileSidebar({ menuItems, isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />
      <aside className="fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col border-r border-base-300 bg-base-100 lg:hidden">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-base-300 px-3.5 gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <img src={logoUnand} alt="Logo" className="h-9 w-auto shrink-0 object-contain" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold leading-tight tracking-tight text-base-content whitespace-nowrap">
                MY UNAND
              </p>
              <p className="text-[11px] font-bold leading-tight text-base-content/85 whitespace-nowrap">
                STUDENT CONNECT
              </p>
              <p className="text-[9px] text-base-content/50 leading-none mt-0.5 whitespace-nowrap">
                Universitas Andalas
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-square btn-xs shrink-0" aria-label="Tutup menu">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <MenuList menuItems={menuItems} collapsed={false} onNavigate={onClose} />
        </nav>
      </aside>
    </>
  )
}

export { MobileSidebar }
export default Sidebar
