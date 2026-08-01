import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Clock, Eye } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import { getCurrentUser } from '../../services/authService'
import { get } from '../../services/apiClient'

const TARGET_POIN = 550
const PAGE_SIZE = 10

function CapaianBar({ poin, persen }) {
  const pct = persen != null
    ? Math.min(100, Math.round(Number(persen)))
    : Math.min(100, Math.round((poin / TARGET_POIN) * 100))
  const isLow = pct < 50
  return (
    <div className="flex items-center gap-2">
      <div className="h-2.5 w-28 overflow-hidden rounded-full bg-[#e9ebf8]">
        <div
          className={`h-full rounded-full transition-all ${isLow ? 'bg-red-500' : 'bg-brand-dark'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-[#555]">{pct}%</span>
    </div>
  )
}

function StatusDot({ poin, persen, status }) {
  const pct = persen != null
    ? Math.round(Number(persen))
    : Math.round((poin / TARGET_POIN) * 100)
  const isLow = status === 'perlu_perhatian' || pct < 50
  return (
    <span className={`inline-block h-3.5 w-3.5 rounded-full ${isLow ? 'bg-red-500' : 'bg-emerald-600'}`}></span>
  )
}

function normalizeMahasiswa(item) {
  return {
    mahasiswaId: item.mahasiswaId ?? item.id,
    nama: item.nama || '-',
    nim: item.nim || '-',
    prodi: item.prodi || '-',
    angkatan: item.angkatan || '-',
    ipk: item.ipk ?? '-',
    poin: item.totalPoin ?? item.poin ?? 0,
    capaianPersen: item.capaianPersen,
    status: item.status,
    tanggalInput: item.updatedAt
      ? new Date(item.updatedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      : item.tanggalInput || '-',
  }
}

function MahasiswaBimbingan() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [mahasiswaList, setMahasiswaList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterProdi, setFilterProdi] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    get('/api/dosen/mahasiswa-bimbingan')
      .then((res) => {
        const data = res?.data || res || []
        setMahasiswaList(Array.isArray(data) ? data.map(normalizeMahasiswa) : [])
      })
      .catch((err) => {
        setMahasiswaList([])
        toast.error('Gagal memuat mahasiswa bimbingan', { description: err.message })
      })
      .finally(() => setLoading(false))
  }, [])

  const prodiOptions = useMemo(
    () => [...new Set(mahasiswaList.map((m) => m.prodi).filter((p) => p && p !== '-'))].sort(),
    [mahasiswaList],
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return mahasiswaList.filter((m) => {
      const matchSearch = !q || m.nama.toLowerCase().includes(q) || m.nim.toLowerCase().includes(q)
      const matchProdi = !filterProdi || m.prodi === filterProdi
      return matchSearch && matchProdi
    })
  }, [mahasiswaList, search, filterProdi])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageItems = filtered.slice(start, start + PAGE_SIZE)

  return (
    <DashboardLayout role="dosen" userName={user?.nama || 'Dosen Pembimbing'} userRole="Dosen Pembimbing">
      <div className="space-y-5">
        <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Mahasiswa Bimbingan</h2>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-1 min-w-[180px] items-center gap-2 rounded-lg border border-[#e9ebf8] bg-white px-3 py-2 shadow-sm">
            <Search className="h-4 w-4 shrink-0 text-[#9aa0a6]" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Cari mahasiswa..."
              className="flex-1 text-sm outline-none"
            />
          </div>
          <select
            value={filterProdi}
            onChange={(e) => { setFilterProdi(e.target.value); setPage(1) }}
            className="rounded-lg border border-[#e9ebf8] bg-white px-3 py-2 text-sm text-[#333] shadow-sm outline-none"
          >
            <option value="">Semua Prodi</option>
            {prodiOptions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <TableCard title="Daftar Mahasiswa Bimbingan">
          <TableFrame>
        <DataTable
          columns={[
            {
              key: '_no',
              label: 'No',
            },
            {
              key: 'nama',
              label: 'Mahasiswa',
              render: (m) => (
                <div>
                  <p className="font-bold uppercase text-[#222]">{m.nama}</p>
                  <p className="text-xs font-medium text-sky-600">{m.prodi}</p>
                  {m.tanggalInput && m.tanggalInput !== '-' && (
                    <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[#9aa0a6]">
                      <Clock className="h-3 w-3 shrink-0" /> {m.tanggalInput}
                    </p>
                  )}
                </div>
              ),
            },
            { key: 'nim', label: 'NIM' },
            { key: 'ipk', label: 'IPK' },
            {
              key: 'capaian',
              label: 'Capaian',
              render: (m) => <CapaianBar poin={m.poin} persen={m.capaianPersen} />,
            },
            {
              key: 'status',
              label: 'Status',
              render: (m) => <StatusDot poin={m.poin} persen={m.capaianPersen} status={m.status} />,
            },
            {
              key: 'aksi',
              label: 'Aksi',
              stopPropagation: true,
              render: (m) => (
                <button
                  type="button"
                  title="Detail"
                  onClick={() => navigate(`/dosen/lihat-detail/${m.mahasiswaId || m.nim}`, { state: { mahasiswa: m } })}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-400 bg-blue-50 text-blue-600 transition hover:bg-blue-500 hover:text-white"
                >
                  <Eye className="h-4 w-4" />
                </button>
              ),
            },
          ]}
          data={pageItems.map((m, i) => ({ ...m, _no: start + i + 1 }))}
          loading={loading}
          emptyText="Tidak ada mahasiswa ditemukan."
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
        />
          </TableFrame>
        </TableCard>
      </div>
    </DashboardLayout>
  )
}

export default MahasiswaBimbingan
