import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { login } from '../services/authService'
import logoUnand from '../assets/logo_unand.png'

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(email, password)
      toast.success('Login berhasil')
      const roleRoutes = {
        mahasiswa: '/mahasiswa/dashboard',
        'dosen-pa': '/dosen-pa/dashboard',
        'pimpinan-fakultas': '/pimpinan-fakultas/dashboard',
        'pimpinan-ditmawa': '/pimpinan-ditmawa/dashboard',
        'admin-ditmawa': '/admin-ditmawa/dashboard',
        'admin-fakultas': '/admin-fakultas/dashboard',
        ukm: '/ukm/dashboard',
        ukmf: '/ukmf/dashboard',
        'pimpinan-utama': '/pimpinan-utama/dashboard',
      }
      navigate(roleRoutes[user.role] || '/mahasiswa/dashboard')
    } catch (err) {
      toast.error('Login gagal', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-white font-poppins">
      {/* Left Panel — desktop only */}
      <div className="relative hidden min-h-screen w-1/2 flex-col justify-center overflow-hidden bg-brand-gradient lg:flex">
        {/* Decorative SVG Ellipses */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <svg className="login-shape-1 absolute -left-[49.6%] -top-[27.8%] aspect-square w-[123.5%]" viewBox="0 0 889 889" fill="none">
            <path d="M253.044 43.3456C148.261 93.3547 67.2039 182.377 27.2072 291.376C-12.7894 400.374-8.55057 520.696 39.0172 626.61C86.585 732.523 173.706 815.621 281.748 858.133C389.791 900.644 510.178 899.194 617.166 854.094C724.153 808.993 809.247 723.821 854.251 616.792C899.254 509.764 900.594 389.375 857.984 281.371C815.374 173.368 732.197 86.3227 626.24 38.8514C520.283-8.61981 399.958-12.749 290.996 27.3469L321.99 111.575C408.951 79.5744 504.982 82.8698 589.545 120.756C674.108 158.642 740.491 228.112 774.497 314.309C808.504 400.505 807.434 496.586 771.518 582.005C735.601 667.423 667.688 735.398 582.303 771.392C496.917 807.387 400.837 808.544 314.609 774.616C228.382 740.688 158.852 674.368 120.888 589.84C82.9251 505.311 79.5421 409.284 111.463 322.293C143.384 235.303 208.075 164.255 291.701 124.343L253.044 43.3456Z" fill="url(#g1)" stroke="#1C4122" strokeWidth="2" />
            <defs>
              <linearGradient id="g1" x1="444.5" y1="0" x2="444.5" y2="889" gradientUnits="userSpaceOnUse">
                <stop stopColor="#48A757" />
                <stop offset="0.950164" stopColor="#1C4122" />
              </linearGradient>
            </defs>
          </svg>
          <svg className="login-shape-2 absolute -left-[49.6%] -top-[27.8%] aspect-square w-[123.5%]" viewBox="0 0 889 889" fill="none">
            <path d="M270.273 79.445C260.758 59.5079 236.769 50.9062 217.767 62.1747C166.623 92.505 121.962 132.863 86.548 180.965C43.2094 239.831 15.0572 308.476 4.58505 380.82C-5.88712 453.165 1.64401 526.975 26.5113 595.714C51.3786 664.453 92.8145 725.998 147.149 774.897C201.483 823.797 267.038 858.542 338.008 876.055C408.978 893.568 483.171 893.308 554.016 875.298C624.861 857.288 690.171 822.084 744.161 772.804C788.279 732.535 823.725 683.884 848.518 629.838C857.729 609.758 846.656 586.805 825.83 579.436L816.639 576.183C795.813 568.814 773.157 579.854 763.491 599.718C743.922 639.936 716.868 676.202 683.656 706.516C640.568 745.846 588.444 773.941 531.904 788.315C475.363 802.689 416.15 802.896 359.51 788.919C302.87 774.943 250.551 747.213 207.187 708.187C163.824 669.16 130.754 620.042 110.908 565.182C91.0613 510.323 85.0508 451.415 93.4085 393.678C101.766 335.941 124.234 281.156 158.822 234.176C185.482 197.965 218.707 167.252 256.648 143.569C275.388 131.87 283.987 108.181 274.472 88.2435L270.273 79.445Z" fill="url(#g2)" stroke="#2E7D32" strokeWidth="2" />
            <defs>
              <linearGradient id="g2" x1="703.5" y1="297.5" x2="445" y2="889" gradientUnits="userSpaceOnUse">
                <stop stopColor="#48A757" />
                <stop offset="1" stopColor="#1C4122" />
              </linearGradient>
            </defs>
          </svg>
          <svg className="login-shape-3 absolute -left-[60.8%] -top-[48.1%] aspect-square w-[173.5%]" viewBox="0 0 1249 1249" fill="none">
            <path d="M1023.3 728.866C1040.41 733.349 1058.04 723.127 1061.28 705.741C1070.18 657.975 1071.2 608.999 1064.24 560.767C1055.74 501.953 1035.54 445.44 1004.83 394.568C974.119 343.696 933.518 299.499 885.429 264.589C845.992 235.961 802.176 214.055 755.762 199.686C738.867 194.455 721.613 205.29 717.612 222.517C713.611 239.745 724.389 256.823 741.219 262.258C779.316 274.561 815.298 292.821 847.804 316.419C888.964 346.298 923.715 384.127 950.002 427.669C976.289 471.211 993.579 519.582 1000.85 569.922C1006.59 609.677 1005.99 650.023 999.133 689.465C996.104 706.89 1006.2 724.382 1023.3 728.866Z" fill="url(#g3)" stroke="url(#g3s)" strokeWidth="2" />
            <defs>
              <linearGradient id="g3" x1="428.978" y1="372.479" x2="855.995" y2="1007.25" gradientUnits="userSpaceOnUse">
                <stop stopColor="#48A757" />
                <stop offset="0.950164" stopColor="#1C4122" />
              </linearGradient>
              <linearGradient id="g3s" x1="348.922" y1="275.379" x2="899.68" y2="973.223" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1C4122" />
                <stop offset="1" stopColor="#48A757" />
              </linearGradient>
            </defs>
          </svg>
          <svg className="login-shape-4 absolute -left-[27.6%] top-[71.6%] aspect-square w-[139.2%]" viewBox="0 0 1002 1010" fill="none">
            <path d="M529.493 164.315C530.372 153.897 522.069 144.954 511.639 145.677C463.134 149.04 414.765 162.482 369.559 185.248C323.214 208.587 281.352 241.14 246.668 280.724C240.573 287.68 241.755 298.253 248.986 304.02C256.157 309.74 266.575 308.566 272.647 301.691C303.726 266.499 341.121 237.536 382.475 216.711C423.709 195.945 467.862 183.784 512.108 180.932C521.195 180.347 528.727 173.389 529.493 164.315Z" fill="url(#g4)" stroke="url(#g4s)" strokeWidth="2" />
            <defs>
              <linearGradient id="g4" x1="325.186" y1="708.054" x2="782.32" y2="254.039" gradientUnits="userSpaceOnUse">
                <stop stopColor="#48A757" />
                <stop offset="0.950164" stopColor="#1C4122" />
              </linearGradient>
              <linearGradient id="g4s" x1="500.536" y1="187.223" x2="261.536" y2="276.223" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1C4122" />
                <stop offset="1" stopColor="#48A757" />
              </linearGradient>
            </defs>
          </svg>
          <svg className="login-shape-5 absolute -left-[19%] top-[80.4%] aspect-square w-[152.1%]" viewBox="0 0 1095 1095" fill="none">
            <path d="M925.866 383.892C942.11 376.898 949.711 357.994 941.566 342.296C906.173 274.083 853.601 216.036 788.811 174.034C715.043 126.211 628.75 101.337 540.844 102.557C452.939 103.777 367.37 131.037 294.957 180.89C231.359 224.674 180.418 284.157 146.932 353.327C139.226 369.245 147.349 387.93 163.781 394.471C180.213 401.012 198.716 392.917 206.614 377.093C235.285 319.657 278.114 270.242 331.275 233.643C393.254 190.974 466.494 167.642 541.733 166.597C616.973 165.553 690.832 186.843 753.972 227.775C808.129 262.884 852.312 311.091 882.566 367.71C890.901 383.308 909.622 390.886 925.866 383.892Z" fill="url(#g5)" stroke="url(#g5s)" strokeWidth="2" />
            <defs>
              <linearGradient id="g5" x1="212.5" y1="232" x2="847.641" y2="213.577" gradientUnits="userSpaceOnUse">
                <stop stopColor="#2E7D32" />
                <stop offset="0.950164" stopColor="#1C4122" />
              </linearGradient>
              <linearGradient id="g5s" x1="292" y1="190.5" x2="860.5" y2="396.5" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1C4122" />
                <stop offset="1" stopColor="#48A757" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="relative z-10 px-16">
          <h1 className="text-white">
            <span className="block text-4xl font-bold">Hallo,</span>
            <span className="block text-6xl font-bold leading-tight">Selamat Datang !</span>
          </h1>
          <p className="mt-8 max-w-[423px] text-base leading-relaxed text-white">
            Program Kreativitas Mahasiswa (PKM) adalah kompetisi yang diselenggarakan untuk
            mengembangkan ide dan kreativitas mahasiswa dalam berbagai bidang ilmiah dan teknologi.
          </p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex w-full min-h-screen flex-col bg-white lg:w-1/2">
        {/* Mobile top banner */}
        <div className="flex items-center justify-center gap-3 bg-brand-gradient px-6 py-6 lg:hidden">
          <img src={logoUnand} alt="Logo" className="h-12 w-12 rounded-full object-cover" />
          <div>
            <p className="text-base font-bold leading-tight text-white">MyUnand Student Connect</p>
            <p className="text-[10px] text-white/70">Universitas Andalas</p>
          </div>
        </div>

        {/* Logo — desktop top-right */}
        <div className="hidden justify-end pr-[180px] pt-[111px] lg:flex">
          <div className="flex items-center gap-4">
            <img src={logoUnand} alt="Logo Universitas Andalas" className="h-[60px] w-[60px] rounded-full object-cover" />
            <div>
              <p className="text-lg font-bold leading-[22px]">
                <span className="bg-gradient-to-r from-brand-dark to-brand-light bg-clip-text text-transparent">
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
              <label className="block text-base font-light text-black lg:text-[20px] lg:leading-[30px]">Username</label>
              <div className="mt-1 flex h-14 items-center gap-3 rounded-xl border border-brand-dark px-4 lg:h-16 lg:gap-4 lg:px-5">
                <svg className="h-5 w-5 shrink-0 text-[#969696]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
                <input
                  type="text"
                  placeholder="dendi_unand"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-full w-full bg-transparent text-sm text-black outline-none placeholder:text-[#969696] lg:text-[16px]"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-base font-light text-black lg:text-[20px] lg:leading-[30px]">Password</label>
              <div className="mt-1 flex h-14 items-center gap-3 rounded-xl border border-brand-dark px-4 lg:h-16 lg:gap-4 lg:px-5">
                <svg className="h-5 w-5 shrink-0 text-[#969696]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="123456"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-full w-full bg-transparent text-sm text-black outline-none placeholder:text-[#969696] lg:text-[16px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="shrink-0 text-[#969696]"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    {showPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-14 w-full items-center justify-center rounded-xl bg-gradient-to-r from-brand-dark to-brand-light text-base font-medium text-white shadow-lg transition-all hover:opacity-90 hover:shadow-xl disabled:opacity-60 lg:mt-[8px] lg:h-16 lg:text-[20px]"
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
