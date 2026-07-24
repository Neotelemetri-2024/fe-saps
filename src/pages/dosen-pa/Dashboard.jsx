import { useEffect, useState } from 'react'
import { Download, Clock, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { getPersetujuanDosen, getPendingPersetujuanCount } from '../../services/pengajuanService'
import { VerticalBarChart } from '../../components/charts'

// ─── data ────────────────────────────────────────────────────────────────────
const baseStats = [
  { label: 'TOTAL MAHASISWA', value: '15', border: 'border-emerald-400', numColor: 'text-brand-dark', link: true },
  { label: 'RATA RATA IPK', value: '3,80', border: 'border-emerald-400', numColor: 'text-brand-dark', link: false },
  { label: 'PENDING APPROVAL', value: '0', border: 'border-amber-400', numColor: 'text-amber-500', link: false, action: '/dosen-pa/permintaan-persetujuan' },
  { label: 'PERLU PERHATIAN', value: '2', border: 'border-red-400', numColor: 'text-red-600', link: false, sublabel: 'Mahasiswa', sublink: 'lihat Detail', action: '/dosen-pa/mahasiswa-perlu-perhatian' },
]

const prodiChart = [
  { prodi: 'Informatika', organisasi: 200, seminar: 220, prestasi: 90 },
  { prodi: 'Sistem Informasi', organisasi: 210, seminar: 190, prestasi: 100 },
  { prodi: 'Teknik Komputer', organisasi: 220, seminar: 200, prestasi: 95 },
]

const progresTahunan = [
  { nama: 'AURA MULYA', prodi: 'Teknik Komputer, S1', tanggalInput: 'Selasa, 4 Feb 2025, 15:37', nim: '2311121017', ipk: '3,80', pct: 83, status: 'baik' },
  { nama: 'AURA MULYA', prodi: 'Teknik Komputer, S1', tanggalInput: 'Selasa, 1 Feb 2025, 15:37', nim: '2311121017', ipk: '3,80', pct: 33, status: 'perhatian' },
  { nama: 'AURA MULYA', prodi: 'Teknik Komputer, S1', tanggalInput: 'Selasa, 4 Feb 2025, 15:37', nim: '2311121017', ipk: '3,80', pct: 83, status: 'baik' },
]

// ─── helpers ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, border, numColor, link, sublabel, sublink, action }) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => action && navigate(action)}
      className={`rounded-xl border-2 bg-white p-5 shadow-sm ${border} ${action ? 'cursor-pointer' : ''}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#616161]">{label}</p>
      <p className={`mt-2 text-3xl font-extrabold ${numColor}`}>{value}</p>
      {sublabel && (
        <p className={`mt-0.5 text-sm font-semibold ${numColor}`}>{sublabel}</p>
      )}
      {sublink && (
        <p className="mt-1 flex items-center gap-0.5 text-xs font-medium text-[#444]">
          → {sublink}
        </p>
      )}
      {link && (
        <p className="mt-2 text-xs font-medium text-emerald-600 hover:underline">Lihat Detail</p>
      )}
    </div>
  )
}

function CapaianBar({ pct, status }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-28 rounded-full bg-[#e9ebf8]">
        <div
          className={`h-2 rounded-full ${status === 'baik' ? 'bg-emerald-600' : 'bg-red-600'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-[#616161]">{pct}%</span>
    </div>
  )
}

function StatusDot({ status }) {
  return (
    <span className={`inline-block h-3 w-3 rounded-full ${status === 'baik' ? 'bg-emerald-600' : 'bg-red-600'}`} />
  )
}

// ─── main ─────────────────────────────────────────────────────────────────────
function DosenPADashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(baseStats)
  const [permintaan, setPermintaan] = useState([])

  useEffect(() => {
    Promise.all([
      getPendingPersetujuanCount(),
      getPersetujuanDosen({ status: 'pending' }),
    ]).then(([count, pending]) => {
      setStats((prev) =>
        prev.map((s) =>
          s.label === 'PENDING APPROVAL' ? { ...s, value: String(count) } : s,
        ),
      )
      setPermintaan(
        pending.slice(0, 5).map((item) => ({
          nama: item.namaMahasiswa || 'Mahasiswa',
          desc: item.kegiatan,
          inisial: (item.namaMahasiswa || 'UA').split(' ').map((n) => n[0]).slice(0, 2).join(''),
        })),
      )
    })
  }, [])

  return (
    <DashboardLayout role="dosen-pa" userName="Dr. Efa Yonnedi, SE. MPPM, Akt, CA, CRGP" userRole="Dosen Pembimbing">
      <div className="space-y-6">

        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-extrabold sm:text-3xl">
            <span className="text-[#333]">Selamat Datang</span>
            <br />
            <span className="bg-gradient-to-r from-brand-dark to-brand-light bg-clip-text text-transparent">
              Dr. Efa Yonnedi, SE. MPPM, Akt, CA, CRGP
            </span>
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[#616161]">
            Pantau perkembangan akademik mahasiswa bimbingan Anda dan kelola persetujuan kegiatan dengan efisien.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        {/* Middle row: Download + Permintaan | Chart */}
        <div className="grid gap-5 lg:grid-cols-2">

          {/* Left column */}
          <div className="flex flex-col gap-4">
            {/* Download Panduan */}
            <div className="rounded-xl bg-gradient-to-r from-brand-dark to-brand-light p-5 shadow-sm">
              <h3 className="text-sm font-bold text-white">Download Panduan</h3>
              <div className="mt-3 flex items-start gap-3 text-white/90">
                <Download className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-xs leading-snug">
                  Admin Fakultas – Panduan Penggunaan Website MyUnand Student Connect.pdf
                </p>
              </div>
            </div>

            {/* Permintaan Persetujuan */}
            <div className="flex-1 rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-brand-dark">Permintaan Persetujuan</h3>
              <div className="mt-3 divide-y divide-[#f0f2f8]">
                {permintaan.length === 0 ? (
                  <p className="py-3 text-xs text-[#888]">Belum ada permintaan pending.</p>
                ) : (
                  permintaan.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 py-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-dark text-xs font-bold text-white">
                        {p.inisial}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#222]">{p.nama}</p>
                        <p className="truncate text-xs text-[#616161]">{p.desc}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-3 text-right">
                <button
                  type="button"
                  onClick={() => navigate('/dosen-pa/permintaan-persetujuan')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-dark hover:underline"
                >
                  Lihat Detail <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Chart */}
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-[#222]">
              Rata rata capaian jenis kegiatan mahasiswa bimbingan
            </h3>
            <VerticalBarChart
              labels={['organisasi', 'seminar', 'prestasi']}
              values={[
                prodiChart.reduce((s, d) => s + d.organisasi, 0),
                prodiChart.reduce((s, d) => s + d.seminar, 0),
                prodiChart.reduce((s, d) => s + d.prestasi, 0),
              ]}
              colors={['#3b82f6', '#15803d', '#eab308']}
              height={280}
            />
          </div>
        </div>

        {/* Progres Capaian Tahunan */}
        <div>
          <h3 className="mb-3 text-base font-bold text-[#222]">Progres Capaian Tahunan</h3>
          <div className="overflow-hidden rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-xs font-semibold uppercase tracking-wide text-white">
                    <th className="px-4 py-3 text-center">NO</th>
                    <th className="px-4 py-3 text-left">MAHASISWA</th>
                    <th className="px-4 py-3 text-left">NIM</th>
                    <th className="px-4 py-3 text-left">IPK</th>
                    <th className="px-4 py-3 text-left">CAPAIAN</th>
                    <th className="px-4 py-3 text-center">STATUS</th>
                    <th className="px-4 py-3 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {progresTahunan.map((row, i) => (
                    <tr key={i} className="border-b border-[#f0f2f8] last:border-0 hover:bg-[#f9fafb]">
                      <td className="px-4 py-3.5 text-center text-[#616161]">{i + 1}.</td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-[#222]">{row.nama}</p>
                        <p className="text-xs text-sky-600">{row.prodi}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-[#9aa0a6]">
                          <Clock className="h-3 w-3 shrink-0" /> {row.tanggalInput}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-[#444]">{row.nim}</td>
                      <td className="px-4 py-3.5 text-[#444]">{row.ipk}</td>
                      <td className="px-4 py-3.5">
                        <CapaianBar pct={row.pct} status={row.status} />
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <StatusDot status={row.status} />
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => navigate(`/dosen-pa/lihat-detail/${row.nim}`, { state: { mahasiswa: row } })}
                          className="text-xs font-semibold text-brand-dark hover:underline"
                        >
                          Lihat Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-2 border-t border-[#e9ebf8] px-5 py-3 text-xs text-[#616161] sm:flex-row sm:items-center sm:justify-between">
              <span>Showing 1 - 10 From Total 20</span>
              <span>Page 1 of 2</span>
              <div className="flex items-center gap-1">
                <button type="button" className="rounded border border-[#e9ebf8] px-2.5 py-1 hover:bg-[#f5f5f5]">Previous</button>
                <button type="button" className="rounded bg-brand-dark px-2.5 py-1 font-semibold text-white">1</button>
                <button type="button" className="rounded border border-[#e9ebf8] px-2.5 py-1 hover:bg-[#f5f5f5]">2</button>
                <span className="px-0.5">...</span>
                <button type="button" className="rounded border border-[#e9ebf8] px-2.5 py-1 hover:bg-[#f5f5f5]">3</button>
                <button type="button" className="rounded border border-[#e9ebf8] px-2.5 py-1 hover:bg-[#f5f5f5]">4</button>
                <button type="button" className="rounded border border-[#e9ebf8] px-2.5 py-1 hover:bg-[#f5f5f5]">Next</button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}

export default DosenPADashboard
