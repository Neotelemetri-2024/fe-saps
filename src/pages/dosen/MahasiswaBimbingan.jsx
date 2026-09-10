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

const TARGET_POIN = 550
const PAGE_SIZE = 10

function formatDate(val) {
  if (!val) return '-'
  try {
    const d = new Date(val)
    if (Number.isNaN(d.getTime())) return '-'
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return '-'
  }
}

function statusMahasiswa(m) {
  if (m.isLulus || m.status === 'lulus') return 'lulus'
  if (m.status === 'baik' || m.status === 'on_track') return 'baik'
  if (m.status === 'perlu_perhatian' || (m.capaianPersen != null && m.capaianPersen < 50)) {
    return 'perlu_perhatian'
  }
  return m.status || 'baik'
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
    totalPoinProgres: item.totalPoinProgres ?? item.totalPoin ?? item.poin ?? 0,
    totalTarget: item.totalTarget ?? 200,
    capaianPersen: item.capaianPersen,
    isLulus: item.isLulus ?? false,
    statusKelulusan: item.statusKelulusan,
    status: item.status,
    tanggalInput: formatDate(item.updatedAt) || item.tanggalInput || '-',
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
        <div>
          <h2 className="text-2xl font-extrabold text-base-content">Mahasiswa bimbingan</h2>
          <p className="mt-1 text-sm text-base-content/60">{filtered.length} mahasiswa</p>
        </div>

        <TableCard title="Daftar mahasiswa">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="input input-sm flex-1">
              <Search className="h-4 w-4 shrink-0 opacity-50" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Cari nama atau NIM"
              />
            </label>
            <select
              value={filterProdi}
              onChange={(e) => { setFilterProdi(e.target.value); setPage(1) }}
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
                onClick={() => { setSearch(''); setFilterProdi(''); setPage(1) }}
                className="btn btn-ghost btn-sm"
              >
                Reset
              </button>
            ) : null}
          </div>
          <TableFrame>
            <DataTable
              columns={[
                { key: '_no', label: 'No' },
                {
                  key: 'nama',
                  label: 'Mahasiswa',
                  render: (m) => (
                    <div>
                      <p className="text-base-content">{m.nama}</p>
                      <p className="text-xs text-base-content/60">{m.prodi}</p>
                    </div>
                  ),
                },
                { key: 'nim', label: 'NIM' },
                { key: 'ipk', label: 'IPK' },
                {
                  key: 'capaian',
                  label: 'Capaian',
                  render: (m) => (
                    <div className="min-w-28">
                      <ProgressBar value={Number(m.capaianPersen) || 0} max={100} height={6} showPercent />
                    </div>
                  ),
                },
                {
                  key: 'status',
                  label: 'Status',
                  render: (m) => <StatusBadge status={statusMahasiswa(m)} />,
                },
                {
                  key: 'aksi',
                  label: 'Aksi',
                  stopPropagation: true,
                  render: (m) => (
                    <ActionMenu
                      items={[
                        {
                          label: 'Detail',
                          icon: <Eye className="h-4 w-4" />,
                          onClick: () => navigate(`/dosen/lihat-detail/${m.mahasiswaId || m.nim}`, { state: { mahasiswa: m } }),
                        },
                      ]}
                    />
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