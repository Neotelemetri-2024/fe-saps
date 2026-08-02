import { useEffect, useMemo, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import { getCurrentUser } from '../../services/authService'
import { getDashboardFakultasDetail } from '../../services/dashboardService'

const KATEGORI = [
  { key: 'organisasi', color: '#3b82f6', label: 'Organisasi' },
  { key: 'seminar', color: '#15803d', label: 'Seminar' },
  { key: 'prestasi', color: '#eab308', label: 'Prestasi' },
]

const SKALA_COLORS = ['#9B5DE5', '#1D3557', '#FF9F1C', '#1A3A2B', '#42B883']
const MHS_COLORS = ['#B34F00', '#DE350B', '#42B883', '#0052CC', '#FFAB00']

function pickKategoriValue(kategoriPoin = {}, keys) {
  for (const key of keys) {
    const found = Object.entries(kategoriPoin).find(([k]) => k.toLowerCase().includes(key))
    if (found) return Number(found[1]) || 0
  }
  return 0
}

function KategoriPoinBar({ item }) {
  const total = item.poin || KATEGORI.reduce((s, k) => s + (item[k.key] || 0), 0) || 1

  return (
    <div className="flex h-2.5 w-32 overflow-hidden rounded-full bg-[#e9ebf8]">
      {KATEGORI.map((k) => (
        <div
          key={k.key}
          style={{ width: `${((item[k.key] || 0) / total) * 100}%`, backgroundColor: k.color }}
          title={`${k.label}: ${item[k.key] || 0}`}
        />
      ))}
    </div>
  )
}

function HorizontalStackedBar({ data, maxVal }) {
  const skala = maxVal || 1

  return (
    <div>
      <div className="space-y-4">
        {data.map((d) => {
          const totalKategori = KATEGORI.reduce((s, k) => s + (d[k.key] || 0), 0) || 1
          const lebarBar = (d.poin / skala) * 100

          return (
            <div key={d.prodi} className="flex items-center gap-3">
              <span className="w-[140px] shrink-0 truncate text-right text-xs font-semibold text-brand-dark">
                {d.prodi}
              </span>
              <div className="h-7 flex-1 rounded-md border border-[#e9ebf8] bg-[#f9fafb]">
                <div className="flex h-full overflow-hidden rounded-md" style={{ width: `${lebarBar}%` }}>
                  {KATEGORI.map((k) => (
                    <div
                      key={k.key}
                      style={{
                        width: `${((d[k.key] || 0) / totalKategori) * 100}%`,
                        backgroundColor: k.color,
                      }}
                      title={`${k.label}: ${d[k.key] || 0}`}
                    />
                  ))}
                </div>
              </div>
              <span className="w-12 shrink-0 text-left text-xs font-bold text-brand-dark">{d.poin}</span>
            </div>
          )
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-xs font-medium text-[#616161]">
        {KATEGORI.map((k) => (
          <span key={k.key} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded" style={{ backgroundColor: k.color }}></span>
            {k.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function SvgDoughnut({ centerTitle = 'Total', centerValue, centerLabel, sections, size = 'h-44 w-44' }) {
  let offsetBerjalan = 0

  return (
    <div className={`relative ${size} flex items-center justify-center`}>
      <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 42 42">
        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#eef0f7" strokeWidth="4.5" />
        {sections.map((cur, i) => {
          const dashOffset = 100 - offsetBerjalan
          offsetBerjalan += cur.percentage
          return (
            <circle
              key={i}
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke={cur.color}
              strokeWidth="4.5"
              strokeDasharray={`${cur.percentage} ${100 - cur.percentage}`}
              strokeDashoffset={dashOffset}
            />
          )
        })}
      </svg>
      <div className="absolute text-center">
        <p className="text-[10px] font-semibold uppercase leading-none tracking-wider text-[#9aa0a6]">{centerTitle}</p>
        <p className="my-0.5 text-2xl font-extrabold text-brand-dark">{centerValue}</p>
        <p className="text-[10px] font-medium leading-none text-[#616161]">{centerLabel}</p>
      </div>
    </div>
  )
}

function DetailFakultasProdi() {
  const { fakultas } = useParams()
  const location = useLocation()
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
    () => distribusiPoin.reduce((s, p) => s + (p.jumlahMahasiswa || 0), 0) ||
      prodiList.reduce((s, p) => s + (p.mahasiswa || 0), 0),
    [distribusiPoin, prodiList],
  )
  const totalPoin = prodiList.reduce((s, p) => s + p.poin, 0)
  const maxPoin = Math.max(...prodiList.map((p) => p.poin), 1)

  const mhsSections = prodiList.map((p, idx) => ({
    percentage: (p.mahasiswa / (totalMahasiswa || 1)) * 100,
    color: MHS_COLORS[idx % MHS_COLORS.length],
    label: p.prodi,
  }))

  const skalaKegiatan = poinBerdasarkanSkala.map((s, i) => ({
    label: s.skala || '-',
    percentage: s.persentaseDariTotal ?? 0,
    color: SKALA_COLORS[i % SKALA_COLORS.length],
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
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-bold text-[#222]">Fakultas tidak ditemukan</h2>
          <p className="mt-2 text-sm text-[#616161]">
            ID fakultas tidak valid. Pilih fakultas lain dari halaman ringkasan.
          </p>
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
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="bg-gradient-to-r from-brand-dark to-brand-light bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl">
              Fakultas {namaFakultas || fakultasId}
            </h2>
            <p className="mt-1 text-sm text-[#616161]">Detail program studi dan poin capaian mahasiswa.</p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-center">
            <label htmlFor="filter-prodi" className="whitespace-nowrap text-sm font-semibold text-[#333]">
              Filter Prodi
            </label>
            <div className="relative">
              <select
                id="filter-prodi"
                value={selectedProdi}
                onChange={(e) => setSelectedProdi(e.target.value)}
                className="cursor-pointer appearance-none rounded-lg border border-[#e9ebf8] bg-white py-2 pl-4 pr-10 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
              >
                {['Semua Prodi', ...prodiList.map((p) => p.prodi)].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#616161]" />
            </div>
            {selectedProdi !== 'Semua Prodi' && (
              <button
                type="button"
                onClick={() => setSelectedProdi('Semua Prodi')}
                className="rounded-lg border border-brand-dark bg-white px-3 py-2 text-sm font-medium text-brand-dark transition hover:bg-[#f5f5f5]"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-[#222]">Kurikulum Aktif</h3>
            <p className="mt-1 text-sm font-semibold text-[#333]">{kurikulumLabel}</p>
            <p className="mt-0.5 text-xs text-[#616161]">
              {Number(statistik?.totalMahasiswa ?? totalMahasiswa).toLocaleString('id-ID')} Mahasiswa Terdaftar
            </p>
          </div>
          <span className="rounded-full bg-gradient-to-r from-brand-dark to-brand-light px-4 py-1 text-xs font-bold text-white shadow-sm">
            Aktif
          </span>
        </div>

        <TableCard title="Peringkat Prodi">
          <TableFrame>
          <DataTable
            loading={loading}
            data={filteredProdi}
            emptyText="Belum ada data prodi."
            columns={[
              { key: 'rank', label: 'Ranking', render: (item) => <span className="block text-center font-semibold text-[#616161]">{item.rank}.</span> },
              { key: 'prodi', label: 'Program Studi', render: (item) => <span className="font-semibold text-brand-dark">{item.prodi}</span> },
              { key: 'poin', label: 'Total Poin', render: (item) => <span className="font-bold text-[#333]">{item.poin}</span> },
              { key: 'kategori', label: 'Kategori Poin', render: (item) => <KategoriPoinBar item={item} /> },
            ]}
          />
          </TableFrame>
        </TableCard>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm md:col-span-3">
            <h3 className="mb-6 text-center text-lg font-bold text-[#222]">Rata-rata capaian per prodi</h3>
            {loading || filteredProdi.length === 0 ? (
              <p className="py-10 text-center text-sm text-[#9aa0a6]">Belum ada data grafik.</p>
            ) : (
              <HorizontalStackedBar data={filteredProdi} maxVal={maxPoin} />
            )}
          </div>

          <div className="flex flex-col items-center rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm md:col-span-2">
            <h3 className="mb-4 text-center text-lg font-bold text-[#222]">Total mahasiswa</h3>
            <SvgDoughnut
              centerValue={Number(totalMahasiswa).toLocaleString('id-ID')}
              centerLabel="Mahasiswa"
              sections={mhsSections.length ? mhsSections : [{ percentage: 100, color: '#eef0f7' }]}
            />
            <div className="mt-6 w-full space-y-2 text-xs font-semibold">
              {prodiList.map((p, idx) => (
                <div key={p.prodi} className="flex items-center justify-between text-[#616161]">
                  <div className="flex max-w-[75%] items-center gap-2.5 truncate">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: MHS_COLORS[idx % MHS_COLORS.length] }}
                    />
                    <span className="truncate">{p.prodi}</span>
                  </div>
                  <span className="font-bold text-[#9aa0a6]">
                    {Math.round((p.mahasiswa / (totalMahasiswa || 1)) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-center text-lg font-bold text-[#222]">Poin berdasarkan skala kegiatan</h3>
          <div className="flex flex-col items-center justify-around gap-8 sm:flex-row">
            <SvgDoughnut
              centerValue={Number(totalPoin).toLocaleString('id-ID')}
              centerLabel="Poin"
              sections={skalaKegiatan.length ? skalaKegiatan : [{ percentage: 100, color: '#eef0f7' }]}
            />
            <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-xs font-semibold">
              {skalaKegiatan.map((s) => (
                <div key={s.label} className="flex items-center gap-3 text-[#616161]">
                  <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: s.color }}></span>
                  <span>{s.label} ({s.percentage}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default DetailFakultasProdi
