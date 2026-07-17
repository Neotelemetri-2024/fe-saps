import { Users, CheckCircle } from 'lucide-react'
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

const peringkatProdi = [
  { prodi: 'Teknik Mesin', mhs: 230, avg: 78, rank: 1 },
  { prodi: 'Teknik Industri', mhs: 180, avg: 72, rank: 2 },
  { prodi: 'Informatika', mhs: 310, avg: 85, rank: 1 },
  { prodi: 'Teknik Sipil', mhs: 195, avg: 65, rank: 3 },
  { prodi: 'Teknik Elektro', mhs: 165, avg: 70, rank: 2 },
]

function PimpinanFakultasDashboard() {
  return (
    <DashboardLayout role="pimpinan-fakultas" userName="Dr. Andi Wijaya" userRole="Pimpinan Fakultas">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Users className="h-5 w-5" />} label="Total Mahasiswa Aktif" value="12.300" />
          <StatCard icon={<BarChart3 className="h-5 w-5" />} label="Rata-rata Capaian" value="72%" sublabel="semua prodi" />
          <StatCard icon={<CheckCircle className="h-5 w-5" />} label="Kegiatan Perlu Persetujuan" value="4" />
          <StatCard icon={<BookIcon className="h-5 w-5" />} label="Kurikulum Aktif" value="1" />
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-brand-dark">Peringkat Prodi</h3>
          <div className="space-y-3">
            {peringkatProdi.map((p) => (
              <div key={p.prodi} className="flex items-center gap-4">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${p.rank === 1 ? 'bg-yellow-500' : p.rank === 2 ? 'bg-gray-400' : 'bg-orange-500'}`}>
                  {p.rank}
                </span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#333]">{p.prodi}</span>
                    <span className="text-[#616161]">{p.avg}%</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-[#e9ebf8]">
                    <div className="h-2 rounded-full bg-brand-light" style={{ width: `${p.avg}%` }} />
                  </div>
                </div>
                <span className="text-xs text-[#616161]">{p.mhs} mhs</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-brand-dark">Distribusi Poin per Kategori</h3>
          <div className="flex items-center gap-8">
            <div className="flex h-[200px] w-[200px] items-center justify-center rounded-full border-8 border-brand-light border-r-yellow-500 border-b-blue-500 border-l-green-300">
              <div className="text-center">
                <p className="text-2xl font-bold text-brand-dark">100%</p>
                <p className="text-xs text-[#616161]">Total Poin</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Organisasi', pct: 35, color: 'bg-blue-500' },
                { label: 'Seminar', pct: 40, color: 'bg-brand-light' },
                { label: 'Prestasi', pct: 25, color: 'bg-yellow-500' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  <span className={`h-3 w-3 rounded ${item.color}`} />
                  <span className="text-[#333]">{item.label}</span>
                  <span className="text-[#616161]">{item.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

function BookIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

export default PimpinanFakultasDashboard
