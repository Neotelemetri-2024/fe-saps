import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatCard from '../../components/dashboard/StatCard'
import ProgressBar from '../../components/dashboard/ProgressBar'
import { StackedBarChart } from '../../components/charts'
import { ChartSkeleton, RankListSkeleton } from '../../components/dashboard/Skeleton'
import PanduanCard from '../../components/dashboard/PanduanCard'
import { getCurrentUser } from '../../services/authService'
import { getDashboardPimpinanUtama } from '../../services/dashboardService'
import { getKurikulumAktif } from '../../services/kurikulumService'

function pickKategoriValue(kategoriPoin = {}, keys) {
  for (const key of keys) {
    const found = Object.entries(kategoriPoin).find(([k]) => k.toLowerCase().includes(key))
    if (found) return found[1]
  }
  return 0
}

function PimpinanUtamaDashboard() {
  const user = getCurrentUser()
  const [loading, setLoading] = useState(true)
  const [statistik, setStatistik] = useState(null)
  const [peringkatFakultas, setPeringkatFakultas] = useState([])
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
        setStatistik(data?.statistik || null)
        const ranking = data?.peringkatFakultas || data?.rankingFakultas || []
        setPeringkatFakultas(Array.isArray(ranking) ? ranking : [])
      })
      .catch((err) => {
        setStatistik(null)
        setPeringkatFakultas([])
        toast.error('Gagal memuat dashboard', { description: err.message })
      })
      .finally(() => setLoading(false))
  }, [kurikulumId])

  const stats = useMemo(() => {
    if (!statistik) {
      return [
        { label: 'TOTAL MAHASISWA AKTIF', loading: true },
        { label: 'RATA RATA CAPAIAN', loading: true },
        { label: 'TOTAL FAKULTAS', loading: true },
        { label: 'KURIKULUM AKTIF', loading: true, small: true },
      ]
    }
    return [
      {
        label: 'TOTAL MAHASISWA AKTIF',
        value: Number(statistik.totalMahasiswa ?? 0).toLocaleString('id-ID'),
      },
      {
        label: 'RATA RATA CAPAIAN',
        value: `${statistik.rataRataCapaian ?? 0}%`,
      },
      {
        label: 'TOTAL FAKULTAS',
        value: String(statistik.totalFakultas ?? 0),
      },
      {
        label: 'KURIKULUM AKTIF',
        value: statistik.kurikulumAktif || '—',
        small: true,
      },
    ]
  }, [statistik])

  const chartData = useMemo(() => {
    if (!peringkatFakultas.length) return []
    return peringkatFakultas.map((f) => {
      const kp = f.kategoriPoin || {}
      return {
        fakultas: f.fakultas || f.name || '-',
        organisasi: pickKategoriValue(kp, ['organisasi', 'ukm']),
        seminar: pickKategoriValue(kp, ['seminar', 'pelatihan', 'workshop']),
        prestasi: pickKategoriValue(kp, ['prestasi', 'lomba', 'kompetisi']),
      }
    })
  }, [peringkatFakultas])

  const chartDatasets = useMemo(() => [
    { label: 'Organisasi', data: chartData.map((d) => d.organisasi) },
    { label: 'Seminar', data: chartData.map((d) => d.seminar) },
    { label: 'Prestasi', data: chartData.map((d) => d.prestasi) },
  ], [chartData])

  const rankingList = useMemo(() => {
    const rows = peringkatFakultas.map((item) => ({
      name: item.fakultas || item.name || '-',
      totalPoin: Number(item.totalPoin ?? 0),
      rataRata: item.rataRataCapaian ?? item.progress ?? 0,
      id: item.fakultasId,
    }))
    const maxPoin = Math.max(...rows.map((r) => r.totalPoin), 1)
    return rows.map((r) => ({
      ...r,
      barValue: r.totalPoin,
      barMax: maxPoin,
    }))
  }, [peringkatFakultas])

  return (
    <DashboardLayout role="pimpinan_utama" userName={user?.nama || 'Pimpinan Utama'} userRole="Pimpinan Utama (Rektor)">
      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-base-content">
              Selamat Datang<br />{user?.nama || 'Pimpinan Utama'}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-base-content/60">
              Pantau capaian poin mahasiswa lintas fakultas dan evaluasi kurikulum MY UNAND STUDENT CONNECT di tingkat universitas.
            </p>
          </div>
          {kurikulumOptions.length > 0 ? (
            <label className="flex min-w-52 flex-col gap-1">
              <span className="text-xs text-base-content/60">Kurikulum</span>
              <select
                className="select select-sm"
                value={kurikulumId}
                onChange={(e) => setKurikulumId(e.target.value)}
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} loading={loading || s.loading} />
          ))}
        </div>

        <div className="card bg-base-100 p-5">
          <h3 className="mb-4 text-sm font-semibold text-base-content">
            Grafik poin per fakultas berdasarkan jenis kegiatan
          </h3>
          {loading ? (
            <ChartSkeleton height={320} />
          ) : chartData.length === 0 ? (
            <p className="py-16 text-center text-sm text-base-content/50">Belum ada data grafik fakultas.</p>
          ) : (
            <StackedBarChart
              labels={chartData.map((d) => d.fakultas)}
              datasets={chartDatasets}
              height={320}
            />
          )}
        </div>

        <div className="card bg-base-100 p-5">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-base-content">Ranking Fakultas</h3>
              <p className="mt-1 text-sm text-base-content/60">
                Peringkat berdasarkan total poin seluruh matriks
              </p>
            </div>
            <Link to="/pimpinan_utama/detail-fakultas" className="btn btn-outline btn-primary btn-sm">
              Lihat selengkapnya
            </Link>
          </div>

          {loading ? (
            <RankListSkeleton />
          ) : rankingList.length === 0 ? (
            <p className="py-10 text-center text-sm text-base-content/50">Belum ada data ranking fakultas.</p>
          ) : (
            <div className="divide-y divide-base-300">
              {rankingList.map((item, index) => {
                const rank = index + 1
                const top = rank <= 3
                return (
                  <div
                    key={item.id || index}
                    className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0 sm:gap-4"
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        top
                          ? 'bg-primary text-primary-content'
                          : 'bg-base-200 text-base-content/60'
                      }`}
                    >
                      {rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                        <p className="truncate text-sm text-base-content">{item.name}</p>
                        <p className="shrink-0 text-sm font-semibold text-primary">
                          {item.totalPoin.toLocaleString('id-ID')}
                          <span className="ml-1 text-xs font-normal text-base-content/50">poin</span>
                        </p>
                      </div>
                      <ProgressBar
                        value={item.barValue}
                        max={item.barMax}
                        height={6}
                        color={top ? 'primary' : 'success'}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <PanduanCard
          className="max-w-lg"
          title="Manual Book User Pimpinan Utama"
          description="Dapatkan panduan lengkap penggunaan dashboard MY UNAND STUDENT CONNECT untuk Pimpinan Utama."
        />
      </div>
    </DashboardLayout>
  )
}

export default PimpinanUtamaDashboard
