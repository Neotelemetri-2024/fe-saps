import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { StackedBarChart } from '../../components/charts'
import { getCurrentUser } from '../../services/authService'
import { get } from '../../services/apiClient'

const statusStyle = {
  Pending: 'bg-yellow-100 text-yellow-600 border border-yellow-300',
  Disetujui: 'bg-green-100 text-green-700 border border-green-300',
  Ditolak: 'bg-red-100 text-red-600 border border-red-300',
  Revisi: 'bg-orange-100 text-orange-600 border border-orange-300',
  Aktif: 'bg-green-100 text-green-700 border border-green-300',
  Draft: 'bg-gray-100 text-gray-600 border border-gray-300',
  'Verifikasi Admin': 'bg-blue-100 text-blue-700 border border-blue-300',
}

function formatTanggal(start, end) {
  if (!start) return '-'
  try {
    const a = new Date(start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    if (!end) return a
    const b = new Date(end).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    return `${a} – ${b}`
  } catch {
    return String(start)
  }
}

function Dashboard() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [loading, setLoading] = useState(true)
  const [namaFakultas, setNamaFakultas] = useState('')
  const [stats, setStats] = useState({ pending: 0, disetujui: 0, menungguPimpinan: 0, ditolak: 0 })
  const [riwayat, setRiwayat] = useState([])
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    get('/api/umum/dashboard/admin-fakultas')
      .then((res) => {
        const d = res?.data || res || {}
        setNamaFakultas(d.namaFakultas || '')
        setStats(d.statistik || { pending: 0, disetujui: 0, menungguPimpinan: 0, ditolak: 0 })
        const list = (d.riwayatTerbaru || []).map((r) => ({
          id: r.id,
          kegiatan: r.namaKegiatan || r.kegiatan || '-',
          namaUKMF: r.ukm || r.namaUKMF || '-',
          jenis: r.kategori || r.jenis || '-',
          skala: r.skala || '-',
          tanggal: formatTanggal(r.tanggalMulai, r.tanggalSelesai),
          status: r.status || 'Pending',
        }))
        setRiwayat(list)
        setChartData(Array.isArray(d.grafikCapaianPerProdi) ? d.grafikCapaianPerProdi : [])
      })
      .catch((err) => {
        toast.error('Gagal memuat dashboard', { description: err.message })
      })
      .finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: 'PENDING', value: stats.pending ?? 0, border: 'border-green-600', numColor: 'text-green-800' },
    { label: 'DISETUJUI', value: stats.disetujui ?? 0, border: 'border-green-600', numColor: 'text-green-800' },
    { label: 'MENUNGGU PIMPINAN', value: stats.menungguPimpinan ?? 0, border: 'border-green-600', numColor: 'text-green-600' },
    { label: 'DITOLAK', value: stats.ditolak ?? 0, border: 'border-red-400', numColor: 'text-red-500' },
  ]

  return (
    <DashboardLayout role="admin_fakultas" userName={user?.nama || 'Admin Fakultas'} userRole="Admin Fakultas">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-brand-dark sm:text-2xl lg:text-3xl">
            Dasboard Fakultas <span className="text-[#222]">{namaFakultas || ''}</span>
          </h2>
          <p className="mt-1 text-sm text-[#616161]">Verifikasi dan ajukan lanjutan kegiatan dari UKMF ke Pimpinan Fakultas</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.label} className={`rounded-xl border-2 ${card.border} bg-white p-4 shadow-sm sm:p-5 lg:p-6`}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#616161]">{card.label}</p>
              <p className={`mt-2 text-3xl font-extrabold ${card.numColor}`}>{loading ? '…' : card.value}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
          <div className="border-b border-[#e5e7eb] px-6 py-4">
            <h3 className="text-base font-bold text-[#222]">Riwayat Terbaru Pengajuan kegiatan dari UKMF</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-white">
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">NO</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">KEGIATAN</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">NAMA UKMF</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">JENIS</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">SKALA</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">TANGGAL</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">STATUS</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-[#9aa0a6]">Memuat data…</td>
                  </tr>
                ) : riwayat.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-[#9aa0a6]">Belum ada pengajuan.</td>
                  </tr>
                ) : (
                  riwayat.map((row, i) => (
                    <tr key={row.id} className="hover:bg-[#f9fafb]">
                      <td className="px-4 py-3.5 text-[#616161]">{i + 1}.</td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-[#222]">{row.kegiatan}</p>
                      </td>
                      <td className="px-4 py-3.5 text-[#616161]">{row.namaUKMF}</td>
                      <td className="px-4 py-3.5 text-[#616161]">{row.jenis}</td>
                      <td className="px-4 py-3.5 text-[#616161]">{row.skala}</td>
                      <td className="px-4 py-3.5 text-[#616161] whitespace-nowrap">{row.tanggal}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[row.status] || statusStyle.Pending}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin_fakultas/verifikasi-pengajuan-ukmf/${row.id}`)}
                            className="rounded border border-brand-dark px-2.5 py-1 text-xs font-semibold text-brand-dark hover:bg-brand-dark hover:text-white"
                          >
                            Detail
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/admin_fakultas/verifikasi-pengajuan-ukmf/${row.id}`)}
                            className="rounded border border-[#2563eb] px-2.5 py-1 text-xs font-semibold text-[#2563eb] hover:bg-[#2563eb] hover:text-white"
                          >
                            verifikasi
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-[#f0f0f0] px-6 py-3 text-xs text-[#888] sm:flex-row sm:items-center sm:justify-between">
            <span>Showing {riwayat.length === 0 ? 0 : 1} – {riwayat.length} from Total {riwayat.length}</span>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-[#222]">Rata rata Capaian per prodi</h3>
            {chartData.length === 0 ? (
              <p className="text-sm text-[#9aa0a6]">Belum ada data grafik.</p>
            ) : (
              <StackedBarChart
                labels={chartData.map((d) => String(d.prodi || '').replace('\n', ' '))}
                datasets={[
                  { label: 'organisasi', data: chartData.map((d) => d.organisasi), color: '#3b82f6' },
                  { label: 'seminar', data: chartData.map((d) => d.seminar), color: '#16a34a' },
                  { label: 'prestasi', data: chartData.map((d) => d.prestasi), color: '#eab308' },
                ]}
                height={280}
              />
            )}
          </div>

          <div className="flex items-start">
            <div className="w-full rounded-xl bg-gradient-to-r from-brand-dark to-brand-light p-5 shadow-sm">
              <h3 className="text-sm font-bold text-white">Download Panduan</h3>
              <div className="mt-3 flex items-start gap-3 text-white/90">
                <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <p className="text-xs leading-snug">Admin Fakultas – Panduan Penggunaan Website MyUnand Student Connect.pdf</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Dashboard
