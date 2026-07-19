import { Download } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'

// ── DATA ──
const peringkatProdi = [
  { prodi: 'Teknik Mesin', organisasi: 200, seminar: 150, prestasi: 100, total: 450 },
  { prodi: 'Teknik Industri', organisasi: 180, seminar: 170, prestasi: 120, total: 470 },
  { prodi: 'Informatika', organisasi: 220, seminar: 130, prestasi: 80, total: 430 },
  { prodi: 'Teknik Sipil', organisasi: 190, seminar: 160, prestasi: 110, total: 460 },
  { prodi: 'Teknik Elektro', organisasi: 210, seminar: 140, prestasi: 95, total: 445 },
]

const capaianPerProdi = [
  { prodi: 'Teknik Mesin', seminar: 150, organisasi: 200, prestasi: 100 },
  { prodi: 'Teknik Industri', seminar: 170, organisasi: 180, prestasi: 120 },
  { prodi: 'Informatika', seminar: 130, organisasi: 220, prestasi: 80 },
  { prodi: 'Teknik Sipil', seminar: 160, organisasi: 190, prestasi: 110 },
  { prodi: 'Teknik Elektro', seminar: 140, organisasi: 210, prestasi: 95 },
]

const distribusiData = [
  { label: 'Teknik Mesin', value: 450, color: '#3b82f6' },
  { label: 'Teknik Industri', value: 470, color: '#15803d' },
  { label: 'Informatika', value: 430, color: '#eab308' },
  { label: 'Teknik Sipil', value: 460, color: '#f97316' },
  { label: 'Teknik Elektro', value: 445, color: '#8b5cf6' },
]
const totalSemuaPoin = distribusiData.reduce((s, d) => s + d.value, 0)

// ── KategoriPoinBar (mini stacked bar di tabel) ──
function KategoriPoinBar({ organisasi, prestasi, seminar, total }) {
  const pctSem = (seminar / total) * 100
  const pctOrg = (organisasi / total) * 100
  const pctPre = (prestasi / total) * 100
  return (
    <div className="flex h-2.5 w-32 overflow-hidden rounded-full bg-[#e9ebf8]">
      <div style={{ width: `${pctSem}%` }} className="bg-[#15803d]" title={`Seminar: ${seminar}`} />
      <div style={{ width: `${pctOrg}%` }} className="bg-[#3b82f6]" title={`Organisasi: ${organisasi}`} />
      <div style={{ width: `${pctPre}%` }} className="bg-[#eab308]" title={`Prestasi: ${prestasi}`} />
    </div>
  )
}

// ── VerticalStackedBar ──
function VerticalStackedBar({ data }) {
  const categories = ['seminar', 'organisasi', 'prestasi']
  const colors = { seminar: '#15803d', organisasi: '#3b82f6', prestasi: '#eab308' }
  const labels = { seminar: 'Seminar', organisasi: 'Organisasi', prestasi: 'Prestasi' }
  const maxSum = Math.max(...data.map((d) => categories.reduce((s, c) => s + d[c], 0)))
  const barMaxHeight = 200

  return (
    <div>
      <div className="flex items-end justify-center gap-4 sm:gap-8">
        {data.map((d) => {
          const total = categories.reduce((s, c) => s + d[c], 0)
          const seminarH = (d.seminar / maxSum) * barMaxHeight
          const organisasiH = (d.organisasi / maxSum) * barMaxHeight
          const prestasiH = (d.prestasi / maxSum) * barMaxHeight
          return (
            <div key={d.prodi} className="flex flex-col items-center">
              <span className="mb-1 text-xs font-bold text-brand-dark">{total}</span>
              <div className="relative" style={{ height: barMaxHeight, width: 36 }}>
                <div className="absolute bottom-0 left-0 right-0 flex flex-col-reverse overflow-hidden rounded-t-md" style={{ height: '100%' }}>
                  <div style={{ height: `${(prestasiH / barMaxHeight) * 100}%` }} className="w-full bg-[#eab308] transition-all" />
                  <div style={{ height: `${(organisasiH / barMaxHeight) * 100}%` }} className="w-full bg-[#3b82f6] transition-all" />
                  <div style={{ height: `${(seminarH / barMaxHeight) * 100}%` }} className="w-full bg-[#15803d] transition-all" />
                </div>
              </div>
              <span className="mt-1.5 text-[10px] font-medium text-[#616161]">{d.prodi}</span>
            </div>
          )
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-5 text-xs font-medium text-[#616161]">
        {categories.map((cat) => (
          <span key={cat} className="flex items-center gap-1.5">
            <span className={`inline-block h-2.5 w-2.5 rounded-sm ${cat === 'seminar' ? 'bg-[#15803d]' : cat === 'organisasi' ? 'bg-[#3b82f6]' : 'bg-[#eab308]'}`} />
            {labels[cat]}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── SvgDoughnut ──
function SvgDoughnut({ sections, size = 'h-44 w-44' }) {
  const total = sections.reduce((s, sec) => s + sec.value, 0)
  const radius = 15.5
  const circumference = 2 * Math.PI * radius

  let cumulative = 0
  const arcs = sections.map((sec) => {
    const offset = cumulative
    const length = (sec.value / total) * circumference
    cumulative += length
    return { ...sec, offset, length }
  })

  return (
    <div className={`relative ${size} flex items-center justify-center`}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 42 42">
        <circle cx="21" cy="21" r={radius} fill="none" stroke="#e9ebf8" strokeWidth="5" />
        {arcs.map((sec, i) => (
          <circle
            key={i}
            cx="21" cy="21" r={radius}
            fill="none"
            stroke={sec.color}
            strokeWidth="5"
            strokeDasharray={`${sec.length} ${circumference - sec.length}`}
            strokeDashoffset={-sec.offset}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div className="absolute text-center">
        <p className="text-3xl font-extrabold text-brand-dark">{total}</p>
        <p className="text-xs font-medium text-[#616161]">Total Poin</p>
      </div>
    </div>
  )
}

// ── MAIN ──
function PimpinanFakultasDashboard() {
  return (
    <DashboardLayout role="pimpinan-fakultas" userName="Dr. Andi Wijaya" userRole="Pimpinan Fakultas">
      <div className="space-y-6">
        <div>
          <h2 className="bg-gradient-to-r from-brand-dark to-brand-light bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl">
            Dashboard Fakultas
          </h2>
          <p className="mt-1 text-sm text-[#616161]">Pantau aktivitas dan capaian fakultas secara real-time.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border-2 border-yellow-400 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#616161]">TOTAL MAHASISWA AKTIF</p>
            <p className="mt-2 text-3xl font-extrabold text-brand-dark">12.300</p>
          </div>
          <div className="rounded-xl border-2 border-blue-500 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#616161]">RATA RATA CAPAIAN</p>
            <p className="mt-2 text-3xl font-extrabold text-brand-dark">72%</p>
          </div>
          <div className="rounded-xl border-2 border-brand-dark bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#616161]">KEGIATAN PERLU PERSETUJUAN</p>
            <p className="mt-2 text-3xl font-extrabold text-brand-dark">4</p>
          </div>
          <div className="rounded-xl border-2 border-brand-dark bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#616161]">KURIKULUM AKTIF</p>
            <p className="mt-2 text-3xl font-extrabold text-brand-dark">1</p>
          </div>
        </div>

        {/* Peringkat Prodi */}
        <div className="overflow-hidden rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
          <div className="border-b border-[#e9ebf8] px-5 py-4">
            <h3 className="text-lg font-bold text-brand-dark">Peringkat Prodi</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-left text-xs font-semibold uppercase tracking-wide text-white">
                  <th className="px-4 py-3">RANKING</th>
                  <th className="px-4 py-3">PROGRAM STUDI</th>
                  <th className="px-4 py-3">TOTAL POIN</th>
                  <th className="px-4 py-3">KATEGORI POIN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef0f7]">
                {peringkatProdi.map((item, i) => (
                  <tr key={item.prodi} className="hover:bg-[#f9fafb]">
                    <td className="px-4 py-3">
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-[#e9ebf8] text-[#616161]'}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-brand-dark">{item.prodi}</td>
                    <td className="px-4 py-3 font-semibold text-brand-dark">{item.total}</td>
                    <td className="px-4 py-3">
                      <KategoriPoinBar organisasi={item.organisasi} prestasi={item.prestasi} seminar={item.seminar} total={item.total} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-[#e9ebf8] px-6 py-3 text-xs text-[#616161]">
            Menampilkan 1-{peringkatProdi.length} dari {peringkatProdi.length} Program Studi
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm lg:col-span-3">
            <h3 className="text-center text-lg font-bold text-brand-dark">Rata rata Capaian per prodi</h3>
            <div className="mt-6">
              <VerticalStackedBar data={capaianPerProdi} />
            </div>
          </div>
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm lg:col-span-2">
            <h3 className="text-center text-lg font-bold text-brand-dark">Distribusi poin per prodi</h3>
            <div className="mt-6 flex flex-col items-center">
              <SvgDoughnut sections={distribusiData} />
              <div className="mt-6 w-full space-y-2">
                {distribusiData.map((d) => (
                  <div key={d.label} className="flex items-center gap-2 text-xs font-medium">
                    <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="flex-1 text-[#333]">{d.label}</span>
                    <span className="text-[#616161]">{Math.round((d.value / totalSemuaPoin) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Download Panduan */}
        <div className="max-w-lg rounded-xl bg-gradient-to-r from-brand-dark to-brand-light p-6 text-white shadow-sm">
          <h3 className="text-lg font-bold">Download Panduan</h3>
          <div className="mt-4 flex items-start gap-3 text-sm text-white/90">
            <Download className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">Panduan Penggunaan Website MyUnand Student Connect 2026.pdf</p>
              <p className="mt-1 text-xs text-white/70">PDF • 2.1 MB</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PimpinanFakultasDashboard
