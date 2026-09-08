import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Eye } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import ActionMenu from '../../components/ui/ActionMenu'
import { getCurrentUser } from '../../services/authService'
import { getDashboardPimpinanUtama } from '../../services/dashboardService'
import { getKurikulumAktif } from '../../services/kurikulumService'

const PAGE_SIZE = 10

function pickKategoriValue(kategoriPoin = {}, keys) {
  for (const key of keys) {
    const found = Object.entries(kategoriPoin).find(([k]) => k.toLowerCase().includes(key))
    if (found) return Number(found[1]) || 0
  }
  return 0
}

function KategoriBar({ organisasi, seminar, prestasi }) {
  const total = organisasi + seminar + prestasi || 1
  const pOrg = (organisasi / total) * 100
  const pSem = (seminar / total) * 100
  const pPre = (prestasi / total) * 100
  return (
    <div className="flex h-3 w-full max-w-[160px] overflow-hidden rounded-md bg-base-300">
      <div className="bg-primary" style={{ width: `${pOrg}%` }} title={`Organisasi: ${organisasi}`} />
      <div className="bg-info" style={{ width: `${pSem}%` }} title={`Seminar: ${seminar}`} />
      <div className="bg-warning" style={{ width: `${pPre}%` }} title={`Prestasi: ${prestasi}`} />
    </div>
  )
}

function DetailFakultas() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [fakultasData, setFakultasData] = useState([])
  const [kurikulumId, setKurikulumId] = useState('')
  const [kurikulumOptions, setKurikulumOptions] = useState([])

  useEffect(() => {
    getKurikulumAktif()
      .then((list) => setKurikulumOptions(Array.isArray(list) ? list : []))
      .catch(() => setKurikulumOptions([]))
  }, [])

  useEffect(() => {
    setLoading(true)
    getDashboardPimpinanUtama(kurikulumId || undefined)
      .then((data) => {
        const ranking = data?.peringkatFakultas || []
        setFakultasData(
          (Array.isArray(ranking) ? ranking : []).map((item) => {
            const kp = item.kategoriPoin || {}
            return {
              rank: item.ranking,
              fakultasId: item.fakultasId,
              nama: item.fakultas || '-',
              organisasi: pickKategoriValue(kp, ['organisasi', 'ukm']),
              seminar: pickKategoriValue(kp, ['seminar', 'pelatihan', 'workshop']),
              prestasi: pickKategoriValue(kp, ['prestasi', 'lomba', 'kompetisi']),
              total: item.rataRataCapaian ?? 0,
            }
          }),
        )
      })
      .catch((err) => {
        setFakultasData([])
        toast.error('Gagal memuat data fakultas', { description: err.message })
      })
      .finally(() => setLoading(false))
  }, [kurikulumId])

  const totalPages = Math.max(1, Math.ceil(fakultasData.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageItems = useMemo(
    () => fakultasData.slice(start, start + PAGE_SIZE),
    [fakultasData, start],
  )

  return (
    <DashboardLayout
      role="pimpinan_utama"
      userName={user?.nama || 'Pimpinan Utama'}
      userRole="Pimpinan Utama (Rektor)"
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-base-content">Detail Fakultas</h2>
            <p className="mt-1 text-sm text-base-content/60">
              Peringkat fakultas berdasarkan capaian poin mahasiswa.
            </p>
          </div>
          {kurikulumOptions.length > 0 ? (
            <label className="flex min-w-52 flex-col gap-1">
              <span className="text-xs text-base-content/60">Kurikulum</span>
              <select
                className="select select-sm"
                value={kurikulumId}
                onChange={(e) => {
                  setPage(1)
                  setKurikulumId(e.target.value)
                }}
              >
                <option value="">Semua / campuran</option>
                {kurikulumOptions.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}{k.angkatanMulai ? ` (${k.angkatanMulai}+)` : ''}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-base-content/80">
          <span className="text-xs font-semibold uppercase tracking-wide text-base-content/50">Kategori Poin</span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-primary" /> Organisasi
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-info" /> Seminar
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-warning" /> Prestasi
          </span>
        </div>

        <TableCard title="Peringkat Fakultas">
          <TableFrame>
            <DataTable
              loading={loading}
              data={pageItems}
              emptyText="Belum ada data fakultas."
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
              onRowClick={(item) => navigate(`/pimpinan_utama/detail-fakultas/${item.fakultasId}`, {
                state: { namaFakultas: item.nama },
              })}
              columns={[
                {
                  key: 'rank',
                  label: 'Ranking',
                  render: (item) => (
                    <span className="block text-center font-semibold text-base-content">{item.rank}.</span>
                  ),
                },
                { key: 'nama', label: 'Fakultas' },
                {
                  key: 'total',
                  label: 'Rata-rata Capaian',
                  render: (item) => (
                    <span className="block text-center font-medium text-base-content">{item.total}%</span>
                  ),
                },
                {
                  key: 'kategori',
                  label: 'Kategori Poin',
                  render: (item) => (
                    <KategoriBar
                      organisasi={item.organisasi}
                      seminar={item.seminar}
                      prestasi={item.prestasi}
                    />
                  ),
                },
                {
                  key: 'aksi',
                  label: 'Aksi',
                  stopPropagation: true,
                  render: (item) => (
                    <ActionMenu
                      items={[
                        {
                          label: 'Detail',
                          icon: <Eye className="h-4 w-4" />,
                          onClick: () => navigate(`/pimpinan_utama/detail-fakultas/${item.fakultasId}`, {
                            state: { namaFakultas: item.nama },
                          }),
                        },
                      ]}
                    />
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

export default DetailFakultas
