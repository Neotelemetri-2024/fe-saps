import { useEffect, useMemo, useState } from 'react'
import { FileSpreadsheet, FileText, Filter, RotateCcw, Search } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatCard from '../../components/dashboard/StatCard'
import DataTable from '../../components/dashboard/DataTable'
import ProgressBar from '../../components/dashboard/ProgressBar'
import StatusBadge from '../../components/dashboard/StatusBadge'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import { CardGridSkeleton } from '../../components/dashboard/Skeleton'
import { getCurrentUser } from '../../services/authService'
import {
  getPreviewLaporan,
  downloadExcelLaporan,
  downloadPdfLaporan,
  getFakultasList,
  getProdiList,
} from '../../services/laporanService'

const ROLE_LABEL = {
  pimpinan_utama: 'Pimpinan Utama',
  pimpinan_ditmawa: 'Pimpinan Ditmawa',
  pimpinan_fakultas: 'Pimpinan Fakultas',
  admin_ditmawa: 'Admin Ditmawa',
}

const GLOBAL_ROLES = new Set(['pimpinan_utama', 'pimpinan_ditmawa', 'admin_ditmawa'])

const TABS = [
  { id: 'ringkasan', label: 'Ringkasan' },
  { id: 'mahasiswa', label: 'Capaian Mahasiswa' },
  { id: 'prestasi', label: 'Prestasi' },
  { id: 'ormawa', label: 'Keaktifan Ormawa' },
]

const TAHUN_AKADEMIK = ['2025/2026', '2024/2025', '2023/2024', '2022/2023']
const ANGKATAN = ['2025', '2024', '2023', '2022', '2021']

function includesQuery(value, query) {
  return String(value || '').toLowerCase().includes(query)
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('id-ID')
}

function formatDistribusi(kategoriPoin = {}) {
  const items = Object.entries(kategoriPoin)
    .map(([label, value]) => [label, Number(value) || 0])
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])

  if (!items.length) return '—'

  return items
    .slice(0, 3)
    .map(([label, value]) => `${label} ${formatNumber(value)}`)
    .join(' · ')
}

function FilterSelect({ label, value, onChange, children }) {
  return (
    <fieldset className="fieldset">
      {label ? <legend className="fieldset-legend py-1">{label}</legend> : null}
      <select value={value} onChange={onChange} className="select w-full">
        {children}
      </select>
    </fieldset>
  )
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <label className="input flex-1">
      <Search className="h-4 w-4 shrink-0 text-base-content/50" />
      <input type="text" value={value} onChange={onChange} placeholder={placeholder} />
    </label>
  )
}

function LaporanPimpinan({ defaultRole, embedded = false }) {
  const user = getCurrentUser()
  const resolvedRole = defaultRole || user?.role || 'pimpinan_utama'
  const isGlobalScope = GLOBAL_ROLES.has(resolvedRole)

  const [tahunAkademik, setTahunAkademik] = useState('')
  const [angkatan, setAngkatan] = useState('')
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
    const nextTahun = overrides.tahunAkademik ?? tahunAkademik
    const nextAngkatan = overrides.angkatan ?? angkatan
    const nextFakultas = overrides.fakultasId ?? fakultasId
    const nextProdi = overrides.prodiId ?? prodiId
    return {
      tahunAkademik: nextTahun || undefined,
      angkatan: nextAngkatan ? Number(nextAngkatan) : undefined,
      fakultasId: nextFakultas ? Number(nextFakultas) : undefined,
      prodiId: nextProdi ? Number(nextProdi) : undefined,
    }
  }

  useEffect(() => {
    getFakultasList().then(setFakultasOptions).catch(() => setFakultasOptions([]))
  }, [])

  useEffect(() => {
    getProdiList(fakultasId || undefined).then(setProdiOptions).catch(() => setProdiOptions([]))
    setProdiId('')
  }, [fakultasId])

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
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleApplyFilter = (e) => {
    e?.preventDefault()
    fetchData()
  }

  const handleResetFilter = () => {
    setTahunAkademik('')
    setAngkatan('')
    setFakultasId('')
    setProdiId('')
    fetchData({ tahunAkademik: '', angkatan: '', fakultasId: '', prodiId: '' })
  }

  const handleDownloadExcel = async () => {
    setExportingExcel(true)
    const toastId = toast.loading('Menyiapkan file Excel...')
    try {
      await downloadExcelLaporan(buildFilter())
      toast.success('File Excel berhasil diunduh.', { id: toastId })
    } catch (error) {
      toast.error('Gagal mengunduh Excel', { id: toastId, description: error.message })
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
  const rankingLabel = rankingUnit === 'program studi' ? 'Program Studi' : 'Fakultas'

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
        includesQuery(p.namaKegiatan, q) ||
        includesQuery(p.prodi, q)
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
  const hasActiveFilter = Boolean(tahunAkademik || angkatan || fakultasId || prodiId)
  const kurikulumStats = laporanData?.capaianKurikulumStats || []

  const content = (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-base-content">Laporan & Evaluasi</h2>
          <p className="mt-1 text-sm text-base-content/60">
            Capaian kurikulum, prestasi, dan keaktifan ormawa{scopeNama ? ` — ${scopeNama}` : ''}.
          </p>
        </div>
        <div className="join">
          <button
            type="button"
            onClick={handleDownloadExcel}
            disabled={loading || exportingExcel}
            className="btn btn-outline btn-sm join-item"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {exportingExcel ? 'Mengunduh…' : 'Excel'}
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

      <TableCard
        title="Filter laporan"
        description={`${laporanData?.kurikulum?.nama || 'Kurikulum SAPS'} · target ${targetPoin} poin`}
        headerRight={
          hasActiveFilter ? (
            <button type="button" onClick={handleResetFilter} className="btn btn-ghost btn-sm">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          ) : null
        }
      >
        <form onSubmit={handleApplyFilter} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <FilterSelect label="Tahun akademik" value={tahunAkademik} onChange={(e) => setTahunAkademik(e.target.value)}>
            <option value="">Semua tahun</option>
            {TAHUN_AKADEMIK.map((tahun) => (
              <option key={tahun} value={tahun}>{tahun}</option>
            ))}
          </FilterSelect>

          <FilterSelect label="Angkatan" value={angkatan} onChange={(e) => setAngkatan(e.target.value)}>
            <option value="">Semua angkatan</option>
            {ANGKATAN.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </FilterSelect>

          {isGlobalScope ? (
            <FilterSelect label="Fakultas" value={fakultasId} onChange={(e) => setFakultasId(e.target.value)}>
              <option value="">Seluruh fakultas</option>
              {fakultasOptions.map((f) => (
                <option key={f.id} value={f.id}>{f.nama}</option>
              ))}
            </FilterSelect>
          ) : (
            <fieldset className="fieldset">
              <legend className="fieldset-legend py-1">Fakultas</legend>
              <input type="text" disabled value={scopeNama} className="input w-full" />
            </fieldset>
          )}

          <FilterSelect label="Program studi" value={prodiId} onChange={(e) => setProdiId(e.target.value)}>
            <option value="">Semua prodi</option>
            {prodiOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.nama}</option>
            ))}
          </FilterSelect>

          <div className="flex items-end">
            <button type="submit" className="btn btn-primary w-full">
              <Filter className="h-4 w-4" />
              Terapkan
            </button>
          </div>
        </form>
      </TableCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total mahasiswa"
          value={loading ? '…' : formatNumber(kpi?.totalMahasiswa)}
        />
        <StatCard
          label="Rata-rata poin"
          value={loading ? '…' : `${kpi?.rataRataPoin ?? 0}`}
          sublabel={`Target ${targetPoin} poin`}
        />
        <StatCard
          label="Rata-rata capaian"
          value={loading ? '…' : `${kpi?.rataRataPersentase ?? 0}%`}
          sublabel={`${kpi?.persentaseLulusTarget ?? 0}% memenuhi target`}
        />
        <StatCard
          label="Total poin sah"
          value={loading ? '…' : formatNumber(kpi?.totalPoinSah)}
          sublabel={`${kpi?.totalPrestasi ?? 0} prestasi`}
        />
      </div>

      <div role="tablist" className="tabs tabs-box">
        {TABS.map((tab) => {
          const count =
            tab.id === 'mahasiswa' ? mahasiswaList.length
              : tab.id === 'prestasi' ? prestasiList.length
              : tab.id === 'ormawa' ? ormawaList.length
              : null
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {count != null && <span className="ml-1.5 opacity-60">{count}</span>}
            </button>
          )
        })}
      </div>

      {activeTab === 'ringkasan' && (
        <div className="space-y-5">
          <TableCard
            title="Evaluasi kurikulum"
            description="Rata-rata poin per tahapan tahun akademik"
          >
            {loading ? (
              <CardGridSkeleton />
            ) : kurikulumStats.length === 0 ? (
              <p className="py-8 text-center text-sm text-base-content/50">Belum ada data evaluasi kurikulum.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {kurikulumStats.map((c, i) => (
                  <div key={c.nama || i} className="rounded-md border border-base-300 p-4">
                    <p className="text-xs text-base-content/60">Tahun {c.tahun}</p>
                    <p className="mt-1 text-sm font-medium text-base-content">{c.nama}</p>
                    <p className="mt-2 text-sm tabular-nums text-base-content">
                      {c.rataRataTerkumpul} / {c.targetPoin} poin
                      <span className="ml-1.5 text-base-content/60">{c.persentaseCapaian}%</span>
                    </p>
                    <div className="mt-3">
                      <ProgressBar value={c.rataRataTerkumpul} max={c.targetPoin || 50} height={6} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TableCard>

          <TableCard
            title={`Peringkat ${rankingUnit}`}
            description="Diurutkan dari rata-rata capaian tertinggi. Distribusi menampilkan tiga kategori poin terbesar."
          >
            <TableFrame>
              <DataTable
                loading={loading}
                data={rankingItems}
                emptyText="Belum ada data peringkat."
                columns={[
                  {
                    key: 'ranking',
                    label: 'No',
                    center: true,
                    render: (item) => (
                      <span className="tabular-nums text-base-content/70">{item.ranking}</span>
                    ),
                  },
                  {
                    key: 'nama',
                    label: rankingLabel,
                    render: (item) => <span className="text-base-content">{item.nama || '—'}</span>,
                  },
                  {
                    key: 'totalMahasiswa',
                    label: 'Mahasiswa',
                    center: true,
                    render: (item) => (
                      <span className="tabular-nums">{formatNumber(item.totalMahasiswa)}</span>
                    ),
                  },
                  {
                    key: 'totalPoin',
                    label: 'Total poin',
                    center: true,
                    render: (item) => (
                      <span className="tabular-nums">{formatNumber(item.totalPoin)}</span>
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
                    center: true,
                    render: (item) => (
                      <span className="tabular-nums">{item.rataRataPersentase ?? 0}%</span>
                    ),
                  },
                  {
                    key: 'kategoriPoin',
                    label: 'Distribusi poin',
                    render: (item) => (
                      <span className="text-xs text-base-content/70">
                        {formatDistribusi(item.kategoriPoin)}
                      </span>
                    ),
                  },
                ]}
              />
            </TableFrame>
          </TableCard>
        </div>
      )}

      {activeTab === 'mahasiswa' && (
        <TableCard title="Capaian poin mahasiswa" description={`${filteredMahasiswa.length} mahasiswa`}>
          <div className="flex flex-col gap-3 lg:flex-row">
            <SearchInput
              value={searchMahasiswa}
              onChange={(e) => setSearchMahasiswa(e.target.value)}
              placeholder="Cari NIM, nama, atau prodi"
            />
            <FilterSelect value={filterStatusMahasiswa} onChange={(e) => setFilterStatusMahasiswa(e.target.value)}>
              <option value="semua">Semua status ({mahasiswaList.length})</option>
              <option value="tercapai">Tercapai</option>
              <option value="belum">Belum tercapai</option>
            </FilterSelect>
          </div>
          <TableFrame>
            <DataTable
              loading={loading}
              data={filteredMahasiswa}
              emptyText="Tidak ada data mahasiswa yang sesuai filter."
              columns={[
                { key: 'nim', label: 'NIM', render: (row) => <span className="font-mono text-sm">{row.nim}</span> },
                { key: 'nama', label: 'Nama' },
                {
                  key: 'prodi',
                  label: 'Prodi / Fakultas',
                  render: (row) => (
                    <div>
                      <p>{row.prodi}</p>
                      <p className="text-xs text-base-content/60">{row.fakultas}</p>
                    </div>
                  ),
                },
                { key: 'angkatan', label: 'Angkatan', center: true, render: (row) => row.angkatan || '—' },
                { key: 'poinTahun1', label: 'Thn 1', center: true },
                { key: 'poinTahun2', label: 'Thn 2', center: true },
                { key: 'poinTahun3', label: 'Thn 3', center: true },
                { key: 'poinTahun4', label: 'Thn 4', center: true },
                {
                  key: 'totalPoin',
                  label: 'Total',
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
        <TableCard title="Rekap prestasi" description="Kejuaraan yang sudah diverifikasi">
          <div className="flex flex-col gap-3 lg:flex-row">
            <SearchInput
              value={searchPrestasi}
              onChange={(e) => setSearchPrestasi(e.target.value)}
              placeholder="Cari prestasi, mahasiswa, atau kompetisi"
            />
            <FilterSelect value={filterSkalaPrestasi} onChange={(e) => setFilterSkalaPrestasi(e.target.value)}>
              <option value="semua">Semua skala</option>
              <option value="internasional">Internasional</option>
              <option value="nasional">Nasional</option>
              <option value="wilayah">Wilayah / Provinsi</option>
            </FilterSelect>
          </div>
          <TableFrame>
            <DataTable
              loading={loading}
              data={filteredPrestasi}
              emptyText="Belum ada data prestasi."
              columns={[
                {
                  key: 'namaMahasiswa',
                  label: 'Mahasiswa',
                  render: (row) => (
                    <div>
                      <p>{row.namaMahasiswa}</p>
                      <p className="font-mono text-xs text-base-content/60">{row.nim}</p>
                    </div>
                  ),
                },
                {
                  key: 'fakultas',
                  label: 'Fakultas / Prodi',
                  render: (row) => (
                    <div>
                      <p>{row.prodi}</p>
                      <p className="text-xs text-base-content/60">{row.fakultas}</p>
                    </div>
                  ),
                },
                {
                  key: 'namaKegiatan',
                  label: 'Kegiatan',
                  render: (row) => (
                    <div>
                      <p>{row.namaKegiatan}</p>
                      <p className="text-xs text-base-content/60">{row.penyelenggara || '—'}</p>
                    </div>
                  ),
                },
                {
                  key: 'skala',
                  label: 'Skala',
                  render: (row) => <span className="badge badge-ghost badge-sm">{row.skala || '—'}</span>,
                },
                { key: 'peran', label: 'Peringkat' },
                {
                  key: 'poin',
                  label: 'Poin',
                  center: true,
                  render: (row) => <span className="tabular-nums">+{row.poin}</span>,
                },
                { key: 'tanggal', label: 'Tanggal', render: (row) => row.tanggal || '—' },
              ]}
            />
          </TableFrame>
        </TableCard>
      )}

      {activeTab === 'ormawa' && (
        <TableCard title="Keaktifan ormawa" description="Event terselenggara dan poin yang didistribusikan">
          <SearchInput
            value={searchOrmawa}
            onChange={(e) => setSearchOrmawa(e.target.value)}
            placeholder="Cari organisasi atau fakultas"
          />
          <TableFrame>
            <DataTable
              loading={loading}
              data={filteredOrmawa}
              emptyText="Belum ada data keaktifan ormawa."
              columns={[
                {
                  key: 'nama',
                  label: 'Organisasi',
                  render: (row) => (
                    <div>
                      <p>{row.nama}</p>
                      <p className="text-xs text-base-content/60">{row.fakultas || '—'}</p>
                    </div>
                  ),
                },
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
                  label: 'Poin didistribusikan',
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
