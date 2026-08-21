import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatCard from '../../components/dashboard/StatCard'
import StatusBadge from '../../components/dashboard/StatusBadge'
import DataTable from '../../components/dashboard/DataTable'
import PanduanCard from '../../components/dashboard/PanduanCard'
import { getCurrentUser } from '../../services/authService'
import { get } from '../../services/apiClient'
import KegiatanCell from '../../components/dashboard/KegiatanCell'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'

function formatTanggal(value) {
  if (!value) return '-'
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '-'
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return String(value)
  }
}

function UKMFDashboard() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [statistik, setStatistik] = useState({
    pending: 0,
    disetujui: 0,
    ditolak: 0,
    eventAktif: 0,
  })
  const [riwayat, setRiwayat] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    get('/api/ukm/dashboard')
      .then((res) => {
        const data = res?.data || res || {}
        const s = data.statistik || {}
        setStatistik({
          pending: s.pending ?? 0,
          disetujui: s.disetujui ?? 0,
          ditolak: s.ditolak ?? 0,
          eventAktif: s.eventAktif ?? 0,
        })
        const list =
          data.riwayatPengajuan ||
          data.riwayatKegiatan ||
          data.kegiatan ||
          []
        setRiwayat(Array.isArray(list) ? list.slice(0, 10) : [])
      })
      .catch((err) => {
        setStatistik({ pending: 0, disetujui: 0, ditolak: 0, eventAktif: 0 })
        setRiwayat([])
        toast.error('Gagal memuat dashboard', { description: err.message })
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout
      role="operator_ukmf"
      userName={user?.nama || 'Operator UKMF'}
      userRole="Operator UKMF"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-[#222] sm:text-3xl">
            Dashboard UKMF {user?.namaOrganisasi || ''}
          </h2>
          <p className="mt-1 text-sm text-[#616161]">Kelola event dan verifikasi kehadiran peserta</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Pending', value: loading ? '…' : statistik.pending },
            { label: 'Disetujui', value: loading ? '…' : statistik.disetujui },
            { label: 'Ditolak', value: loading ? '…' : statistik.ditolak },
            { label: 'Event Aktif', value: loading ? '…' : statistik.eventAktif },
          ].map(({ label, value }) => (
            <StatCard key={label} label={label} value={value} />
          ))}
        </div>

        <TableCard
          title="Riwayat Terbaru Kegiatan"
          headerRight={
            <button
              type="button"
              onClick={() => navigate('/operator_ukmf/daftar-kegiatan')}
              className="rounded-lg border border-brand-dark bg-white px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-[#f5f7f5]"
            >
              Lihat selengkapnya →
            </button>
          }
        >
          <TableFrame>
            <DataTable
              loading={loading}
              data={riwayat}
              emptyText="Belum ada kegiatan."
              columns={[
                { key: 'no', label: 'No', render: (_r, i) => i + 1 },
                {
                  key: 'kegiatan',
                  label: 'Kegiatan',
                  render: (r) => (
                    <KegiatanCell
                      nama={r.nama || r.namaKegiatan || '-'}
                      tanggal={formatTanggal(r.diajukanPada || r.createdAt)}
                    />
                  ),
                },
                { key: 'jenis', label: 'Jenis', render: (r) => r.jenis || r.jenisKegiatan || r.kategori?.nama || '-' },
                { key: 'skala', label: 'Skala', render: (r) => (typeof r.skala === 'object' ? r.skala?.nama : r.skala) || '-' },
                { key: 'tanggal', label: 'Tanggal', render: (r) => formatTanggal(r.tanggalMulai || r.tanggal) },
                { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              ]}
            />
          </TableFrame>
        </TableCard>

        <PanduanCard
          className="max-w-sm"
          title="Manual Book User UKMF"
          description="Panduan Penggunaan Website SAPS 2026 untuk UKMF"
        />
      </div>
    </DashboardLayout>
  )
}

export default UKMFDashboard
