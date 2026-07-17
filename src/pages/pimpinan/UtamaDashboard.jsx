import { Users, BookOpen } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatCard from '../../components/dashboard/StatCard'

function BarChart3({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  )
}

function PimpinanUtamaDashboard() {
  return (
    <DashboardLayout role="pimpinan-utama" userName="Prof. Dr. Rektor" userRole="Pimpinan Utama">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Users className="h-5 w-5" />} label="Total Mahasiswa" value="38.450" />
          <StatCard icon={<BookOpen className="h-5 w-5" />} label="Total Fakultas" value="15" sublabel="aktif" />
          <StatCard icon={<BarChart3 className="h-5 w-5" />} label="Rata-rata Capaian" value="74%" />
          <StatCard icon={<CheckCircleIcon className="h-5 w-5" />} label="Kegiatan Terverifikasi" value="1.240" sublabel="Tahun ini" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-brand-dark">Distribusi Mahasiswa per Fakultas</h3>
            <div className="space-y-3">
              {[
                { fakultas: 'Teknik', mhs: 4500 }, { fakultas: 'Ekonomi', mhs: 3800 }, { fakultas: 'Hukum', mhs: 2900 },
                { fakultas: 'Kedokteran', mhs: 2100 }, { fakultas: 'Farmasi', mhs: 1800 }, { fakultas: 'MIPA', mhs: 3500 },
                { fakultas: 'FISIP', mhs: 4200 }, { fakultas: 'FKIP', mhs: 4800 },
              ].map((f) => {
                const pct = (f.mhs / 4800) * 100
                return (
                  <div key={f.fakultas} className="flex items-center gap-3">
                    <span className="w-24 text-xs text-[#333]">{f.fakultas}</span>
                    <div className="flex-1">
                      <div className="h-4 w-full rounded-full bg-[#e9ebf8]">
                        <div className="h-4 rounded-full bg-brand-light" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="w-14 text-right text-xs text-[#616161]">{f.mhs.toLocaleString()}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-brand-dark">Rata-rata Capaian per Fakultas</h3>
            <div className="space-y-3">
              {[
                { fakultas: 'Teknik', pct: 72 }, { fakultas: 'Ekonomi', pct: 68 }, { fakultas: 'Hukum', pct: 75 },
                { fakultas: 'Kedokteran', pct: 82 }, { fakultas: 'Farmasi', pct: 78 }, { fakultas: 'MIPA', pct: 70 },
                { fakultas: 'FISIP', pct: 76 }, { fakultas: 'FKIP', pct: 74 },
              ].map((f) => (
                <div key={f.fakultas} className="flex items-center gap-3">
                  <span className="w-24 text-xs text-[#333]">{f.fakultas}</span>
                  <div className="flex-1">
                    <div className="h-4 w-full rounded-full bg-[#e9ebf8]">
                      <div className="h-4 rounded-full bg-brand-dark" style={{ width: `${f.pct}%` }} />
                    </div>
                  </div>
                  <span className="w-10 text-right text-xs text-[#616161]">{f.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-brand-dark">Ringkasan Capaian Non-Akademik</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-[#f0f4f0] p-4 text-center">
              <p className="text-3xl font-bold text-brand-dark">38.450</p>
              <p className="text-xs text-[#616161]">Total Mahasiswa Terdaftar</p>
            </div>
            <div className="rounded-lg bg-[#f0f4f0] p-4 text-center">
              <p className="text-3xl font-bold text-brand-dark">74%</p>
              <p className="text-xs text-[#616161]">Rata-rata Capaian</p>
            </div>
            <div className="rounded-lg bg-[#f0f4f0] p-4 text-center">
              <p className="text-3xl font-bold text-brand-dark">1.240</p>
              <p className="text-xs text-[#616161]">Kegiatan Tervalidasi</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

function CheckCircleIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

export default PimpinanUtamaDashboard
