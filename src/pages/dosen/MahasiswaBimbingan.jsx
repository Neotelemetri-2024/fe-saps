import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Clock } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
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
    <span className={`inline-block h-3.5 w-3.5 rounded-full ${isLow ? 'bg-red-500' : 'bg-emerald-600'}`} />
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
      ? new Date(item.updatedAt).toLocaleString('id-ID')
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

        <div className="overflow-hidden rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-xs font-semibold uppercase tracking-wide text-white">
                  <th className="px-4 py-3 text-center">NO</th>
                  <th className="px-4 py-3">MAHASISWA</th>
                  <th className="px-4 py-3">NIM</th>
                  <th className="px-4 py-3">IPK</th>
                  <th className="px-4 py-3">CAPAIAN</th>
                  <th className="px-4 py-3 text-center">STATUS</th>
                  <th className="px-4 py-3 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#888]">
                      Memuat data…
                    </td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#888]">
                      Tidak ada mahasiswa ditemukan.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((m, i) => (
                    <tr key={m.mahasiswaId || m.nim} className="border-b border-[#f0f2f8] last:border-0 hover:bg-[#f9fafb]">
                      <td className="px-4 py-3.5 text-center text-[#616161]">{start + i + 1}.</td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold uppercase text-[#222]">{m.nama}</p>
                        <p className="text-xs font-medium text-sky-600">{m.prodi}</p>
                        {m.tanggalInput && m.tanggalInput !== '-' && (
                          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[#9aa0a6]">
                            <Clock className="h-3 w-3 shrink-0" /> {m.tanggalInput}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-[#444]">{m.nim}</td>
                      <td className="px-4 py-3.5 text-[#444]">{m.ipk}</td>
                      <td className="px-4 py-3.5">
                        <CapaianBar poin={m.poin} persen={m.capaianPersen} />
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <StatusDot poin={m.poin} persen={m.capaianPersen} status={m.status} />
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => navigate(`/dosen/lihat-detail/${m.mahasiswaId || m.nim}`, { state: { mahasiswa: m } })}
                          className="text-xs font-semibold text-brand-dark hover:underline"
                        >
                          Lihat Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 border-t border-[#e9ebf8] px-5 py-3 text-xs text-[#616161] sm:flex-row sm:items-center sm:justify-between">
            <span>Showing {filtered.length === 0 ? 0 : start + 1} - {Math.min(start + PAGE_SIZE, filtered.length)} From Total {filtered.length}</span>
            <span>Page {currentPage} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <button type="button" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}
                className="rounded border border-[#e9ebf8] px-2.5 py-1 hover:bg-[#f5f5f5] disabled:opacity-40">Previous</button>
              {Array.from({ length: Math.min(totalPages, 4) }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" onClick={() => setPage(n)}
                  className={`rounded px-2.5 py-1 ${n === currentPage ? 'bg-brand-dark text-white' : 'border border-[#e9ebf8] hover:bg-[#f5f5f5]'}`}>
                  {n}
                </button>
              ))}
              <button type="button" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}
                className="rounded border border-[#e9ebf8] px-2.5 py-1 hover:bg-[#f5f5f5] disabled:opacity-40">Next</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default MahasiswaBimbingan
