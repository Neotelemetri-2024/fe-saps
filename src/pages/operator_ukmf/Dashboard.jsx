import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatCard from '../../components/dashboard/StatCard'
import StatusBadge from '../../components/dashboard/StatusBadge'
import DataTable from '../../components/dashboard/DataTable'
import PanduanCard from '../../components/dashboard/PanduanCard'
import { getCurrentUser } from '../../services/authService'
import { getKegiatan } from '../../services/kegiatanService'
import KegiatanCell from '../../components/dashboard/KegiatanCell'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'

function mapStatus(status) {
  const s = String(status || '').toLowerCase()
  if (['diajukan', 'pending'].includes(s)) return 'pending'
  if (['terverifikasi', 'diteruskan'].includes(s)) return 'diteruskan'
  if (['disetujui', 'terpublikasi', 'aktif'].includes(s)) return 'disetujui'
  if (['ditolak'].includes(s)) return 'ditolak'
  if (['perlu_revisi', 'revisi'].includes(s)) return 'revisi'
  return s || 'pending'
}

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
  const [riwayat, setRiwayat] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getKegiatan()
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setRiwayat(list)
      })
      .catch((err) => {
        setRiwayat([])
        toast.error('Gagal memuat dashboard', { description: err.message })
      })
      .finally(() => setLoading(false))
  }, [])

  const pending = riwayat.filter((d) => ['diajukan', 'pending'].includes(String(d.status || '').toLowerCase())).length
  const disetujui = riwayat.filter((d) => ['disetujui', 'terpublikasi', 'aktif'].includes(String(d.status || '').toLowerCase())).length
  const ditolak = riwayat.filter((d) => String(d.status || '').toLowerCase() === 'ditolak').length
  const aktif = riwayat.filter((d) => ['terpublikasi', 'aktif', 'disetujui'].includes(String(d.status || '').toLowerCase())).length

  const preview = riwayat.slice(0, 10)

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
            { label: 'Pending', value: loading ? '…' : pending },
            { label: 'Disetujui', value: loading ? '…' : disetujui },
            { label: 'Ditolak', value: loading ? '…' : ditolak },
            { label: 'Event Aktif', value: loading ? '…' : aktif },
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
              className="text-sm font-semibold text-brand-dark hover:underline"
            >
              Lihat Semua →
            </button>
          }
        >
          <TableFrame>
            <DataTable
              loading={loading}
              data={preview}
              emptyText="Belum ada kegiatan."
              columns={[
                { key: 'no', label: 'No', render: (_r, i) => i + 1 },
                {
                  key: 'kegiatan', label: 'Kegiatan',
                  render: (r) => <KegiatanCell nama={r.nama || '-'} tanggal={formatTanggal(r.createdAt)} />,
                },
                { key: 'jenis', label: 'Jenis', render: (r) => r.kategori?.nama || r.jenis || '-' },
                { key: 'skala', label: 'Skala', render: (r) => r.skala?.nama || r.skala || '-' },
                { key: 'tanggal', label: 'Tanggal', render: (r) => formatTanggal(r.tanggalMulai || r.tanggal) },
                { key: 'status', label: 'Status', render: (r) => <StatusBadge status={mapStatus(r.status)} /> },
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
