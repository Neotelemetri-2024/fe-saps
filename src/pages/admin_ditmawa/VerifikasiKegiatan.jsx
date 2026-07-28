import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Search, Filter, Clock } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import { getCurrentUser } from '../../services/authService'
import { getKegiatan } from '../../services/kegiatanService'

const STATUS_PENDAFTARAN = {
  belum: { label: 'belum terdaftar', bg: 'bg-[#f5f5f5]', text: 'text-[#616161]' },
  sudah: { label: 'sudah terdaftar', bg: 'bg-green-100', text: 'text-green-700' },
}

const PAGE_SIZE = 10

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
  const pesertaCount = item._count?.partisipasi ?? 0
  return {
    id: item.id,
    nama: item.nama || '-',
    jenis: item.kategori?.nama || item.jenis || '-',
    skala: item.skala?.nama || item.skala || '-',
    tanggal: formatTanggal(item.tanggalMulai, item.tanggalSelesai),
    peserta: pesertaCount || item.kuota || '-',
    poin: item.poin ?? '-',
    statusPendaftaran: pesertaCount > 0 ? 'sudah' : 'belum',
    dibuatPada: item.createdAt
      ? new Date(item.createdAt).toLocaleString('id-ID')
      : '-',
  }
}

function VerifikasiKegiatan() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterJenis, setFilterJenis] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSkala, setFilterSkala] = useState('')
  const [filterTahun, setFilterTahun] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    getKegiatan()
      .then((res) => setData(Array.isArray(res) ? res.map(normalizeItem) : []))
      .catch((err) => {
        setData([])
        toast.error('Gagal memuat kegiatan', { description: err.message })
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.filter((d) => {
      if (filterJenis && d.jenis !== filterJenis) return false
      if (filterStatus && d.statusPendaftaran !== filterStatus) return false
      if (filterSkala && d.skala !== filterSkala) return false
      if (filterTahun && !d.tanggal.includes(filterTahun)) return false
      if (!q) return true
      return d.nama.toLowerCase().includes(q)
    })
  }, [data, search, filterJenis, filterStatus, filterSkala, filterTahun])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageItems = filtered.slice(start, start + PAGE_SIZE)

  const handleManajemenPeserta = (item) => {
    navigate(`/admin_ditmawa/manajemen-peserta-event/${item.id}`, { state: { event: item } })
  }

  const columns = useMemo(() => [
    { key: 'no', label: 'No', render: (row) => <span className="text-[#616161]">{start + pageItems.indexOf(row) + 1}</span> },
    { key: 'nama', label: 'Nama Kegiatan', render: (row) => (
      <div>
        <p className="font-medium text-[#333]">{row.nama}</p>
        <div className="mt-1 flex items-center gap-1 text-xs text-[#9aa0a6]">
          <Clock className="h-3 w-3 shrink-0" />
          <span>{row.dibuatPada}</span>
        </div>
      </div>
    )},
    { key: 'jenis', label: 'Jenis', render: (row) => <span className="text-[#616161]">{row.jenis}</span> },
    { key: 'skala', label: 'Skala', render: (row) => <span className="text-[#616161]">{row.skala}</span> },
    { key: 'tanggal', label: 'Tanggal', render: (row) => <span className="text-[#616161]">{row.tanggal}</span> },
    { key: 'peserta', label: 'Peserta', render: (row) => <span className="text-[#616161]">{row.peserta}</span> },
    { key: 'poin', label: 'Poin', render: (row) => <span className="text-[#616161]">{row.poin}</span> },
    { key: 'status', label: 'Status', render: (row) => {
      const pendaftaran = STATUS_PENDAFTARAN[row.statusPendaftaran] || STATUS_PENDAFTARAN.belum
      return (
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${pendaftaran.bg} ${pendaftaran.text}`}>
          {pendaftaran.label}
        </span>
      )
    }},
    { key: 'aksi', label: 'Aksi', stopPropagation: true, render: (row) => {
      const btnColor = row.statusPendaftaran === 'sudah' ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-500 hover:bg-yellow-600'
      return (
        <button
          type="button"
          onClick={() => handleManajemenPeserta(row)}
          className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold text-white transition ${btnColor}`}
        >
          Manajemen Peserta
        </button>
      )
    }},
  ], [pageItems, start, navigate])

  const resetFilter = () => {
    setSearch('')
    setFilterJenis('')
    setFilterStatus('')
    setFilterSkala('')
    setFilterTahun('')
    setPage(1)
  }

  return (
    <DashboardLayout role="admin_ditmawa" userName={user?.nama || 'Admin Ditmawa'} userRole="Admin Ditmawa">
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-brand-dark">Verifikasi Kegiatan</h2>
          <p className="mt-1 text-sm text-[#616161]">lakukan verifikasi kegiatan terhadap mahasiswa yang mengikuti event yang di buat oleh admin ditmawa</p>
        </div>

        <section>
          <h3 className="mb-3 text-base font-bold text-brand-dark">Event yang telah dibuat</h3>

          <div className="mb-3 flex flex-col gap-3 lg:flex-row">
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
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              <Filter className="h-4 w-4" /> Filter
            </button>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            <select value={filterJenis} onChange={(e) => { setFilterJenis(e.target.value); setPage(1) }}
              className="rounded-lg border border-[#d9dce7] bg-white px-4 py-2 text-sm text-[#616161] outline-none">
              <option value="">Jenis</option>
              {[...new Set(data.map((d) => d.jenis).filter(Boolean))].map((j) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
              className="rounded-lg border border-[#d9dce7] bg-white px-4 py-2 text-sm text-[#616161] outline-none">
              <option value="">Status</option>
              <option value="belum">Belum Terdaftar</option>
              <option value="sudah">Sudah Terdaftar</option>
            </select>
            <select value={filterSkala} onChange={(e) => { setFilterSkala(e.target.value); setPage(1) }}
              className="rounded-lg border border-[#d9dce7] bg-white px-4 py-2 text-sm text-[#616161] outline-none">
              <option value="">Skala</option>
              {[...new Set(data.map((d) => d.skala).filter(Boolean))].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select value={filterTahun} onChange={(e) => { setFilterTahun(e.target.value); setPage(1) }}
              className="rounded-lg border border-[#d9dce7] bg-white px-4 py-2 text-sm text-[#616161] outline-none">
              <option value="">Tahun</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
            <button type="button" onClick={resetFilter}
              className="rounded-lg border border-[#d9dce7] bg-white px-4 py-2 text-sm text-[#616161] transition hover:bg-[#f5f6f8]">
              Reset filter
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
            <DataTable
              columns={columns}
              data={pageItems}
              loading={loading}
              emptyText="Belum ada data kegiatan."
              page={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}

export default VerifikasiKegiatan
