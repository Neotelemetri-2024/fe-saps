import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-start justify-center gap-6 rounded-4xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-10">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
        404
      </p>
      <h2 className="text-4xl font-black text-slate-950">Halaman tidak ditemukan.</h2>
      <p className="text-lg leading-8 text-slate-600">
        Route yang kamu buka tidak tersedia. Silakan kembali ke halaman utama atau buka
        login.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-full bg-brand-dark px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Home
        </Link>
        <Link
          to="/login"
          className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
        >
          Login
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage
