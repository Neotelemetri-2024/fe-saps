import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Eye } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import ProgressBar from '../../components/dashboard/ProgressBar'
import { getCurrentUser } from '../../services/authService'
import { get } from '../../services/apiClient'

function MahasiswaPerluPerhatian() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterProdi, setFilterProdi] = useState('')

  useEffect(() => {
    setLoading(true)
    get('/api/dosen/mahasiswa-perlu-perhatian')
      .then((res) => {
        const list = res?.data || res || []
        setData(
          (Array.isArray(list) ? list : []).map((item, i) => ({
            no: i + 1,
            mahasiswaId: item.mahasiswaId ?? item.id,
            mahasiswa: item.nama || item.mahasiswa || '-',
            nim: item.nim || '-',
            ipk: item.ipk ?? '-',
            capaian: item.capaianPersen ?? item.capaian ?? 0,
            status: 'red',
            prodi: item.prodi || '-',
            poin: item.totalPoin ?? item.poin ?? 0,
          })),
        )
      })
      .catch((err) => {
        setData([])
        toast.error('Gagal memuat data', { description: err.message })
      })
      .finally(() => setLoading(false))
  }, [])

  const prodiOptions = useMemo(
    () => [...new Set(data.map((m) => m.prodi).filter((p) => p && p !== '-'))].sort(),
    [data],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.filter((row) => {
      const matchSearch = !q || (row.mahasiswa || '').toLowerCase().includes(q) || (row.nim || '').toLowerCase().includes(q)
      const matchProdi = !filterProdi || row.prodi === filterProdi
      return matchSearch && matchProdi
    })
  }, [data, search, filterProdi])

  const columns = useMemo(() => [
    { key: 'no', label: 'NO', render: (row) => <span className="text-[#616161]">{row.no}</span> },
    { key: 'mahasiswa', label: 'MAHASISWA' },
    { key: 'nim', label: 'NIM' },
    { key: 'ipk', label: 'IPK' },
    {
      key: 'capaian',
      label: 'CAPAIAN',
      render: (row) => (
        <div className="flex items-center gap-2">
          <ProgressBar value={row.capaian} max={100} height={8} color="bg-red-500" />
          <span className="text-sm text-[#616161]">{row.capaian}%</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => (
        <div className={`h-4 w-4 rounded-full ${row.status === 'red' ? 'bg-red-500' : 'bg-green-500'}`} />
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      render: (row) => (
        <button
          type="button"
          title="Detail"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-400 bg-blue-50 text-blue-600 transition hover:bg-blue-500 hover:text-white"
          onClick={() => navigate(`/dosen/lihat-detail/${row.mahasiswaId || row.nim}`, {
            state: {
              mahasiswa: {
                mahasiswaId: row.mahasiswaId,
                nama: row.mahasiswa,
                nim: row.nim,
                prodi: row.prodi,
                ipk: row.ipk,
                poin: row.poin,
                capaianPersen: row.capaian,
              },
            },
          })}
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ], [navigate])

  return (
    <DashboardLayout role="dosen" userName={user?.nama || 'Dosen Pembimbing'} userRole="Dosen Pembimbing">
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-[#222] sm:text-2xl">Mahasiswa yang Perlu Perhatian!</h2>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-1 min-w-[180px] items-center gap-2 rounded-lg border border-[#e9ebf8] bg-white px-3 py-2 shadow-sm">
              <Search className="h-4 w-4 shrink-0 text-[#9aa0a6]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau NIM..."
                className="flex-1 text-sm outline-none"
              />
            </div>
            <select
              value={filterProdi}
              onChange={(e) => setFilterProdi(e.target.value)}
              className="rounded-lg border border-[#e9ebf8] bg-white px-3 py-2 text-sm text-[#333] shadow-sm outline-none"
            >
              <option value="">Semua Prodi</option>
              {prodiOptions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {(search || filterProdi) && (
              <button
                type="button"
                onClick={() => { setSearch(''); setFilterProdi('') }}
                className="rounded-lg border border-brand-dark bg-white px-3 py-2 text-sm font-medium text-brand-dark transition hover:bg-[#f5f5f5]"
              >
                Reset Filter
              </button>
            )}
          </div>

          <TableCard title="Mahasiswa Perlu Perhatian">
            <TableFrame>
              {loading ? (
                <p className="py-8 text-center text-sm text-[#9aa0a6]">Memuat data…</p>
              ) : (
                <>
                  <DataTable columns={columns} data={filtered} />
                  <p className="mt-4 text-sm text-[#616161]">
                    menampilkan {filtered.length === 0 ? 0 : 1} - {filtered.length} dari {data.length} Mahasiswa
                  </p>
                </>
              )}
            </TableFrame>
          </TableCard>
        </div>
    </DashboardLayout>
  )
}

export default MahasiswaPerluPerhatian
