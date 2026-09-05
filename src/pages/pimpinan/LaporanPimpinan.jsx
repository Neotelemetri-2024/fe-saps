import { useEffect, useMemo, useState } from 'react'
import {
  FileSpreadsheet,
  FileText,
  Filter,
  RotateCcw,
  Search,
  Award,
  Users,
  CheckCircle2,
  TrendingUp,
  Activity,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatCard from '../../components/dashboard/StatCard'
import DataTable from '../../components/dashboard/DataTable'
import ProgressBar from '../../components/dashboard/ProgressBar'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
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
  { id: 'ringkasan', label: 'Ringkasan', icon: TrendingUp },
  { id: 'mahasiswa', label: 'Capaian Mahasiswa', icon: Users },
  { id: 'prestasi', label: 'Prestasi', icon: Award },
  { id: 'ormawa', label: 'Keaktifan Ormawa', icon: Activity },
]

const TAHUN_AKADEMIK = ['2025/2026', '2024/2025', '2023/2024', '2022/2023']
const ANGKATAN = ['2025', '2024', '2023', '2022', '2021']

function pickKategoriValue(kategoriPoin = {}, keys) {
  for (const key of keys) {
    const found = Object.entries(kategoriPoin).find(([k]) => k.toLowerCase().includes(key))
    if (found) return Number(found[1]) || 0
  }
  return 0
}

function includesQuery(value, query) {
  return String(value || '').toLowerCase().includes(query)
}

function KategoriPoinBar({ organisasi = 0, prestasi = 0, seminar = 0 }) {
  const total = organisasi + seminar + prestasi || 1
  return (
    <div className="flex h-2.5 w-32 overflow-hidden rounded-full bg-gray-100">
      <div style={{ width: `${(organisasi / total) * 100}%` }} className="bg-emerald-600" title={`Organisasi: ${organisasi}`} />
      <div style={{ width: `${(seminar / total) * 100}%` }} className="bg-blue-600" title={`Seminar: ${seminar}`} />
      <div style={{ width: `${(prestasi / total) * 100}%` }} className="bg-amber-500" title={`Prestasi: ${prestasi}`} />
    </div>
  )
}

function FilterSelect({ label, value, onChange, children }) {
  return (
    <div>
      {label && <label className="mb-1 block text-xs font-medium text-[#616161]">{label}</label>}
      <select
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-[#d9dce7] bg-white px-4 py-2.5 text-sm text-[#616161] outline-none focus:border-brand-dark"
      >
        {children}
      </select>
    </div>
  )
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#cfd6df] bg-white px-4 py-2.5 shadow-sm">
      <Search className="h-4 w-4 shrink-0 text-[#9aa0a6]" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full text-sm outline-none"
      />
    </div>
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

  const content = (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-[#222] sm:text-3xl">Laporan & Evaluasi</h2>
          <p className="mt-1 text-sm text-[#616161]">
            Capaian kurikulum, prestasi, dan keaktifan ormawa{scopeNama ? ` — ${scopeNama}` : ''}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadExcel}
            disabled={loading || exportingExcel}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {exportingExcel ? 'Mengunduh...' : 'Excel'}
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={loading || exportingPdf}
            className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
          >
            <FileText className="h-4 w-4" />
            {exportingPdf ? 'Mengunduh...' : 'PDF'}
          </button>
        </div>
      </div>

      <TableCard
        title="Filter Laporan"
        description={`${laporanData?.kurikulum?.nama || 'Kurikulum SAPS'} · target ${targetPoin} poin`}
        headerRight={
          hasActiveFilter ? (
            <button
              type="button"
              onClick={handleResetFilter}
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-dark bg-white px-4 py-2 text-sm font-medium text-brand-dark transition hover:bg-[#f5f6f8]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset filter
            </button>
          ) : null
        }
      >
        <form onSubmit={handleApplyFilter} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <FilterSelect label="Tahun Akademik" value={tahunAkademik} onChange={(e) => setTahunAkademik(e.target.value)}>
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
            <div>
              <label className="mb-1 block text-xs font-medium text-[#616161]">Fakultas</label>
              <input
                type="text"
                disabled
                value={scopeNama}
                className="w-full rounded-lg border border-[#d9dce7] bg-[#f5f6f8] px-4 py-2.5 text-sm text-[#616161]"
              />
            </div>
          )}

          <FilterSelect label="Program Studi" value={prodiId} onChange={(e) => setProdiId(e.target.value)}>
            <option value="">Semua prodi</option>
            {prodiOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.nama}</option>
            ))}
          </FilterSelect>

          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Filter className="h-4 w-4" />
              Terapkan
            </button>
          </div>
        </form>
      </TableCard>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Mahasiswa"
          value={loading ? '…' : Number(kpi?.totalMahasiswa ?? 0).toLocaleString('id-ID')}
        />
        <StatCard
          label="Rata-rata Poin"
          value={loading ? '…' : `${kpi?.rataRataPoin ?? 0}`}
          sublabel={`Target ${targetPoin} poin`}
        />
        <StatCard
          label="Rata-rata Capaian"
          value={loading ? '…' : `${kpi?.rataRataPersentase ?? 0}%`}
          sublabel={`${kpi?.persentaseLulusTarget ?? 0}% memenuhi target`}
        />
        <StatCard
          label="Total Poin Sah"
          value={loading ? '…' : Number(kpi?.totalPoinSah ?? 0).toLocaleString('id-ID')}
          sublabel={`${kpi?.totalPrestasi ?? 0} prestasi`}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const count =
            tab.id === 'mahasiswa' ? mahasiswaList.length
              : tab.id === 'prestasi' ? prestasiList.length
              : tab.id === 'ormawa' ? ormawaList.length
              : null
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                active
                  ? 'bg-gradient-to-r from-brand-dark to-brand-light text-white'
                  : 'border border-[#d9dce7] bg-white text-[#616161] hover:bg-[#f5f6f8]'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {count != null && (
                <span className={`rounded-full px-1.5 text-xs ${active ? 'bg-white/20' : 'bg-[#f0f4f8]'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {activeTab === 'ringkasan' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-[#222] sm:text-lg">Evaluasi 4 Pilar Kurikulum</h3>
              <p className="mt-0.5 text-xs text-[#616161] sm:text-sm">Distribusi poin berdasarkan tahapan tahun akademik.</p>
            </div>
            {loading ? (
              <p className="py-8 text-center text-sm text-[#9aa0a6]">Memuat evaluasi kurikulum…</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {(laporanData?.capaianKurikulumStats || []).map((c, i) => (
                  <div key={c.nama || i} className="rounded-xl border border-[#e9ebf8] bg-[#f9fafb] p-4">
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-brand-dark/10 px-2 py-0.5 text-[10px] font-bold text-brand-dark">
                        Tahun {c.tahun}
                      </span>
                      <span className="text-xs font-bold text-brand-dark">{c.persentaseCapaian}%</span>
                    </div>
                    <h4 className="mt-2 font-bold text-[#222]">{c.nama}</h4>
                    <p className="mt-1 text-xs text-[#616161]">
                      Rata-rata <strong className="text-[#222]">{c.rataRataTerkumpul}</strong> / {c.targetPoin} poin
                    </p>
                    <div className="mt-3">
                      <ProgressBar
                        value={c.rataRataTerkumpul}
                        max={c.targetPoin || 50}
                        height={6}
                        color={c.persentaseCapaian >= 100 ? 'bg-emerald-600' : 'bg-brand-dark'}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <TableCard
            title={`Peringkat antar-${laporanData?.komparasi?.unit === 'fakultas' ? 'fakultas' : 'program studi'}`}
            description="Perbandingan poin akumulasi dan distribusi kategori"
            headerRight={
              <div className="flex items-center gap-3 text-xs font-medium text-[#555]">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-600" /> Organisasi
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600" /> Seminar
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" /> Prestasi
                </span>
              </div>
            }
          >
            <TableFrame>
              <DataTable
                loading={loading}
                data={laporanData?.komparasi?.items || []}
                emptyText="Belum ada data peringkat."
                columns={[
                  {
                    key: 'ranking',
                    label: 'Peringkat',
                    render: (item) => (
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                          item.ranking === 1 ? 'bg-yellow-500'
                            : item.ranking === 2 ? 'bg-gray-400'
                            : item.ranking === 3 ? 'bg-amber-700'
                            : 'bg-brand-dark'
                        }`}
                      >
                        {item.ranking}
                      </span>
                    ),
                  },
                  {
                    key: 'nama',
                    label: laporanData?.komparasi?.unit === 'fakultas' ? 'Fakultas' : 'Program Studi',
                    render: (item) => <span className="font-semibold text-black">{item.nama}</span>,
                  },
                  {
                    key: 'totalMahasiswa',
                    label: 'Mahasiswa',
                    render: (item) => <span className="text-black">{item.totalMahasiswa}</span>,
                  },
                  {
                    key: 'totalPoin',
                    label: 'Total Poin',
                    render: (item) => (
                      <span className="font-bold text-brand-dark">
                        {Number(item.totalPoin || 0).toLocaleString('id-ID')}
                      </span>
                    ),
                  },
                  {
                    key: 'rataRataPoin',
                    label: 'Rata-rata',
                    render: (item) => <span className="text-black">{item.rataRataPoin}</span>,
                  },
                  {
                    key: 'rataRataPersentase',
                    label: 'Capaian',
                    render: (item) => <span className="font-semibold text-emerald-700">{item.rataRataPersentase}%</span>,
                  },
                  {
                    key: 'kategoriPoin',
                    label: 'Distribusi',
                    render: (item) => {
                      const kp = item.kategoriPoin || {}
                      return (
                        <KategoriPoinBar
                          organisasi={pickKategoriValue(kp, ['organisasi', 'ukm'])}
                          seminar={pickKategoriValue(kp, ['seminar', 'pelatihan', 'workshop'])}
                          prestasi={pickKategoriValue(kp, ['prestasi', 'lomba', 'kompetisi'])}
                        />
                      )
                    },
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
              placeholder="Cari NIM, nama, atau prodi..."
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
                {
                  key: 'nim',
                  label: 'NIM',
                  render: (row) => <span className="font-mono font-semibold text-brand-dark">{row.nim}</span>,
                },
                {
                  key: 'nama',
                  label: 'Nama',
                  render: (row) => <span className="font-medium text-black">{row.nama}</span>,
                },
                {
                  key: 'prodi',
                  label: 'Prodi / Fakultas',
                  render: (row) => (
                    <div>
                      <p className="text-xs font-semibold text-black">{row.prodi}</p>
                      <p className="text-[10px] text-[#616161]">{row.fakultas}</p>
                    </div>
                  ),
                },
                { key: 'angkatan', label: 'Angkatan', render: (row) => <span className="text-black">{row.angkatan || '-'}</span> },
                { key: 'poinTahun1', label: 'Thn 1', render: (row) => <span className="text-black">{row.poinTahun1}</span> },
                { key: 'poinTahun2', label: 'Thn 2', render: (row) => <span className="text-black">{row.poinTahun2}</span> },
                { key: 'poinTahun3', label: 'Thn 3', render: (row) => <span className="text-black">{row.poinTahun3}</span> },
                { key: 'poinTahun4', label: 'Thn 4', render: (row) => <span className="text-black">{row.poinTahun4}</span> },
                {
                  key: 'totalPoin',
                  label: 'Total',
                  render: (row) => <span className="font-bold text-brand-dark">{row.totalPoin} / {row.targetPoin}</span>,
                },
                {
                  key: 'persentase',
                  label: 'Capaian',
                  render: (row) => <span className="font-semibold text-emerald-700">{row.persentase}%</span>,
                },
                {
                  key: 'statusTarget',
                  label: 'Status',
                  render: (row) => (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        row.statusTarget === 'Tercapai'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {row.statusTarget === 'Tercapai' ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                      {row.statusTarget}
                    </span>
                  ),
                },
              ]}
            />
          </TableFrame>
        </TableCard>
      )}

      {activeTab === 'prestasi' && (
        <TableCard title="Rekap prestasi mahasiswa" description="Kejuaraan yang sudah diverifikasi">
          <div className="flex flex-col gap-3 lg:flex-row">
            <SearchInput
              value={searchPrestasi}
              onChange={(e) => setSearchPrestasi(e.target.value)}
              placeholder="Cari prestasi, mahasiswa, atau kompetisi..."
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
                      <p className="font-semibold text-black">{row.namaMahasiswa}</p>
                      <p className="font-mono text-[10px] text-[#616161]">{row.nim}</p>
                    </div>
                  ),
                },
                {
                  key: 'fakultas',
                  label: 'Fakultas / Prodi',
                  render: (row) => (
                    <div>
                      <p className="text-xs font-medium text-black">{row.prodi}</p>
                      <p className="text-[10px] text-[#616161]">{row.fakultas}</p>
                    </div>
                  ),
                },
                {
                  key: 'namaKegiatan',
                  label: 'Kegiatan',
                  render: (row) => (
                    <div>
                      <p className="font-semibold text-brand-dark">{row.namaKegiatan}</p>
                      <p className="text-[10px] text-[#616161]">Oleh: {row.penyelenggara || '-'}</p>
                    </div>
                  ),
                },
                {
                  key: 'skala',
                  label: 'Skala',
                  render: (row) => {
                    const skala = String(row.skala || '').toLowerCase()
                    const tone = skala.includes('internasional')
                      ? 'bg-purple-100 text-purple-800'
                      : skala.includes('nasional')
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${tone}`}>{row.skala}</span>
                  },
                },
                { key: 'peran', label: 'Peringkat', render: (row) => <span className="font-semibold text-black">{row.peran}</span> },
                { key: 'poin', label: 'Poin', render: (row) => <span className="font-bold text-brand-dark">+{row.poin}</span> },
                { key: 'tanggal', label: 'Tanggal', render: (row) => <span className="text-xs text-[#616161]">{row.tanggal}</span> },
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
            placeholder="Cari organisasi atau fakultas..."
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
                      <p className="font-semibold text-black">{row.nama}</p>
                      <p className="text-[10px] text-[#616161]">{row.fakultas}</p>
                    </div>
                  ),
                },
                {
                  key: 'tipe',
                  label: 'Tipe',
                  render: (row) => (
                    <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      row.tipe === 'UKM' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {row.tipe}
                    </span>
                  ),
                },
                {
                  key: 'totalKegiatan',
                  label: 'Kegiatan',
                  render: (row) => <span className="font-bold text-black">{row.totalKegiatan}</span>,
                },
                {
                  key: 'totalPeserta',
                  label: 'Partisipasi',
                  render: (row) => <span className="text-black">{Number(row.totalPeserta || 0).toLocaleString('id-ID')}</span>,
                },
                {
                  key: 'totalPoinDidistribusikan',
                  label: 'Poin Didistribusikan',
                  render: (row) => (
                    <span className="font-bold text-brand-dark">
                      {Number(row.totalPoinDidistribusikan || 0).toLocaleString('id-ID')}
                    </span>
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
