import { useEffect, useState } from 'react'
import { Download, Clock, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import logoUnand from '../../assets/logo_unand.png'
import { getPersetujuanDosen, getPendingPersetujuanCount } from '../../services/pengajuanService'

// ---------------------------------------------------------------------------
// Mock data — swap these for real API data
// ---------------------------------------------------------------------------
const baseStats = [
  { label: 'TOTAL MAHASISWA', value: '15', tone: 'emerald', link: true },
  { label: 'RATA RATA IPK', value: '3,80', tone: 'emerald', link: false },
  { label: 'PENDING APPROVAL', value: '0', tone: 'amber', link: false },
  { label: 'PERLU PERHATIAN', value: '2', tone: 'red', link: false, sublabel: 'Mahasiswa' },
]

const prodiChart = [
  { prodi: 'Informatika', organisasi: 200, seminar: 220, prestasi: 90 },
  { prodi: 'Sistem Informasi', organisasi: 210, seminar: 190, prestasi: 100 },
  { prodi: 'Teknik Komputer', organisasi: 220, seminar: 200, prestasi: 95 },
]

const progresTahunan = [
  { nama: 'AURA MULYA', prodi: 'Teknik Komputer, S1', tanggalInput: 'Selasa, 4 Feb 2025, 15:37', nim: '2311121017', ipk: '3,80', pct: 83, status: 'baik' },
  { nama: 'AURA MULYA', prodi: 'Teknik Komputer, S1', tanggalInput: 'Selasa, 4 Feb 2025, 15:37', nim: '2311121017', ipk: '3,80', pct: 33, status: 'perhatian' },
  { nama: 'AURA MULYA', prodi: 'Teknik Komputer, S1', tanggalInput: 'Selasa, 4 Feb 2025, 15:37', nim: '2311121017', ipk: '3,80', pct: 83, status: 'baik' },
]

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
const toneStyles = {
  emerald: { border: 'border-emerald-300', label: 'text-emerald-700', value: 'text-brand-dark', link: 'text-emerald-600' },
  amber: { border: 'border-amber-400', label: 'text-amber-600', value: 'text-amber-500' },
  red: { border: 'border-red-400', label: 'text-red-600', value: 'text-red-600' },
}

function StatBox({ label, value, tone, link, sublabel }) {
  const navigate = useNavigate()
  const s = toneStyles[tone]
  return (
    <div
      className={`rounded-xl border-2 bg-white p-5 shadow-sm ${s.border} ${link || label === 'PERLU PERHATIAN' || label === 'PENDING APPROVAL' ? 'cursor-pointer' : ''}`}
      onClick={() => {
        if (label === 'PERLU PERHATIAN') navigate('/dosen-pa/mahasiswa-perlu-perhatian')
        if (label === 'PENDING APPROVAL') navigate('/dosen-pa/permintaan-persetujuan')
      }}
    >
      <p className={`text-xs font-semibold tracking-wide ${s.label}`}>{label}</p>
      <p className={`mt-2 text-3xl font-extrabold ${s.value}`}>
        {value} {sublabel && <span className="align-middle text-sm font-semibold">{sublabel}</span>}
      </p>
      {link && <p className="mt-2 text-xs font-medium text-emerald-600 underline-offset-2 hover:underline">Lihat Detail</p>}
    </div>
  )
}

function StatusDot({ status }) {
  return (
    <span className={`inline-block h-3 w-3 rounded-full ${status === 'baik' ? 'bg-emerald-600' : 'bg-red-700'}`} />
  )
}

function CapaianBar({ pct, status }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-28 rounded-full bg-[#e9ebf8]">
        <div
          className={`h-2 rounded-full ${status === 'baik' ? 'bg-emerald-600' : 'bg-red-700'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-[#616161]">{pct}%</span>
    </div>
  )
}

// Stacked bar chart: organisasi (blue) / seminar (green) / prestasi (yellow)
function ProdiStackedChart({ data }) {
  const width = 560
  const height = 300
  const paddingLeft = 50
  const paddingBottom = 50
  const maxVal = 800
  const chartHeight = height - paddingBottom - 10
  const barWidth = 60
  const gap = (width - paddingLeft - barWidth * data.length) / (data.length + 1)

  const yTicks = [200, 300, 400, 500, 600, 700, 800]
  const colors = { organisasi: '#3b82f6', seminar: '#15803d', prestasi: '#eab308' }

  const scaleY = (v) => (v / maxVal) * chartHeight

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {yTicks.map((t) => {
          const y = height - paddingBottom - scaleY(t)
          return (
            <g key={t}>
              <line x1={paddingLeft} y1={y} x2={width} y2={y} stroke="#eef0f7" strokeWidth="1" />
              <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#9aa0a6">{t}</text>
            </g>
          )
        })}
        {data.map((d, i) => {
          const x = paddingLeft + gap + i * (barWidth + gap)
          const baseY = height - paddingBottom
          const hOrg = scaleY(d.organisasi)
          const hSem = scaleY(d.seminar)
          const hPre = scaleY(d.prestasi)
          const yOrg = baseY - hOrg
          const ySem = yOrg - hSem
          const yPre = ySem - hPre
          const pctTotal = Math.round((d.organisasi / (d.organisasi + d.seminar + d.prestasi)) * 100)
          const pctSem = Math.round((d.seminar / (d.organisasi + d.seminar + d.prestasi)) * 100)
          const pctPre = Math.round((d.prestasi / (d.organisasi + d.seminar + d.prestasi)) * 100)
          return (
            <g key={d.prodi}>
              <rect x={x} y={yOrg} width={barWidth} height={hOrg} fill={colors.organisasi} rx="2" />
              <text x={x + barWidth / 2} y={yOrg + hOrg / 2 + 4} textAnchor="middle" fontSize="10" fill="#ffffff">{pctTotal}%</text>

              <rect x={x} y={ySem} width={barWidth} height={hSem} fill={colors.seminar} rx="2" />
              <text x={x + barWidth / 2} y={ySem + hSem / 2 + 4} textAnchor="middle" fontSize="10" fill="#ffffff">{pctSem}%</text>

              <rect x={x} y={yPre} width={barWidth} height={hPre} fill={colors.prestasi} rx="2" />
              <text x={x + barWidth / 2} y={yPre + hPre / 2 + 4} textAnchor="middle" fontSize="10" fill="#5c4a00">{pctPre}%</text>

              <text
                x={x + barWidth / 2}
                y={baseY + 20}
                textAnchor="end"
                fontSize="11"
                fill="#616161"
                transform={`rotate(-35 ${x + barWidth / 2} ${baseY + 20})`}
              >
                {d.prodi}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-[#616161]">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: colors.organisasi }} />organisasi</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: colors.seminar }} />seminar</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: colors.prestasi }} />prestasi</span>
      </div>
    </div>
  )
}

function Pagination({ page = 1, totalPages = 2, showingFrom = 1, showingTo = 10, totalItems = 20 }) {
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-[#e9ebf8] px-6 py-4 text-xs text-[#616161] sm:flex-row">
      <span>Showng {showingFrom} - {showingTo} From Total {totalItems}</span>
      <span>Page {page} of {totalPages}</span>
      <div className="flex items-center gap-1">
        <button className="rounded-md border border-[#e9ebf8] px-3 py-1 text-[#616161]">Previous</button>
        <button className="rounded-md bg-brand-dark px-3 py-1 font-semibold text-white">1</button>
        <button className="rounded-md border border-[#e9ebf8] px-3 py-1">2</button>
        <span className="px-1">...</span>
        <button className="rounded-md border border-[#e9ebf8] px-3 py-1">3</button>
        <button className="rounded-md border border-[#e9ebf8] px-3 py-1">4</button>
        <button className="rounded-md border border-[#e9ebf8] px-3 py-1">Next</button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
function DosenPADashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(baseStats)
  const [permintaanPersetujuan, setPermintaanPersetujuan] = useState([])

  useEffect(() => {
    Promise.all([
      getPendingPersetujuanCount(),
      getPersetujuanDosen({ status: 'pending' }),
    ]).then(([count, pending]) => {
      setStats((prev) =>
        prev.map((s) =>
          s.label === 'PENDING APPROVAL' ? { ...s, value: String(count) } : s
        )
      )
      setPermintaanPersetujuan(
        pending.slice(0, 5).map((item) => ({
          nama: item.namaMahasiswa || 'Mahasiswa',
          desc: item.kegiatan,
        }))
      )
    })
  }, [])

  return (
    <DashboardLayout role="dosen-pa" userName="Dr. Efa Yonnedi, SE. MPPM, Akt, CA, CRGP" userRole="Dosen Pembimbing">
      <div className="space-y-6">
        {/* Welcome header */}
        <div>
          <h2 className="bg-gradient-to-r from-brand-dark to-brand-light bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl">
            Selamat Datang<br />Dr. Efa Yonnedi, SE. MPPM, Akt, CA, CRGP
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-[#616161]">
            Pantau perkembangan akademik mahasiswa bimbingan Anda dan kelola persetujuan kegiatan dengan efisien.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <StatBox key={s.label} {...s} />
          ))}
        </div>

        {/* Download panduan + Permintaan Persetujuan / Chart */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="rounded-xl bg-gradient-to-r from-brand-dark to-brand-light p-6 shadow-sm">
              <h3 className="text-lg font-bold text-white">Download Panduan</h3>
              <div className="mt-3 flex items-center gap-3 text-white/95">
                <Download className="h-5 w-5 shrink-0" />
                <p className="text-sm">Admin Fakultas - Panduan Penggunaan Website MyUnand Student Connect.pdf</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-brand-dark">Permintaan Persetujuan</h3>
              <div className="mt-4 divide-y divide-[#eef0f7]">
                {permintaanPersetujuan.length === 0 ? (
                  <p className="py-3 text-sm text-[#616161]">Belum ada permintaan pending.</p>
                ) : (
                  permintaanPersetujuan.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 py-3">
                      <img src={logoUnand} alt="Logo" className="h-10 w-auto object-contain" />
                      <div>
                        <p className="text-sm font-semibold text-brand-dark">{p.nama}</p>
                        <p className="text-xs text-[#616161]">{p.desc}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-3 text-right">
                <button
                  type="button"
                  onClick={() => navigate('/dosen-pa/permintaan-persetujuan')}
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand-dark"
                >
                  Lihat Detail <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-center text-lg font-bold text-brand-dark">Rata rata capaian matriks per prodi</h3>
            <ProdiStackedChart data={prodiChart} />
          </div>
        </div>

        {/* Progres Capaian Tahunan table */}
        <div>
          <h3 className="mb-4 text-lg font-bold text-brand-dark">Progres Capaian Tahunan</h3>
          <div className="overflow-hidden rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-left text-xs font-semibold uppercase tracking-wide text-white">
                    <th className="whitespace-nowrap px-4 py-3 text-center">NO</th>
                    <th className="whitespace-nowrap px-4 py-3 text-center">MAHASISWA</th>
                    <th className="whitespace-nowrap px-4 py-3 text-center">NIM</th>
                    <th className="whitespace-nowrap px-4 py-3 text-center">IPK</th>
                    <th className="whitespace-nowrap px-4 py-3 text-center">CAPAIAN</th>
                    <th className="whitespace-nowrap px-4 py-3 text-center">STATUS</th>
                    <th className="whitespace-nowrap px-4 py-3 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {progresTahunan.map((row, i) => (
                    <tr key={i} className="border-b border-[#e9ebf8] last:border-0">
                      <td className="px-4 py-4 align-top">{i + 1}.</td>
                      <td className="px-4 py-4 align-top">
                        <p className="font-semibold text-[#333]">{row.nama}</p>
                        <p className="text-xs font-medium text-sky-600">{row.prodi}</p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-[#9aa0a6]">
                          <Clock className="h-3 w-3" /> {row.tanggalInput}
                        </p>
                      </td>
                      <td className="px-4 py-4 align-top">{row.nim}</td>
                      <td className="px-4 py-4 align-top">{row.ipk}</td>
                      <td className="px-4 py-4 align-top"><CapaianBar pct={row.pct} status={row.status} /></td>
                      <td className="px-4 py-4 align-top"><StatusDot status={row.status} /></td>
                      <td className="px-4 py-4 align-top">
                        <a href="#" className="font-medium text-brand-dark underline-offset-2 hover:underline">Lihat Detail</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default DosenPADashboard