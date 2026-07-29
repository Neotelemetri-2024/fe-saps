import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import { getCurrentUser } from '../../services/authService'
import { getDashboardPimpinanUtama } from '../../services/dashboardService'

const PAGE_SIZE = 9

function pickKategoriValue(kategoriPoin = {}, keys) {
  for (const key of keys) {
    const found = Object.entries(kategoriPoin).find(([k]) => k.toLowerCase().includes(key))
    if (found) return Number(found[1]) || 0
  }
  return 0
}

// ─── stacked bar ─────────────────────────────────────────────────────────────
function KategoriBar({ organisasi, seminar, prestasi }) {
  const total = organisasi + seminar + prestasi || 1
  const pOrg = (organisasi / total) * 100
  const pSem = (seminar / total) * 100
  const pPre = (prestasi / total) * 100
  return (
    <div className="flex h-3 w-full max-w-[160px] overflow-hidden rounded-sm">
      <div style={{ width: `${pOrg}%`, background: '#16a34a' }} />
      <div style={{ width: `${pSem}%`, background: '#3b82f6' }} />
      <div style={{ width: `${pPre}%`, background: '#eab308' }} />
    </div>
  )
}

// ─── page ────────────────────────────────────────────────────────────────────
function DetailFakultas() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [fakultasData, setFakultasData] = useState([])

  useEffect(() => {
    setLoading(true)
    getDashboardPimpinanUtama()
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
  }, [])

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
        <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Detail Fakultas</h2>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-5 text-sm text-[#444]">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#888]">Kategori Poin</span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-[#16a34a]"></span> Organisasi
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-[#3b82f6]"></span> Seminar
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-[#eab308]"></span> Prestasi
          </span>
        </div>

        <DataTable
          loading={loading}
          data={pageItems}
          emptyText="Belum ada data fakultas."
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          onRowClick={(item) => navigate(`/pimpinan_utama/detail-fakultas/${item.fakultasId}`, { state: { namaFakultas: item.nama } })}
          columns={[
            { key: 'rank', label: 'Ranking', render: (item) => <span className="block text-center font-semibold text-[#333]">{item.rank}.</span> },
            { key: 'nama', label: 'Fakultas' },
            { key: 'total', label: 'Total Poin', render: (item) => <span className="block text-center font-medium text-[#444]">{item.total}%</span> },
            {
              key: 'kategori', label: 'Kategori Poin',
              render: (item) => <KategoriBar organisasi={item.organisasi} seminar={item.seminar} prestasi={item.prestasi} />,
            },
            {
              key: 'aksi', label: 'Aksi', stopPropagation: true,
              render: (item) => (
                <button type="button"
                  onClick={() => navigate(`/pimpinan_utama/detail-fakultas/${item.fakultasId}`, { state: { namaFakultas: item.nama } })}
                  className="text-xs font-semibold text-brand-dark hover:underline">
                  detail
                </button>
              ),
            },
          ]}
        />
      </div>
    </DashboardLayout>
  )
}

export default DetailFakultas
