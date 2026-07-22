import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Medal, CheckCircle, BarChart3, Users, GraduationCap, Building2, ShieldCheck, Menu, X } from 'lucide-react'
import logoUnand from '../assets/logo_unand.png'

const features = [
  {
    icon: <BookOpen className="h-8 w-8 text-white sm:h-10 sm:w-10" />,
    title: 'Portofolio Berjenjang',
    desc: 'Pantau capaian poin per tahun (Tahun 1-4) secara rinci dengan sistem rapor berjenjang yang transparan.',
  },
  {
    icon: <Medal className="h-8 w-8 text-white sm:h-10 sm:w-10" />,
    title: 'Klaim Kegiatan',
    desc: 'Klaim poin dari kegiatan dengan kalkulator otomatis berbasis matriks penilaian resmi.',
  },
  {
    icon: <CheckCircle className="h-8 w-8 text-white sm:h-10 sm:w-10" />,
    title: 'Verifikasi Berjenjang',
    desc: 'Verifikasi kegiatan oleh Operator Fakultas dan Admin Ditmawa secara sistematis.',
  },
  {
    icon: <BarChart3 className="h-8 w-8 text-white sm:h-10 sm:w-10" />,
    title: 'Transkrip Rapor Soft Skill',
    desc: 'Generate Transkrip Rapor Soft Skill yang terverifikasi dan siap cetak.',
  },
]

const flowSteps = [
  {
    step: '1',
    icon: <Users className="h-8 w-8 sm:h-10 sm:w-10" />,
    title: 'Login SSO',
    desc: 'Autentikasi via Single Sign-On UNAND. Data profil diambil otomatis dari SIAKAD.',
  },
  {
    step: '2',
    icon: <Medal className="h-8 w-8 sm:h-10 sm:w-10" />,
    title: 'Klaim Kegiatan',
    desc: 'Pilih kegiatan terdaftar atau ajukan kegiatan baru untuk diklaim.',
  },
  {
    step: '3',
    icon: <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10" />,
    title: 'Verifikasi Berjenjang',
    desc: 'Lokal/Regional -> Operator Fakultas. Nasional/Internasional -> Admin Ditmawa.',
  },
  {
    step: '4',
    icon: <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10" />,
    title: 'Poin dan Rapor',
    desc: 'Poin diakumulasikan ke Rapor Berjenjang. Unduh Transkrip Soft Skill kapan saja.',
  },
]

const userRoles = [
  { icon: <Users className="h-7 w-7 sm:h-8 sm:w-8" />, title: 'Mahasiswa', desc: 'Validasi nasional/internasional, analitik universitas, dan peringkat prodi.' },
  { icon: <GraduationCap className="h-7 w-7 sm:h-8 sm:w-8" />, title: 'Dosen PA', desc: 'Memantau dan menyetujui capaian mahasiswa bimbingan.' },
  { icon: <Building2 className="h-7 w-7 sm:h-8 sm:w-8" />, title: 'Operator Fakultas', desc: 'Verifikasi kegiatan skala lokal dan regional.' },
  { icon: <ShieldCheck className="h-7 w-7 sm:h-8 sm:w-8" />, title: 'Admin Ditmawa', desc: 'Verifikasi nasional/internasional dan kelola kurikulum.' },
]

function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white font-poppins">
      {/* Navbar */}
      <header className="fixed top-0 z-50 w-full bg-brand-darker">
        <div className="mx-auto flex h-[70px] max-w-[1440px] items-center justify-between px-4 sm:px-8 lg:h-[99px]">
          <div className="flex items-center gap-3 sm:gap-4">
            <img src={logoUnand} alt="Logo" className="h-10 w-auto object-contain sm:h-[60px]" />
            <div>
              <p className="text-sm font-bold leading-tight text-white sm:text-lg">
                MyUnand Student Connect
              </p>
              <p className="text-[10px] text-white/70 sm:text-xs">Universitas Andalas</p>
            </div>
          </div>

          {/* Desktop right text */}
          <p className="hidden text-sm text-white md:block md:text-base">Direktorat Kemahasiswaan UNAND</p>

          {/* Mobile login button */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              to="/login"
              className="rounded-[8px] bg-white px-4 py-2 text-xs font-semibold text-brand-darker"
            >
              Masuk
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="rounded-lg p-1.5 text-white"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="border-t border-white/20 bg-brand-darker px-4 py-4 md:hidden">
            <p className="text-sm text-white/80">Direktorat Kemahasiswaan UNAND</p>
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-3 flex items-center gap-2 rounded-[10px] bg-white px-5 py-2.5 text-sm font-semibold text-brand-darker"
            >
              Masuk via SSO UNAND <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative mt-[70px] overflow-hidden bg-gradient-to-br from-brand-dark via-brand-mid to-brand-dark lg:mt-[99px] lg:min-h-[835px]">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-8 px-4 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-2 lg:pt-20">
          <div className="py-8 lg:py-12">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs text-white sm:text-sm">
              <span className="h-2 w-2 rounded-full bg-[#4caf50]" />
              Sistem Resmi Universitas Andalas
            </div>
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-7xl">
              MyUnand
              <br />
              Student Connect
            </h1>
            <p className="mt-4 text-base font-medium text-white sm:text-xl">
              Sistem Informasi Pengembangan Diri & Karir Mahasiswa
            </p>
            <p className="mt-4 max-w-[603px] text-sm leading-relaxed text-white/70 sm:mt-6 sm:text-base">
              Platform terpusat untuk mendokumentasikan, mengukur, dan memvalidasi portofolio
              capaian non-akademik mahasiswa Universitas Andalas secara otomatis dan terintegrasi
              dengan SIAKAD.
            </p>
            <div className="mt-4 text-xs leading-relaxed text-white/70 sm:mt-6 sm:text-sm">
              Gunakan akun portal.unand.ac.id - data profil diambil otomatis dari SIAKAD
            </div>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-3 rounded-[10px] bg-white px-6 py-3 text-sm font-semibold text-brand-darker shadow-lg transition hover:bg-white/90 sm:mt-8 sm:px-8 sm:py-4 sm:text-base"
            >
              Masuk via SSO UNAND
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </div>

          {/* Rapor Card — desktop only */}
          <div className="hidden py-12 lg:block">
            <div className="rounded-[30px] bg-white/10 p-6 backdrop-blur-sm">
              <div className="rounded-[30px] bg-white/10 p-6 backdrop-blur-sm">
                <p className="text-sm font-medium text-white">Rapor Capaian Berjenjang</p>
                <p className="mt-2 text-xs text-white/70">Kurikulum Soft Skill - Syarat Yudisium: 550 Poin</p>
                <div className="mt-6 space-y-4">
                  {[
                    { label: 'Tahun 1 - Fondasi', value: '102/100', pct: 100 },
                    { label: 'Tahun 2 - Penguatan', value: '153/150', pct: 100 },
                    { label: 'Tahun 3 - Pemantapan', value: '185/200', pct: 93 },
                    { label: 'Tahun 4 - Aktualisasi', value: '30/100', pct: 30 },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-xs text-white">
                        <span>{item.label}</span>
                        <span>{item.value}</span>
                      </div>
                      <div className="mt-1 h-2 w-full rounded-full bg-white/20">
                        <div
                          className="h-2 rounded-full bg-white transition-all"
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-white/20 pt-4 text-sm text-white">
                  <span>Total Akumulatif</span>
                  <span className="font-bold">470 / 550 Poin</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rapor Card mobile — below hero text */}
        <div className="mx-auto max-w-[1440px] px-4 pb-10 sm:px-8 lg:hidden">
          <div className="rounded-[20px] bg-white/10 p-4 backdrop-blur-sm sm:p-6">
            <p className="text-sm font-medium text-white">Rapor Capaian Berjenjang</p>
            <p className="mt-1 text-xs text-white/70">Kurikulum Soft Skill - Syarat Yudisium: 550 Poin</p>
            <div className="mt-4 space-y-3">
              {[
                { label: 'Tahun 1 - Fondasi', value: '102/100', pct: 100 },
                { label: 'Tahun 2 - Penguatan', value: '153/150', pct: 100 },
                { label: 'Tahun 3 - Pemantapan', value: '185/200', pct: 93 },
                { label: 'Tahun 4 - Aktualisasi', value: '30/100', pct: 30 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-xs text-white">
                    <span>{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-white/20">
                    <div className="h-1.5 rounded-full bg-white" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-3 text-sm text-white">
              <span>Total Akumulatif</span>
              <span className="font-bold">470 / 550 Poin</span>
            </div>
          </div>
        </div>
      </section>

      {/* Fitur Unggulan */}
      <section className="bg-white px-4 py-12 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-[1440px]">
          <h2 className="text-center text-2xl font-bold text-[#061a0d] sm:text-3xl lg:text-4xl">
            Fitur Unggulan MyUnand Student Connect
          </h2>
          <p className="mt-2 text-center text-sm text-[#616161] sm:text-base lg:text-lg">
            Mendukung tiga pilar lulusan: Berkarakter Andalasian, Berjiwa Kewirausahaan, Berdaya Saing Global
          </p>
          <div className="mt-8 grid gap-4 sm:mt-12 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl bg-gradient-to-br from-brand-dark to-brand-mid p-5 text-white shadow-lg sm:p-6"
              >
                <div className="mb-3 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-white/20 sm:mb-4 sm:h-[70px] sm:w-[70px]">
                  {f.icon}
                </div>
                <h3 className="mb-2 text-base font-bold sm:text-lg">{f.title}</h3>
                <p className="text-xs leading-relaxed text-white/80 sm:text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Alur Sistem */}
      <section className="bg-[#f9fafb] px-4 py-12 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-[1440px]">
          <h2 className="text-center text-2xl font-bold text-brand-dark sm:text-3xl">
            Alur Sistem MyUnand Student Connect
          </h2>
          <p className="mt-2 text-center text-xs text-[#616161] sm:text-sm">
            Sesuai Business Requirement Document (BRD) Universitas Andalas
          </p>
          <div className="relative mt-10 sm:mt-16">
            <div className="absolute left-0 right-0 top-10 hidden border-t-2 border-dashed border-brand-dark/20 lg:block" />
            <div className="grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
              {flowSteps.map((step) => (
                <div key={step.step} className="relative text-center">
                  <div className="mx-auto flex h-[60px] w-[60px] items-center justify-center rounded-full bg-white shadow-lg ring-4 ring-brand-dark/10 sm:h-[70px] sm:w-[70px]">
                    {step.icon}
                  </div>
                  <h3 className="mt-3 text-base font-bold text-brand-dark sm:mt-4 sm:text-lg">{step.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#616161] sm:text-sm">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pengguna Sistem */}
      <section className="px-4 py-12 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-[1440px]">
          <h2 className="text-center text-2xl font-bold text-brand-dark sm:text-3xl">
            Pengguna Sistem
          </h2>
          <div className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {userRoles.map((role) => (
              <div
                key={role.title}
                className="rounded-2xl border border-[#e9ebf8] bg-white p-5 text-center shadow-sm transition hover:shadow-md sm:p-6"
              >
                <div className="mx-auto mb-3 flex h-[50px] w-[50px] items-center justify-center rounded-full bg-[#f0f4f0] text-brand-dark sm:mb-4 sm:h-[60px] sm:w-[60px]">
                  {role.icon}
                </div>
                <h3 className="text-base font-bold text-brand-dark sm:text-lg">{role.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#616161] sm:text-sm">{role.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Aturan Bisnis */}
      <section className="bg-[#f9fafb] px-4 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-[1440px] text-center">
          <h2 className="text-2xl font-bold text-brand-dark sm:text-3xl">
            Aturan Bisnis Utama (Business Rules)
          </h2>
          <div className="mx-auto mt-6 grid max-w-4xl gap-3 sm:mt-8 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {['Portofolio Berjenjang', 'Klaim Kegiatan', 'Verifikasi Berjenjang', 'Poin dan Rapor'].map((rule) => (
              <div
                key={rule}
                className="rounded-xl border border-[#e9ebf8] bg-white p-4 text-sm font-medium text-[#333] shadow-sm sm:p-5"
              >
                {rule}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-dark px-4 py-14 text-center sm:px-8 sm:py-20">
        <div className="mx-auto max-w-[1440px]">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Mulai Sekarang !</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/70 sm:text-base">
            Bergabunglah dengan ribuan mahasiswa Universitas Andalas yang telah menggunakan platform ini.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex items-center gap-3 rounded-[10px] bg-white px-6 py-3 text-sm font-semibold text-brand-darker shadow-lg transition hover:bg-white/90 sm:mt-8 sm:px-8 sm:py-4 sm:text-base"
          >
            Masuk via SSO UNAND
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-darker px-4 py-5 text-center text-xs text-white/60 sm:px-8 sm:py-6 sm:text-sm">
        &copy; 2026 Direktorat Kemahasiswaan Universitas Andalas. All rights reserved.
      </footer>
    </div>
  )
}

export default LandingPage
