import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Download, Edit3, Trash2 } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import DataTable from '../../components/dashboard/DataTable'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { getCurrentUser } from '../../services/authService'
import { getDashboardAdminDitmawa } from '../../services/dashboardService'
import { deleteKegiatan, updateKegiatan } from '../../services/kegiatanService'

function formatTanggal(start, end) {
  if (!start) return '-'
  try {
    const a = new Date(start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    if (!end) return a
    const b = new Date(end).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    return `${a} - ${b}`
  } catch {
    return String(start)
  }
}

function AdminDitmawaDashboard() {
  const user = getCurrentUser()
  const [stats, setStats] = useState([
    { label: 'DISETUJUI', value: 0, border: 'border-brand-dark', valueColor: 'text-brand-dark' },
    { label: 'PENDING', value: 0, border: 'border-yellow-400', valueColor: 'text-yellow-500' },
    { label: 'DITOLAK', value: 0, border: 'border-red-500', valueColor: 'text-red-600' },
    { label: 'EVENT GLOBAL AKTIF', value: 0, border: 'border-brand-dark', valueColor: 'text-brand-dark' },
  ])
  const [kegiatanTerbaru, setKegiatanTerbaru] = useState([])
  const [loading, setLoading] = useState(true)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)

  const load = () => {
    setLoading(true)
    getDashboardAdminDitmawa()
      .then((data) => {
        const s = data?.statistik || {}
        setStats([
          { label: 'DISETUJUI', value: s.disetujui ?? 0, border: 'border-brand-dark', valueColor: 'text-brand-dark' },
          { label: 'PENDING', value: s.pending ?? 0, border: 'border-yellow-400', valueColor: 'text-yellow-500' },
          { label: 'DITOLAK', value: s.ditolak ?? 0, border: 'border-red-500', valueColor: 'text-red-600' },
          {
            label: 'EVENT GLOBAL AKTIF',
            value: s.eventGlobalAktif ?? 0,
            border: 'border-brand-dark',
            valueColor: 'text-brand-dark',
          },
        ])
        const list = data?.kegiatanTerbaru || []
        setKegiatanTerbaru(
          list.map((k, i) => ({
            no: i + 1,
            id: k.id,
            nama: k.namaKegiatan || k.nama || '-',
            meta: formatTanggal(k.tanggalMulai, k.tanggalSelesai),
            kategori: k.kategori || '-',
            skala: k.skala || '-',
            tanggal: formatTanggal(k.tanggalMulai, k.tanggalSelesai),
            peserta: k.peserta ?? 0,
            poin: k.poin ?? 50,
            status: String(k.status || 'pending').toLowerCase(),
          })),
        )
      })
      .catch((err) => toast.error('Gagal memuat dashboard', { description: err.message }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleEdit = async (item) => {
    try {
      await updateKegiatan(item.id, { status: 'aktif' })
      toast.success('Data diperbarui!', { description: `Kegiatan "${item.nama}" berhasil diperbarui.` })
      load()
    } catch (err) {
      toast.error('Gagal', { description: err.message })
    }
  }

  const handleDeleteClick = (item) => {
    setSelectedItem(item)
    setShowConfirmDelete(true)
  }

  const handleDeleteConfirm = async () => {
    if (selectedItem) {
      try {
        await deleteKegiatan(selectedItem.id)
        toast.success('Dihapus!', { description: 'Kegiatan berhasil dihapus.' })
        load()
      } catch (err) {
        toast.error('Gagal', { description: err.message })
      }
    }
    setShowConfirmDelete(false)
    setSelectedItem(null)
  }

  const kegiatanColumns = useMemo(() => [
    { key: 'no', label: 'No', render: (row) => <span className="text-[#616161]">{row.no}</span> },
    { key: 'nama', label: 'Nama Kegiatan', render: (row) => (
      <div>
        <p className="font-medium text-[#333]">{row.nama}</p>
        <p className="mt-1 text-[11px] text-[#9aa0a6]">{row.meta}</p>
      </div>
    )},
    { key: 'kategori', label: 'Kategori', render: (row) => <span className="text-[#616161]">{row.kategori}</span> },
    { key: 'skala', label: 'Skala', render: (row) => <span className="text-[#616161]">{row.skala}</span> },
    { key: 'tanggal', label: 'Tanggal', render: (row) => <span className="text-[#616161]">{row.tanggal}</span> },
    { key: 'peserta', label: 'Peserta', render: (row) => <span className="text-[#616161]">{row.peserta}</span> },
    { key: 'poin', label: 'Poin', render: (row) => <span className="text-[#616161]">{row.poin}</span> },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'aksi', label: 'Aksi', stopPropagation: true, render: (row) => (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleEdit(row)}
          className="rounded p-1 text-brand-dark transition hover:bg-green-50"
          aria-label="Edit kegiatan"
        >
          <Edit3 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => handleDeleteClick(row)}
          className="rounded p-1 text-red-600 transition hover:bg-red-50"
          aria-label="Hapus kegiatan"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    )},
  ], [kegiatanTerbaru])

  return (
    <DashboardLayout
      role="admin_ditmawa"
      userName={user?.nama || 'Admin Ditmawa'}
      userRole="Admin Ditmawa"
    >
      <ConfirmModal
        isOpen={showConfirmDelete}
        message={selectedItem ? `Yakin ingin menghapus "${selectedItem.nama}"?` : ''}
        confirmText="Ya, hapus"
        cancelText="Batal"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowConfirmDelete(false)
          setSelectedItem(null)
        }}
      />

      <div className="space-y-6">
        <div>
          <h2 className="bg-gradient-to-r from-brand-dark to-brand-light bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl">
            Dashboard Admin Ditmawa
          </h2>
          <p className="mt-1 text-sm text-[#616161]">
            Kelola verifikasi kegiatan nasional/internasional dan event global.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-xl border-2 ${stat.border} bg-white p-4 shadow-sm sm:p-5 lg:p-6`}
            >
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#616161]">{stat.label}</p>
              <p className={`mt-2 text-3xl font-extrabold ${stat.valueColor}`}>
                {loading ? '…' : stat.value}
              </p>
            </div>
          ))}
        </div>

        <section>
          <h3 className="mb-3 text-lg font-bold text-brand-dark">Kegiatan terbaru</h3>
          <div className="overflow-hidden rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
            <DataTable
              columns={kegiatanColumns}
              data={kegiatanTerbaru}
              loading={loading}
              emptyText="Belum ada kegiatan."
            />
          </div>
        </section>

        <section className="max-w-lg rounded-xl bg-gradient-to-r from-brand-dark to-brand-light p-6 text-white shadow-sm">
          <h3 className="text-lg font-bold">Download Panduan</h3>
          <div className="mt-4 flex items-start gap-3 text-sm text-white/90">
            <Download className="mt-0.5 h-5 w-5 shrink-0" />
            <p>Ditmawa - Panduan Penggunaan Website MyUnand Student Connect 2026.pdf</p>
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}

export default AdminDitmawaDashboard
