import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Eye } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import ProgressBar from '../../components/dashboard/ProgressBar'
import StatusBadge from '../../components/dashboard/StatusBadge'
import ActionMenu from '../../components/ui/ActionMenu'
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
            totalPoin: item.totalPoin ?? item.poin ?? 0,
            totalPoinProgres: item.totalPoinProgres ?? item.totalPoin ?? item.poin ?? 0,
            totalTarget: item.totalTarget ?? 200,
            isLulus: item.isLulus ?? false,
            statusKelulusan: item.statusKelulusan,
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
    { key: 'no', label: 'No' },
    { key: 'mahasiswa', label: 'Mahasiswa' },
    { key: 'nim', label: 'NIM' },
    { key: 'ipk', label: 'IPK' },
    {
      key: 'capaian',
      label: 'Capaian',
      render: (row) => (
        <div className="min-w-28">
          <ProgressBar value={row.capaian} max={100} height={6} showPercent />
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: () => <StatusBadge status="perlu_perhatian" />,
    },
    {
      key: 'aksi',
      label: 'Aksi',
      stopPropagation: true,
      render: (row) => (
        <ActionMenu
          items={[
            {
              label: 'Detail',
              icon: <Eye className="h-4 w-4" />,
              onClick: () => navigate(`/dosen/lihat-detail/${row.mahasiswaId || row.nim}`, {
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
              }),
            },
          ]}
        />
      ),
    },
  ], [navigate])

  return (
    <DashboardLayout role="dosen" userName={user?.nama || 'Dosen Pembimbing'} userRole="Dosen Pembimbing">
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-extrabold text-base-content">Mahasiswa perlu perhatian</h2>
            <p className="mt-1 text-sm text-base-content/60">{filtered.length} mahasiswa</p>
          </div>

          <TableCard title="Daftar mahasiswa">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="input input-sm flex-1">
                <Search className="h-4 w-4 shrink-0 opacity-50" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama atau NIM"
                />
              </label>
              <select
                value={filterProdi}
                onChange={(e) => setFilterProdi(e.target.value)}
                className="select select-sm sm:w-56"
              >
                <option value="">Semua prodi</option>
                {prodiOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {(search || filterProdi) ? (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setFilterProdi('') }}
                  className="btn btn-ghost btn-sm"
                >
                  Reset
                </button>
              ) : null}
            </div>
            <TableFrame>
              <DataTable
                columns={columns}
                data={filtered}
                loading={loading}
                emptyText="Tidak ada mahasiswa perlu perhatian."
                pageSize={15}
              />
            </TableFrame>
          </TableCard>
        </div>
    </DashboardLayout>
  )
}

export default MahasiswaPerluPerhatian
