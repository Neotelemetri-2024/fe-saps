import { NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'

function Sidebar({ menuItems, userName, userRole }) {
  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[260px] flex-col border-r border-[#e9ebf8] bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-[#e9ebf8] px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-dark to-brand-light text-sm font-bold text-white shadow-md">
          UA
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-brand-dark">
            MyUnand Student Connect
          </p>
          <p className="text-[10px] text-[#616161]">Universitas Andalas</p>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-4 py-4">
        <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-brand-dark">
          Menu Utama
        </p>
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isHash = item.path === '#'

            if (isHash) {
              return (
                <li key={item.label}>
                  <button className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm text-[#333] transition-all hover:bg-gradient-to-r hover:from-brand-dark hover:to-brand-light hover:text-white active:bg-gradient-to-r active:from-brand-dark active:to-brand-light active:text-white">
                    <span className="flex h-5 w-5 items-center justify-center">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
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
                  <span>{item.label}</span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="border-t border-[#e9ebf8] px-4 py-4">
        <NavLink
          to="/login"
          onClick={(e) => {
            e.preventDefault()
            window.location.href = '/login'
          }}
          className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm text-[#333] transition-all hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </NavLink>
      </div>
    </aside>
  )
}

export default Sidebar
