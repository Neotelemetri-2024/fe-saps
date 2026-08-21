import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatCard from '../../components/dashboard/StatCard'
import ProgressBar from '../../components/dashboard/ProgressBar'
import { StackedBarChart } from '../../components/charts'
import PanduanCard from '../../components/dashboard/PanduanCard'
import { getCurrentUser } from '../../services/authService'
import { get } from '../../services/apiClient'

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

  useEffect(() => {
    setLoading(true)
    get('/api/umum/dashboard/pimpinan-utama')
      .then((res) => {
        const data = res?.data || res || {}
        setStatistik(data.statistik || null)
        const ranking = data.peringkatFakultas || data.rankingFakultas || []
        setPeringkatFakultas(Array.isArray(ranking) ? ranking : [])
      })
      .catch((err) => {
        setStatistik(null)
        setPeringkatFakultas([])
        toast.error('Gagal memuat dashboard', { description: err.message })
      })
      .finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => {
    if (!statistik) {
      return [
        { label: 'TOTAL MAHASISWA AKTIF', value: loading ? '…' : '—' },
        { label: 'RATA RATA CAPAIAN', value: loading ? '…' : '—' },
        { label: 'TOTAL FAKULTAS', value: loading ? '…' : '—' },
        { label: 'KURIKULUM AKTIF', value: loading ? '…' : '—' },
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
      },
    ]
  }, [statistik, loading])

  const chartData = useMemo(() => {
    if (!peringkatFakultas.length) return []
    return peringkatFakultas.map((f) => {
      const kp = f.kategoriPoin || {}
      return {
        fakultas: f.fakultas || f.name || '-',
        organisasi: pickKategoriValue(kp, ['organisasi', 'ukm', 'organisasi']),
        seminar: pickKategoriValue(kp, ['seminar', 'pelatihan', 'workshop']),
        prestasi: pickKategoriValue(kp, ['prestasi', 'lomba', 'kompetisi']),
      }
    })
  }, [peringkatFakultas])

  const chartDatasets = useMemo(() => [
    { label: 'Organisasi', data: chartData.map((d) => d.organisasi), color: '#3b82f6' },
    { label: 'Seminar', data: chartData.map((d) => d.seminar), color: '#15803d' },
    { label: 'Prestasi', data: chartData.map((d) => d.prestasi), color: '#eab308' },
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
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-black sm:text-3xl">
            Selamat Datang<br />{user?.nama || 'Pimpinan Utama'}
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-[#616161]">
            Kelola persetujuan kegiatan, kurikulum berjenjang, dan pantau analitik universitas.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-center text-lg font-bold text-[#222]">Grafik poin per Fakultas berdasarkan Jenis Kegiatan</h3>
          {loading ? (
            <p className="py-16 text-center text-sm text-[#9aa0a6]">Memuat grafik…</p>
          ) : chartData.length === 0 ? (
            <p className="py-16 text-center text-sm text-[#9aa0a6]">Belum ada data grafik fakultas.</p>
          ) : (
            <StackedBarChart
              labels={chartData.map((d) => d.fakultas)}
              datasets={chartDatasets}
              height={320}
            />
          )}
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-[#222]">Ranking Fakultas</h3>
              <p className="mt-1 text-sm text-[#616161]">
                Peringkat berdasarkan total poin seluruh matriks
              </p>
            </div>
            <Link
              to="/pimpinan_utama/detail-fakultas"
              className="inline-flex items-center rounded-lg border border-brand-dark bg-white px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-[#f5f7f5]"
            >
              Lihat selengkapnya →
            </Link>
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm text-[#9aa0a6]">Memuat ranking…</p>
          ) : rankingList.length === 0 ? (
            <p className="py-10 text-center text-sm text-[#9aa0a6]">Belum ada data ranking fakultas.</p>
          ) : (
            <div className="divide-y divide-[#e9ebf8]">
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
                          ? 'bg-brand-dark text-white'
                          : 'bg-[#f0f2f5] text-[#616161]'
                      }`}
                    >
                      {rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                        <p className="truncate text-sm text-[#222]">{item.name}</p>
                        <p className="shrink-0 text-sm font-semibold text-brand-dark">
                          {item.totalPoin.toLocaleString('id-ID')}
                          <span className="ml-1 text-xs font-normal text-[#9aa0a6]">poin</span>
                        </p>
                      </div>
                      <ProgressBar
                        value={item.barValue}
                        max={item.barMax}
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

        <PanduanCard
          className="max-w-lg"
          title="Manual Book User Pimpinan Utama"
          description="Dapatkan panduan lengkap penggunaan dashboard SAPS untuk Pimpinan Utama."
        />
      </div>
    </DashboardLayout>
  )
}

export default PimpinanUtamaDashboard
