import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { login, handleSsoLogin } from '../services/authService'
import { User, Lock, Eye, EyeOff, GraduationCap, School, X, Sparkles, UserCheck } from 'lucide-react'
import logoUnand from '../assets/logo_unand.png'
import fotoUnand from '../assets/foto-unand.jpeg'
import AccessibilityMenu from '../components/dashboard/AccessibilityMenu'

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const navigate = useNavigate()

  // State untuk Modal Simulasi SSO UNAND di Local Development
  const [showMockSsoModal, setShowMockSsoModal] = useState(false)
  const [mockRole, setMockRole] = useState('mahasiswa')
  const [mockNim, setMockNim] = useState('2411522001')
  const [mockNama, setMockNama] = useState('Sheva Ramadhan')
  const [useCustomMock, setUseCustomMock] = useState(false)

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const sso = searchParams.get('sso')
    const token = searchParams.get('token')
    const error = searchParams.get('error')

    if (error) {
      setErrorMsg(decodeURIComponent(error))
      window.history.replaceState({}, document.title, '/login')
      return
    }

    if (sso === 'success' && token) {
      setLoading(true)
      setErrorMsg('')
      handleSsoLogin(token)
        .then((user) => {
          toast.success('Login SSO berhasil')
          const roleRoutes = {
            mahasiswa: '/mahasiswa/dashboard',
            dosen: '/dosen/dashboard',
            dosen_pa: '/dosen/dashboard',
            pimpinan_fakultas: '/pimpinan_fakultas/dashboard',
            pimpinan_ditmawa: '/pimpinan_ditmawa/dashboard',
            admin_ditmawa: '/admin_ditmawa/dashboard',
            admin_fakultas: '/admin_fakultas/dashboard',
            operator_ukm: '/operator_ukm/dashboard',
            operator_ukmf: '/operator_ukmf/dashboard',
            pimpinan_utama: '/pimpinan_utama/dashboard',
          }
          const dest = roleRoutes[user.role] || '/mahasiswa/dashboard'
          window.history.replaceState({}, document.title, '/login')
          navigate(dest, { replace: true })
        })
        .catch((err) => {
          console.error('SSO Login Error:', err)
          setErrorMsg(err.message || 'Gagal menyelesaikan login SSO.')
        })
        .finally(() => {
          setLoading(false)
        })
      return
    }

    localStorage.removeItem('saps_current_user')
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    try {
      const user = await login(email, password)
      toast.success('Login berhasil')
      const roleRoutes = {
        mahasiswa: '/mahasiswa/dashboard',
        dosen: '/dosen/dashboard',
        dosen_pa: '/dosen/dashboard',
        pimpinan_fakultas: '/pimpinan_fakultas/dashboard',
        pimpinan_ditmawa: '/pimpinan_ditmawa/dashboard',
        admin_ditmawa: '/admin_ditmawa/dashboard',
        admin_fakultas: '/admin_fakultas/dashboard',
        operator_ukm: '/operator_ukm/dashboard',
        operator_ukmf: '/operator_ukmf/dashboard',
        pimpinan_utama: '/pimpinan_utama/dashboard',
      }
      const dest = roleRoutes[user.role]
      if (!dest) toast.error(`Role "${user.role}" tidak dikenali`)
      navigate(dest || '/login')
    } catch (err) {
      setPassword('')
      setErrorMsg(err.message || 'Username atau password yang Anda masukkan salah.')
    } finally {
      setLoading(false)
    }
  }

  const handleSsoClick = () => {
    setErrorMsg('')
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    if (isLocal) {
      // Buka modal simulasi SSO agar user bisa memilih akun & mengulang login secara realistis
      setShowMockSsoModal(true)
      return
    }

    // Di production / server publik: arahkan ke server autentikasi SSO UNAND
    setLoading(true)
    const ssoUrl = import.meta.env.VITE_SSO_LOGIN_URL || 'https://api-studentconnect.unand.ac.id/api/auth/sso'
    window.location.href = ssoUrl
  }

  const executeMockSsoLogin = (role, nim, nama) => {
    setLoading(true)
    setShowMockSsoModal(false)
    const params = new URLSearchParams({
      role: role || 'mahasiswa',
      nim: nim || '2411522001',
      nama: nama || 'Sheva Ramadhan',
      frontend: window.location.origin,
    })
    window.location.href = `http://localhost:3000/api/auth/sso/mock?${params.toString()}`
  }

  const form = (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="mb-1 block text-sm font-medium text-base-content" htmlFor="login-email">
          Email atau username
        </label>
        <label className="input w-full">
          <User className="h-4 w-4 opacity-50" />
          <input
            id="login-email"
            type="text"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrorMsg('') }}
            placeholder="Masukkan email Anda"
            autoComplete="username"
          />
        </label>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-base-content" htmlFor="login-password">
          Password
        </label>
        <label className="input w-full">
          <Lock className="h-4 w-4 opacity-50" />
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrorMsg('') }}
            placeholder="Masukkan password Anda"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            className="btn btn-ghost btn-xs btn-square"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </label>
      </div>

      {errorMsg ? (
        <div role="alert" className="alert alert-error text-sm">
          <span>{errorMsg}</span>
        </div>
      ) : null}

      <button type="submit" disabled={loading} className="btn btn-primary w-full">
        {loading ? <span className="loading loading-spinner loading-sm" /> : null}
        {loading ? 'Memproses…' : 'Masuk'}
      </button>

      <div className="divider text-xs text-base-content/50">atau</div>

      <button
        type="button"
        onClick={handleSsoClick}
        disabled={loading}
        className="btn btn-outline btn-primary w-full"
      >
        Masuk dengan SSO Unand
      </button>
    </form>
  )

  return (
    <div className="flex min-h-screen w-full bg-base-200 font-sans lg:overflow-hidden lg:bg-base-100">
      <div className="relative hidden h-screen w-1/2 flex-col justify-between overflow-hidden p-10 xl:p-14 lg:flex">
        {/* Background Image */}
        <img
          src={fotoUnand}
          alt="Gedung Rektorat Universitas Andalas"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />

        {/* Green gradients strictly at perimeter edges */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#187a39]/65 via-[#238b45]/20 to-transparent" />

        {/* Top Header & Title */}
        <div className="relative z-10 space-y-12 xl:space-y-16">
          <div className="flex items-center gap-3.5">
            <img src={logoUnand} alt="Logo Universitas Andalas" className="h-12 w-12 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]" />
            <span className="text-xl font-bold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              Universitas Andalas
            </span>
          </div>

          <div>
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.18] tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
              MY UNAND<br />STUDENT CONNECT
            </h1>
          </div>
        </div>

        <div className="relative z-10 space-y-5">
          <p className="max-w-md text-sm xl:text-base leading-relaxed text-white/95 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
            Platform terintegrasi pengelolaan pengajuan kegiatan, verifikasi poin, dan rekapitulasi capaian mahasiswa secara transparan, akuntabel, dan terintegrasi.
          </p>
          <p className="text-xs text-white/80 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
            &copy; {new Date().getFullYear()} Universitas Andalas - Developed by Neo Telemetri.
          </p>
        </div>
      </div>

      <div className="relative flex min-h-screen w-full flex-col lg:w-1/2 lg:bg-base-100">
        <header className="flex items-center justify-between border-b border-base-300 bg-base-100 px-4 py-3 lg:absolute lg:inset-x-0 lg:top-0 lg:z-20 lg:border-0 lg:bg-transparent lg:px-5 lg:py-4">
          <div className="flex items-center gap-2 lg:hidden">
            <img src={logoUnand} alt="Universitas Andalas" className="h-9 w-9 object-contain" />
            <div>
              <p className="text-sm font-semibold text-base-content">MY UNAND STUDENT CONNECT</p>
              <p className="text-xs text-base-content/60">Universitas Andalas</p>
            </div>
          </div>
          <div className="hidden lg:block" />
          <AccessibilityMenu />
        </header>

        <div className="flex flex-1 flex-col justify-center px-4 py-6 sm:px-8 lg:px-20 lg:py-10">
          <div className="mx-auto w-full max-w-md">
            <div className="card border border-base-300 bg-base-100 p-5 sm:p-6 lg:border-0 lg:bg-transparent lg:p-0">
              <h2 className="text-2xl font-extrabold text-base-content">Masuk</h2>
              <p className="mt-1 text-sm text-base-content/60">
                Gunakan akun portal Universitas Andalas.
              </p>
              <div className="mt-6">{form}</div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL SIMULASI SSO UNAND (KHUSUS LOCAL DEVELOPMENT) */}
      {showMockSsoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-lg border border-base-300 bg-base-100 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-base-200 bg-emerald-700 px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                <img src={logoUnand} alt="UNAND" className="h-8 w-8 object-contain drop-shadow" />
                <div>
                  <h3 className="text-base font-bold leading-tight">Portal SSO Universitas Andalas</h3>
                  <p className="text-xs text-emerald-100">Simulasi Autentikasi Pengguna (Local Dev)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMockSsoModal(false)}
                className="btn btn-ghost btn-sm btn-circle text-white hover:bg-emerald-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 p-5">
              <p className="text-xs leading-relaxed text-base-content/70">
                Silakan pilih profil akun untuk masuk ke sistem SAPS melalui Single Sign-On (SSO):
              </p>

              {/* Preset Cards */}
              <div className="space-y-2.5">
                {/* 1. Mahasiswa 2024 (Sheva Ramadhan) */}
                <button
                  type="button"
                  onClick={() => executeMockSsoLogin('mahasiswa', '2411522001', 'Sheva Ramadhan')}
                  className="flex w-full items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-left transition hover:border-emerald-400 hover:bg-emerald-100/70"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-base-content">Sheva Ramadhan</span>
                        <span className="badge badge-success badge-xs text-[10px] text-white">Akt 2024</span>
                      </div>
                      <p className="text-xs text-base-content/70 font-mono">NIM: 2411522001</p>
                    </div>
                  </div>
                  <span className="btn btn-xs btn-success text-white">Masuk &rarr;</span>
                </button>

                {/* 2. Mahasiswa Baru 2026 */}
                <button
                  type="button"
                  onClick={() => executeMockSsoLogin('mahasiswa', '2611521001', 'Mahasiswa Baru 2026')}
                  className="flex w-full items-center justify-between rounded-xl border border-sky-200 bg-sky-50/60 p-3.5 text-left transition hover:border-sky-400 hover:bg-sky-100/70"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-600 text-white shadow-sm">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-base-content">Mahasiswa Baru 2026</span>
                        <span className="badge badge-info badge-xs text-[10px] text-white">Akt 2026</span>
                      </div>
                      <p className="text-xs text-base-content/70 font-mono">NIM: 2611521001 (Auto-Kurikulum)</p>
                    </div>
                  </div>
                  <span className="btn btn-xs btn-info text-white">Masuk &rarr;</span>
                </button>

                {/* 3. Dosen */}
                <button
                  type="button"
                  onClick={() => executeMockSsoLogin('dosen', '198501012010121001', 'Dr. Dosen Teladan, M.Kom')}
                  className="flex w-full items-center justify-between rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 text-left transition hover:border-amber-400 hover:bg-amber-100/70"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-600 text-white shadow-sm">
                      <School className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-base-content">Dr. Dosen Teladan, M.Kom</span>
                        <span className="badge badge-warning badge-xs text-[10px]">Dosen</span>
                      </div>
                      <p className="text-xs text-base-content/70 font-mono">NIP: 198501012010121001</p>
                    </div>
                  </div>
                  <span className="btn btn-xs btn-warning">Masuk &rarr;</span>
                </button>
              </div>

              {/* Toggle Custom Input Form */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setUseCustomMock((v) => !v)}
                  className="text-xs font-semibold text-emerald-700 hover:underline"
                >
                  {useCustomMock ? '▲ Sembunyikan form input kustom' : '▼ Atau masuk dengan NIM / NIP kustom lainnya…'}
                </button>

                {useCustomMock && (
                  <div className="mt-3 space-y-3 rounded-lg border border-base-200 bg-base-200/40 p-3.5">
                    <div>
                      <label className="block text-xs font-medium text-base-content mb-1">Peran Akun</label>
                      <select
                        className="select select-bordered select-sm w-full text-xs"
                        value={mockRole}
                        onChange={(e) => setMockRole(e.target.value)}
                      >
                        <option value="mahasiswa">Mahasiswa</option>
                        <option value="dosen">Dosen</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-base-content mb-1">
                        {mockRole === 'dosen' ? 'NIP' : 'NIM'}
                      </label>
                      <input
                        type="text"
                        className="input input-bordered input-sm w-full text-xs font-mono"
                        value={mockNim}
                        onChange={(e) => setMockNim(e.target.value)}
                        placeholder={mockRole === 'dosen' ? 'Contoh: 198501012010121001' : 'Contoh: 2411522001'}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-base-content mb-1">Nama Lengkap</label>
                      <input
                        type="text"
                        className="input input-bordered input-sm w-full text-xs"
                        value={mockNama}
                        onChange={(e) => setMockNama(e.target.value)}
                        placeholder="Contoh: Budi Pratama"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => executeMockSsoLogin(mockRole, mockNim, mockNama)}
                      className="btn btn-emerald btn-sm w-full bg-emerald-700 text-white hover:bg-emerald-800"
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Masuk dengan Akun Kustom
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-base-200 bg-base-200/30 px-5 py-3">
              <button
                type="button"
                onClick={() => setShowMockSsoModal(false)}
                className="btn btn-ghost btn-sm"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LoginPage
