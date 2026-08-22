import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Search, Edit3, Plus, Trash2, Send, RefreshCw, Users } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import EventForm from '../../components/EventForm'
import { getCurrentUser } from '../../services/authService'
import { getKegiatan, deleteKegiatan, ajukanKegiatan } from '../../services/kegiatanService'
import { statusOptionsFromRows } from '../../utils/statusFilter'
import ConfirmModal from '../../components/ui/ConfirmModal'
import ActionMenu from '../../components/ui/ActionMenu'

function HapusEventModal({ event, onClose, onConfirm }) {
  const [namaInput, setNamaInput] = useState('')
  const [skalaInput, setSkalaInput] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#212121]">Apakah anda yakin menghapus kegiatan ini?</h3>
          <button type="button" onClick={onClose} className="text-[#616161] hover:text-[#333] text-xl leading-none">×</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#212121]">Nama Kegiatan</label>
            <input
              type="text"
              value={namaInput}
              onChange={(e) => setNamaInput(e.target.value)}
              placeholder={event?.nama}
              className="mt-1 w-full rounded-lg border border-[#c4c6cf] px-3 py-2 text-sm outline-none focus:border-brand-dark"
            />
          </div>
          <div>
            <label className="block text-sm text-[#212121]">Skala</label>
            <input
              type="text"
              value={skalaInput}
              onChange={(e) => setSkalaInput(e.target.value)}
              placeholder={event?.skala}
              className="mt-1 w-full rounded-lg border border-[#c4c6cf] px-3 py-2 text-sm outline-none focus:border-brand-dark"
            />
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => onConfirm(event)}
            className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
          >
            HAPUS
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#c4c6cf] px-8 py-2.5 text-sm font-semibold text-[#616161] transition hover:bg-[#f5f5f5]"
          >
            BATAL
          </button>
        </div>
      </div>
    </div>
  )
}

const PAGE_SIZE = 10

function mapStatus(status) {
  const s = String(status || '').toLowerCase()
  if (s === 'draft') return 'draft'
  if (['disetujui', 'terpublikasi', 'aktif'].includes(s)) return 'aktif'
  if (['diajukan', 'terverifikasi', 'pending'].includes(s)) return 'pending'
  if (['ditolak'].includes(s)) return 'ditolak'
  if (['perlu_revisi', 'revisi'].includes(s)) return 'revisi'
  return s || 'pending'
}

function formatDate(val) {
  if (!val) return '-'
  try {
    const d = new Date(val)
    if (Number.isNaN(d.getTime())) return '-'
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return '-'
  }
}

function formatTanggal(start, end) {
  if (!start) return '-'
  try {
    const ds = new Date(start)
    if (Number.isNaN(ds.getTime())) return '-'
    const a = ds.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    if (!end) return a
    const de = new Date(end)
    if (Number.isNaN(de.getTime())) return a
    const b = de.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    return `${a} - ${b}`
  } catch {
    return String(start)
  }
}

function normalizeEvent(item) {
  const rawStatus = String(item.status || '').toLowerCase()
  const pesertaCount = item._count?.partisipasi ?? 0
  return {
    id: item.id,
    nama: item.nama || '-',
    jenis: item.kategori?.nama || item.jenis || '-',
    skala: item.skala?.nama || item.skala || '-',
    tanggal: formatTanggal(item.tanggalMulai, item.tanggalSelesai),
    peserta: pesertaCount || item.kuota || '-',
    status: mapStatus(item.status),
    rawStatus,
    dibuatPada: formatDate(item.createdAt),
  }
}

function ManajemenEvent() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterJenis, setFilterJenis] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSkala, setFilterSkala] = useState('')
  const [hapusTarget, setHapusTarget] = useState(null)
  const [kirimTarget, setKirimTarget] = useState(null)
  const [page, setPage] = useState(1)

  // Mode & target edit disimpan di URL (?mode=create|edit&id=..) agar tetap
  // bertahan saat halaman di-refresh, bukan hilang kembali ke daftar.
  const modeParam = searchParams.get('mode')
  const editIdParam = searchParams.get('id')
  const mode = modeParam === 'create' || modeParam === 'edit' ? modeParam : 'list' // 'list' | 'create' | 'edit'
  const editTarget = mode === 'edit' && editIdParam ? { id: Number(editIdParam) } : null

  const goToCreate = () => setSearchParams({ mode: 'create' })
  const goToEdit = (row) => setSearchParams({ mode: 'edit', id: String(row.id) })
  const goToList = () => setSearchParams({})

  const load = () => {
    setLoading(true)
    getKegiatan()
      .then((res) => {
        const list = Array.isArray(res) ? res : []
        // Hanya event yang dibuat langsung oleh Admin Ditmawa (asal universitas).
        // Kegiatan yang diajukan oleh UKM/UKMF/mahasiswa tidak tampil di sini.
        const eventAdmin = list.filter(
          (item) => String(item.asal || '').toLowerCase() === 'universitas'
        )
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
    return data.filter((d) => {
      if (filterJenis && d.jenis !== filterJenis) return false
      if (filterStatus && d.status !== filterStatus) return false
      if (filterSkala && d.skala !== filterSkala) return false
      if (!q) return true
      return d.nama.toLowerCase().includes(q)
    })
  }, [data, search, filterJenis, filterStatus, filterSkala])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageItems = filtered.slice(start, start + PAGE_SIZE)

  const statusOptions = useMemo(() => statusOptionsFromRows(data, 'status'), [data])

  const handleConfirmHapus = async (event) => {
    try {
      await deleteKegiatan(event.id)
      toast.success('Event dihapus.', { description: event.nama })
      setHapusTarget(null)
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

  const bisaEdit = (item) => ['draft', 'perlu_revisi'].includes(item.rawStatus)
  const bisaHapus = (item) => ['draft', 'perlu_revisi', 'ditolak'].includes(item.rawStatus)
  const bisaKirim = (item) => item.rawStatus === 'draft' || item.rawStatus === 'perlu_revisi'
  const bisaPeserta = (item) => ['disetujui', 'terpublikasi'].includes(item.rawStatus)

  const columns = useMemo(() => [
    { key: 'no', label: 'No', render: (row) => <span className="text-black">{start + pageItems.indexOf(row) + 1}</span> },
    { key: 'nama', label: 'Nama Kegiatan', render: (row) => (
      <div>
        <p className="text-black">{row.nama}</p>
        {row.dibuatPada && row.dibuatPada !== '-' && (
          <p className="text-xs text-[#616161]">Diajukan: {row.dibuatPada}</p>
        )}
      </div>
    )},
    { key: 'jenis', label: 'Jenis', render: (row) => <span className="text-black">{row.jenis}</span> },
    { key: 'skala', label: 'Skala', render: (row) => <span className="text-black">{row.skala}</span> },
    { key: 'tanggal', label: 'Tanggal', render: (row) => <span className="text-black">{row.tanggal}</span> },
    { key: 'peserta', label: 'Peserta', center: true, render: (row) => <span className="text-black">{row.peserta}</span> },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'aksi', label: 'Aksi', stopPropagation: true, render: (row) => (
      <ActionMenu
        items={[
          bisaKirim(row)
            ? {
                label: row.rawStatus === 'perlu_revisi' ? 'Ajukan Ulang' : 'Kirim',
                icon: row.rawStatus === 'perlu_revisi' ? <RefreshCw className="h-4 w-4" /> : <Send className="h-4 w-4" />,
                color: row.rawStatus === 'perlu_revisi' ? 'text-amber-600' : 'text-brand-dark',
                onClick: () => setKirimTarget(row),
              }
            : null,
          {
            label: 'Manajemen Peserta',
            icon: <Users className="h-4 w-4" />,
            color: 'text-blue-600',
            disabled: !bisaPeserta(row),
            onClick: () => navigate(`/admin_ditmawa/manajemen-peserta-event/${row.id}`),
          },
          {
            label: 'Edit',
            icon: <Edit3 className="h-4 w-4" />,
            color: 'text-yellow-600',
            disabled: !bisaEdit(row),
            onClick: () => goToEdit(row),
          },
          {
            label: 'Hapus',
            icon: <Trash2 className="h-4 w-4" />,
            color: 'text-red-500',
            disabled: !bisaHapus(row),
            onClick: () => setHapusTarget(row),
          },
        ]}
      />
    )},
  ], [pageItems, start, navigate, bisaKirim, bisaEdit, bisaHapus, bisaPeserta])

  const resetFilter = () => {
    setSearch('')
    setFilterJenis('')
    setFilterStatus('')
    setFilterSkala('')
    setPage(1)
  }

  if (mode === 'create' || mode === 'edit') {
    return (
      <DashboardLayout role="admin_ditmawa" userName={user?.nama || 'Admin Ditmawa'} userRole="Admin Ditmawa">
        <EventForm
          editItem={mode === 'edit' ? editTarget : null}
          onCancel={goToList}
          onSaved={() => { goToList(); load() }}
        />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="admin_ditmawa" userName={user?.nama || 'Admin Ditmawa'} userRole="Admin Ditmawa">
      {hapusTarget && (
        <HapusEventModal
          event={hapusTarget}
          onClose={() => setHapusTarget(null)}
          onConfirm={handleConfirmHapus}
        />
      )}
      <ConfirmModal
        isOpen={!!kirimTarget}
        message="Setelah dikirim, kegiatan tidak dapat diedit. Lanjutkan?"
        confirmText={kirimTarget?.rawStatus === 'perlu_revisi' ? 'Ya, Ajukan Ulang' : 'Ya, Kirim'}
        cancelText="Batal"
        onConfirm={handleKirim}
        onCancel={() => setKirimTarget(null)}
      />

      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#222] sm:text-2xl lg:text-3xl">Event Global</h2>
            <p className="mt-1 text-sm text-[#616161]">Kelola event yang dibuat Admin Ditmawa: buat, kirim, dan verifikasi pendaftaran peserta.</p>
          </div>
          <button
            type="button"
            onClick={goToCreate}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 sm:w-auto"
          >
            <Plus className="h-4 w-4" /> Buat Event
          </button>
        </div>

        <section>
          <TableCard title="Daftar Event Global">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#cfd6df] bg-white px-4 py-2.5 shadow-sm">
                <Search className="h-4 w-4 shrink-0 text-[#9aa0a6]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  placeholder="Cari mahasiswa atau kegiatan..."
                  className="w-full text-sm outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <select value={filterJenis} onChange={(e) => { setFilterJenis(e.target.value); setPage(1) }}
                className="min-w-0 flex-1 rounded-lg border border-[#d9dce7] bg-white px-4 py-2 text-sm text-[#616161] outline-none">
                <option value="">Semua Jenis</option>
                {[...new Set(data.map((d) => d.jenis).filter(Boolean))].map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
              <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
                className="min-w-0 flex-1 rounded-lg border border-[#d9dce7] bg-white px-4 py-2 text-sm text-[#616161] outline-none">
                <option value="">Semua Status</option>
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <select value={filterSkala} onChange={(e) => { setFilterSkala(e.target.value); setPage(1) }}
                className="min-w-0 flex-1 rounded-lg border border-[#d9dce7] bg-white px-4 py-2 text-sm text-[#616161] outline-none">
                <option value="">Semua Skala</option>
                {[...new Set(data.map((d) => d.skala).filter(Boolean))].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {(search || filterJenis || filterStatus || filterSkala) && (
                <button type="button" onClick={resetFilter}
                  className="rounded-lg border border-brand-dark bg-white px-4 py-2 text-sm font-medium text-brand-dark transition hover:bg-[#f5f6f8]">
                  Reset filter
                </button>
              )}
            </div>

            <TableFrame>
              <DataTable
                columns={columns}
                data={pageItems}
                loading={loading}
                emptyText="Belum ada event."
                page={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </TableFrame>
          </TableCard>
        </section>
      </div>
    </DashboardLayout>
  )
}

export default ManajemenEvent
