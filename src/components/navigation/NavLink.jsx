import { NavLink as RouterNavLink } from 'react-router-dom'

const baseClass =
  'rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200'

function NavLink({ to, children, end = false }) {
  return (
    <RouterNavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `${baseClass} ${isActive ? 'bg-brand-dark text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'}`
      }
    >
      {children}
    </RouterNavLink>
  )
}

export default NavLink
