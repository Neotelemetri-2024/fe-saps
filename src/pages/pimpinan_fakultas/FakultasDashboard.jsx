import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatCard from '../../components/dashboard/StatCard'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import { getCurrentUser } from '../../services/authService'
import { getDashboardPimpinanFakultas } from '../../services/dashboardService'
import PanduanCard from '../../components/dashboard/PanduanCard'
import { DoughnutChart, StackedBarChart } from '../../components/charts'
import { ChartSkeleton } from '../../components/dashboard/Skeleton'

const DOUGHNUT_COLORS = ['#92400e', '#dc2626', '#15803d', '#3b82f6', '#eab308', '#7c3aed']

function pickKategoriValue(kategoriPoin = {}, keys) {
  for (const key of keys) {
    const found = Object.entries(kategoriPoin).find(([k]) => k.toLowerCase().includes(key))
    if (found) return Number(found[1]) || 0
  }
  return 0
}

// ── KategoriPoinBar ──
function KategoriPoinBar({ organisasi, prestasi, seminar }) {
  const total = organisasi + seminar + prestasi || 1
  return (
    <div className="flex h-3 w-36 overflow-hidden rounded-sm">
      <div style={{ width: `${(organisasi / total) * 100}%` }} className="bg-[#15803d]" title={`Organisasi: ${organisasi}`} />
      <div style={{ width: `${(seminar / total) * 100}%` }} className="bg-[#3b82f6]" title={`Seminar: ${seminar}`} />
      <div style={{ width: `${(prestasi / total) * 100}%` }} className="bg-[#eab308]" title={`Prestasi: ${prestasi}`} />
    </div>
  )
}

// ── MAIN ──
function PimpinanFakultasDashboard() {
  const user = getCurrentUser()
  const [loading, setLoading] = useState(true)
  const [statistik, setStatistik] = useState(null)
  const [peringkatProdi, setPeringkatProdi] = useState([])
  const [distribusiPoin, setDistribusiPoin] = useState([])

  useEffect(() => {
    setLoading(true)
    getDashboardPimpinanFakultas()
      .then((data) => {
        setStatistik(data?.statistik || null)
        setPeringkatProdi(Array.isArray(data?.peringkatProdi) ? data.peringkatProdi : [])
        setDistribusiPoin(Array.isArray(data?.distribusiPoin) ? data.distribusiPoin : [])
      })
      .catch((err) => {
        setStatistik(null)
        setPeringkatProdi([])
        setDistribusiPoin([])
        toast.error('Gagal memuat dashboard', { description: err.message })
      })
      .finally(() => setLoading(false))
  }, [])

  const mappedPeringkat = useMemo(() => {
    return peringkatProdi.map((item) => {
      const kp = item.kategoriPoin || {}
      return {
        prodi: item.programStudi || item.prodi || '-',
        organisasi: pickKategoriValue(kp, ['organisasi', 'ukm']),
        seminar: pickKategoriValue(kp, ['seminar', 'pelatihan', 'workshop']),
        prestasi: pickKategoriValue(kp, ['prestasi', 'lomba', 'kompetisi']),
        total: `${item.rataRataCapaian ?? item.total ?? 0}%`,
      }
    })
  }, [peringkatProdi])

  const capaianPerProdi = useMemo(() => {
    return peringkatProdi.map((item) => {
      const kp = item.kategoriPoin || {}
      const nama = item.programStudi || item.prodi || '-'
      return {
        prodi: String(nama).replace(/\s+/g, '\n'),
        organisasi: pickKategoriValue(kp, ['organisasi', 'ukm']),
        seminar: pickKategoriValue(kp, ['seminar', 'pelatihan', 'workshop']),
        prestasi: pickKategoriValue(kp, ['prestasi', 'lomba', 'kompetisi']),
      }
    })
  }, [peringkatProdi])

  const distribusiData = useMemo(() => {
    return distribusiPoin.map((d, i) => ({
      label: d.programStudi || d.prodi || '-',
      value: d.persentaseDariTotal ?? 0,
      color: DOUGHNUT_COLORS[i % DOUGHNUT_COLORS.length],
      jumlahMahasiswa: d.jumlahMahasiswa ?? 0,
    }))
  }, [distribusiPoin])

  const totalMahasiswa = statistik?.totalMahasiswa ?? 0
  const kurikulumLabel =
    typeof statistik?.kurikulumAktif === 'string'
      ? statistik.kurikulumAktif
      : statistik?.kurikulumAktif
        ? `KURIKULUM AKTIF (${statistik.kurikulumAktif})`
        : '—'

  return (
    <DashboardLayout
      role="pimpinan_fakultas"
      userName={user?.nama || 'Pimpinan Fakultas'}
      userRole="Pimpinan"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold sm:text-3xl">
            <span className="text-brand-dark">Dasboard Pimpinan/</span>{' '}
            <span className="text-base-content">Direktorat</span>
          </h2>
          <p className="mt-1 text-sm text-base-content/60">Kelola persetujuan kegiatan, kurikulum berjenjang, dan pantau analitik universitas.</p>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="TOTAL MAHASISWA AKTIF"
            value={loading ? '…' : Number(totalMahasiswa).toLocaleString('id-ID')}
          />
          <StatCard
            label="RATA RATA CAPAIAN"
            value={loading ? '…' : `${statistik?.rataRataCapaian ?? 0}%`}
          />
          <StatCard
            label="KEGIATAN PERLU PERSETUJUAN"
            value={loading ? '…' : String(statistik?.kegiatanPending ?? 0)}
          />
          <StatCard
            label="KURIKULUM AKTIF"
            value={loading ? '…' : kurikulumLabel}
            small
          />
        </div>

        {/* Peringkat Prodi */}
        <TableCard title="Peringkat Prodi" description="Kategori Poin"
          headerRight={
            <div className="flex gap-4 text-xs font-medium text-base-content/70">
              {[['#15803d', 'Organisasi'], ['#3b82f6', 'Seminar'], ['#eab308', 'Prestasi']].map(([c, l]) => (
                <span key={l} className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c }}></span>
                  {l}
                </span>
              ))}
            </div>
          }>
          <TableFrame>
          <DataTable
            loading={loading}
            data={mappedPeringkat}
            emptyText="Belum ada data peringkat prodi."
            columns={[
              {
                key: 'ranking', label: 'Ranking',
                render: (item, i) => (
                  <div className="flex justify-center">
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                      i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-400' : 'bg-amber-700'
                    }`}>
                      {i + 1}.
                    </span>
                  </div>
                ),
              },
              { key: 'prodi', label: 'Program Studi', render: (item) => <span className="text-center block text-black">{item.prodi}</span> },
              { key: 'total', label: 'Total Poin', render: (item) => <span className="text-center block font-semibold text-black">{item.total}</span> },
              {
                key: 'kategori', label: 'Kategori Poin',
                render: (item) => (
                  <div className="flex justify-center">
                    <KategoriPoinBar organisasi={item.organisasi} prestasi={item.prestasi} seminar={item.seminar} />
                  </div>
                ),
              },
            ]}
          />
          </TableFrame>
        </TableCard>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-5">
          <div className="card bg-base-100 p-6 md:col-span-1 lg:col-span-3">
            <h3 className="mb-5 text-center text-sm font-bold text-base-content">Rata rata Capaian per prodi</h3>
            {loading ? (
              <ChartSkeleton height={280} />
            ) : capaianPerProdi.length === 0 ? (
              <p className="py-16 text-center text-sm text-base-content/50">Belum ada data capaian per prodi.</p>
            ) : (
              <StackedBarChart
                labels={capaianPerProdi.map((d) => d.prodi)}
                datasets={[
                  { label: 'Organisasi', data: capaianPerProdi.map((d) => d.organisasi), color: '#3b82f6' },
                  { label: 'Seminar', data: capaianPerProdi.map((d) => d.seminar), color: '#15803d' },
                  { label: 'Prestasi', data: capaianPerProdi.map((d) => d.prestasi), color: '#eab308' },
                ]}
                height={280}
              />
            )}
          </div>

          <div className="card bg-base-100 p-6 md:col-span-1 lg:col-span-2">
            <h3 className="mb-5 text-center text-sm font-bold text-base-content">Distribusi poin per prodi</h3>
            <div className="flex flex-col items-center">
              {loading ? (
                <ChartSkeleton variant="donut" height={220} />
              ) : (
                <>
                  <DoughnutChart
                    labels={distribusiData.length ? distribusiData.map((d) => d.label) : ['—']}
                    values={distribusiData.length ? distribusiData.map((d) => d.value) : [1]}
                    colors={distribusiData.length ? distribusiData.map((d) => d.color) : ['#e9ebf8']}
                    centerValue={Number(totalMahasiswa).toLocaleString('id-ID')}
                    centerLabel="Mahasiswa"
                    height={220}
                  />
                  <div className="mt-5 w-full space-y-2.5">
                    {distribusiData.map((d) => (
                      <div key={d.label} className="flex items-center gap-2 text-xs font-medium">
                        <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }}></span>
                        <span className="flex-1 text-base-content">{d.label}</span>
                        <span className="text-base-content/60">{d.value} %</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <PanduanCard
          className="max-w-lg"
          title="Manual Book User Pimpinan Fakultas"
          description="Panduan Penggunaan Website SAPS untuk Pimpinan Fakultas"
        />
      </div>
    </DashboardLayout>
  )
}

export default PimpinanFakultasDashboard
