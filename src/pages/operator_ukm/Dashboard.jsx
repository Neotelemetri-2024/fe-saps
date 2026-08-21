import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatCard from '../../components/dashboard/StatCard'
import StatusBadge from '../../components/dashboard/StatusBadge'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import PanduanCard from '../../components/dashboard/PanduanCard'
import KegiatanCell from '../../components/dashboard/KegiatanCell'
import { getCurrentUser } from '../../services/authService'
import { get } from '../../services/apiClient'

function formatTanggal(value) {
  if (!value) return ''
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return String(value)
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return String(value)
  }
}

function UKMDashboard() {
  const navigate = useNavigate()
  const user = getCurrentUser()

  const [statistik, setStatistik] = useState({
    draft: 0,
    pending: 0,
    disetujui: 0,
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
          draft: s.draft ?? 0,
          pending: s.pending ?? 0,
          disetujui: s.disetujui ?? 0,
          eventAktif: s.eventAktif ?? 0,
        })
        const list =
          data.riwayatPengajuan ||
          data.riwayatKegiatan ||
          data.kegiatan ||
          []
        setRiwayat(Array.isArray(list) ? list.slice(0, 10) : [])
      })
      .catch(() => {
        setStatistik({ draft: 0, pending: 0, disetujui: 0, eventAktif: 0 })
        setRiwayat([])
      })
      .finally(() => setLoading(false))
  }, [])

  const columns = [
    {
      key: 'no',
      label: 'No',
      render: (_row, index) => (
        <span className="text-[#616161]">{index + 1}</span>
      ),
    },
    {
      key: 'kegiatan',
      label: 'Kegiatan',
      render: (row) => (
        <KegiatanCell
          nama={row.nama || row.namaKegiatan || row.kegiatan || '-'}
          tanggal={formatTanggal(row.diajukanPada || row.createdAt)}
        />
      ),
    },
    {
      key: 'jenis',
      label: 'Jenis',
      render: (row) => row.jenis || row.jenisKegiatan || row.kategori?.nama || '-',
    },
    {
      key: 'skala',
      label: 'Skala',
      render: (row) => (typeof row.skala === 'object' ? row.skala?.nama : row.skala) || '-',
    },
    {
      key: 'tanggal',
      label: 'Tanggal',
      render: (row) => formatTanggal(row.tanggalMulai || row.tanggal) || '-',
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ]

  const statCards = [
    { label: 'Draft', value: loading ? '…' : statistik.draft },
    { label: 'Menunggu', value: loading ? '…' : statistik.pending },
    { label: 'Disetujui', value: loading ? '…' : statistik.disetujui },
    { label: 'Event Aktif', value: loading ? '…' : statistik.eventAktif },
  ]

  return (
    <DashboardLayout
      role="operator_ukm"
      userName={user?.nama || 'Operator UKM'}
      userRole="Operator UKM"
    >
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-[#222] sm:text-3xl">
            Dashboard UKM {user?.namaOrganisasi || ''}
          </h2>
          <p className="mt-1 text-sm text-[#616161]">
            Kelola event dan verifikasi kehadiran peserta.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map(({ label, value }) => (
            <StatCard key={label} label={label} value={value} />
          ))}
        </div>

        <TableCard
          title="Riwayat Terbaru Pengajuan Kegiatan"
          headerRight={
            <button
              type="button"
              onClick={() => navigate('/operator_ukm/daftar-kegiatan')}
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
              columns={columns}
            />
          </TableFrame>
        </TableCard>

        <PanduanCard
          className="max-w-sm"
          title="Manual Book User UKM"
          description="Panduan Penggunaan Website SAPS 2026 untuk UKM"
        />
      </div>
    </DashboardLayout>
  )
}

export default UKMDashboard
