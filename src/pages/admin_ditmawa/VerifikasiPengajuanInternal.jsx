import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Clock, Eye, Search } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import DataTable from '../../components/dashboard/DataTable'
import KegiatanCell from '../../components/dashboard/KegiatanCell'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import ConfirmModal from '../../components/ui/ConfirmModal'
import ActionMenu from '../../components/ui/ActionMenu'
import { getCurrentUser } from '../../services/authService'
import { getKegiatanVerifikasi, verifikasiBulk } from '../../services/kegiatanService'

const PAGE_SIZE = 10

function mapStatus(status) {
  const s = String(status || '').toLowerCase()
  if (['diajukan', 'pending'].includes(s)) return 'pending'
  if (['terverifikasi'].includes(s)) return 'diteruskan'
  if (['disetujui', 'terpublikasi'].includes(s)) return 'disetujui'
  if (['ditolak'].includes(s)) return 'ditolak'
  if (['perlu_revisi', 'revisi'].includes(s)) return 'revisi'
  return s || 'pending'
}

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

function normalizeItem(item) {
  return {
    id: item.id,
    namaMahasiswa: item.organisasi?.nama || item.pembuat?.nama || item.namaOrganisasi || '-',
    nim: item.organisasi?.tipe || '',
    prodi: item.pembuat?.nama || '',
    kegiatan: item.nama || item.kegiatan || '-',
    kategori: item.kategori?.nama || item.kategori || item.jenis || '-',
    tanggal: formatTanggal(item.tanggalMulai, item.tanggalSelesai),
    status: mapStatus(item.status),
    rawStatus: item.status,
    diajukanPada: item.createdAt
      ? new Date(item.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      : item.diajukanPada || '-',
    skala: item.skala?.nama || item.skala || '-',
  }
}

function VerifikasiPengajuanInternal() {
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

  const load = () => {
    setLoading(true)
    getKegiatanVerifikasi({ limit: 50, asal: 'kurikuler_ukm' })
      .then((data) => setItems(Array.isArray(data) ? data.map(normalizeItem) : []))
      .catch((err) => {
        setItems([])
        toast.error('Gagal memuat data', { description: err.message })
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((item) => {
      if (status && item.status !== status) return false
      if (kategori && item.kategori !== kategori) return false
      if (skala && String(item.skala).toLowerCase() !== skala.toLowerCase()) return false
      if (!q) return true
      return (
        (item.namaMahasiswa || '').toLowerCase().includes(q) ||
        (item.nim || '').toLowerCase().includes(q) ||
        (item.kegiatan || '').toLowerCase().includes(q) ||
        (item.kategori || '').toLowerCase().includes(q)
      )
    })
  }, [items, search, kategori, status, skala])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageItems = filtered.slice(start, start + PAGE_SIZE)
  const resetFilter = () => {
    setSearch(''); setKategori(''); setStatus(''); setSkala(''); setPage(1)
  }

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const columns = useMemo(() => [
    { key: 'no', label: 'No', render: (row) => <span className="text-[#616161]">{start + pageItems.indexOf(row) + 1}</span> },
    { key: 'organisasi', label: 'Organisasi', render: (row) => (
      <div className="flex flex-col gap-0.5">
        <p className="font-bold uppercase text-[#333]">{row.namaMahasiswa}</p>
        {row.nim && <p className="text-sm font-medium text-orange-500">{row.nim}</p>}
        {row.prodi && <p className="text-sm text-sky-500">{row.prodi}</p>}
      </div>
    )},
    { key: 'kegiatan', label: 'Kegiatan', render: (row) => <KegiatanCell nama={row.kegiatan} tanggal={row.diajukanPada} /> },
    { key: 'kategori', label: 'Kategori', render: (row) => <span className="text-[#616161]">{row.kategori}</span> },
    { key: 'skala', label: 'Skala', render: (row) => <span className="text-[#616161]">{row.skala}</span> },
    { key: 'tanggal', label: 'Tanggal', render: (row) => <span className="text-[#616161]">{row.tanggal}</span> },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'aksi', label: 'Aksi', stopPropagation: true, render: (row) => (
      <ActionMenu
        items={[
          {
            label: 'Detail',
            icon: <Eye className="h-4 w-4" />,
            color: 'text-blue-600',
            onClick: () => navigate(`/admin_ditmawa/verifikasi-pengajuan-internal/${row.id}`, { state: { item: row } }),
          },
        ]}
      />
    )},
  ], [pageItems, start, navigate])

  const allPageSelected = pageItems.length > 0 && pageItems.every((i) => selected.has(i.id))

  const centangSemua = () => {
    if (allPageSelected) setSelected(new Set())
    else setSelected(new Set(pageItems.map((i) => i.id)))
  }

  const handleBulkConfirm = async () => {
    try {
      await verifikasiBulk(Array.from(selected), 'setuju')
      toast.success(`${selected.size} pengajuan internal disetujui dan diteruskan ke Pimpinan.`)
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
    <DashboardLayout
      role="admin_ditmawa"
      userName={user?.nama || 'Admin Ditmawa'}
      userRole="Admin Ditmawa"
    >
      <ConfirmModal
        isOpen={showBulkConfirm}
        message={`Apakah Anda yakin ingin menyetujui ${selected.size} pengajuan ini dan meneruskannya ke Pimpinan Ditmawa?`}
        confirmText="TERUSKAN KE PIMPINAN"
        cancelText="BATAL"
        onConfirm={handleBulkConfirm}
        onCancel={() => setShowBulkConfirm(false)}
      />

      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-extrabold text-[#222] sm:text-3xl">
            Verifikasi Pengajuan Kegiatan Internal
          </h2>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#cfd6df] bg-white px-4 py-2.5 shadow-sm">
              <Search className="h-4 w-4 shrink-0 text-[#9aa0a6]" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Cari penyelenggara atau kegiatan..."
                className="w-full text-sm outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select value={kategori} onChange={(e) => { setKategori(e.target.value); setPage(1) }}
              className="rounded-lg border border-[#d9dce7] bg-white px-4 py-2.5 text-sm text-[#616161] outline-none">
              <option value="">Semua Kategori</option>
              {[...new Set(items.map((i) => i.kategori).filter(Boolean))].map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}
              className="rounded-lg border border-[#d9dce7] bg-white px-4 py-2.5 text-sm text-[#616161] outline-none">
              <option value="">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="diteruskan">Diteruskan</option>
              <option value="ditolak">Ditolak</option>
              <option value="revisi">Revisi</option>
            </select>
            <select value={skala} onChange={(e) => { setSkala(e.target.value); setPage(1) }}
              className="rounded-lg border border-[#d9dce7] bg-white px-4 py-2.5 text-sm text-[#616161] outline-none">
              <option value="">Semua Skala</option>
              <option value="nasional">Nasional</option>
              <option value="internasional">Internasional</option>
              <option value="regional">Regional</option>
              <option value="universitas">Universitas</option>
            </select>
            {(search || kategori || status || skala) && (
              <button type="button" onClick={resetFilter}
                className="rounded-lg border border-brand-dark bg-white px-4 py-2 text-sm font-medium text-brand-dark outline-none transition hover:bg-[#f5f6f8]">
                Reset filter
              </button>
            )}
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
                <button type="button" onClick={() => { if (selected.size === 0) { toast.error('Pilih minimal satu.'); return }; setShowBulkConfirm(true) }}
                  className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-6 py-2 text-sm font-bold text-white transition hover:opacity-90">
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>

        <TableCard title="Daftar Pengajuan Internal" description="Pengajuan kegiatan internal oleh mahasiswa.">
          <TableFrame>
            <DataTable
              columns={columns}
              data={pageItems}
              loading={loading}
              emptyText="Belum ada pengajuan internal."
              selectable={pilihanMode}
              selected={selected}
              onSelect={toggleSelect}
              onSelectAll={centangSemua}
              page={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </TableFrame>
        </TableCard>
      </div>
    </DashboardLayout>
  )
}

export default VerifikasiPengajuanInternal
