import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { login } from '../services/authService'
import { User, Lock, Eye, EyeOff } from 'lucide-react'
import logoUnand from '../assets/logo_unand.png'
import GradientWaves from '../components/GradientWaves'
import AccessibilityMenu from '../components/dashboard/AccessibilityMenu'
import { useAppearance } from '../lib/appearance'
import { isDarkTheme } from '../constants/theme'

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const navigate = useNavigate()
  const { theme } = useAppearance()
  const dark = isDarkTheme(theme)

  useEffect(() => {
    localStorage.removeItem('saps_current_user')
  }, [])

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
        onClick={() => toast.info('Login SSO Unand belum tersedia')}
        className="btn btn-outline btn-primary w-full"
      >
        Masuk dengan SSO Unand
      </button>
    </form>
  )

  return (
    <div className="flex min-h-screen w-full bg-base-200 font-sans lg:overflow-hidden lg:bg-base-100">
      <div className={`relative hidden h-screen w-1/2 flex-col justify-center overflow-hidden lg:flex ${dark ? 'bg-black' : 'bg-white'}`}>
        <GradientWaves
          horizonColor={dark ? '#16a34a' : '#009219'}
          waveColor={dark ? '#22c55e' : '#006e0b'}
          crestColor={dark ? '#4ade80' : '#017a2d'}
          speed={0.4}
          amplitude={2.5}
          waveScale={0.6}
          waveRatio={0.9}
          swell={35}
          turbulence={20}
          tilt={1.11}
          zoom={0.55}
          height={6.5}
          fogDepth={18}
          detail="medium"
          brightness={dark ? 1.2 : 1}
          opacity={1}
          mouseInteraction
          parallaxStrength={0.5}
          grain
          grainIntensity={0.025}
        />
        <div className="pointer-events-none relative z-10 flex flex-col items-center px-16 text-center">
          <h1 className="text-5xl font-extrabold leading-tight text-primary">
            Selamat Datang!
          </h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-primary/80">
            SAPS mengelola pengajuan kegiatan, verifikasi poin, dan rekapitulasi capaian mahasiswa secara terintegrasi.
          </p>
        </div>
      </div>

      <div className="relative flex min-h-screen w-full flex-col lg:w-1/2 lg:bg-base-100">
        <header className="flex items-center justify-between border-b border-base-300 bg-base-100 px-4 py-3 lg:absolute lg:inset-x-0 lg:top-0 lg:z-20 lg:border-0 lg:bg-transparent lg:px-5 lg:py-4">
          <div className="flex items-center gap-2 lg:hidden">
            <img src={logoUnand} alt="Universitas Andalas" className="h-9 w-9 object-contain" />
            <div>
              <p className="text-sm font-semibold text-base-content">SAPS</p>
              <p className="text-xs text-base-content/60">Universitas Andalas</p>
            </div>
          </div>
          <div className="hidden lg:block" />
          <AccessibilityMenu />
        </header>

        <div className="flex flex-1 flex-col justify-center px-4 py-6 sm:px-8 lg:px-20 lg:py-10">
          <div className="mx-auto w-full max-w-md">
            <div className="hidden flex-col items-center gap-1 pb-8 text-center lg:flex">
              <img src={logoUnand} alt="Logo Universitas Andalas" className="h-11 w-11 object-contain" />
              <p className="text-xl font-extrabold text-primary">SAPS</p>
              <p className="text-sm text-base-content/60">Universitas Andalas</p>
            </div>

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
    </div>
  )
}

export default LoginPage
