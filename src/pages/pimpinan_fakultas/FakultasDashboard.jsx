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

function pickKategoriValue(kategoriPoin = {}, keys) {
  for (const key of keys) {
    const found = Object.entries(kategoriPoin).find(([k]) => k.toLowerCase().includes(key))
    if (found) return Number(found[1]) || 0
  }
  return 0
}

function KategoriPoinBar({ organisasi, prestasi, seminar }) {
  const total = organisasi + seminar + prestasi || 1
  return (
    <div className="flex h-3 w-full max-w-[160px] overflow-hidden rounded-md bg-base-300">
      <div className="bg-primary" style={{ width: `${(organisasi / total) * 100}%` }} title={`Organisasi: ${organisasi}`} />
      <div className="bg-info" style={{ width: `${(seminar / total) * 100}%` }} title={`Seminar: ${seminar}`} />
      <div className="bg-warning" style={{ width: `${(prestasi / total) * 100}%` }} title={`Prestasi: ${prestasi}`} />
    </div>
  )
}

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
    return peringkatProdi.map((item, index) => {
      const kp = item.kategoriPoin || {}
      return {
        rank: index + 1,
        prodi: item.programStudi || item.prodi || '-',
        organisasi: pickKategoriValue(kp, ['organisasi', 'ukm']),
        seminar: pickKategoriValue(kp, ['seminar', 'pelatihan', 'workshop']),
        prestasi: pickKategoriValue(kp, ['prestasi', 'lomba', 'kompetisi']),
        total: item.rataRataCapaian ?? item.total ?? 0,
      }
    })
  }, [peringkatProdi])

  const capaianPerProdi = useMemo(() => {
    return peringkatProdi.map((item) => {
      const kp = item.kategoriPoin || {}
      return {
        prodi: item.programStudi || item.prodi || '-',
        organisasi: pickKategoriValue(kp, ['organisasi', 'ukm']),
        seminar: pickKategoriValue(kp, ['seminar', 'pelatihan', 'workshop']),
        prestasi: pickKategoriValue(kp, ['prestasi', 'lomba', 'kompetisi']),
      }
    })
  }, [peringkatProdi])

  const distribusiData = useMemo(() => {
    return distribusiPoin.map((d) => ({
      label: d.programStudi || d.prodi || '-',
      value: d.persentaseDariTotal ?? 0,
      jumlahMahasiswa: d.jumlahMahasiswa ?? 0,
    }))
  }, [distribusiPoin])

  const totalMahasiswa = statistik?.totalMahasiswa ?? 0

  return (
    <DashboardLayout
      role="pimpinan_fakultas"
      userName={user?.nama || 'Pimpinan Fakultas'}
      userRole="Pimpinan Fakultas"
    >
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-extrabold text-base-content">
            Selamat Datang<br />
            {user?.nama || 'Pimpinan Fakultas'}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-base-content/60">
            Pantau capaian mahasiswa per program studi, kelola persetujuan kegiatan, dan evaluasi kurikulum MY UNAND STUDENT CONNECT di tingkat fakultas.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="TOTAL MAHASISWA AKTIF"
            loading={loading}
            value={Number(totalMahasiswa).toLocaleString('id-ID')}
          />
          <StatCard
            label="RATA RATA CAPAIAN"
            loading={loading}
            value={`${statistik?.rataRataCapaian ?? 0}%`}
          />
          <StatCard
            label="KEGIATAN PERLU PERSETUJUAN"
            loading={loading}
            value={String(statistik?.kegiatanPending ?? 0)}
          />
        </div>

        <TableCard
          title="Peringkat Prodi"
          description="Berdasarkan rata-rata capaian mahasiswa"
          headerRight={
            <div className="flex flex-wrap items-center gap-4 text-xs text-base-content/70">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Organisasi
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-info" /> Seminar
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-warning" /> Prestasi
              </span>
            </div>
          }
        >
          <TableFrame>
            <DataTable
              loading={loading}
              data={mappedPeringkat}
              emptyText="Belum ada data peringkat prodi."
              columns={[
                {
                  key: 'rank',
                  label: 'Ranking',
                  render: (item) => (
                    <span className="block text-center font-semibold text-base-content">{item.rank}.</span>
                  ),
                },
                { key: 'prodi', label: 'Program Studi' },
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
                    <KategoriPoinBar
                      organisasi={item.organisasi}
                      prestasi={item.prestasi}
                      seminar={item.seminar}
                    />
                  ),
                },
              ]}
            />
          </TableFrame>
        </TableCard>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          <div className="card bg-base-100 p-5 lg:col-span-3">
            <h3 className="mb-4 text-sm font-semibold text-base-content">
              Rata-rata capaian per prodi
            </h3>
            {loading ? (
              <ChartSkeleton height={280} />
            ) : capaianPerProdi.length === 0 ? (
              <p className="py-16 text-center text-sm text-base-content/50">Belum ada data capaian per prodi.</p>
            ) : (
              <StackedBarChart
                labels={capaianPerProdi.map((d) => d.prodi)}
                datasets={[
                  { label: 'Organisasi', data: capaianPerProdi.map((d) => d.organisasi) },
                  { label: 'Seminar', data: capaianPerProdi.map((d) => d.seminar) },
                  { label: 'Prestasi', data: capaianPerProdi.map((d) => d.prestasi) },
                ]}
                height={280}
              />
            )}
          </div>

          <div className="card bg-base-100 p-5 lg:col-span-2">
            <h3 className="mb-4 text-sm font-semibold text-base-content">
              Distribusi poin per prodi
            </h3>
            {loading ? (
              <ChartSkeleton variant="donut" height={220} />
            ) : distribusiData.length === 0 ? (
              <p className="py-16 text-center text-sm text-base-content/50">Belum ada data distribusi.</p>
            ) : (
              <div className="flex flex-col items-center">
                <DoughnutChart
                  labels={distribusiData.map((d) => d.label)}
                  values={distribusiData.map((d) => d.value)}
                  centerValue={Number(totalMahasiswa).toLocaleString('id-ID')}
                  centerLabel="Mahasiswa"
                  height={220}
                />
                <div className="mt-4 w-full space-y-2">
                  {distribusiData.map((d) => (
                    <div key={d.label} className="flex items-center gap-2 text-xs">
                      <span className="flex-1 text-base-content">{d.label}</span>
                      <span className="tabular-nums text-base-content/60">{d.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <PanduanCard
          className="max-w-lg"
          title="Manual Book User Pimpinan Fakultas"
          description="Panduan Penggunaan Website MY UNAND STUDENT CONNECT untuk Pimpinan Fakultas"
        />
      </div>
    </DashboardLayout>
  )
}

export default PimpinanFakultasDashboard
