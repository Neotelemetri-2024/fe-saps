import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Clock, Filter, Search } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import DataTable from '../../components/dashboard/DataTable'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { getKegiatanApproval, approvalBulk } from '../../services/kegiatanService'

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
    namaOrganisasi: item.organisasi?.nama || item.namaOrganisasi || item.penyelenggara || '-',
    kegiatan: item.nama || item.namaKegiatan || item.kegiatan || '-',
    kategori: item.kategori?.nama || item.kategori || item.jenis || '-',
    skala: item.skala?.nama || item.skala || '-',
    tanggal: item.tanggalMulai
      ? new Date(item.tanggalMulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
      : (item.tanggal || '-'),
    status: mapStatus(item.status),
    diajukanPada: item.createdAt
      ? new Date(item.createdAt).toLocaleString('id-ID')
      : (item.diajukanPada || '-'),
  }
}

function VerifikasiPengajuanUKM() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [kategori, setKategori] = useState('')
  const [tahun, setTahun] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const [pilihanMode, setPilihanMode] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)

  const load = () => {
    setLoading(true)
    getKegiatanApproval({ limit: 50 })
      .then((data) => setItems(Array.isArray(data) ? data.map(normalizeItem) : []))
      .catch((err) => toast.error('Gagal memuat data', { description: err.message }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((item) => {
      if (status && item.status !== status) return false
      if (kategori && item.kategori !== kategori) return false
      if (!q) return true
      return (
        (item.namaMahasiswa || '').toLowerCase().includes(q) ||
        (item.nim || '').toLowerCase().includes(q) ||
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
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allPageSelected = pageItems.length > 0 && pageItems.every((i) => selected.has(i.id))

  const centangSemua = () => {
    if (allPageSelected) setSelected(new Set())
    else setSelected(new Set(pageItems.map((i) => i.id)))
  }

  const handleBulkConfirm = async () => {
    try {
      await approvalBulk(Array.from(selected), 'setuju')
      toast.success(`${selected.size} pengajuan UKM disetujui.`)
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
    <DashboardLayout role="pimpinan_ditmawa" userName="Dr. Dendi Adi Saputra" userRole="Pimpinan Ditmawa">
      <ConfirmModal
        isOpen={showBulkConfirm}
       
        message={`Apakah Anda yakin ingin menyetujui ${selected.size} pengajuan UKM ini?`}
        confirmText="SETUJUI"
        cancelText="BATAL"
        onConfirm={handleBulkConfirm}
        onCancel={() => setShowBulkConfirm(false)}
      />

      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">
            Verifikasi Pengajuan Kegiatan UKM
          </h2>
          <p className="mt-1 text-sm text-[#616161]">
            Pengajuan kegiatan dari UKM yang memerlukan verifikasi pimpinan.
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
                placeholder="Cari mahasiswa atau kegiatan..."
                className="w-full text-sm outline-none"
              />
            </div>
            <button type="button"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-10 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 sm:w-auto">
              <Filter className="h-4 w-4" /> Filter
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select value={kategori} onChange={(e) => { setKategori(e.target.value); setPage(1) }}
              className="rounded-lg border border-[#d9dce7] bg-white px-4 py-2.5 text-sm text-[#616161] outline-none">
              <option value="">Kategori</option>
              <option value="Kompetisi">Kompetisi</option>
              <option value="Seminar">Seminar</option>
              <option value="Pelatihan">Pelatihan</option>
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
              <option value="ditolak">Ditolak</option>
            </select>
            <button type="button"
              onClick={() => { setPilihanMode((v) => !v); setSelected(new Set()) }}
              className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
                pilihanMode ? 'border-brand-dark bg-brand-dark text-white' : 'border-[#d9dce7] bg-white text-[#616161] hover:bg-[#f5f5f5]'
              }`}>
              Pilih Beberapa
            </button>
            <button type="button" onClick={resetFilter}
              className="rounded-lg border border-[#d9dce7] bg-white px-4 py-2 text-sm text-[#616161] outline-none transition hover:bg-[#f5f6f8]">
              Reset filter
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

        <DataTable
          loading={loading}
          data={pageItems}
          emptyText="Belum ada pengajuan kegiatan UKM."
          selectable={pilihanMode}
          selected={selected}
          onSelect={toggleSelect}
          onSelectAll={centangSemua}
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          columns={[
            { key: 'no', label: 'No', render: (_item, index) => start + index + 1 },
            {
              key: 'organisasi', label: 'Organisasi',
              render: (item) => (
                <div className="flex flex-col gap-0.5">
                  <p className="font-bold uppercase text-[#333]">{item.namaOrganisasi}</p>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>{item.diajukanPada}</span>
                  </div>
                </div>
              ),
            },
            { key: 'kegiatan', label: 'Kegiatan' },
            { key: 'kategori', label: 'Kategori', render: (item) => <span className="text-brand-light">{item.kategori}</span> },
            { key: 'peran', label: 'Peran' },
            { key: 'tanggal', label: 'Tanggal' },
            { key: 'status', label: 'Status', render: (item) => <StatusBadge status={item.status} /> },
            {
              key: 'aksi', label: 'Aksi', stopPropagation: true,
              render: (item) => pilihanMode ? null : (
                <button type="button"
                  onClick={() => navigate(`/pimpinan_ditmawa/verifikasi-pengajuan-ukm/${item.id}`, { state: { item } })}
                  className="whitespace-nowrap rounded-lg border border-brand-dark px-3 py-1.5 text-xs font-semibold text-brand-dark transition hover:bg-brand-dark hover:text-white">
                  Detail dan verifikasi
                </button>
              ),
            },
          ]}
        />
      </div>
    </DashboardLayout>
  )
}

export default VerifikasiPengajuanUKM
