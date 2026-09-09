import { useEffect, useMemo, useState } from 'react'
import { FileSpreadsheet, FileText, Filter, RotateCcw, Search } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatCard from '../../components/dashboard/StatCard'
import DataTable from '../../components/dashboard/DataTable'
import ProgressBar from '../../components/dashboard/ProgressBar'
import StatusBadge from '../../components/dashboard/StatusBadge'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import { ChartSkeleton } from '../../components/dashboard/Skeleton'
import { VerticalBarChart } from '../../components/charts'
import { getCurrentUser } from '../../services/authService'
import {
  getPreviewLaporan,
  downloadExcelLaporan,
  downloadPdfLaporan,
  getFakultasList,
  getProdiList,
} from '../../services/laporanService'
import { getKurikulumAktif } from '../../services/kurikulumService'

const ROLE_LABEL = {
  pimpinan_utama: 'Pimpinan Utama',
  pimpinan_ditmawa: 'Pimpinan Ditmawa',
  pimpinan_fakultas: 'Pimpinan Fakultas',
  admin_ditmawa: 'Admin Ditmawa',
}

const GLOBAL_ROLES = new Set(['pimpinan_utama', 'pimpinan_ditmawa', 'admin_ditmawa'])

const TABS = [
  { id: 'ringkasan', label: 'Ringkasan' },
  { id: 'mahasiswa', label: 'Mahasiswa' },
  { id: 'prestasi', label: 'Prestasi' },
  { id: 'ormawa', label: 'Ormawa' },
]

const TAHUN_AKADEMIK = ['2025/2026', '2024/2025', '2023/2024', '2022/2023']
const ANGKATAN = ['2025', '2024', '2023', '2022', '2021']

function includesQuery(value, query) {
  return String(value || '').toLowerCase().includes(query)
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('id-ID')
}

/** Kurikulum aktif dengan angkatanMulai / id tertinggi. */
function pickDefaultKurikulumId(list) {
  if (!Array.isArray(list) || list.length === 0) return ''
  const sorted = [...list].sort((a, b) => {
    const angA = Number(a.angkatanMulai) || 0
    const angB = Number(b.angkatanMulai) || 0
    if (angB !== angA) return angB - angA
    return Number(b.id) - Number(a.id)
  })
  return String(sorted[0].id)
}

function ToolbarSelect({ label, value, onChange, children, className = '' }) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-xs font-medium text-base-content/70">{label}</span>
      <select value={value} onChange={onChange} className="select select-sm w-full font-normal">
        {children}
      </select>
    </label>
  )
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <label className="input input-sm flex-1">
      <Search className="h-4 w-4 shrink-0 opacity-50" />
      <input type="text" value={value} onChange={onChange} placeholder={placeholder} />
    </label>
  )
}

function LaporanPimpinan({ defaultRole, embedded = false }) {
  const user = getCurrentUser()
  const resolvedRole = defaultRole || user?.role || 'pimpinan_utama'
  const isGlobalScope = GLOBAL_ROLES.has(resolvedRole)

  const [angkatan, setAngkatan] = useState('')
  const [kurikulumId, setKurikulumId] = useState('')
  const [kurikulumOptions, setKurikulumOptions] = useState([])
  const [fakultasId, setFakultasId] = useState('')
  const [prodiId, setProdiId] = useState('')
  const [fakultasOptions, setFakultasOptions] = useState([])
  const [prodiOptions, setProdiOptions] = useState([])

  const [loading, setLoading] = useState(true)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [laporanData, setLaporanData] = useState(null)
  const [activeTab, setActiveTab] = useState('ringkasan')

  const [searchMahasiswa, setSearchMahasiswa] = useState('')
  const [filterStatusMahasiswa, setFilterStatusMahasiswa] = useState('semua')
  const [searchPrestasi, setSearchPrestasi] = useState('')
  const [filterSkalaPrestasi, setFilterSkalaPrestasi] = useState('semua')
  const [searchOrmawa, setSearchOrmawa] = useState('')

  const buildFilter = (overrides = {}) => {
    const nextAngkatan = overrides.angkatan ?? angkatan
    const nextKurikulum = overrides.kurikulumId ?? kurikulumId
    const nextFakultas = overrides.fakultasId ?? fakultasId
    const nextProdi = overrides.prodiId ?? prodiId
    return {
      angkatan: nextAngkatan ? Number(nextAngkatan) : undefined,
      kurikulumId: nextKurikulum ? Number(nextKurikulum) : undefined,
      fakultasId: nextFakultas ? Number(nextFakultas) : undefined,
      prodiId: nextProdi ? Number(nextProdi) : undefined,
    }
  }

  const fetchData = async (overrides) => {
    setLoading(true)
    try {
      const res = await getPreviewLaporan(buildFilter(overrides))
      if (res?.success) {
        setLaporanData(res.data)
      } else {
        toast.error(res?.message || 'Gagal memuat data laporan')
      }
    } catch (error) {
      toast.error('Gagal memuat preview laporan', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getFakultasList().then(setFakultasOptions).catch(() => setFakultasOptions([]))
    getKurikulumAktif()
      .then((list) => {
        const options = Array.isArray(list) ? list : []
        const defaultId = pickDefaultKurikulumId(options)
        setKurikulumOptions(options)
        setKurikulumId(defaultId)
        fetchData({ kurikulumId: defaultId })
      })
      .catch(() => {
        setKurikulumOptions([])
        fetchData({ kurikulumId: '' })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    getProdiList(fakultasId || undefined).then(setProdiOptions).catch(() => setProdiOptions([]))
    setProdiId('')
  }, [fakultasId])

  const handleApplyFilter = (e) => {
    e?.preventDefault()
    fetchData()
  }

  const handleResetFilter = () => {
    const defaultId = pickDefaultKurikulumId(kurikulumOptions)
    setAngkatan('')
    setKurikulumId(defaultId)
    setFakultasId('')
    setProdiId('')
    fetchData({ angkatan: '', kurikulumId: defaultId, fakultasId: '', prodiId: '' })
  }

  const handleDownloadExcel = async () => {
    setExportingExcel(true)
    const toastId = toast.loading('Menyiapkan file CSV...')
    try {
      await downloadExcelLaporan(buildFilter())
      toast.success('File CSV berhasil diunduh.', { id: toastId })
    } catch (error) {
      toast.error('Gagal mengunduh CSV', { id: toastId, description: error.message })
    } finally {
      setExportingExcel(false)
    }
  }

  const handleDownloadPdf = async () => {
    setExportingPdf(true)
    const toastId = toast.loading('Menyiapkan dokumen PDF...')
    try {
      await downloadPdfLaporan(buildFilter())
      toast.success('Dokumen PDF berhasil diunduh.', { id: toastId })
    } catch (error) {
      toast.error('Gagal mengunduh PDF', { id: toastId, description: error.message })
    } finally {
      setExportingPdf(false)
    }
  }

  const mahasiswaList = laporanData?.mahasiswaList || []
  const prestasiList = laporanData?.prestasiList || []
  const ormawaList = laporanData?.ormawaList || []
  const rankingItems = laporanData?.komparasi?.items || []
  const rankingUnit = laporanData?.komparasi?.unit === 'prodi' ? 'program studi' : 'fakultas'
  const rankingLabel = rankingUnit === 'program studi' ? 'Program studi' : 'Fakultas'

  const filteredMahasiswa = useMemo(() => {
    const q = searchMahasiswa.trim().toLowerCase()
    return mahasiswaList.filter((m) => {
      const matchSearch = !q || includesQuery(m.nama, q) || includesQuery(m.nim, q) || includesQuery(m.prodi, q)
      const matchStatus =
        filterStatusMahasiswa === 'semua' ||
        (filterStatusMahasiswa === 'tercapai' && m.statusTarget === 'Tercapai') ||
        (filterStatusMahasiswa === 'belum' && m.statusTarget === 'Belum Tercapai')
      return matchSearch && matchStatus
    })
  }, [mahasiswaList, searchMahasiswa, filterStatusMahasiswa])

  const filteredPrestasi = useMemo(() => {
    const q = searchPrestasi.trim().toLowerCase()
    return prestasiList.filter((p) => {
      const matchSearch =
        !q ||
        includesQuery(p.namaMahasiswa, q) ||
        includesQuery(p.nim, q) ||
        includesQuery(p.namaKegiatan, q)
      const matchSkala =
        filterSkalaPrestasi === 'semua' || includesQuery(p.skala, filterSkalaPrestasi.toLowerCase())
      return matchSearch && matchSkala
    })
  }, [prestasiList, searchPrestasi, filterSkalaPrestasi])

  const filteredOrmawa = useMemo(() => {
    const q = searchOrmawa.trim().toLowerCase()
    if (!q) return ormawaList
    return ormawaList.filter(
      (o) => includesQuery(o.nama, q) || includesQuery(o.tipe, q) || includesQuery(o.fakultas, q)
    )
  }, [ormawaList, searchOrmawa])

  const kpi = laporanData?.kpi
  const scopeNama = laporanData?.scopeNama || 'Universitas Andalas'
  const targetPoin = laporanData?.kurikulum?.targetPoin ?? 200
  const defaultKurikulumId = pickDefaultKurikulumId(kurikulumOptions)
  const hasActiveFilter = Boolean(
    angkatan
    || fakultasId
    || prodiId
    || (kurikulumId && kurikulumId !== defaultKurikulumId),
  )
  const kurikulumStats = laporanData?.capaianKurikulumStats || []
  const selectedKurikulum = kurikulumOptions.find((k) => String(k.id) === String(kurikulumId))
  const kurikulumChartLabel = selectedKurikulum
    ? `${selectedKurikulum.nama}${selectedKurikulum.angkatanMulai ? ` (${selectedKurikulum.angkatanMulai}+)` : ''}`
    : null

  const content = (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-base-content">Laporan & Evaluasi</h2>
          <p className="mt-1 text-sm text-base-content/60">{scopeNama}</p>
        </div>
        <div className="join">
          <button
            type="button"
            onClick={handleDownloadExcel}
            disabled={loading || exportingExcel}
            className="btn btn-outline btn-sm join-item"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {exportingExcel ? 'Mengunduh…' : 'CSV'}
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={loading || exportingPdf}
            className="btn btn-outline btn-sm join-item"
          >
            <FileText className="h-4 w-4" />
            {exportingPdf ? 'Mengunduh…' : 'PDF'}
          </button>
        </div>
      </div>

      <form onSubmit={handleApplyFilter} className="card bg-base-100 p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <ToolbarSelect label="Angkatan" className="w-28 shrink-0" value={angkatan} onChange={(e) => setAngkatan(e.target.value)}>
            <option value="">Semua</option>
            {ANGKATAN.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </ToolbarSelect>

          <ToolbarSelect label="Kurikulum" className="min-w-[260px] flex-1" value={kurikulumId} onChange={(e) => setKurikulumId(e.target.value)}>
            {kurikulumOptions.length === 0 ? (
              <option value="">Belum ada kurikulum aktif</option>
            ) : (
              kurikulumOptions.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}{k.angkatanMulai ? ` (${k.angkatanMulai}+)` : ''}
                </option>
              ))
            )}
          </ToolbarSelect>

          {isGlobalScope ? (
            <ToolbarSelect label="Fakultas" className="min-w-[200px] flex-1" value={fakultasId} onChange={(e) => setFakultasId(e.target.value)}>
              <option value="">Semua</option>
              {fakultasOptions.map((f) => (
                <option key={f.id} value={f.id}>{f.nama}</option>
              ))}
            </ToolbarSelect>
          ) : (
            <label className="flex min-w-36 flex-1 flex-col gap-1">
              <span className="text-xs text-base-content/60">Fakultas</span>
              <input type="text" disabled value={scopeNama} className="input input-sm w-full" />
            </label>
          )}

          <ToolbarSelect label="Program studi" className="min-w-[200px] flex-1" value={prodiId} onChange={(e) => setProdiId(e.target.value)}>
            <option value="">Semua</option>
            {prodiOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.nama}</option>
            ))}
          </ToolbarSelect>

          <div className="flex items-center gap-2 pb-0.5">
            <button type="submit" className="btn btn-primary btn-sm">
              <Filter className="h-4 w-4" />
              Terapkan
            </button>
            {hasActiveFilter ? (
              <button type="button" onClick={handleResetFilter} className="btn btn-ghost btn-sm">
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            ) : null}
          </div>
        </div>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Mahasiswa"
          loading={loading}
          value={formatNumber(kpi?.totalMahasiswa)}
        />
        <StatCard
          label="Rata-rata poin"
          loading={loading}
          value={`${kpi?.rataRataPoin ?? 0}`}
          sublabel={`Target ${targetPoin}`}
        />
        <StatCard
          label="Capaian"
          loading={loading}
          value={`${kpi?.rataRataPersentase ?? 0}%`}
          sublabel={`${kpi?.persentaseLulusTarget ?? 0}% lulus target`}
        />
        <StatCard
          label="Poin sah"
          loading={loading}
          value={formatNumber(kpi?.totalPoinSah)}
          sublabel={`${kpi?.totalPrestasi ?? 0} prestasi`}
        />
      </div>

      <div role="tablist" className="tabs tabs-box">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'ringkasan' && (
        <div className="space-y-5">
          <TableCard
            title="Capaian kurikulum"
            description={
              kurikulumChartLabel
                ? `Target ${targetPoin} poin · ${kurikulumChartLabel}`
                : `Target ${targetPoin} poin`
            }
            headerRight={
              kurikulumOptions.length > 0 ? (
                <select
                  className="select select-sm min-w-52 max-w-xs"
                  value={kurikulumId}
                  aria-label="Filter kurikulum"
                  onChange={(e) => {
                    const next = e.target.value
                    setKurikulumId(next)
                    fetchData({ kurikulumId: next })
                  }}
                >
                  {kurikulumOptions.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama}{k.angkatanMulai ? ` (${k.angkatanMulai}+)` : ''}
                    </option>
                  ))}
                </select>
              ) : null
            }
          >
            {loading ? (
              <ChartSkeleton />
            ) : kurikulumStats.length === 0 ? (
              <p className="py-8 text-center text-sm text-base-content/50">Belum ada data kurikulum.</p>
            ) : (
              <VerticalBarChart
                labels={kurikulumStats.map((c) => c.nama || `Tahun ${c.tahun}`)}
                values={kurikulumStats.map((c) => Number(c.persentaseCapaian) || 0)}
                height={kurikulumStats.length > 4 ? 320 : 220}
              />
            )}
          </TableCard>

          <TableCard
            title={`Peringkat ${rankingUnit}`}
            description={loading ? undefined : `${rankingItems.length} ${rankingUnit}`}
          >
            <TableFrame>
              <DataTable
                loading={loading}
                data={rankingItems}
                emptyText="Belum ada data peringkat."
                pageSize={15}
                columns={[
                  {
                    key: 'ranking',
                    label: 'No',
                    center: true,
                    render: (item) => (
                      <span className="tabular-nums text-base-content/70">{item.ranking}</span>
                    ),
                  },
                  { key: 'nama', label: rankingLabel },
                  {
                    key: 'totalMahasiswa',
                    label: 'Mhs',
                    center: true,
                    render: (item) => (
                      <span className="tabular-nums">{formatNumber(item.totalMahasiswa)}</span>
                    ),
                  },
                  {
                    key: 'rataRataPoin',
                    label: 'Rata-rata',
                    center: true,
                    render: (item) => (
                      <span className="tabular-nums">{formatNumber(item.rataRataPoin)}</span>
                    ),
                  },
                  {
                    key: 'rataRataPersentase',
                    label: 'Capaian',
                    render: (item) => (
                      <div className="min-w-28">
                        <ProgressBar
                          value={Number(item.rataRataPersentase) || 0}
                          max={100}
                          height={6}
                          showPercent
                        />
                      </div>
                    ),
                  },
                ]}
              />
            </TableFrame>
          </TableCard>
        </div>
      )}

      {activeTab === 'mahasiswa' && (
        <TableCard
          title="Capaian mahasiswa"
          description={`${filteredMahasiswa.length} mahasiswa`}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SearchInput
              value={searchMahasiswa}
              onChange={(e) => setSearchMahasiswa(e.target.value)}
              placeholder="Cari NIM, nama, atau prodi"
            />
            <select
              value={filterStatusMahasiswa}
              onChange={(e) => setFilterStatusMahasiswa(e.target.value)}
              className="select select-sm sm:w-44"
            >
              <option value="semua">Semua status</option>
              <option value="tercapai">Tercapai</option>
              <option value="belum">Belum tercapai</option>
            </select>
          </div>
          <TableFrame>
            <DataTable
              loading={loading}
              data={filteredMahasiswa}
              emptyText="Tidak ada data mahasiswa."
              pageSize={15}
              columns={[
                { key: 'nim', label: 'NIM' },
                { key: 'nama', label: 'Nama' },
                { key: 'prodi', label: 'Prodi' },
                {
                  key: 'totalPoin',
                  label: 'Poin',
                  center: true,
                  render: (row) => (
                    <span className="tabular-nums">{row.totalPoin} / {row.targetPoin}</span>
                  ),
                },
                {
                  key: 'persentase',
                  label: 'Capaian',
                  center: true,
                  render: (row) => <span className="tabular-nums">{row.persentase}%</span>,
                },
                {
                  key: 'statusTarget',
                  label: 'Status',
                  render: (row) => <StatusBadge status={row.statusTarget} />,
                },
              ]}
            />
          </TableFrame>
        </TableCard>
      )}

      {activeTab === 'prestasi' && (
        <TableCard
          title="Prestasi"
          description={`${filteredPrestasi.length} kejuaraan`}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SearchInput
              value={searchPrestasi}
              onChange={(e) => setSearchPrestasi(e.target.value)}
              placeholder="Cari mahasiswa atau kegiatan"
            />
            <select
              value={filterSkalaPrestasi}
              onChange={(e) => setFilterSkalaPrestasi(e.target.value)}
              className="select select-sm sm:w-44"
            >
              <option value="semua">Semua skala</option>
              <option value="internasional">Internasional</option>
              <option value="nasional">Nasional</option>
              <option value="wilayah">Wilayah</option>
            </select>
          </div>
          <TableFrame>
            <DataTable
              loading={loading}
              data={filteredPrestasi}
              emptyText="Belum ada data prestasi."
              pageSize={15}
              columns={[
                { key: 'namaMahasiswa', label: 'Mahasiswa' },
                { key: 'namaKegiatan', label: 'Kegiatan' },
                { key: 'skala', label: 'Skala' },
                { key: 'peran', label: 'Peringkat' },
                {
                  key: 'poin',
                  label: 'Poin',
                  center: true,
                  render: (row) => <span className="tabular-nums">+{row.poin}</span>,
                },
              ]}
            />
          </TableFrame>
        </TableCard>
      )}

      {activeTab === 'ormawa' && (
        <TableCard
          title="Keaktifan ormawa"
          description={`${filteredOrmawa.length} organisasi`}
        >
          <SearchInput
            value={searchOrmawa}
            onChange={(e) => setSearchOrmawa(e.target.value)}
            placeholder="Cari organisasi"
          />
          <TableFrame>
            <DataTable
              loading={loading}
              data={filteredOrmawa}
              emptyText="Belum ada data ormawa."
              pageSize={15}
              columns={[
                { key: 'nama', label: 'Organisasi' },
                {
                  key: 'tipe',
                  label: 'Tipe',
                  render: (row) => <span className="badge badge-ghost badge-sm">{row.tipe || '—'}</span>,
                },
                {
                  key: 'totalKegiatan',
                  label: 'Kegiatan',
                  center: true,
                  render: (row) => <span className="tabular-nums">{formatNumber(row.totalKegiatan)}</span>,
                },
                {
                  key: 'totalPeserta',
                  label: 'Partisipasi',
                  center: true,
                  render: (row) => <span className="tabular-nums">{formatNumber(row.totalPeserta)}</span>,
                },
                {
                  key: 'totalPoinDidistribusikan',
                  label: 'Poin',
                  center: true,
                  render: (row) => (
                    <span className="tabular-nums">{formatNumber(row.totalPoinDidistribusikan)}</span>
                  ),
                },
              ]}
            />
          </TableFrame>
        </TableCard>
      )}
    </div>
  )

  if (embedded) return content

  return (
    <DashboardLayout
      role={resolvedRole}
      userName={user?.nama || 'Pimpinan'}
      userRole={ROLE_LABEL[resolvedRole] || 'Admin Fakultas'}
    >
      {content}
    </DashboardLayout>
  )
}

export default LaporanPimpinan
