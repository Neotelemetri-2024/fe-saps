import { useEffect, useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import ProgressBar from '../../components/dashboard/ProgressBar'
import { StackedBarChart } from '../../components/charts'
import PanduanCard from '../../components/dashboard/PanduanCard'
import { getCurrentUser } from '../../services/authService'
import { get } from '../../services/apiClient'

const toneStyles = {
  emerald: { label: 'text-emerald-700', value: 'text-brand-dark' },
}

function StatBox({ label, value, tone }) {
  const s = toneStyles[tone] || toneStyles.emerald
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className={`text-xs font-semibold tracking-wide ${s.label}`}>{label}</p>
      <p className={`mt-2 text-3xl font-extrabold ${s.value}`}>{value}</p>
    </div>
  )
}

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
        { label: 'TOTAL MAHASISWA AKTIF', value: loading ? '…' : '—', tone: 'emerald' },
        { label: 'RATA RATA CAPAIAN', value: loading ? '…' : '—', tone: 'emerald' },
        { label: 'TOTAL FAKULTAS', value: loading ? '…' : '—', tone: 'emerald' },
        { label: 'KURIKULUM AKTIF', value: loading ? '…' : '—', tone: 'emerald' },
      ]
    }
    return [
      {
        label: 'TOTAL MAHASISWA AKTIF',
        value: Number(statistik.totalMahasiswa ?? 0).toLocaleString('id-ID'),
        tone: 'emerald',
      },
      {
        label: 'RATA RATA CAPAIAN',
        value: `${statistik.rataRataCapaian ?? 0}%`,
        tone: 'emerald',
      },
      {
        label: 'TOTAL FAKULTAS',
        value: String(statistik.totalFakultas ?? 0),
        tone: 'emerald',
      },
      {
        label: 'KURIKULUM AKTIF',
        value: statistik.kurikulumAktif || '—',
        tone: 'emerald',
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
    return peringkatFakultas.map((item) => ({
      name: item.fakultas || item.name || '-',
      desc: item.totalPoin != null ? `Total poin: ${item.totalPoin}` : (item.desc || ''),
      progress: item.rataRataCapaian ?? item.progress ?? 0,
      id: item.fakultasId,
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
            <StatBox key={s.label} {...s} />
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

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-[#222]">Ranking Fakultas</h3>
          <p className="text-sm text-[#616161] mb-4">Daftar peringkat seluruh fakultas berdasarkan total poin semua matriks</p>
          {loading ? (
            <p className="py-8 text-center text-sm text-[#9aa0a6]">Memuat ranking…</p>
          ) : rankingList.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#9aa0a6]">Belum ada data ranking fakultas.</p>
          ) : (
            <div className="space-y-4">
              {rankingList.map((item, index) => (
                <div key={item.id || index} className="flex items-center gap-4">
                  <span className="w-6 text-lg font-bold text-brand-dark">{index + 1}.</span>
                  <div className="flex-1">
                    <p className="font-medium text-brand-dark">{item.name}</p>
                    {item.desc && <p className="text-xs text-[#616161]">{item.desc}</p>}
                    <ProgressBar value={item.progress} max={100} height={8} color="bg-brand-light" />
                  </div>
                  <span className="text-sm font-medium text-brand-dark">{item.progress}%</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 text-right">
            <Link to="/pimpinan_utama/detail-fakultas" className="inline-flex items-center gap-1 text-sm font-medium text-brand-dark">
              Lihat Detail <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
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
