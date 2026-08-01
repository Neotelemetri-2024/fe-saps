import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatCard from '../../components/dashboard/StatCard'
import StatusBadge from '../../components/dashboard/StatusBadge'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { toast } from 'sonner'
import { getCurrentUser } from '../../services/authService'
import { getDashboardAdminDitmawa } from '../../services/dashboardService'
import { deleteKegiatan } from '../../services/kegiatanService'
import KegiatanCell from '../../components/dashboard/KegiatanCell'

function formatTanggal(start, end) {
  if (!start) return '-'
  try {
    const a = new Date(start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    if (!end) return a
    return `${a} - ${new Date(end).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
  } catch { return String(start) }
}

function AdminDitmawaDashboard() {
  const user = getCurrentUser()
  const [stats, setStats] = useState([])
  const [kegiatan, setKegiatan] = useState([])
  const [loading, setLoading] = useState(true)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [selectedRow, setSelectedRow] = useState(null)

  const load = () => {
    setLoading(true)
    getDashboardAdminDitmawa()
      .then((data) => {
        const s = data?.statistik || {}
        setStats([
          { label: 'DISETUJUI', value: String(s.disetujui ?? 0) },
          { label: 'PENDING', value: String(s.pending ?? 0) },
          { label: 'DITOLAK', value: String(s.ditolak ?? 0) },
          { label: 'EVENT GLOBAL AKTIF', value: String(s.eventGlobalAktif ?? 0) },
        ])
        setKegiatan(
          (data?.kegiatanTerbaru || []).map((k, i) => ({
            id: k.id,
            no: i + 1,
            kegiatan: k.namaKegiatan || k.nama || '-',
            diajukanPada: formatTanggal(k.diajukanPada),
            pengaju: k.kategori || '-',
            skala: k.skala || '-',
            tgl: formatTanggal(k.tanggalMulai, k.tanggalSelesai),
            status: String(k.status || 'pending').toLowerCase(),
          }))
        )
      })
      .catch((err) => toast.error('Gagal memuat dashboard', { description: err.message }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const columns = [
    { key: 'no', label: 'NO', render: (row) => <span className="text-[#616161]">{row.no}</span> },
    { key: 'kegiatan', label: 'KEGIATAN', render: (row) => <KegiatanCell nama={row.kegiatan} tanggal={row.diajukanPada} /> },
    { key: 'pengaju', label: 'KATEGORI' },
    { key: 'skala', label: 'SKALA' },
    { key: 'tgl', label: 'TANGGAL' },
    { key: 'status', label: 'STATUS', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'aksi', label: 'AKSI',
      render: (row) => (
        <button
          type="button"
          onClick={() => { setSelectedRow(row); setShowConfirmDelete(true) }}
          className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
        >
          Hapus
        </button>
      ),
    },
  ]

  const handleDeleteConfirm = async () => {
    if (selectedRow) {
      try {
        await deleteKegiatan(selectedRow.id)
        toast.success('Dihapus!', { description: `Kegiatan "${selectedRow.kegiatan}" dihapus.` })
        load()
      } catch (err) {
        toast.error('Gagal', { description: err.message })
      }
    }
    setShowConfirmDelete(false)
    setSelectedRow(null)
  }

  return (
    <DashboardLayout
      role="admin_ditmawa"
      userName={user?.nama || 'Admin Ditmawa'}
      userRole="Admin Ditmawa"
    >
      <ConfirmModal
        isOpen={showConfirmDelete}
        message={selectedRow ? `Yakin ingin menghapus "${selectedRow.kegiatan}"?` : ''}
        confirmText="Ya, hapus"
        cancelText="Batal"
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setShowConfirmDelete(false); setSelectedRow(null) }}
      />

      <div className="space-y-6">
        <div>
          <h2 className="bg-gradient-to-r from-brand-dark to-brand-light bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl">
            Dashboard Admin Ditmawa
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#616161]">{s.label}</p>
              <p className="mt-2 text-3xl font-extrabold text-brand-dark">{loading ? '…' : s.value}</p>
            </div>
          ))}
        </div>

        <TableCard title="Kegiatan Terbaru">
          <TableFrame>
            <DataTable columns={columns} data={kegiatan} />
          </TableFrame>
        </TableCard>
      </div>
    </DashboardLayout>
  )
}

export default AdminDitmawaDashboard
