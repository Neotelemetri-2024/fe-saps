import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Eye, Search } from 'lucide-react'
import StatusBadge from '../../components/dashboard/StatusBadge'
import DataTable from '../../components/dashboard/DataTable'
import KegiatanCell from '../../components/dashboard/KegiatanCell'
import MahasiswaIdentityCell from '../../components/dashboard/MahasiswaIdentityCell'
import ConfirmModal from '../../components/ui/ConfirmModal'
import ActionMenu from '../../components/ui/ActionMenu'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import { getCurrentUser } from '../../services/authService'
import { getKlaimEksternal, validasiBulk } from '../../services/poinService'
import { subscribeDataUpdate } from '../../services/pengajuanService'
import { statusOptionsFromRows } from '../../utils/statusFilter'
import { batalBtnClass } from '../../components/ui/buttonStyles'

const PAGE_SIZE = 10

function mapStatus(status) {
  const s = String(status || '').toLowerCase()
  if (['menunggu_validasi', 'pending', 'menunggu_pimpinan'].includes(s)) return 'pending'
  if (['perlu_revisi', 'revisi'].includes(s)) return 'revisi'
  if (['disetujui'].includes(s)) return 'disetujui'
  if (['ditolak'].includes(s)) return 'ditolak'
  return s || 'pending'
}

function formatTanggal(value) {
  if (!value) return '-'
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '-'
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return '-' }
}

function normalizeItem(item) {
  const part = item.partisipasi || {}
  const kegiatan = part.kegiatan || {}
  const mahasiswa = part.mahasiswa || {}
  return {
    id: String(item.id),
    mahasiswa: mahasiswa.user?.nama || item.namaMahasiswa || '-',
    nim: mahasiswa.nim || item.nim || '-',
    prodi: mahasiswa.prodi?.nama || item.prodi || '-',
    kegiatan: kegiatan.nama || item.namaKegiatan || '-',
    kategori: kegiatan.kategori?.nama || item.kategori || '-',
    peran: item.peranUsulan?.nama || part.peranVerif?.nama || item.peran || '-',
    skala: kegiatan.skala?.nama || item.skala || '-',
    tanggal: formatTanggal(item.createdAt || kegiatan.tanggalMulai),
    status: mapStatus(item.status),
    statusRaw: item.status,
  }
}

function ValidasiKlaimPoin() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [kategori, setKategori] = useState('')
  const [status, setStatus] = useState('')
  const [skala, setSkala] = useState('')
  const [page, setPage] = useState(1)
  const [pilihanMode, setPilihanMode] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    getKlaimEksternal({ status: 'semua', limit: 100 })
      .then((data) => setItems(Array.isArray(data) ? data.map(normalizeItem) : []))
      .catch((err) => {
        setItems([])
        toast.error('Gagal memuat data klaim', { description: err.message })
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    return subscribeDataUpdate((detail) => {
      if (!detail?.type || detail.type === 'klaim') load()
    })
  }, [])

  const kategoriOptions = useMemo(() => [...new Set(items.map((i) => i.kategori).filter(Boolean))], [items])
  const statusOptions = useMemo(() => statusOptionsFromRows(items, 'status'), [items])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((item) => {
      if (status && item.status !== status) return false
      if (kategori && item.kategori !== kategori) return false
      if (skala && String(item.skala).toLowerCase() !== skala.toLowerCase()) return false
      if (!q) return true
      return (
        (item.mahasiswa || '').toLowerCase().includes(q) ||
        (item.nim || '').toLowerCase().includes(q) ||
        (item.kegiatan || '').toLowerCase().includes(q)
      )
    })
  }, [items, search, kategori, status, skala])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageItems = filtered.slice(start, start + PAGE_SIZE)

  const isSelectableRow = (row) => row.status === 'pending'

  const toggleSelect = (id) => {
    const row = pageItems.find((i) => i.id === id)
    if (row && !isSelectableRow(row)) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectablePageItems = pageItems.filter(isSelectableRow)
  const allPageSelected = selectablePageItems.length > 0 && selectablePageItems.every((i) => selected.has(i.id))

  const centangSemua = () => {
    if (allPageSelected) setSelected(new Set())
    else setSelected(new Set(selectablePageItems.map((i) => i.id)))
  }

  const handleBulkConfirm = async () => {
    setSubmitting(true)
    try {
      await validasiBulk([...selected], 'disetujui')
      toast.success(`${selected.size} klaim poin berhasil disetujui.`)
      setSelected(new Set())
      setPilihanMode(false)
      setShowBulkConfirm(false)
      load()
    } catch (err) {
      toast.error('Gagal', { description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const columns = useMemo(() => [
    { key: 'no', label: 'No', render: (row) => <span className="text-base-content">{start + pageItems.indexOf(row) + 1}</span> },
    { key: 'mahasiswa', label: 'Mahasiswa', render: (row) => (
      <MahasiswaIdentityCell nama={row.mahasiswa} nim={row.nim} prodi={row.prodi} />
    )},
    { key: 'kegiatan', label: 'Kegiatan', render: (row) => <KegiatanCell nama={row.kegiatan} tanggal={row.tanggal} /> },
    { key: 'kategori', label: 'Kategori', render: (row) => <span className="text-base-content">{row.kategori}</span> },
    { key: 'peran', label: 'Peran', render: (row) => <span className="text-base-content">{row.peran}</span> },
    { key: 'skala', label: 'Skala', render: (row) => <span className="text-base-content">{row.skala}</span> },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'aksi', label: 'Aksi', stopPropagation: true, render: (row) => (
      <ActionMenu items={[{
        label: 'Detail & Validasi',
        icon: <Eye className="h-4 w-4" />,
        color: 'text-blue-600',
        onClick: () => navigate(`/pimpinan_ditmawa/verifikasi-klaim/${row.id}`, { state: { item: row } }),
      }]} />
    )},
  ], [pageItems, start, navigate])

  const resetFilter = () => {
    setSearch(''); setKategori(''); setStatus(''); setSkala(''); setPage(1)
  }

  return (
      <>
      <ConfirmModal
        isOpen={showBulkConfirm}
        message={`${selected.size} klaim poin akan disetujui.`}
        confirmText={submitting ? 'Memproses...' : 'YA, SETUJUI'}
        cancelText="BATAL"
        onConfirm={handleBulkConfirm}
        onCancel={() => setShowBulkConfirm(false)}
      />

      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-extrabold text-base-content sm:text-3xl">Validasi Klaim Poin</h2>
          <p className="mt-1 text-sm text-base-content/60">Daftar klaim poin kegiatan eksternal yang menunggu validasi pimpinan.</p>
        </div>

        <TableCard title="Daftar Klaim Poin">
          <div className="space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="flex flex-1 items-center gap-3 rounded-lg border border-base-300 bg-base-100 px-4 py-2.5 shadow-sm">
                <Search className="h-4 w-4 shrink-0 text-base-content/50" />
                <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  placeholder="Cari mahasiswa atau kegiatan..."
                  className="w-full text-sm outline-none" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select value={kategori} onChange={(e) => { setKategori(e.target.value); setPage(1) }}
                className="select select-sm flex-1">
                <option value="">Semua Kategori</option>
                {kategoriOptions.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
              <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}
                className="select select-sm flex-1">
                <option value="">Semua Status</option>
                {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <select value={skala} onChange={(e) => { setSkala(e.target.value); setPage(1) }}
                className="select select-sm flex-1">
                <option value="">Semua Skala</option>
                <option value="nasional">Nasional</option>
                <option value="internasional">Internasional</option>
              </select>
              {(search || kategori || status || skala) && (
                <button type="button" onClick={resetFilter}
                  className="rounded-lg border border-brand-dark bg-base-100 px-4 py-2 text-sm font-medium text-brand-dark outline-none transition hover:bg-base-200">
                  Reset filter
                </button>
              )}
              <button type="button"
                onClick={() => { setPilihanMode((v) => !v); setSelected(new Set()) }}
                className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
                  pilihanMode
                    ? 'border-brand-dark bg-brand-dark text-white'
                    : 'btn btn-primary'
                }`}>
                Pilih Beberapa
              </button>
            </div>
            {pilihanMode && (
              <div className="flex items-center gap-3 rounded-lg border border-base-300 bg-base-200 px-4 py-3">
                <span className="text-sm text-base-content/60">{selected.size} dipilih</span>
                <div className="ml-auto flex gap-2">
                  <button type="button" onClick={() => { setPilihanMode(false); setSelected(new Set()) }} className={batalBtnClass}>
                    Batal Pilih
                  </button>
                  <button type="button"
                    onClick={() => { if (selected.size === 0) { toast.error('Pilih minimal satu.'); return }; setShowBulkConfirm(true) }}
                    className="btn btn-primary px-6 py-2 text-sm font-bold text-white transition hover:opacity-90">
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>
          <TableFrame>
            <DataTable
              loading={loading}
              data={pageItems}
              emptyText="Tidak ada klaim poin menunggu validasi."
              selectable={pilihanMode}
              selected={selected}
              onSelect={toggleSelect}
              onSelectAll={centangSemua}
              isSelectable={isSelectableRow}
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
              columns={columns}
            />
          </TableFrame>
        </TableCard>
      </div>
      </>
  )
}

export default ValidasiKlaimPoin
