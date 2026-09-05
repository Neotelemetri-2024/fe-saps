import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatCard from '../../components/dashboard/StatCard'
import ProgressBar from '../../components/dashboard/ProgressBar'
import { VerticalBarChart } from '../../components/charts'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import DataTable from '../../components/dashboard/DataTable'
import PanduanCard from '../../components/dashboard/PanduanCard'
import { CardGridSkeleton, ChartSkeleton, RankListSkeleton } from '../../components/dashboard/Skeleton'
import { get } from '../../services/apiClient'
import { getCurrentUser } from '../../services/authService'

function formatTanggal(val) {
  if (!val) return '-'
  try {
    const d = new Date(val)
    if (Number.isNaN(d.getTime())) return String(val)
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return String(val)
  }
}

function Dashboard() {
  const user = getCurrentUser()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    get('/api/umum/dashboard/pimpinan-ditmawa')
      .then((res) => setStats(res?.data || res))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  const statistik = stats?.statistik || {}
  const capaianKurikulum = Array.isArray(stats?.capaianKurikulum) ? stats.capaianKurikulum : []
  const topFakultas = Array.isArray(stats?.topFakultas) ? stats.topFakultas : []
  const kegiatanPending = Array.isArray(stats?.kegiatanMenungguApproval) ? stats.kegiatanMenungguApproval : []
  const ukmChart = Array.isArray(stats?.grafikPoinUkm) ? stats.grafikPoinUkm : []

  const chartLabels = ukmChart.map((d) => d.ukm || d.label || d.nama || d.organisasi || '')
  const chartValues = ukmChart.map((d) => d.totalPoin ?? d.poin ?? d.nilai ?? 0)

  const fallbackLabels = ['Neo Telemetri', 'Pramuka', 'KSR PMI', 'Mapala', 'UKS', 'Penelitian', 'Sinematografi', 'Tapak Suci']
  const fallbackValues = [35000, 28000, 22000, 19500, 16000, 14500, 12000, 9500]

  return (
    <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-extrabold text-base-content sm:text-3xl">
            Selamat Datang<br />
            <span className="text-brand-dark">{user?.nama || 'Pimpinan Ditmawa'}</span>
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-base-content/60">
            Pantau perkembangan mahasiswa, evaluasi kurikulum SAPS, dan kelola kegiatan kemahasiswaan Universitas Andalas.
          </p>
        </div>

        {/* 4 Stat Cards Utama */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="TOTAL MAHASISWA AKTIF"
            value={loading ? '…' : Number(statistik.mahasiswaAktif ?? 0).toLocaleString('id-ID')}
          />
          <StatCard
            label="TOTAL FAKULTAS"
            value={loading ? '…' : String(statistik.totalFakultas ?? 15)}
          />
          <StatCard
            label="TOTAL ORMAWA AKTIF"
            value={loading ? '…' : String(statistik.totalOrmawaAktif ?? 0)}
          />
          <StatCard
            label="KURIKULUM AKTIF"
            value={loading ? '…' : (statistik.kurikulumAktif || 'Kurikulum SAPS 2024')}
            small
          />
        </div>

        {/* Progres Capaian Kurikulum */}
        <div className="card bg-base-100 p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-base-content">Progres Capaian Kurikulum</h3>
              <p className="mt-0.5 text-xs text-base-content/60">
                Rata-rata pemenuhan poin kompetensi mahasiswa pada setiap tahun kurikulum
              </p>
            </div>
            <span className="text-xs text-base-content/60">
              Target Minimum: <strong className="text-brand-dark">{statistik.targetPoinKurikulum ?? 200} poin</strong>
            </span>
          </div>

          {loading ? (
            <CardGridSkeleton />
          ) : capaianKurikulum.length === 0 ? (
            <p className="py-8 text-center text-sm text-base-content/50">Belum ada data kurikulum aktif.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {capaianKurikulum.map((pilar) => (
                <div key={pilar.id || pilar.pilar} className="rounded-lg border border-base-300 p-4 text-center">
                  <p className="text-xs font-semibold uppercase text-base-content/60">{pilar.pilar}</p>
                  <p className="mt-1 text-2xl font-bold text-brand-dark">
                    {pilar.rataRataPoin ?? 0}
                    <span className="text-sm font-normal text-base-content/60">/{pilar.targetPoin} poin</span>
                  </p>
                  <div className="mt-2 flex justify-center">
                    <ProgressBar value={pilar.rataRataPoin ?? 0} max={pilar.targetPoin || 1} height={6} />
                  </div>
                  <p className="mt-2 text-xs font-medium text-base-content/60">
                    {pilar.persenCapaian}% Tercapai
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Middle Section: Top Fakultas & Grafik UKM */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Ranking Capaian Fakultas */}
          <div className="card bg-base-100 p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-base-content">Ranking Capaian Fakultas</h3>
                <p className="mt-1 text-sm text-base-content/60">
                  Peringkat berdasarkan persentase capaian poin mahasiswa
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/pimpinan_ditmawa/laporan')}
                className="inline-flex items-center btn btn-outline btn-primary btn-sm"
              >
                Lihat selengkapnya →
              </button>
            </div>

            {loading ? (
              <RankListSkeleton />
            ) : topFakultas.length === 0 ? (
              <p className="py-10 text-center text-sm text-base-content/50">Belum ada data ranking fakultas.</p>
            ) : (
              <div className="divide-y divide-base-300">
                {topFakultas.slice(0, 5).map((fak, index) => {
                  const rank = index + 1
                  const top = rank <= 3
                  return (
                    <div
                      key={fak.id || index}
                      className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0 sm:gap-4"
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          top ? 'bg-brand-dark text-white' : 'bg-base-200 text-base-content/60'
                        }`}
                      >
                        {rank}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                          <p className="truncate text-sm font-medium text-base-content">{fak.fakultas}</p>
                          <p className="shrink-0 text-sm font-semibold text-brand-dark">
                            {fak.rataRataPersentase}%
                            <span className="ml-1 text-xs font-normal text-base-content/50">
                              ({Number(fak.totalPoin ?? 0).toLocaleString('id-ID')} poin)
                            </span>
                          </p>
                        </div>
                        <ProgressBar
                          value={fak.rataRataPersentase}
                          max={100}
                          height={6}
                          color={top ? 'bg-brand-dark' : 'bg-brand-light'}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Grafik Poin per UKM */}
          <div className="card bg-base-100 p-5 sm:p-6">
            <h3 className="mb-1 text-lg font-bold text-base-content">Grafik Poin per UKM</h3>
            <p className="mb-4 text-sm text-base-content/60">
              Akumulasi poin kegiatan mahasiswa berdasarkan UKM penyelenggara
            </p>

            {loading ? (
              <ChartSkeleton height={280} />
            ) : (
              <VerticalBarChart
                labels={chartLabels.length ? chartLabels : fallbackLabels}
                values={chartValues.length ? chartValues : fallbackValues}
                height={280}
              />
            )}
          </div>
        </div>

        {/* Antrean Proposal Kegiatan Menunggu Persetujuan */}
        <TableCard
          title="Proposal Kegiatan Menunggu Persetujuan"
          headerRight={
            <button
              type="button"
              onClick={() => navigate('/pimpinan_ditmawa/verifikasi-pengajuan-internal')}
              className="btn btn-outline btn-primary btn-sm"
            >
              Lihat selengkapnya →
            </button>
          }
        >
          <TableFrame>
            <DataTable
              columns={[
                { key: '_no', label: 'No' },
                {
                  key: 'kegiatan',
                  label: 'Kegiatan',
                  render: (row) => (
                    <div>
                      <p className="font-bold uppercase text-base-content">{row.namaKegiatan}</p>
                      <p className="text-xs font-normal text-base-content/60">
                        {row.organisasi} • {row.tipePenyelenggara}
                      </p>
                    </div>
                  ),
                },
                { key: 'kategori', label: 'Kategori', render: (row) => row.kategori || '-' },
                { key: 'skala', label: 'Skala', render: (row) => row.skala || '-' },
                { key: 'tanggal', label: 'Diajukan Pada', render: (row) => formatTanggal(row.diajukanPada) },
                {
                  key: 'aksi',
                  label: 'Aksi',
                  render: (row) => (
                    <button
                      type="button"
                      onClick={() => navigate(`/pimpinan_ditmawa/verifikasi-pengajuan-internal/${row.id}`)}
                      className="btn btn-outline btn-primary btn-xs"
                    >
                      Tinjau
                    </button>
                  ),
                },
              ]}
              data={kegiatanPending.map((r, i) => ({ ...r, _no: i + 1 }))}
              loading={loading}
              emptyText="Tidak ada proposal kegiatan yang menunggu persetujuan."
            />
          </TableFrame>
        </TableCard>

        {/* Manual Book */}
        <PanduanCard
          className="max-w-sm"
          title="Manual Book User Pimpinan Ditmawa"
          description="Panduan Penggunaan Website SAPS 2026 untuk Pimpinan Ditmawa"
        />
    </div>
  )
}

export default Dashboard
