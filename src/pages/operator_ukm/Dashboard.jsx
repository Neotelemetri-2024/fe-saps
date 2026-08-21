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

  const [stats, setStats] = useState(null)
  const [riwayat, setRiwayat] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    get('/api/ukm/dashboard')
      .then((res) => {
        const data = res?.data || res || {}

        setStats(data)

        const list =
          data.riwayatKegiatan ||
          data.kegiatan ||
          []

        setRiwayat(
          Array.isArray(list)
            ? list.slice(0, 10)
            : []
        )
      })
      .catch(() => {
        setStats(null)
        setRiwayat([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const statusLower = (item) => {
    return String(item?.status || '').toLowerCase()
  }

  const allKegiatan =
    stats?.riwayatKegiatan ||
    stats?.kegiatan ||
    []

  const draftCount = allKegiatan.filter(
    (item) => statusLower(item) === 'draft'
  ).length

  const pending = allKegiatan.filter((item) =>
    ['diajukan', 'terverifikasi'].includes(
      statusLower(item)
    )
  ).length

  const disetujui = allKegiatan.filter((item) =>
    ['disetujui', 'terpublikasi'].includes(
      statusLower(item)
    )
  ).length

  const aktif = allKegiatan.filter((item) =>
    ['terpublikasi', 'berlangsung'].includes(
      statusLower(item)
    )
  ).length

  const columns = [
    {
      key: 'no',
      label: 'No',
      render: (_row, index) => (
        <span className="text-[#616161]">
          {index + 1}
        </span>
      ),
    },
    {
      key: 'kegiatan',
      label: 'Kegiatan',
      render: (row) => (
        <KegiatanCell
          nama={
            row.nama ||
            row.namaKegiatan ||
            row.kegiatan ||
            '-'
          }
          tanggal={formatTanggal(
            row.diajukanPada ||
            row.createdAt
          )}
        />
      ),
    },
    {
      key: 'jenis',
      label: 'Jenis',
      render: (row) => (
        <span className="text-[#616161]">
          {typeof row.jenis === 'object'
            ? row.jenis?.nama || '-'
            : row.jenis ||
              row.kategori?.nama ||
              '-'}
        </span>
      ),
    },
    {
      key: 'skala',
      label: 'Skala',
      render: (row) => (
        <span className="text-[#616161]">
          {typeof row.skala === 'object'
            ? row.skala?.nama || '-'
            : row.skala || '-'}
        </span>
      ),
    },
    {
      key: 'tanggal',
      label: 'Tanggal',
      render: (row) => (
        <span className="text-[#616161]">
          {formatTanggal(
            row.tanggal ||
            row.tgl ||
            row.tanggalMulai ||
            row.tanggalPelaksanaan
          ) || '-'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <StatusBadge status={row.status} />
      ),
    },
  ]

  const statCards = [
    {
      label: 'Draft',
      value: loading ? '…' : draftCount,
    },
    {
      label: 'Menunggu',
      value: loading ? '…' : pending,
    },
    {
      label: 'Disetujui',
      value: loading ? '…' : disetujui,
    },
    {
      label: 'Event Aktif',
      value: loading ? '…' : aktif,
    },
  ]

  return (
    <DashboardLayout
      role="operator_ukm"
      userName={user?.nama || 'Operator UKM'}
      userRole="Operator UKM"
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Header halaman */}
        <div>
          <h2 className="text-2xl font-extrabold text-[#222] sm:text-3xl">
            Dashboard UKM{' '}
            {user?.namaOrganisasi || ''}
          </h2>

          <p className="mt-1 text-sm text-[#616161]">
            Kelola event dan verifikasi kehadiran
            peserta.
          </p>
        </div>

        {/* Statistik */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map(({ label, value }) => (
            <StatCard key={label} label={label} value={value} />
          ))}
        </div>

        {/* Card putih riwayat kegiatan */}
        <TableCard
          title="Riwayat Terbaru Pengajuan Kegiatan"
          headerRight={
            <button
              type="button"
              onClick={() =>
                navigate(
                  '/operator_ukm/daftar-kegiatan'
                )
              }
              className="rounded-lg border border-brand-dark bg-white px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-[#f5f7f5]"
            >
              Lihat selengkapnya →
            </button>
          }
        >
          {/* Tabel */}
          <TableFrame>
            <DataTable
              loading={loading}
              data={riwayat}
              emptyText="Belum ada kegiatan."
              columns={columns}
            />
          </TableFrame>
        </TableCard>

        {/* Panduan */}
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