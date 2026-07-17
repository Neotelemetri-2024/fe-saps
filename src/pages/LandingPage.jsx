import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Medal, CheckCircle, BarChart3, Users, GraduationCap, Building2, ShieldCheck } from 'lucide-react'

const features = [
  {
    icon: <BookOpen className="h-10 w-10 text-white" />,
    title: 'Portofolio Berjenjang',
    desc: 'Pantau capaian poin per tahun (Tahun 1-4) secara rinci dengan sistem rapor berjenjang yang transparan.',
  },
  {
    icon: <Medal className="h-10 w-10 text-white" />,
    title: 'Klaim Kegiatan',
    desc: 'Klaim poin dari kegiatan dengan kalkulator otomatis berbasis matriks penilaian resmi.',
  },
  {
    icon: <CheckCircle className="h-10 w-10 text-white" />,
    title: 'Verifikasi Berjenjang',
    desc: 'Verifikasi kegiatan oleh Operator Fakultas dan Admin Ditmawa secara sistematis.',
  },
  {
    icon: <BarChart3 className="h-10 w-10 text-white" />,
    title: 'Transkrip Rapor Soft Skill',
    desc: 'Generate Transkrip Rapor Soft Skill yang terverifikasi dan siap cetak.',
  },
]

const flowSteps = [
  {
    step: '1',
    icon: <Users className="h-10 w-10" />,
    title: 'Login SSO',
    desc: 'Autentikasi via Single Sign-On UNAND. Data profil diambil otomatis dari SIAKAD.',
  },
  {
    step: '2',
    icon: <Medal className="h-10 w-10" />,
    title: 'Klaim Kegiatan',
    desc: 'Pilih kegiatan terdaftar atau ajukan kegiatan baru untuk diklaim.',
  },
  {
    step: '3',
    icon: <CheckCircle className="h-10 w-10" />,
    title: 'Verifikasi Berjenjang',
    desc: 'Lokal/Regional -> Operator Fakultas. Nasional/Internasional -> Admin Ditmawa.',
  },
  {
    step: '4',
    icon: <BarChart3 className="h-10 w-10" />,
    title: 'Poin dan Rapor',
    desc: 'Poin diakumulasikan ke Rapor Berjenjang. Unduh Transkrip Soft Skill kapan saja.',
  },
]

const userRoles = [
  { icon: <Users className="h-8 w-8" />, title: 'Mahasiswa', desc: 'Validasi nasional/internasional, analitik universitas, dan peringkat prodi.' },
  { icon: <GraduationCap className="h-8 w-8" />, title: 'Dosen PA', desc: 'Memantau dan menyetujui capaian mahasiswa bimbingan.' },
  { icon: <Building2 className="h-8 w-8" />, title: 'Operator Fakultas', desc: 'Verifikasi kegiatan skala lokal dan regional.' },
  { icon: <ShieldCheck className="h-8 w-8" />, title: 'Admin Ditmawa', desc: 'Verifikasi nasional/internasional dan kelola kurikulum.' },
]

function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-poppins">
      {/* Navbar */}
      <header className="fixed top-0 z-50 w-full bg-brand-darker">
        <div className="mx-auto flex h-[99px] max-w-[1440px] items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-white text-xl font-bold text-brand-darker">
              UA
            </div>
            <div>
              <p className="text-lg font-bold leading-tight text-white">
                MyUnand Student Connect
              </p>
              <p className="text-xs text-white/70">Universitas Andalas</p>
            </div>
          </div>
          <p className="text-base text-white">Direktorat Kemahasiswaan UNAND</p>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mt-[99px] min-h-[835px] overflow-hidden bg-gradient-to-br from-brand-dark via-brand-mid to-brand-dark">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-8 px-8 pt-20 lg:grid-cols-2">
          <div className="py-12">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm text-white">
              <span className="h-2 w-2 rounded-full bg-[#4caf50]" />
              Sistem Resmi Universitas Andalas
            </div>
            <h1 className="text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
              MyUnand
              <br />
              Student Connect
            </h1>
            <p className="mt-4 text-xl font-medium text-white">
              Sistem Informasi Pengembangan Diri & Karir Mahasiswa
            </p>
            <p className="mt-6 max-w-[603px] text-base leading-relaxed text-white/70">
              Platform terpusat untuk mendokumentasikan, mengukur, dan memvalidasi portofolio
              capaian non-akademik mahasiswa Universitas Andalas secara otomatis dan terintegrasi
              dengan SIAKAD.
            </p>
            <div className="mt-6 text-sm leading-relaxed text-white/70">
              Gunakan akun portal.unand.ac.id - data profil diambil otomatis dari SIAKAD
            </div>
            <Link
              to="/login"
              className="mt-8 inline-flex items-center gap-3 rounded-[10px] bg-white px-8 py-4 font-semibold text-brand-darker shadow-lg transition hover:bg-white/90"
            >
              Masuk via SSO UNAND
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          {/* Rapor Card */}
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
      </section>

      {/* Fitur Unggulan */}
      <section className="bg-white px-8 py-20">
        <div className="mx-auto max-w-[1440px]">
          <h2 className="text-center text-4xl font-bold text-[#061a0d]">
            Fitur Unggulan MyUnand Student Connect
          </h2>
          <p className="mt-2 text-center text-lg text-[#616161]">
            Mendukung tiga pilar lulusan: Berkarakter Andalasian, Berjiwa Kewirausahaan, Berdaya Saing Global
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl bg-gradient-to-br from-brand-dark to-brand-mid p-6 text-white shadow-lg"
              >
                <div className="mb-4 flex h-[70px] w-[70px] items-center justify-center rounded-full bg-white/20">
                  {f.icon}
                </div>
                <h3 className="mb-2 text-lg font-bold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-white/80">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Alur Sistem */}
      <section className="bg-[#f9fafb] px-8 py-20">
        <div className="mx-auto max-w-[1440px]">
          <h2 className="text-center text-3xl font-bold text-brand-dark">
            Alur Sistem MyUnand Student Connect
          </h2>
          <p className="mt-2 text-center text-sm text-[#616161]">
            Sesuai Business Requirement Document (BRD) Universitas Andalas
          </p>
          <div className="relative mt-16">
            <div className="absolute left-0 right-0 top-10 hidden border-t-2 border-dashed border-brand-dark/20 lg:block" />
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {flowSteps.map((step) => (
                <div key={step.step} className="relative text-center">
                  <div className="mx-auto flex h-[70px] w-[70px] items-center justify-center rounded-full bg-white shadow-lg ring-4 ring-brand-dark/10">
                    {step.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-brand-dark">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#616161]">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pengguna Sistem */}
      <section className="px-8 py-20">
        <div className="mx-auto max-w-[1440px]">
          <h2 className="text-center text-3xl font-bold text-brand-dark">
            Pengguna Sistem
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {userRoles.map((role) => (
              <div
                key={role.title}
                className="rounded-2xl border border-[#e9ebf8] bg-white p-6 text-center shadow-sm transition hover:shadow-md"
              >
                <div className="mx-auto mb-4 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#f0f4f0] text-brand-dark">
                  {role.icon}
                </div>
                <h3 className="text-lg font-bold text-brand-dark">{role.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#616161]">{role.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Aturan Bisnis */}
      <section className="bg-[#f9fafb] px-8 py-16">
        <div className="mx-auto max-w-[1440px] text-center">
          <h2 className="text-3xl font-bold text-brand-dark">
            Aturan Bisnis Utama (Business Rules)
          </h2>
          <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {['Portofolio Berjenjang', 'Klaim Kegiatan', 'Verifikasi Berjenjang', 'Poin dan Rapor'].map((rule) => (
              <div
                key={rule}
                className="rounded-xl border border-[#e9ebf8] bg-white p-5 text-sm font-medium text-[#333] shadow-sm"
              >
                {rule}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-dark px-8 py-20 text-center">
        <div className="mx-auto max-w-[1440px]">
          <h2 className="text-4xl font-bold text-white">Mulai Sekarang !</h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/70">
            Bergabunglah dengan ribuan mahasiswa Universitas Andalas yang telah menggunakan platform ini.
          </p>
          <Link
            to="/login"
            className="mt-8 inline-flex items-center gap-3 rounded-[10px] bg-white px-8 py-4 font-semibold text-brand-darker shadow-lg transition hover:bg-white/90"
          >
            Masuk via SSO UNAND
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-darker px-8 py-6 text-center text-sm text-white/60">
        &copy; 2026 Direktorat Kemahasiswaan Universitas Andalas. All rights reserved.
      </footer>
    </div>
  )
}

export default LandingPage
