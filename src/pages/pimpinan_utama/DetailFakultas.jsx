import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
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
            <span className="h-3 w-3 rounded-sm bg-[#16a34a]" /> Organisasi
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-[#3b82f6]" /> Seminar
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-[#eab308]" /> Prestasi
          </span>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-xs font-semibold uppercase tracking-wide text-white">
                  <th className="px-5 py-3 text-center">Ranking</th>
                  <th className="px-5 py-3">Fakultas</th>
                  <th className="px-5 py-3 text-center">Total Poin</th>
                  <th className="px-5 py-3">Kategori Poin</th>
                  <th className="px-5 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-[#888]">Memuat data…</td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-[#888]">Belum ada data fakultas.</td>
                  </tr>
                ) : (
                  pageItems.map((item) => (
                    <tr
                      key={item.fakultasId || item.rank}
                      className="border-b border-[#f0f2f8] last:border-0 hover:bg-[#f9fafb]"
                    >
                      <td className="px-5 py-3.5 text-center font-semibold text-[#333]">{item.rank}.</td>
                      <td className="px-5 py-3.5 text-[#333]">{item.nama}</td>
                      <td className="px-5 py-3.5 text-center font-medium text-[#444]">{item.total}%</td>
                      <td className="px-5 py-3.5">
                        <KategoriBar
                          organisasi={item.organisasi}
                          seminar={item.seminar}
                          prestasi={item.prestasi}
                        />
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/pimpinan_utama/detail-fakultas/${item.fakultasId}`, {
                              state: { namaFakultas: item.nama },
                            })
                          }
                          className="text-xs font-semibold text-brand-dark hover:underline"
                        >
                          detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-2 border-t border-[#e9ebf8] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#616161]">
              menampilkan {fakultasData.length ? start + 1 : 0} -{' '}
              {Math.min(start + PAGE_SIZE, fakultasData.length)} dari {fakultasData.length} Fakultas
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded px-2 py-1 text-xs text-[#616161] hover:bg-[#f0f4f0] disabled:opacity-40"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={`h-7 w-7 rounded text-xs font-semibold transition ${
                    n === currentPage
                      ? 'bg-brand-dark text-white'
                      : 'text-[#444] hover:bg-[#f0f4f0]'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded px-2 py-1 text-xs text-[#616161] hover:bg-[#f0f4f0] disabled:opacity-40"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default DetailFakultas
