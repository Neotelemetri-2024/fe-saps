import { useEffect, useMemo, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import { DetailBackButton } from '../../components/ui/DetailComponents'
import { getCurrentUser } from '../../services/authService'
import { getDashboardFakultasDetail } from '../../services/dashboardService'
import { ChartSkeleton } from '../../components/dashboard/Skeleton'
import { DoughnutChart, StackedBarChart } from '../../components/charts'

function pickKategoriValue(kategoriPoin = {}, keys) {
  for (const key of keys) {
    const found = Object.entries(kategoriPoin).find(([k]) => k.toLowerCase().includes(key))
    if (found) return Number(found[1]) || 0
  }
  return 0
}

function KategoriPoinBar({ item }) {
  const organisasi = item.organisasi || 0
  const seminar = item.seminar || 0
  const prestasi = item.prestasi || 0
  const total = item.poin || organisasi + seminar + prestasi || 1

  return (
    <div className="flex h-2.5 w-32 overflow-hidden rounded-md bg-base-300">
      <div className="bg-primary" style={{ width: `${(organisasi / total) * 100}%` }} title={`Organisasi: ${organisasi}`} />
      <div className="bg-info" style={{ width: `${(seminar / total) * 100}%` }} title={`Seminar: ${seminar}`} />
      <div className="bg-warning" style={{ width: `${(prestasi / total) * 100}%` }} title={`Prestasi: ${prestasi}`} />
    </div>
  )
}

function DetailFakultasProdi() {
  const { fakultas } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const user = getCurrentUser()
  const fakultasId = fakultas
  const [selectedProdi, setSelectedProdi] = useState('Semua Prodi')
  const [loading, setLoading] = useState(true)
  const [namaFakultas, setNamaFakultas] = useState(location.state?.namaFakultas || '')
  const [statistik, setStatistik] = useState(null)
  const [prodiList, setProdiList] = useState([])
  const [poinBerdasarkanSkala, setPoinBerdasarkanSkala] = useState([])
  const [distribusiPoin, setDistribusiPoin] = useState([])

  useEffect(() => {
    if (!fakultasId || Number.isNaN(Number(fakultasId))) {
      setLoading(false)
      return
    }
    setLoading(true)
    getDashboardFakultasDetail(fakultasId)
      .then((data) => {
        setStatistik(data?.statistik || null)
        const ranking = Array.isArray(data?.peringkatProdi) ? data.peringkatProdi : []
        const dist = Array.isArray(data?.distribusiPoin) ? data.distribusiPoin : []
        setDistribusiPoin(dist)
        setProdiList(
          ranking.map((item) => {
            const kp = item.kategoriPoin || {}
            const namaProdi = item.programStudi || '-'
            const found = dist.find((d) => d.programStudi === namaProdi)
            return {
              rank: item.ranking,
              prodi: namaProdi,
              poin: item.totalPoin ?? 0,
              organisasi: pickKategoriValue(kp, ['organisasi', 'ukm']),
              seminar: pickKategoriValue(kp, ['seminar', 'pelatihan', 'workshop']),
              prestasi: pickKategoriValue(kp, ['prestasi', 'lomba', 'kompetisi']),
              mahasiswa: found?.jumlahMahasiswa ?? 0,
              rataRataCapaian: item.rataRataCapaian ?? 0,
            }
          }),
        )
        setPoinBerdasarkanSkala(Array.isArray(data?.poinBerdasarkanSkala) ? data.poinBerdasarkanSkala : [])
        if (location.state?.namaFakultas) {
          setNamaFakultas(location.state.namaFakultas)
        }
      })
      .catch((err) => {
        setProdiList([])
        setDistribusiPoin([])
        setPoinBerdasarkanSkala([])
        toast.error('Gagal memuat detail fakultas', { description: err.message })
      })
      .finally(() => setLoading(false))
  }, [fakultasId, location.state?.namaFakultas])

  const filteredProdi =
    selectedProdi === 'Semua Prodi' ? prodiList : prodiList.filter((p) => p.prodi === selectedProdi)

  const totalMahasiswa = useMemo(
    () => distribusiPoin.reduce((s, p) => s + (p.jumlahMahasiswa || 0), 0)
      || prodiList.reduce((s, p) => s + (p.mahasiswa || 0), 0),
    [distribusiPoin, prodiList],
  )
  const totalPoin = prodiList.reduce((s, p) => s + p.poin, 0)

  const mhsSections = prodiList.map((p) => ({
    label: p.prodi,
    value: p.mahasiswa,
  }))

  const skalaKegiatan = poinBerdasarkanSkala.map((s) => ({
    label: s.skala || '-',
    percentage: s.persentaseDariTotal ?? 0,
    value: s.totalPoin ?? s.poin ?? null,
  }))

  const kurikulumLabel =
    typeof statistik?.kurikulumAktif === 'string'
      ? statistik.kurikulumAktif
      : statistik?.kurikulumAktif
        ? `Kurikulum aktif (${statistik.kurikulumAktif})`
        : 'Kurikulum soft skill berjenjang'

  if (!fakultasId || Number.isNaN(Number(fakultasId))) {
    return (
      <DashboardLayout
        role="pimpinan_utama"
        userName={user?.nama || 'Pimpinan Utama'}
        userRole="Pimpinan Utama (Rektor)"
      >
        <div className="space-y-5">
          <DetailBackButton onClick={() => navigate('/pimpinan_utama/detail-fakultas')} />
          <div className="card bg-base-100 p-8 text-center">
            <h2 className="text-xl font-extrabold text-base-content">Fakultas tidak ditemukan</h2>
            <p className="mt-2 text-sm text-base-content/60">
              ID fakultas tidak valid. Pilih fakultas lain dari halaman ringkasan.
            </p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      role="pimpinan_utama"
      userName={user?.nama || 'Pimpinan Utama'}
      userRole="Pimpinan Utama (Rektor)"
    >
      <div className="space-y-5">
        <DetailBackButton onClick={() => navigate('/pimpinan_utama/detail-fakultas')} />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-base-content">
              {namaFakultas || fakultasId}
            </h2>
            <p className="mt-1 text-sm text-base-content/60">
              Detail program studi dan poin capaian mahasiswa.
            </p>
          </div>
          <label className="flex min-w-52 flex-col gap-1">
            <span className="text-xs text-base-content/60">Filter Prodi</span>
            <select
              value={selectedProdi}
              onChange={(e) => setSelectedProdi(e.target.value)}
              className="select select-sm"
            >
              {['Semua Prodi', ...prodiList.map((p) => p.prodi)].map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="card bg-base-100 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-base-content">Kurikulum Aktif</h3>
              <p className="mt-1 text-sm text-base-content">{kurikulumLabel}</p>
              <p className="mt-0.5 text-xs text-base-content/60">
                {Number(statistik?.totalMahasiswa ?? totalMahasiswa).toLocaleString('id-ID')} mahasiswa terdaftar
              </p>
            </div>
            <span className="badge badge-success badge-sm">Aktif</span>
          </div>
        </div>

        <TableCard title="Peringkat Prodi">
          <TableFrame>
            <DataTable
              loading={loading}
              data={filteredProdi}
              emptyText="Belum ada data prodi."
              columns={[
                {
                  key: 'rank',
                  label: 'Ranking',
                  render: (item) => (
                    <span className="block text-center font-semibold text-base-content/60">{item.rank}.</span>
                  ),
                },
                {
                  key: 'prodi',
                  label: 'Program Studi',
                  render: (item) => <span className="font-medium text-base-content">{item.prodi}</span>,
                },
                {
                  key: 'poin',
                  label: 'Total Poin',
                  render: (item) => <span className="font-semibold text-base-content">{item.poin}</span>,
                },
                {
                  key: 'kategori',
                  label: 'Kategori Poin',
                  render: (item) => <KategoriPoinBar item={item} />,
                },
              ]}
            />
          </TableFrame>
        </TableCard>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-5">
          <div className="card bg-base-100 p-5 md:col-span-3">
            <h3 className="mb-4 text-sm font-semibold text-base-content">Rata-rata capaian per prodi</h3>
            {loading ? (
              <ChartSkeleton height={240} />
            ) : filteredProdi.length === 0 ? (
              <p className="py-10 text-center text-sm text-base-content/50">Belum ada data grafik.</p>
            ) : (
              <StackedBarChart
                horizontal
                labels={filteredProdi.map((d) => d.prodi)}
                datasets={[
                  { label: 'Organisasi', data: filteredProdi.map((d) => d.organisasi) },
                  { label: 'Seminar', data: filteredProdi.map((d) => d.seminar) },
                  { label: 'Prestasi', data: filteredProdi.map((d) => d.prestasi) },
                ]}
                height={Math.max(240, filteredProdi.length * 42)}
              />
            )}
          </div>

          <div className="card flex flex-col items-center bg-base-100 p-5 md:col-span-2">
            <h3 className="mb-4 text-sm font-semibold text-base-content">Total mahasiswa</h3>
            {loading ? (
              <ChartSkeleton height={220} />
            ) : (
              <>
                <DoughnutChart
                  labels={mhsSections.length ? mhsSections.map((s) => s.label) : ['—']}
                  values={mhsSections.length ? mhsSections.map((s) => s.value) : [1]}
                  centerTitle="Total"
                  centerValue={Number(totalMahasiswa).toLocaleString('id-ID')}
                  centerLabel="Mahasiswa"
                  height={220}
                />
                <div className="mt-5 w-full space-y-2 text-xs">
                  {prodiList.map((p) => (
                    <div key={p.prodi} className="flex items-center justify-between text-base-content/70">
                      <span className="max-w-[75%] truncate">{p.prodi}</span>
                      <span className="font-medium text-base-content/50">
                        {Math.round((p.mahasiswa / (totalMahasiswa || 1)) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="card bg-base-100 p-5">
          <h3 className="mb-4 text-sm font-semibold text-base-content">Poin berdasarkan skala kegiatan</h3>
          {loading ? (
            <ChartSkeleton height={220} />
          ) : (
            <div className="flex flex-col items-center justify-around gap-8 sm:flex-row">
              <DoughnutChart
                labels={skalaKegiatan.length ? skalaKegiatan.map((s) => s.label) : ['—']}
                values={skalaKegiatan.length ? skalaKegiatan.map((s) => s.percentage) : [1]}
                centerValue={Number(totalPoin).toLocaleString('id-ID')}
                centerLabel="Poin"
                height={220}
              />
              <div className="grid grid-cols-2 gap-x-10 gap-y-3 text-xs">
                {skalaKegiatan.map((s) => (
                  <div key={s.label} className="text-base-content/70">
                    {s.label} ({s.percentage}%)
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default DetailFakultasProdi
