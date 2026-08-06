import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import KegiatanCell from '../../components/dashboard/KegiatanCell'
import { HorizontalBarChart } from '../../components/charts'
import { toast } from 'sonner'
import { get } from '../../services/apiClient'
import { getCurrentUser } from '../../services/authService'
import { getKegiatan } from '../../services/kegiatanService'

function formatDate(val) {
  if (!val) return ''
  try {
    const d = new Date(val)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return ''
  }
}

function PimpinanDitmawaDashboard() {
  const user = getCurrentUser()
  const [stats, setStats] = useState({
    mahasiswaAktif: 0, totalFakultas: 0, totalPending: 0, kurikulumAktif: '-',
  })
  const [grafikData, setGrafikData] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      get('/api/umum/dashboard/pimpinan-ditmawa').catch(() => null),
      getKegiatan({ limit: 10, status: 'terpublikasi' }).catch(() => []),
    ]).then(([dash, keg]) => {
      if (dash?.data) {
        const s = dash.data.statistik || {}
        setStats({
          mahasiswaAktif: s.mahasiswaAktif ?? 0,
          totalFakultas: s.totalFakultas ?? 0,
          totalPending: s.totalPending ?? 0,
          kurikulumAktif: s.kurikulumAktif ?? '-',
        })
        setGrafikData(
          (dash.data.grafikPoinUkm || []).map((d) => ({
            label: d.ukm || d.label || '-',
            poin: d.totalPoin ?? d.poin ?? 0,
          }))
        )
      }
      const kegList = Array.isArray(keg) ? keg : []
      setEvents(kegList.map((k, i) => ({
        no: i + 1,
        nama: k.nama || '-',
        diajukanPada: formatDate(k.createdAt),
        tipe: k.kategori?.nama || '-',
        penyelenggara: k.organisasi?.nama || k.pembuat?.nama || '-',
        kategori: k.kategori?.nama || '-',
        peserta: k._count?.partisipasi ?? k.peserta ?? 0,
        skala: k.skala?.nama || '-',
      })))
    }).finally(() => setLoading(false))
  }, [])

  const cards = [
    { label: 'MAHASISWA AKTIF', value: stats.mahasiswaAktif },
    { label: 'TOTAL FAKULTAS', value: stats.totalFakultas },
    { label: 'TOTAL PENDING', value: stats.totalPending },
    { label: 'KURIKULUM AKTIF', value: stats.kurikulumAktif },
  ]

  return (
    <DashboardLayout
      role="pimpinan_ditmawa"
      userName={user?.nama || 'Pimpinan Ditmawa'}
      userRole="Pimpinan Ditmawa"
    >
      <div className="space-y-6">
        <div>
          <h2 className="bg-gradient-to-r from-brand-dark to-brand-light bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl">
            Dashboard Pimpinan / Direktorat
          </h2>
          <p className="mt-1 text-sm text-[#616161]">
            Pantau aktivitas mahasiswa dan pengajuan UKM secara real-time.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#616161]">{card.label}</p>
              <p className="mt-2 text-3xl font-extrabold text-brand-dark">
                {loading ? '…' : String(card.value)}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#222]">
            Grafik poin per UKM berdasarkan pengajuan Kegiatan
          </h3>
          {grafikData.length === 0 ? (
            <p className="mt-4 text-sm text-[#9aa0a6]">{loading ? 'Memuat…' : 'Belum ada data.'}</p>
          ) : (
            <HorizontalBarChart
              labels={grafikData.map((d) => d.label)}
              values={grafikData.map((d) => d.poin)}
              max={Math.max(...grafikData.map((d) => d.poin), 10)}
            />
          )}
        </div>

        <TableCard title="Daftar Event Disetujui">
          <TableFrame>
            <DataTable
              loading={loading}
              data={events}
              emptyText="Belum ada event disetujui."
              columns={[
                { key: 'no', label: 'No', render: (e) => <span className="block text-center">{e.no}</span> },
                { key: 'nama', label: 'Nama Kegiatan', render: (e) => <KegiatanCell nama={e.nama} tanggal={e.diajukanPada} /> },
                { key: 'tipe', label: 'Tipe' },
                { key: 'penyelenggara', label: 'Penyelenggara' },
                { key: 'peserta', label: 'Peserta', render: (e) => <span className="block text-center">{e.peserta}</span> },
                { key: 'skala', label: 'Skala' },
              ]}
            />
          </TableFrame>
        </TableCard>
      </div>
    </DashboardLayout>
  )
}

export default PimpinanDitmawaDashboard
