import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'

// ─── data ────────────────────────────────────────────────────────────────────
const FAKULTAS_DATA = [
  { rank: 1,  nama: 'Fakultas Teknologi Informasi',  organisasi: 45, seminar: 30, prestasi: 25, total: 70 },
  { rank: 2,  nama: 'Fakultas Kedokteran',           organisasi: 40, seminar: 35, prestasi: 25, total: 70 },
  { rank: 3,  nama: 'Fakultas Teknik',               organisasi: 35, seminar: 20, prestasi: 45, total: 70 },
  { rank: 4,  nama: 'Fakultas Ekonomi dan Bisnis',   organisasi: 50, seminar: 25, prestasi: 25, total: 70 },
  { rank: 5,  nama: 'Fakultas Teknologi Informasi',  organisasi: 30, seminar: 40, prestasi: 30, total: 70 },
  { rank: 6,  nama: 'Fakultas Teknologi Informasi',  organisasi: 42, seminar: 28, prestasi: 30, total: 70 },
  { rank: 7,  nama: 'Fakultas Teknologi Informasi',  organisasi: 38, seminar: 32, prestasi: 30, total: 70 },
  { rank: 8,  nama: 'Fakultas Teknologi Informasi',  organisasi: 44, seminar: 22, prestasi: 34, total: 70 },
  { rank: 9,  nama: 'Fakultas Teknologi Informasi',  organisasi: 36, seminar: 34, prestasi: 30, total: 70 },
  { rank: 10, nama: 'Fakultas Hukum',                organisasi: 40, seminar: 30, prestasi: 30, total: 70 },
  { rank: 11, nama: 'Fakultas Pertanian',            organisasi: 48, seminar: 22, prestasi: 30, total: 70 },
  { rank: 12, nama: 'Fakultas MIPA',                 organisasi: 35, seminar: 35, prestasi: 30, total: 70 },
  { rank: 13, nama: 'Fakultas Peternakan',           organisasi: 40, seminar: 28, prestasi: 32, total: 70 },
  { rank: 14, nama: 'Fakultas Farmasi',              organisasi: 38, seminar: 30, prestasi: 32, total: 70 },
  { rank: 15, nama: 'Fakultas Ilmu Budaya',          organisasi: 42, seminar: 26, prestasi: 32, total: 70 },
]

const PAGE_SIZE = 9

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
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(FAKULTAS_DATA.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageItems = FAKULTAS_DATA.slice(start, start + PAGE_SIZE)

  return (
    <DashboardLayout
      role="pimpinan-utama"
      userName="Dr. Efa Yonnedi, SE. MPPM, Akt, CA, CRGP"
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
                {pageItems.map((item) => (
                  <tr
                    key={item.rank}
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
                          navigate(
                            `/pimpinan-utama/detail-fakultas/${encodeURIComponent(item.nama)}`,
                          )
                        }
                        className="text-xs font-semibold text-brand-dark hover:underline"
                      >
                        detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-2 border-t border-[#e9ebf8] px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#616161]">
              menampilkan {start + 1} - {Math.min(start + PAGE_SIZE, FAKULTAS_DATA.length)} dari{' '}
              {FAKULTAS_DATA.length} Fakultas
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
