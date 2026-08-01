import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Eye, Search } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import DataTable from '../../components/dashboard/DataTable'
import KegiatanCell from '../../components/dashboard/KegiatanCell'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { getKegiatanApproval, approvalBulk } from '../../services/kegiatanService'
import { getKategoriKegiatanValid } from '../../services/matriksService'
import { getCurrentUser } from '../../services/authService'

const PAGE_SIZE = 10

function mapStatus(status) {
  const s = String(status || '').toLowerCase()
  if (['terverifikasi', 'diajukan'].includes(s)) return 'pending'
  if (['perlu_revisi'].includes(s)) return 'revisi'
  if (['terpublikasi'].includes(s)) return 'disetujui'
  return s || 'pending'
}

function normalizeItem(item) {
  return {
    id: item.id,
    kegiatan: item.nama || item.namaKegiatan || item.kegiatan || '-',
    kategori: item.kategori?.nama || item.kategori || item.jenis || '-',
    skala: item.skala?.nama || item.skala || '-',
    tanggal: item.tanggalMulai
      ? new Date(item.tanggalMulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
      : (item.tanggal || '-'),
    status: mapStatus(item.status),
    rawStatus: String(item.status || '').toLowerCase(),
    diajukanPada: item.createdAt
      ? new Date(item.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      : (item.diajukanPada || '-'),
  }
}

function VerifikasiKegiatanInternal() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [kategori, setKategori] = useState('')
  const [kategoriOptions, setKategoriOptions] = useState([])
  const [tahun, setTahun] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const [pilihanMode, setPilihanMode] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)

  const load = () => {
    setLoading(true)
    getKegiatanApproval({ limit: 50, asal: 'internal' })
      .then((data) => setItems(Array.isArray(data) ? data.map(normalizeItem) : []))
      .catch((err) => toast.error('Gagal memuat data', { description: err.message }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    getKategoriKegiatanValid()
      .then((list) => setKategoriOptions(Array.isArray(list) ? list : []))
      .catch(() => setKategoriOptions([]))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((item) => {
      if (status && item.status !== status) return false
      if (kategori && item.kategori !== kategori) return false
      if (tahun && !item.diajukanPada.includes(tahun)) return false
      if (!q) return true
      return (
        (item.kegiatan || '').toLowerCase().includes(q) ||
        (item.kategori || '').toLowerCase().includes(q)
      )
    })
  }, [items, search, kategori, tahun, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageItems = filtered.slice(start, start + PAGE_SIZE)

  const resetFilter = () => {
    setSearch(''); setKategori(''); setTahun(''); setStatus(''); setPage(1)
  }

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const item = items.find((i) => i.id === id)
      if (item && item.rawStatus !== 'terverifikasi') return prev
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const isSelectable = (item) => item.rawStatus === 'terverifikasi'

  const selectablePageItems = pageItems.filter(isSelectable)
  const allPageSelected = selectablePageItems.length > 0 && selectablePageItems.every((i) => selected.has(i.id))

  const centangSemua = () => {
    if (allPageSelected) setSelected(new Set())
    else setSelected(new Set(selectablePageItems.map((i) => i.id)))
  }

  const handleBulkConfirm = async () => {
    try {
      await approvalBulk(Array.from(selected), 'setuju')
      toast.success(`${selected.size} kegiatan internal disetujui.`)
      setSelected(new Set())
      setPilihanMode(false)
      setShowBulkConfirm(false)
      load()
    } catch (err) {
      toast.error('Gagal menyetujui', { description: err.message })
      setShowBulkConfirm(false)
    }
  }

  return (
    <DashboardLayout role="pimpinan_fakultas" userName={user?.nama || 'Pimpinan Fakultas'} userRole="Pimpinan">
      <ConfirmModal
        isOpen={showBulkConfirm}
        message={`Apakah Anda yakin ingin menyetujui ${selected.size} kegiatan internal ini?`}
        confirmText="SETUJUI"
        cancelText="BATAL"
        onConfirm={handleBulkConfirm}
        onCancel={() => setShowBulkConfirm(false)}
      />

      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-extrabold text-[#222] sm:text-3xl">
            Verifikasi Kegiatan Internal
          </h2>
          <p className="mt-1 text-sm text-[#616161]">
            Kegiatan internal yang dibuat Admin Fakultas dan memerlukan persetujuan pimpinan.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#cfd6df] bg-white px-4 py-2.5 shadow-sm">
              <Search className="h-4 w-4 shrink-0 text-[#9aa0a6]" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Cari kegiatan..."
                className="w-full text-sm outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select value={kategori} onChange={(e) => { setKategori(e.target.value); setPage(1) }}
              className="rounded-lg border border-[#d9dce7] bg-white px-4 py-2.5 text-sm text-[#616161] outline-none">
              <option value="">Kategori</option>
              {kategoriOptions.map((k) => (
                <option key={k.id} value={k.nama}>{k.nama}</option>
              ))}
            </select>
            <select value={tahun} onChange={(e) => { setTahun(e.target.value); setPage(1) }}
              className="rounded-lg border border-[#d9dce7] bg-white px-4 py-2.5 text-sm text-[#616161] outline-none">
              <option value="">Tahun</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}
              className="rounded-lg border border-[#d9dce7] bg-white px-4 py-2.5 text-sm text-[#616161] outline-none">
              <option value="">Status</option>
              <option value="pending">Pending</option>
              <option value="disetujui">Disetujui</option>
              <option value="revisi">Perlu Revisi</option>
            </select>
            <button type="button" onClick={resetFilter}
              className="rounded-lg border border-brand-dark bg-white px-4 py-2 text-sm font-medium text-brand-dark outline-none transition hover:bg-[#f5f6f8]">
              Reset filter
            </button>
            <button type="button"
              onClick={() => { setPilihanMode((v) => !v); setSelected(new Set()) }}
              className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
                pilihanMode
                  ? 'border-brand-dark bg-brand-dark text-white'
                  : 'border-brand-dark bg-gradient-to-r from-brand-dark to-brand-light text-white hover:opacity-90'
              }`}>
              Pilih Beberapa
            </button>
          </div>

          {pilihanMode && (
            <div className="flex items-center gap-3 rounded-lg border border-[#e9ebf8] bg-[#f9fafb] px-4 py-3">
              <span className="text-sm text-[#616161]">{selected.size} dipilih</span>
              <div className="ml-auto flex gap-2">
                <button type="button" onClick={() => { setPilihanMode(false); setSelected(new Set()) }}
                  className="rounded-lg border border-[#d9dce7] px-4 py-2 text-sm font-semibold text-[#616161] transition hover:bg-white">
                  Batal Pilih
                </button>
                <button type="button"
                  onClick={() => { if (selected.size === 0) { toast.error('Pilih minimal satu.'); return }; setShowBulkConfirm(true) }}
                  className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-6 py-2 text-sm font-bold text-white transition hover:opacity-90">
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>

        <TableCard title="Daftar Kegiatan Internal">
          <TableFrame>
        <DataTable
          loading={loading}
          data={pageItems}
          emptyText="Belum ada kegiatan internal yang perlu diverifikasi."
          selectable={pilihanMode}
          selected={selected}
          onSelect={toggleSelect}
          onSelectAll={centangSemua}
          isSelectable={isSelectable}
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          columns={[
            { key: 'no', label: 'No', render: (_item, index) => start + index + 1 },
            {
              key: 'kegiatan', label: 'Kegiatan',
              render: (item) => <KegiatanCell nama={item.kegiatan} tanggal={item.diajukanPada} />,
            },
            { key: 'kategori', label: 'Kategori', render: (item) => <span className="text-[#616161]">{item.kategori}</span> },
            { key: 'skala', label: 'Skala' },
            { key: 'tanggal', label: 'Tanggal' },
            { key: 'status', label: 'Status', render: (item) => <StatusBadge status={item.status} /> },
            {
              key: 'aksi', label: 'Aksi', stopPropagation: true,
              render: (item) => pilihanMode ? null : (
                <button type="button"
                  onClick={() => navigate(`/pimpinan_fakultas/verifikasi-kegiatan-internal/${item.id}`, { state: { item } })}
                  title="Detail & Verifikasi"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-400 bg-blue-50 text-blue-600 transition hover:bg-blue-500 hover:text-white">
                  <Eye className="h-4 w-4" />
                </button>
              ),
            },
          ]}
        />
          </TableFrame>
        </TableCard>
      </div>
    </DashboardLayout>
  )
}

export default VerifikasiKegiatanInternal
