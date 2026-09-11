import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Eye } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatCard from '../../components/dashboard/StatCard'
import StatusBadge from '../../components/dashboard/StatusBadge'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import PanduanCard from '../../components/dashboard/PanduanCard'
import KegiatanCell from '../../components/dashboard/KegiatanCell'
import ActionMenu from '../../components/ui/ActionMenu'
import { getCurrentUser } from '../../services/authService'
import { getDashboardAdminDitmawa } from '../../services/dashboardService'

function formatTanggal(start, end) {
  if (!start) return '-'
  try {
    const ds = new Date(start)
    if (Number.isNaN(ds.getTime())) return '-'
    const a = ds.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    if (!end) return a
    const de = new Date(end)
    if (Number.isNaN(de.getTime())) return a
    const b = de.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    return `${a} – ${b}`
  } catch {
    return String(start)
  }
}

function formatDiajukan(val) {
  if (!val) return '-'
  try {
    const d = new Date(val)
    if (Number.isNaN(d.getTime())) return '-'
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return String(val)
  }
}

function detailPath(row) {
  if (row.asal === 'eksternal') {
    return `/admin_ditmawa/verifikasi-pengajuan-eksternal/${row.id}`
  }
  if (row.asal === 'universitas') {
    return `/admin_ditmawa/manajemen-peserta-event/${row.id}`
  }
  return `/admin_ditmawa/verifikasi-pengajuan-internal/${row.id}`
}

function mapRows(list = []) {
  return list.map((k, i) => ({
    no: i + 1,
    id: k.id,
    nama: k.namaKegiatan || k.nama || '-',
    diajukanPada: formatDiajukan(k.diajukanPada),
    asal: k.asal || '',
    asalLabel: k.asalLabel || k.asal || '-',
    kategori: k.kategori || '-',
    skala: k.skala || '-',
    tanggal: formatTanggal(k.tanggalMulai, k.tanggalSelesai),
    pengaju: k.pengaju || '-',
    kurikulumNama: k.kurikulumNama || null,
    peserta: k.peserta ?? 0,
    status: String(k.statusRaw || k.status || 'diajukan').toLowerCase(),
  }))
}

function KegiatanPreviewTable({
  title,
  rows,
  loading,
  emptyText,
  onSeeAll,
  seeAllLabel,
  showAsal = false,
  showPeserta = false,
}) {
  const navigate = useNavigate()

  const openDetail = (row) => {
    navigate(detailPath(row), { state: { item: row } })
  }

  const columns = useMemo(
    () => [
      {
        key: 'no',
        label: 'No',
        render: (row) => <span className="text-base-content">{row.no}</span>,
      },
      {
        key: 'nama',
        label: 'Kegiatan',
        render: (row) => <KegiatanCell nama={row.nama} tanggal={row.diajukanPada} />,
      },
      ...(showAsal
        ? [{
            key: 'asal',
            label: 'Asal',
            render: (row) => <span className="text-base-content">{row.asalLabel}</span>,
          }]
        : []),
      {
        key: 'pengaju',
        label: 'Pengaju',
        render: (row) => <span className="text-base-content">{row.pengaju}</span>,
      },
      {
        key: 'kategori',
        label: 'Kategori',
        render: (row) => <span className="text-base-content">{row.kategori}</span>,
      },
      {
        key: 'skala',
        label: 'Skala',
        render: (row) => <span className="text-base-content">{row.skala}</span>,
      },
      ...(showPeserta
        ? [{
            key: 'peserta',
            label: 'Peserta',
            center: true,
            render: (row) => <span className="text-base-content">{row.peserta}</span>,
          }]
        : []),
      {
        key: 'status',
        label: 'Status',
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: 'aksi',
        label: 'Aksi',
        stopPropagation: true,
        render: (row) => (
          <ActionMenu
            items={[
              {
                label: 'Detail',
                icon: <Eye className="h-4 w-4" />,
                color: 'text-primary',
                onClick: () => openDetail(row),
              },
            ]}
          />
        ),
      },
    ],
    [showAsal, showPeserta, navigate],
  )

  return (
    <TableCard
      title={title}
      headerRight={
        <button type="button" onClick={onSeeAll} className="btn btn-outline btn-primary btn-sm">
          {seeAllLabel}
        </button>
      }
    >
      <TableFrame>
        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          emptyText={emptyText}
          pageSize={5}
          onRowClick={openDetail}
        />
      </TableFrame>
    </TableCard>
  )
}

function AdminDitmawaDashboard() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [stats, setStats] = useState([
    { label: 'DISETUJUI', value: 0 },
    { label: 'PENDING', value: 0 },
    { label: 'DITOLAK', value: 0 },
    { label: 'EVENT GLOBAL AKTIF', value: 0 },
  ])
  const [eksternal, setEksternal] = useState([])
  const [internal, setInternal] = useState([])
  const [eventGlobal, setEventGlobal] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    getDashboardAdminDitmawa()
      .then((data) => {
        const s = data?.statistik || {}
        setStats([
          { label: 'DISETUJUI', value: s.disetujui ?? 0 },
          { label: 'PENDING', value: s.pending ?? 0 },
          { label: 'DITOLAK', value: s.ditolak ?? 0 },
          { label: 'EVENT GLOBAL AKTIF', value: s.eventGlobalAktif ?? 0 },
        ])
        setEksternal(mapRows(data?.kegiatanEksternal || []))
        setInternal(mapRows(data?.kegiatanInternal || []))
        setEventGlobal(mapRows(data?.kegiatanEventGlobal || []))
      })
      .catch((err) =>
        toast.error('Gagal memuat dashboard', { description: err.message }),
      )
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <DashboardLayout
      role="admin_ditmawa"
      userName={user?.nama || 'Admin Ditmawa'}
      userRole="Admin Ditmawa"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-base-content sm:text-3xl">
            Dashboard Admin Ditmawa
          </h2>
          <p className="mt-1 text-sm text-base-content/60">
            Kelola verifikasi kegiatan nasional/internasional dan event global.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={loading ? '…' : stat.value}
            />
          ))}
        </div>

        <KegiatanPreviewTable
          title="Pengajuan eksternal terbaru"
          rows={eksternal}
          loading={loading}
          emptyText="Belum ada pengajuan eksternal."
          seeAllLabel="Lihat selengkapnya →"
          onSeeAll={() => navigate('/admin_ditmawa/verifikasi-pengajuan-eksternal')}
        />

        <KegiatanPreviewTable
          title="Pengajuan internal terbaru"
          rows={internal}
          loading={loading}
          emptyText="Belum ada pengajuan internal UKM/UKMF."
          seeAllLabel="Lihat selengkapnya →"
          showAsal
          onSeeAll={() => navigate('/admin_ditmawa/verifikasi-pengajuan-internal')}
        />

        <KegiatanPreviewTable
          title="Event global terbaru"
          rows={eventGlobal}
          loading={loading}
          emptyText="Belum ada event global."
          seeAllLabel="Lihat selengkapnya →"
          showPeserta
          onSeeAll={() => navigate('/admin_ditmawa/manajemen-event')}
        />

        <PanduanCard
          className="max-w-lg"
          title="Manual Book User Admin Ditmawa"
          description="Panduan Penggunaan Website MY UNAND STUDENT CONNECT 2026 untuk Admin Ditmawa"
        />
      </div>
    </DashboardLayout>
  )
}

export default AdminDitmawaDashboard
