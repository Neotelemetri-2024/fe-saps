import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Send, RefreshCw, Users } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import ConfirmModal from '../../components/ui/ConfirmModal'
import EventForm from '../../components/EventForm'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
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

const STATUS_PENDAFTARAN = {
  belum: { label: 'belum terdaftar', bg: 'bg-[#f5f5f5]', text: 'text-[#616161]' },
  sudah: { label: 'sudah terdaftar', bg: 'bg-green-100', text: 'text-green-700' },
}

const PAGE_SIZE = 10

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
  const pesertaCount = item._count?.partisipasi ?? 0
  return {
    id: item.id,
    kegiatan: item.nama || '-',
    submitted: item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
    kategori: item.kategori?.nama || '-',
    skala: item.skala?.nama || '-',
    tanggal: formatTanggal(item.tanggalMulai, item.tanggalSelesai),
    peserta: pesertaCount || item.kuota || '-',
    poin: item.poin ?? null,
    status: mapStatusLabel(item.status),
    rawStatus,
    statusPendaftaran: pesertaCount > 0 ? 'sudah' : 'belum',
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
  const [filterPendaftaran, setFilterPendaftaran] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [kirimTarget, setKirimTarget] = useState(null)
  const [mode, setMode] = useState('list') // 'list' | 'create' | 'edit'
  const [editTarget, setEditTarget] = useState(null)
  const [page, setPage] = useState(1)

  const load = () => {
    setLoading(true)
    getKegiatan()
      .then((res) => {
        const list = Array.isArray(res) ? res : []
        // Hanya event yang dibuat langsung oleh Admin Fakultas
        // (asal kurikuler_ukmf tanpa organisasi). Kegiatan yang diajukan
        // oleh operator UKMF tidak tampil di sini.
        const eventAdmin = list.filter((item) => {
          const asal = String(item.asal || '').toLowerCase()
          return asal === 'kurikuler_ukmf' && !item.organisasiId
        })
        setData(eventAdmin.map(normalizeEvent))
      })
      .catch((err) => {
        setData([])
        toast.error('Gagal memuat event', { description: err.message })
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.filter((e) => {
      if (q && !e.kegiatan.toLowerCase().includes(q)) return false
      if (filterKategori && e.kategori !== filterKategori) return false
      if (filterStatus && e.status !== filterStatus) return false
      if (filterSkala && e.skala !== filterSkala) return false
      if (filterPendaftaran && e.statusPendaftaran !== filterPendaftaran) return false
      return true
    })
  }, [data, search, filterKategori, filterStatus, filterSkala, filterPendaftaran])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageItems = filtered.slice(start, start + PAGE_SIZE)

  const resetFilter = () => {
    setSearch('')
    setFilterKategori('')
    setFilterStatus('')
    setFilterSkala('')
    setFilterPendaftaran('')
    setPage(1)
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
  const bisaPeserta = (e) => ['disetujui', 'terpublikasi'].includes(e.rawStatus)

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
    { key: 'kategori', label: 'KATEGORI', render: (row) => <span className="text-[#616161]">{row.kategori}</span> },
    { key: 'skala', label: 'SKALA', render: (row) => <span className="text-[#616161]">{row.skala}</span> },
    { key: 'tanggal', label: 'TANGGAL', render: (row) => <span className="text-[#616161]">{row.tanggal}</span> },
    { key: 'peserta', label: 'PESERTA', render: (row) => <span className="text-[#616161]">{row.peserta}</span> },
    {
      key: 'poin',
      label: 'POIN',
      render: (row) => <span className="text-[#616161]">{row.poin ?? '–'}</span>,
    },
    {
      key: 'pendaftaran', label: 'PENDAFTARAN',
      render: (row) => {
        const pendaftaran = STATUS_PENDAFTARAN[row.statusPendaftaran] || STATUS_PENDAFTARAN.belum
        return (
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${pendaftaran.bg} ${pendaftaran.text}`}>
            {pendaftaran.label}
          </span>
        )
      },
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[row.status] ?? ''}`}>
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
          {bisaKirim(row) ? (
            <button
              type="button"
              onClick={() => setKirimTarget(row)}
              disabled={!bisaKirim(row)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition hover:text-white disabled:opacity-40 disabled:cursor-not-allowed ${
                row.rawStatus === 'perlu_revisi'
                  ? 'border-amber-400 bg-amber-50 text-amber-600 hover:bg-amber-500'
                  : 'border-brand-dark bg-[#eaf5ec] text-brand-dark hover:bg-brand-dark'
              }`}
              title={row.rawStatus === 'perlu_revisi' ? 'Ajukan Ulang' : 'Kirim'}
            >
              {row.rawStatus === 'perlu_revisi' ? <RefreshCw className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            </button>
          ) : null}
          <button
              type="button"
              onClick={() => navigate(`/admin_fakultas/manajemen-event/${row.id}/peserta`)}
              disabled={!bisaPeserta(row)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-400 bg-blue-50 text-blue-600 transition hover:bg-blue-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              title="Manajemen Peserta"
            >
              <Users className="h-4 w-4" />
            </button>
          <button
              type="button"
              onClick={() => { setEditTarget(row); setMode('edit') }}
              disabled={!bisaEdit(row)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-yellow-400 bg-amber-50 text-yellow-600 transition hover:bg-yellow-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
          <button
              type="button"
              onClick={() => setDeleteId(row.id)}
              disabled={!bisaHapus(row)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-400 bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              title="Hapus"
            >
              <Trash2 className="h-4 w-4" />
            </button>
        </div>
      ),
    },
  ], [navigate, bisaKirim, bisaEdit, bisaHapus, bisaPeserta])

  if (mode === 'create' || mode === 'edit') {
    return (
      <DashboardLayout role="admin_fakultas" userName={user?.nama || 'Admin Fakultas'} userRole="Admin Fakultas">
        <EventForm
          editItem={mode === 'edit' ? editTarget : null}
          asal="kurikuler_ukmf"
          onCancel={() => { setMode('list'); setEditTarget(null) }}
          onSaved={() => { setMode('list'); setEditTarget(null); load() }}
        />
      </DashboardLayout>
    )
  }

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
          <div>
            <h2 className="text-xl font-extrabold text-brand-dark sm:text-2xl lg:text-3xl">Event Fakultas</h2>
            <p className="mt-1 text-sm text-[#616161]">Kelola event yang dibuat Admin Fakultas: buat, kirim, dan verifikasi pendaftaran peserta.</p>
          </div>
          <button
            type="button"
            onClick={() => { setEditTarget(null); setMode('create') }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 sm:w-auto"
          >
            <Plus className="h-4 w-4" /> Buat event
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0a6]" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Cari mahasiswa atau kegiatan..."
              className="w-full rounded-lg border border-[#d1d5db] py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-dark"
            />
          </div>
          <select
            value={filterKategori}
            onChange={(e) => { setFilterKategori(e.target.value); setPage(1) }}
            className="rounded-lg border border-[#d9dce7] bg-white px-3 py-2 text-sm text-[#444] outline-none"
          >
            <option value="">Kategori</option>
            {[...new Set(data.map((d) => d.kategori))].map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
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
            onChange={(e) => { setFilterSkala(e.target.value); setPage(1) }}
            className="rounded-lg border border-[#d9dce7] bg-white px-3 py-2 text-sm text-[#444] outline-none"
          >
            <option value="">Skala</option>
            {[...new Set(data.map((d) => d.skala))].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={filterPendaftaran}
            onChange={(e) => { setFilterPendaftaran(e.target.value); setPage(1) }}
            className="rounded-lg border border-[#d9dce7] bg-white px-3 py-2 text-sm text-[#444] outline-none"
          >
            <option value="">Pendaftaran</option>
            <option value="belum">Belum Terdaftar</option>
            <option value="sudah">Sudah Terdaftar</option>
          </select>
          <button
            type="button"
            onClick={resetFilter}
            className="rounded-lg border border-brand-dark bg-white px-3 py-2 text-sm font-medium text-brand-dark hover:bg-[#f5f5f5]"
          >
            Reset filter
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
          <DataTable
            columns={columns}
            data={pageItems}
            loading={loading}
            emptyText="Tidak ada event ditemukan."
            page={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ManajemenEvent
