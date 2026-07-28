import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, Pencil, Trash2 } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { toast } from 'sonner'
import { getCurrentUser } from '../../services/authService'
import { getKegiatan, deleteKegiatan, ajukanKegiatan } from '../../services/kegiatanService'

const statusStyle = {
  Draft: 'bg-gray-100 text-gray-700 border border-gray-300',
  'Disetujui Pimpinan': 'bg-green-100 text-green-700 border border-green-300',
  Pending: 'bg-yellow-100 text-yellow-600 border border-yellow-300',
  Ditolak: 'bg-red-100 text-red-600 border border-red-300',
  Revisi: 'bg-orange-100 text-orange-600 border border-orange-300',
  Aktif: 'bg-green-100 text-green-700 border border-green-300',
}

function mapStatusLabel(status) {
  const s = String(status || '').toLowerCase()
  if (s === 'draft') return 'Draft'
  if (['disetujui', 'terpublikasi'].includes(s)) return 'Disetujui Pimpinan'
  if (['diajukan', 'terverifikasi'].includes(s)) return 'Pending'
  if (s === 'ditolak') return 'Ditolak'
  if (['perlu_revisi', 'revisi'].includes(s)) return 'Revisi'
  return status || 'Pending'
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

function normalizeEvent(item) {
  const rawStatus = String(item.status || '').toLowerCase()
  return {
    id: item.id,
    kegiatan: item.nama || '-',
    submitted: item.createdAt ? new Date(item.createdAt).toLocaleString('id-ID') : '-',
    kategori: item.kategori?.nama || '-',
    skala: item.skala?.nama || '-',
    tanggal: formatTanggal(item.tanggalMulai, item.tanggalSelesai),
    peserta: item._count?.partisipasi ?? item.kuota ?? '-',
    poin: item.poin ?? null,
    status: mapStatusLabel(item.status),
    rawStatus,
  }
}

function ManajemenEvent() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSkala, setFilterSkala] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [kirimTarget, setKirimTarget] = useState(null)

  const load = () => {
    setLoading(true)
    getKegiatan()
      .then((res) => setData(Array.isArray(res) ? res.map(normalizeEvent) : []))
      .catch((err) => {
        setData([])
        toast.error('Gagal memuat event', { description: err.message })
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = data.filter((e) => {
    const q = search.trim().toLowerCase()
    if (q && !e.kegiatan.toLowerCase().includes(q)) return false
    if (filterKategori && e.kategori !== filterKategori) return false
    if (filterStatus && e.status !== filterStatus) return false
    if (filterSkala && e.skala !== filterSkala) return false
    return true
  })

  const resetFilter = () => {
    setSearch('')
    setFilterKategori('')
    setFilterStatus('')
    setFilterSkala('')
  }

  const handleDelete = async () => {
    try {
      await deleteKegiatan(deleteId)
      setDeleteId(null)
      toast.success('Event berhasil dihapus.')
      load()
    } catch (err) {
      toast.error('Gagal menghapus', { description: err.message })
    }
  }

  const handleKirim = async () => {
    if (!kirimTarget) return
    try {
      await ajukanKegiatan(kirimTarget.id)
      toast.success('Event dikirim ke Pimpinan')
      setKirimTarget(null)
      load()
    } catch (err) {
      toast.error('Gagal kirim', { description: err.message })
    }
  }

  const bisaEdit = (e) => ['draft', 'perlu_revisi'].includes(e.rawStatus)
  const bisaHapus = (e) => ['draft', 'perlu_revisi', 'ditolak'].includes(e.rawStatus)
  const bisaKirim = (e) => e.rawStatus === 'draft' || e.rawStatus === 'perlu_revisi'

  const columns = useMemo(() => [
    {
      key: 'kegiatan',
      label: 'NAMA KEGIATAN',
      render: (row) => (
        <div>
          <p className="font-medium text-[#222]">{row.kegiatan}</p>
          <p className="mt-0.5 text-xs text-[#9aa0a6]">⏱ {row.submitted}</p>
        </div>
      ),
    },
    { key: 'kategori', label: 'KATEGORI' },
    { key: 'skala', label: 'SKALA' },
    { key: 'tanggal', label: 'TANGGAL' },
    { key: 'peserta', label: 'PESERTA' },
    {
      key: 'poin',
      label: 'POIN',
      render: (row) => <span>{row.poin ?? '–'}</span>,
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[row.status] ?? ''}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {row.status}
        </span>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      stopPropagation: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          {bisaKirim(row) && (
            <button
              type="button"
              onClick={() => setKirimTarget(row)}
              className="rounded-lg bg-brand-dark px-2.5 py-1 text-xs font-semibold text-white hover:opacity-90"
            >
              {row.rawStatus === 'perlu_revisi' ? 'Ajukan Ulang' : 'Kirim'}
            </button>
          )}
          {bisaEdit(row) && (
            <button
              type="button"
              onClick={() => navigate(`/admin_fakultas/buat-event?edit=${row.id}`)}
              className="rounded-lg border border-brand-dark p-1.5 text-brand-dark transition hover:bg-brand-dark hover:text-white"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {bisaHapus(row) && (
            <button
              type="button"
              onClick={() => setDeleteId(row.id)}
              className="rounded-lg border border-red-400 p-1.5 text-red-500 transition hover:bg-red-500 hover:text-white"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ], [navigate])

  return (
    <DashboardLayout role="admin_fakultas" userName={user?.nama || 'Admin Fakultas'} userRole="Admin Fakultas">
      <ConfirmModal
        isOpen={deleteId !== null}
        message="Apakah kamu yakin ingin menghapus event ini?"
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
      <ConfirmModal
        isOpen={!!kirimTarget}
        message="Setelah dikirim, kegiatan tidak dapat diedit. Lanjutkan?"
        confirmText={kirimTarget?.rawStatus === 'perlu_revisi' ? 'Ya, Ajukan Ulang' : 'Ya, Kirim'}
        cancelText="Batal"
        onConfirm={handleKirim}
        onCancel={() => setKirimTarget(null)}
      />

      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-extrabold text-brand-dark sm:text-2xl lg:text-3xl">
            Manejemen Event Fakultas
          </h2>
          <button
            type="button"
            onClick={() => navigate('/admin_fakultas/buat-event')}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 sm:w-auto"
          >
            <Plus className="h-4 w-4" /> Buat event
          </button>
        </div>

        <p className="text-sm text-[#616161]">Event yang telah di buat</p>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0a6]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari mahasiswa atau kegiatan..."
              className="w-full rounded-lg border border-[#d1d5db] py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-dark"
            />
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            <Filter className="h-4 w-4" /> Filter
          </button>
          <select
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            className="rounded-lg border border-[#d9dce7] bg-white px-3 py-2 text-sm text-[#444] outline-none"
          >
            <option value="">Kategori</option>
            {[...new Set(data.map((d) => d.kategori))].map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-[#d9dce7] bg-white px-3 py-2 text-sm text-[#444] outline-none"
          >
            <option value="">Status</option>
            <option value="Draft">Draft</option>
            <option value="Pending">Pending</option>
            <option value="Disetujui Pimpinan">Disetujui Pimpinan</option>
            <option value="Ditolak">Ditolak</option>
            <option value="Revisi">Revisi</option>
          </select>
          <select
            value={filterSkala}
            onChange={(e) => setFilterSkala(e.target.value)}
            className="rounded-lg border border-[#d9dce7] bg-white px-3 py-2 text-sm text-[#444] outline-none"
          >
            <option value="">Skala</option>
            {[...new Set(data.map((d) => d.skala))].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={resetFilter}
            className="rounded-lg border border-[#d9dce7] bg-white px-3 py-2 text-sm text-[#616161] hover:bg-[#f5f5f5]"
          >
            Reset filter
          </button>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          emptyText="Tidak ada event ditemukan."
        />
      </div>
    </DashboardLayout>
  )
}

export default ManajemenEvent
