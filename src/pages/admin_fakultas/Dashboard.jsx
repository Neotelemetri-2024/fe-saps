import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatCard from '../../components/dashboard/StatCard'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import { StackedBarChart } from '../../components/charts'
import PanduanCard from '../../components/dashboard/PanduanCard'
import { getCurrentUser } from '../../services/authService'
import { get } from '../../services/apiClient'
import KegiatanCell from '../../components/dashboard/KegiatanCell'

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
    const ds = new Date(start)
    if (Number.isNaN(ds.getTime())) return '-'
    const a = ds.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    if (!end) return a
    const de = new Date(end)
    if (Number.isNaN(de.getTime())) return a
    const b = de.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
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
        const list = (d.riwayatTerbaru || []).map((r, i) => ({
          id: r.id,
          no: i + 1,
          kegiatan: r.namaKegiatan || r.kegiatan || '-',
          diajukanPada: formatTanggal(r.diajukanPada),
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
    { label: 'PENDING', value: stats.pending ?? 0 },
    { label: 'DISETUJUI', value: stats.disetujui ?? 0 },
    { label: 'MENUNGGU PIMPINAN', value: stats.menungguPimpinan ?? 0 },
    { label: 'DITOLAK', value: stats.ditolak ?? 0 },
  ]

  const columns = useMemo(() => [
    {
      key: 'no',
      label: 'NO',
      render: (row) => <span className="text-black">{row.no}</span>,
    },
    {
      key: 'kegiatan',
      label: 'KEGIATAN',
      render: (row) => <KegiatanCell nama={row.kegiatan} tanggal={row.diajukanPada} />,
    },
    { key: 'namaUKMF', label: 'NAMA UKMF' },
    { key: 'jenis', label: 'JENIS' },
    { key: 'skala', label: 'SKALA' },
    { key: 'tanggal', label: 'TANGGAL' },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[row.status] || statusStyle.Pending}`}>
          {row.status}
        </span>
      ),
    },
  ], [])

  return (
    <DashboardLayout role="admin_fakultas" userName={user?.nama || 'Admin Fakultas'} userRole="Admin Fakultas">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-[#222] sm:text-2xl lg:text-3xl">
            Dasboard Fakultas <span className="text-[#222]">{namaFakultas || ''}</span>
          </h2>
          <p className="mt-1 text-sm text-[#616161]">Verifikasi dan ajukan lanjutan kegiatan dari UKMF ke Pimpinan Fakultas</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={loading ? '…' : card.value}
            />
          ))}
        </div>

        <TableCard
          title="Riwayat Terbaru Pengajuan kegiatan dari UKMF"
          headerRight={
            <button
              type="button"
              onClick={() => navigate('/admin_fakultas/verifikasi-pengajuan-ukmf')}
              className="rounded-lg border border-brand-dark bg-white px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-[#f5f7f5]"
            >
              Lihat selengkapnya →
            </button>
          }
        >
          <TableFrame>
            <DataTable
              columns={columns}
              data={riwayat}
              loading={loading}
              emptyText="Belum ada pengajuan."
            />
          </TableFrame>
        </TableCard>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-[#222]">Rata rata Capaian per prodi</h3>
            {chartData.length === 0 ? (
              <p className="text-sm text-[#9aa0a6]">Belum ada data grafik.</p>
            ) : (
              <StackedBarChart
                labels={chartData.map((d) => String(d.prodi || '').replace('\n', ' '))}
                datasets={[
                  { label: 'Organisasi', data: chartData.map((d) => d.organisasi), color: '#3b82f6' },
                  { label: 'Seminar', data: chartData.map((d) => d.seminar), color: '#16a34a' },
                  { label: 'Prestasi', data: chartData.map((d) => d.prestasi), color: '#eab308' },
                ]}
                height={280}
              />
            )}
          </div>

          <div className="flex items-start">
            <PanduanCard
              className="w-full"
              title="Manual Book User Admin Fakultas"
              description="Panduan Penggunaan Website SAPS untuk Admin Fakultas"
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Dashboard
