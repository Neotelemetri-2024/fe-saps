import { Link } from 'react-router-dom'
import { getCurrentUser } from '../services/authService'
import { roleHomePath } from '../components/AuthGuard'
import DashboardLayout, { useDashboardChrome } from '../components/dashboard/DashboardLayout'
import { PublicStatus } from '../components/PublicChrome'

function NotFoundBody({ home, loggedIn }) {
  return (
    <div className="mx-auto max-w-md space-y-4 py-10 text-center">
      <p className="text-sm font-semibold text-primary">404</p>
      <h2 className="text-2xl font-extrabold text-base-content">Halaman tidak ditemukan</h2>
      <p className="text-sm leading-relaxed text-base-content/60">
        Alamat yang dibuka tidak tersedia. Kembali ke {loggedIn ? 'dashboard' : 'halaman masuk'}.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link to={home} className="btn btn-primary btn-sm">
          {loggedIn ? 'Ke dashboard' : 'Masuk'}
        </Link>
        {!loggedIn ? (
          <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
        ) : null}
      </div>
    </div>
  )
}

function NotFoundPage() {
  const user = getCurrentUser()
  const home = roleHomePath(user)
  const inDashboard = useDashboardChrome()
  const loggedIn = Boolean(user?.role)

  if (inDashboard) return <NotFoundBody home={home} loggedIn />

  if (loggedIn) {
    return (
      <DashboardLayout>
        <NotFoundBody home={home} loggedIn />
      </DashboardLayout>
    )
  }

  return (
    <PublicStatus
      code="404"
      title="Halaman tidak ditemukan"
      description="Alamat yang dibuka tidak tersedia. Silakan kembali ke halaman masuk."
      actions={(
        <Link to="/login" className="btn btn-primary btn-sm">Masuk</Link>
      )}
    />
  )
}

export default NotFoundPage
