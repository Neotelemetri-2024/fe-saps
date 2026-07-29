import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Search, Filter } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import { getCurrentUser } from '../../services/authService'
import { getKegiatan } from '../../services/kegiatanService'

const statusStyle = {
  'sudah tercatat': 'bg-green-100 text-green-700 border border-green-300',
  'belum tercatat': 'bg-yellow-100 text-yellow-600 border border-yellow-300',
}

const PAGE_SIZE = 10

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

function normalizeItem(item) {
  const pesertaCount = item._count?.partisipasi ?? item.peserta ?? 0
  return {
    id: item.id,
    kegiatan: item.nama || item.kegiatan || '-',
    submitted: item.createdAt
      ? new Date(item.createdAt).toLocaleString('id-ID')
      : '-',
    kategori: item.kategori?.nama || item.kategori || item.jenis || '-',
    skala: item.skala?.nama || item.skala || '-',
    tanggal: formatTanggal(item.tanggalMulai, item.tanggalSelesai),
    peserta: pesertaCount || item.kuota || 0,
    poin: item.poin ?? '-',
    status: pesertaCount > 0 ? 'sudah tercatat' : 'belum tercatat',
    asal: item.asal || '',
  }
}

function VerifikasiKegiatan() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState('')
  const [filterSkala, setFilterSkala] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    getKegiatan()
      .then((res) => {
        const list = Array.isArray(res) ? res : []
        const filtered = list.filter((item) => {
          const asal = String(item.asal || '').toLowerCase()
          return (
            asal === 'universitas' ||
            asal === 'kurikuler_ukmf' ||
            !item.organisasiId
          )
        })
        setItems(filtered.map(normalizeItem))
      })
      .catch((err) => {
        setItems([])
        toast.error('Gagal memuat kegiatan', { description: err.message })
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((e) => {
      if (q && !e.kegiatan.toLowerCase().includes(q)) return false
      if (filterKategori && e.kategori !== filterKategori) return false
      if (filterSkala && e.skala !== filterSkala) return false
      if (filterStatus && e.status !== filterStatus) return false
      return true
    })
  }, [items, search, filterKategori, filterSkala, filterStatus])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageItems = filtered.slice(start, start + PAGE_SIZE)

  const resetFilter = () => {
    setSearch('')
    setFilterKategori('')
    setFilterSkala('')
    setFilterStatus('')
    setPage(1)
  }

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
    { key: 'poin', label: 'POIN' },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[row.status] ?? ''}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
          {row.status}
        </span>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      stopPropagation: true,
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/admin_fakultas/verifikasi-kegiatan/${row.id}/peserta`)}
          className="rounded-lg bg-yellow-400 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-yellow-500"
        >
          Manajemen Peserta
        </button>
      ),
    },
  ], [navigate])

  return (
    <DashboardLayout
      role="admin_fakultas"
      userName={user?.nama || 'Admin Fakultas'}
      userRole="Admin Fakultas"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-[#222] sm:text-2xl lg:text-3xl">Verifikasi Kegiatan</h2>
          <p className="mt-1 text-sm text-[#616161]">
            lakukan verifikasi kegiatan terhadap mahasiswa yang mengikuti event yang di buat oleh admin Fakultas
          </p>
        </div>

        <p className="text-sm font-medium text-[#333]">Event yang telah dibuat</p>

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
          <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            <Filter className="h-4 w-4" /> Filter
          </button>
          <select
            value={filterKategori}
            onChange={(e) => { setFilterKategori(e.target.value); setPage(1) }}
            className="rounded-lg border border-[#d9dce7] bg-white px-3 py-2 text-sm text-[#444] outline-none"
          >
            <option value="">Kategori</option>
            {[...new Set(items.map((d) => d.kategori))].map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <select
            value={filterSkala}
            onChange={(e) => { setFilterSkala(e.target.value); setPage(1) }}
            className="rounded-lg border border-[#d9dce7] bg-white px-3 py-2 text-sm text-[#444] outline-none"
          >
            <option value="">Skala</option>
            {[...new Set(items.map((d) => d.skala))].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
            className="rounded-lg border border-[#d9dce7] bg-white px-3 py-2 text-sm text-[#444] outline-none"
          >
            <option value="">Status</option>
            <option value="sudah tercatat">Sudah Tercatat</option>
            <option value="belum tercatat">Belum Tercatat</option>
          </select>
          <button
            type="button"
            onClick={resetFilter}
            className="rounded-lg border border-[#d9dce7] bg-white px-3 py-2 text-sm text-[#616161] hover:bg-[#f5f5f5]"
          >
            Reset filter
          </button>
        </div>

        <DataTable
          columns={columns}
          data={pageItems}
          loading={loading}
          emptyText="Tidak ada data ditemukan."
          page={currentPage}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p)}
        />
      </div>
    </DashboardLayout>
  )
}

export default VerifikasiKegiatan
