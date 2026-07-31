import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { login } from '../services/authService'
import { User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import logoUnand from '../assets/logo_unand.png'
import { GridScan } from '../components/GridScan'

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const navigate = useNavigate()

  // Hapus session lama saat halaman login dibuka
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

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-white font-poppins">
      {/* Left Panel — desktop only */}
      <div className="relative hidden min-h-screen w-1/2 flex-col justify-center overflow-hidden login-bg-gradient lg:flex">
        {/* Overlay gelap agar garis grid tidak bercampur dengan warna gradient di belakangnya */}
        <div className="absolute inset-0 bg-[#111111]/85" />

        {/* Decorative background — GridScan (WebGL) */}
        <div className="absolute inset-0 overflow-hidden">
          <GridScan
            sensitivity={0.55}
            lineThickness={1}
            linesColor="#4a4a4a"
            gridScale={0.12}
            scanColor="#6fe08a"
            scanOpacity={0.45}
            enablePost
            bloomIntensity={0.6}
            chromaticAberration={0.002}
            noiseIntensity={0.01}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center px-16 text-center">
          <h1 className="text-white">
            <span className="block text-6xl font-bold leading-tight">Selamat Datang!</span>
          </h1>
          <p className="mt-8 max-w-[423px] text-base leading-relaxed text-white">
          SAPS adalah sistem berbasis web yang dirancang untuk mengelola pengajuan kegiatan, verifikasi poin, dan rekapitulasi capaian mahasiswa secara efektif, transparan, dan terintegrasi.
          </p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex w-full min-h-screen flex-col bg-white lg:w-1/2">
        {/* Mobile top banner */}
        <div className="flex items-center justify-center gap-3 login-bg-gradient px-6 py-6 lg:hidden">
          <img src={logoUnand} alt="Logo" className="h-12 w-12 rounded-full object-cover" />
          <div>
            <p className="text-base font-bold leading-tight text-white">MyUnand Student Connect</p>
            <p className="text-[10px] text-white/70">Universitas Andalas</p>
          </div>
        </div>

        {/* Logo — desktop top */}
        <div className="hidden justify-center pt-[90px] lg:flex">
          <div className="flex flex-col items-center gap-2 text-center">
            <img src={logoUnand} alt="Logo Universitas Andalas" className="h-[60px] w-[60px] object-contain" />
            <div>
              <p className="text-lg font-bold leading-[22px]">
                <span className="bg-gradient-to-r from-[#0e3b1e] to-[#48a757] bg-clip-text text-transparent">
                  MyUnand Student Connect
                </span>
              </p>
              <p className="text-[10px] text-[#616161]">Universitas Andalas</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="flex flex-1 flex-col justify-center px-6 py-8 sm:px-12 lg:px-[86px] lg:py-0">
          <h2 className="text-2xl font-bold text-[#292727] sm:text-3xl lg:text-[36px] lg:leading-[54px]">Log in</h2>
          <p className="mt-2 text-sm text-[#969696] sm:text-base lg:mt-[11px] lg:text-[20px] lg:leading-[30px]">
            Silahkan login menggunakan informasi akun portal Anda.
          </p>

          <form className="mt-6 space-y-4 lg:mt-10 lg:space-y-[18px]" onSubmit={handleSubmit}>
            {/* Username */}
            <div>
              <label className="block text-base font-light text-black lg:text-[20px] lg:leading-[30px]">Email</label>
              <div className="mt-1 flex h-14 items-center gap-3 rounded-xl border border-[#0e3b1e] px-4 lg:h-16 lg:gap-4 lg:px-5">
                <User className="h-5 w-5 shrink-0 text-[#969696]" />
                <input
                  type="text"
                  placeholder=""
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrorMsg('') }}
                  className="h-full w-full bg-transparent text-sm text-black outline-none placeholder:text-[#969696] lg:text-[16px]"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-base font-light text-black lg:text-[20px] lg:leading-[30px]">Password</label>
              <div className="mt-1 flex h-14 items-center gap-3 rounded-xl border border-[#0e3b1e] px-4 lg:h-16 lg:gap-4 lg:px-5">
                <Lock className="h-5 w-5 shrink-0 text-[#969696]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder=""
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorMsg('') }}
                  className="h-full w-full bg-transparent text-sm text-black outline-none placeholder:text-[#969696] lg:text-[16px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="shrink-0 text-[#969696]"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <p className="text-sm text-red-600">{errorMsg}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-14 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#0e3b1e] to-[#2f7a3c] text-base font-medium text-white shadow-lg transition-all hover:opacity-90 hover:shadow-xl disabled:opacity-60 lg:mt-[8px] lg:h-16 lg:text-[20px]"
            >
              {loading ? 'Memproses...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginPage