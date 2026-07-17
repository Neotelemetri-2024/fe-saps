import { Users, CheckCircle, BookOpen, Download, Filter } from 'lucide-react'
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

const dataFakultas = [
  { nama: 'Teknik', organisasi: 45, seminar: 60, prestasi: 35, total: 140 },
  { nama: 'Ekonomi', organisasi: 50, seminar: 55, prestasi: 40, total: 145 },
  { nama: 'Hukum', organisasi: 35, seminar: 70, prestasi: 30, total: 135 },
  { nama: 'Kedokteran', organisasi: 40, seminar: 65, prestasi: 45, total: 150 },
  { nama: 'Farmasi', organisasi: 55, seminar: 50, prestasi: 38, total: 143 },
  { nama: 'MIPA', organisasi: 48, seminar: 58, prestasi: 42, total: 148 },
  { nama: 'Pertanian', organisasi: 52, seminar: 45, prestasi: 36, total: 133 },
  { nama: 'Peternakan', organisasi: 38, seminar: 48, prestasi: 32, total: 118 },
  { nama: 'FISIP', organisasi: 60, seminar: 55, prestasi: 50, total: 165 },
  { nama: 'FKIP', organisasi: 42, seminar: 62, prestasi: 44, total: 148 },
  { nama: 'Teknologi Informasi', organisasi: 58, seminar: 68, prestasi: 55, total: 181 },
  { nama: 'Keperawatan', organisasi: 36, seminar: 52, prestasi: 28, total: 116 },
  { nama: 'Kedokteran Gigi', organisasi: 30, seminar: 45, prestasi: 25, total: 100 },
  { nama: 'Psikologi', organisasi: 44, seminar: 56, prestasi: 38, total: 138 },
  { nama: 'Ilmu Kelautan', organisasi: 40, seminar: 48, prestasi: 30, total: 118 },
]

function PimpinanDitmawaDashboard() {
  return (
    <DashboardLayout role="pimpinan-ditmawa" userName="Dr. Dendi Adi Saputra" userRole="Pimpinan Ditmawa">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Users className="h-5 w-5" />} label="Mahasiswa Aktif" value="12.110" />
          <StatCard icon={<BarChart3 className="h-5 w-5" />} label="Total Fakultas" value="62%" sublabel="partisipasi" />
          <StatCard icon={<CheckCircle className="h-5 w-5" />} label="Total Pending" value="3" />
          <StatCard icon={<BookOpen className="h-5 w-5" />} label="Kurikulum Aktif" value="1" />
        </div>

        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[#e9ebf8] bg-white p-4 shadow-sm">
          <Filter className="h-4 w-4 text-[#616161]" />
          <select className="rounded-lg border border-[#e9ebf8] px-4 py-2 text-sm outline-none">
            <option>Semua Fakultas</option>
            {dataFakultas.map((f) => <option key={f.nama}>{f.nama}</option>)}
          </select>
          <select className="rounded-lg border border-[#e9ebf8] px-4 py-2 text-sm outline-none">
            <option>Semester Ganjil 2025/2026</option>
            <option>Semester Genap 2024/2025</option>
          </select>
          <select className="rounded-lg border border-[#e9ebf8] px-4 py-2 text-sm outline-none">
            <option>Semua Capaian</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-bold text-brand-dark">Poin per Fakultas</h3>
          <div className="flex items-center gap-6 text-xs text-[#616161]">
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-blue-500" /> Organisasi</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-brand-light" /> Seminar</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-yellow-500" /> Prestasi</span>
          </div>
          <div className="mt-4 space-y-2">
            {dataFakultas.slice(0, 10).map((f) => {
              const maxTotal = Math.max(...dataFakultas.map((x) => x.total))
              const widthPct = (f.total / maxTotal) * 100
              return (
                <div key={f.nama} className="flex items-center gap-3">
                  <span className="w-32 text-xs font-medium text-[#333]">{f.nama}</span>
                  <div className="flex h-6 flex-1 overflow-hidden rounded-full bg-[#e9ebf8]">
                    <div className="h-full bg-blue-500 transition-all" style={{ width: `${(f.organisasi / f.total) * widthPct}%` }} />
                    <div className="h-full bg-brand-light transition-all" style={{ width: `${(f.seminar / f.total) * widthPct}%` }} />
                    <div className="h-full bg-yellow-500 transition-all" style={{ width: `${(f.prestasi / f.total) * widthPct}%` }} />
                  </div>
                  <span className="w-10 text-right text-xs text-[#616161]">{f.total}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#f0f4f0]">
              <Download className="h-6 w-6 text-brand-dark" />
            </div>
            <div>
              <p className="font-semibold text-brand-dark">Download Laporan Rekapitulasi</p>
              <p className="text-xs text-[#616161]">PDF - 5.2 MB</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PimpinanDitmawaDashboard
