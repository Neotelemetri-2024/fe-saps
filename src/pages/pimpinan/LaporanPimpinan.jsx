import { useEffect, useState, useMemo } from 'react'
import {
  FileSpreadsheet,
  FileText,
  Filter,
  RotateCcw,
  Search,
  Download,
  Award,
  Users,
  CheckCircle2,
  TrendingUp,
  Layers,
  Building2,
  Activity,
  AlertCircle,
  HelpCircle,
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

function pickKategoriValue(kategoriPoin = {}, keys) {
  for (const key of keys) {
    const found = Object.entries(kategoriPoin).find(([k]) => k.toLowerCase().includes(key))
    if (found) return Number(found[1]) || 0
  }
  return 0
}

function KategoriPoinBar({ organisasi = 0, prestasi = 0, seminar = 0 }) {
  const total = organisasi + seminar + prestasi || 1
  return (
    <div className="flex h-2.5 w-32 overflow-hidden rounded-full bg-gray-100">
      <div
        style={{ width: `${(organisasi / total) * 100}%` }}
        className="bg-emerald-600"
        title={`Organisasi: ${organisasi}`}
      />
      <div
        style={{ width: `${(seminar / total) * 100}%` }}
        className="bg-blue-600"
        title={`Seminar: ${seminar}`}
      />
      <div
        style={{ width: `${(prestasi / total) * 100}%` }}
        className="bg-amber-500"
        title={`Prestasi: ${prestasi}`}
      />
    </div>
  )
}

function LaporanPimpinan({ defaultRole }) {
  const user = getCurrentUser()
  const resolvedRole = defaultRole || user?.role || 'pimpinan_utama'

  // Filter States
  const [tahunAkademik, setTahunAkademik] = useState('')
  const [angkatan, setAngkatan] = useState('')
  const [fakultasId, setFakultasId] = useState('')
  const [prodiId, setProdiId] = useState('')

  // Options master
  const [fakultasOptions, setFakultasOptions] = useState([])
  const [prodiOptions, setProdiOptions] = useState([])

  // Data & Loading
  const [loading, setLoading] = useState(true)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [laporanData, setLaporanData] = useState(null)

  // Active Tab: 'ringkasan' | 'mahasiswa' | 'prestasi' | 'ormawa'
  const [activeTab, setActiveTab] = useState('ringkasan')

  // Sub filters
  const [searchMahasiswa, setSearchMahasiswa] = useState('')
  const [filterStatusMahasiswa, setFilterStatusMahasiswa] = useState('semua')
  const [searchPrestasi, setSearchPrestasi] = useState('')
  const [filterSkalaPrestasi, setFilterSkalaPrestasi] = useState('semua')
  const [searchOrmawa, setSearchOrmawa] = useState('')

  // Load master data fakultas & prodi
  useEffect(() => {
    getFakultasList().then(setFakultasOptions).catch(() => {})
  }, [])

  useEffect(() => {
    getProdiList(fakultasId || undefined).then(setProdiOptions).catch(() => {})
    setProdiId('')
  }, [fakultasId])

  // Fetch report data
  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getPreviewLaporan({
        tahunAkademik: tahunAkademik || undefined,
        angkatan: angkatan ? Number(angkatan) : undefined,
        fakultasId: fakultasId ? Number(fakultasId) : undefined,
        prodiId: prodiId ? Number(prodiId) : undefined,
      })
      if (res?.success) {
        setLaporanData(res.data)
      } else {
        toast.error(res?.message || 'Gagal memuat data laporan')
      }
    } catch (error) {
      console.error('[fetchData]', error)
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
    setTimeout(() => {
      fetchData()
    }, 50)
  }

  // Handle Export Excel
  const handleDownloadExcel = async () => {
    setExportingExcel(true)
    const toastId = toast.loading('Sedang menyiapkan file Excel...')
    try {
      await downloadExcelLaporan({
        tahunAkademik: tahunAkademik || undefined,
        angkatan: angkatan ? Number(angkatan) : undefined,
        fakultasId: fakultasId ? Number(fakultasId) : undefined,
        prodiId: prodiId ? Number(prodiId) : undefined,
      })
      toast.success('File Excel laporan berhasil diunduh!', { id: toastId })
    } catch (error) {
      console.error('[handleDownloadExcel]', error)
      toast.error('Gagal mengunduh file Excel', {
        id: toastId,
        description: error.message,
      })
    } finally {
      setExportingExcel(false)
    }
  }

  // Handle Export PDF
  const handleDownloadPdf = async () => {
    setExportingPdf(true)
    const toastId = toast.loading('Sedang men-generate dokumen PDF resmi Unand...')
    try {
      await downloadPdfLaporan({
        tahunAkademik: tahunAkademik || undefined,
        angkatan: angkatan ? Number(angkatan) : undefined,
        fakultasId: fakultasId ? Number(fakultasId) : undefined,
        prodiId: prodiId ? Number(prodiId) : undefined,
      })
      toast.success('Dokumen PDF laporan resmi berhasil diunduh!', { id: toastId })
    } catch (error) {
      console.error('[handleDownloadPdf]', error)
      toast.error('Gagal mengunduh dokumen PDF', {
        id: toastId,
        description: error.message,
      })
    } finally {
      setExportingPdf(false)
    }
  }

  // Filtered Mahasiswa List
  const filteredMahasiswa = useMemo(() => {
    if (!laporanData?.mahasiswaList) return []
    return laporanData.mahasiswaList.filter((m) => {
      const matchSearch =
        m.nama.toLowerCase().includes(searchMahasiswa.toLowerCase()) ||
        m.nim.toLowerCase().includes(searchMahasiswa.toLowerCase()) ||
        m.prodi?.toLowerCase().includes(searchMahasiswa.toLowerCase())
      const matchStatus =
        filterStatusMahasiswa === 'semua' ||
        (filterStatusMahasiswa === 'tercapai' && m.statusTarget === 'Tercapai') ||
        (filterStatusMahasiswa === 'belum' && m.statusTarget === 'Belum Tercapai')
      return matchSearch && matchStatus
    })
  }, [laporanData?.mahasiswaList, searchMahasiswa, filterStatusMahasiswa])

  // Filtered Prestasi List
  const filteredPrestasi = useMemo(() => {
    if (!laporanData?.prestasiList) return []
    return laporanData.prestasiList.filter((p) => {
      const matchSearch =
        p.namaMahasiswa.toLowerCase().includes(searchPrestasi.toLowerCase()) ||
        p.nim.toLowerCase().includes(searchPrestasi.toLowerCase()) ||
        p.namaKegiatan.toLowerCase().includes(searchPrestasi.toLowerCase()) ||
        p.prodi.toLowerCase().includes(searchPrestasi.toLowerCase())
      const matchSkala =
        filterSkalaPrestasi === 'semua' ||
        p.skala.toLowerCase().includes(filterSkalaPrestasi.toLowerCase())
      return matchSearch && matchSkala
    })
  }, [laporanData?.prestasiList, searchPrestasi, filterSkalaPrestasi])

  // Filtered Ormawa List
  const filteredOrmawa = useMemo(() => {
    if (!laporanData?.ormawaList) return []
    return laporanData.ormawaList.filter((o) =>
      o.nama.toLowerCase().includes(searchOrmawa.toLowerCase()) ||
      o.tipe.toLowerCase().includes(searchOrmawa.toLowerCase()) ||
      o.fakultas.toLowerCase().includes(searchOrmawa.toLowerCase())
    )
  }, [laporanData?.ormawaList, searchOrmawa])

  const kpi = laporanData?.kpi
  const scopeNama = laporanData?.scopeNama || 'Universitas Andalas'
  const isGlobalScope =
    resolvedRole === 'pimpinan_utama' ||
    resolvedRole === 'pimpinan_ditmawa' ||
    resolvedRole === 'admin_ditmawa'

  return (
    <DashboardLayout
      role={resolvedRole}
      userName={user?.nama || 'Pimpinan'}
      userRole={
        resolvedRole === 'pimpinan_utama'
          ? 'Pimpinan Utama'
          : resolvedRole === 'pimpinan_ditmawa'
          ? 'Pimpinan Ditmawa'
          : resolvedRole === 'pimpinan_fakultas'
          ? 'Pimpinan Fakultas'
          : resolvedRole === 'admin_ditmawa'
          ? 'Admin Ditmawa'
          : 'Admin Fakultas'
      }
    >
      <div className="space-y-6">
        {/* Header Title & Scope Indicator */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-black sm:text-3xl">
                Laporan Evaluasi & Riset Pimpinan
              </h2>
              <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800">
                {laporanData?.kurikulum?.nama || 'Kurikulum SAPS'}
              </span>
            </div>
            <p className="mt-1 text-sm text-[#616161]">
              Analitik komprehensif, evaluasi 4 pilar capaian kurikulum, dan rekapitulasi data mahasiswa untuk pimpinan.
            </p>
          </div>

          {/* Quick Download Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadExcel}
              disabled={loading || exportingExcel}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {exportingExcel ? 'Mengunduh Excel...' : 'Download Excel (.xlsx)'}
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={loading || exportingPdf}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              {exportingPdf ? 'Membuat PDF...' : 'Download PDF Resmi (.pdf)'}
            </button>
          </div>
        </div>

        {/* Scope Banner */}
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-950">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-700">
                Cakupan Laporan Aktif
              </p>
              <p className="text-sm font-bold sm:text-base">{scopeNama}</p>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-xs text-emerald-700">Target Kurikulum</p>
            <p className="text-sm font-bold text-emerald-900">
              {laporanData?.kurikulum?.targetPoin ?? 200} Poin Total
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm">
          <form onSubmit={handleApplyFilter} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-brand-dark" />
                <span className="text-sm font-bold text-[#222]">Filter Laporan</span>
              </div>
              <button
                type="button"
                onClick={handleResetFilter}
                className="flex items-center gap-1.5 text-xs font-semibold text-brand-dark hover:underline"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Filter
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* Tahun Akademik */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#444]">Tahun Akademik</label>
                <select
                  value={tahunAkademik}
                  onChange={(e) => setTahunAkademik(e.target.value)}
                  className="w-full rounded-lg border border-[#d0d5dd] bg-white px-3 py-2 text-xs text-[#222] focus:border-brand-dark focus:outline-none"
                >
                  <option value="">Semua Tahun Akademik</option>
                  <option value="2025/2026">2025/2026</option>
                  <option value="2024/2025">2024/2025</option>
                  <option value="2023/2024">2023/2024</option>
                  <option value="2022/2023">2022/2023</option>
                </select>
              </div>

              {/* Angkatan */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#444]">Angkatan Mahasiswa</label>
                <select
                  value={angkatan}
                  onChange={(e) => setAngkatan(e.target.value)}
                  className="w-full rounded-lg border border-[#d0d5dd] bg-white px-3 py-2 text-xs text-[#222] focus:border-brand-dark focus:outline-none"
                >
                  <option value="">Semua Angkatan</option>
                  <option value="2025">Angkatan 2025</option>
                  <option value="2024">Angkatan 2024</option>
                  <option value="2023">Angkatan 2023</option>
                  <option value="2022">Angkatan 2022</option>
                  <option value="2021">Angkatan 2021</option>
                </select>
              </div>

              {/* Fakultas (Bila role global) */}
              {isGlobalScope ? (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#444]">Fakultas</label>
                  <select
                    value={fakultasId}
                    onChange={(e) => setFakultasId(e.target.value)}
                    className="w-full rounded-lg border border-[#d0d5dd] bg-white px-3 py-2 text-xs text-[#222] focus:border-brand-dark focus:outline-none"
                  >
                    <option value="">Seluruh Fakultas (Universitas)</option>
                    {fakultasOptions.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nama}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#444]">Fakultas</label>
                  <input
                    type="text"
                    disabled
                    value={scopeNama}
                    className="w-full rounded-lg border border-[#d0d5dd] bg-gray-100 px-3 py-2 text-xs text-gray-600"
                  />
                </div>
              )}

              {/* Program Studi */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#444]">Program Studi</label>
                <select
                  value={prodiId}
                  onChange={(e) => setProdiId(e.target.value)}
                  className="w-full rounded-lg border border-[#d0d5dd] bg-white px-3 py-2 text-xs text-[#222] focus:border-brand-dark focus:outline-none"
                >
                  <option value="">Semua Program Studi</option>
                  {prodiOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-dark px-5 py-2 text-xs font-semibold text-white shadow transition hover:opacity-90"
              >
                <Filter className="h-3.5 w-3.5" />
                Terapkan Filter
              </button>
            </div>
          </form>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Mahasiswa Terdaftar"
            value={loading ? '…' : Number(kpi?.totalMahasiswa ?? 0).toLocaleString('id-ID')}
            sublabel="Mahasiswa dalam cakupan"
          />
          <StatCard
            label="Rata-rata Poin Capaian"
            value={loading ? '…' : `${kpi?.rataRataPoin ?? 0} Poin`}
            sublabel={`Target: ${laporanData?.kurikulum?.targetPoin ?? 200} Poin`}
          />
          <StatCard
            label="Rata-rata % Capaian"
            value={loading ? '…' : `${kpi?.rataRataPersentase ?? 0}%`}
            sublabel={`${kpi?.persentaseLulusTarget ?? 0}% Memenuhi Target Lulus`}
          />
          <StatCard
            label="Total Poin Sah Terkumpul"
            value={loading ? '…' : Number(kpi?.totalPoinSah ?? 0).toLocaleString('id-ID')}
            sublabel={`${kpi?.totalPrestasi ?? 0} Prestasi SIMKATMAWA`}
          />
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-[#e9ebf8] bg-white px-2 pt-2 rounded-t-xl">
          <div className="flex space-x-2 overflow-x-auto">
            {[
              { id: 'ringkasan', label: 'Ringkasan & Komparasi Ranking', icon: <TrendingUp className="h-4 w-4" /> },
              { id: 'mahasiswa', label: `Data Capaian Mahasiswa (${laporanData?.mahasiswaList?.length ?? 0})`, icon: <Users className="h-4 w-4" /> },
              { id: 'prestasi', label: `Rekap Prestasi (${laporanData?.prestasiList?.length ?? 0})`, icon: <Award className="h-4 w-4" /> },
              { id: 'ormawa', label: `Keaktifan Ormawa (${laporanData?.ormawaList?.length ?? 0})`, icon: <Activity className="h-4 w-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'border-brand-dark text-brand-dark'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: RINGKASAN & KOMPARASI */}
        {activeTab === 'ringkasan' && (
          <div className="space-y-6">
            {/* 4 Pilar Kurikulum SAPS */}
            <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#222]">
                    Evaluasi 4 Pilar Kurikulum SAPS
                  </h3>
                  <p className="text-xs text-[#616161]">
                    Distribusi poin berjenjang berdasarkan tahapan tahun akademik mahasiswa
                  </p>
                </div>
                <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {laporanData?.capaianKurikulumStats?.length ?? 4} Pilar Capaian
                </span>
              </div>

              {loading ? (
                <p className="py-8 text-center text-sm text-[#9aa0a6]">Memuat evaluasi kurikulum…</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {(laporanData?.capaianKurikulumStats || []).map((c, i) => (
                    <div
                      key={c.nama || i}
                      className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 transition hover:bg-white hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="rounded bg-brand-dark/10 px-2 py-0.5 text-[10px] font-bold text-brand-dark">
                          Tahun {c.tahun}
                        </span>
                        <span className="text-xs font-bold text-brand-dark">
                          {c.persentaseCapaian}%
                        </span>
                      </div>
                      <h4 className="mt-2 font-bold text-[#222]">{c.nama}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Rata-rata: <strong className="text-gray-800">{c.rataRataTerkumpul}</strong> / {c.targetPoin} Poin
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

            {/* Ranking Komparasi Antar-Unit */}
            <TableCard
              title={`Peringkat Capaian Antar-${laporanData?.komparasi?.unit === 'fakultas' ? 'Fakultas' : 'Program Studi'}`}
              description="Perbandingan performa poin akumulasi dan distribusi kategori"
              headerRight={
                <div className="flex items-center gap-3 text-xs font-medium text-[#555]">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-600"></span>
                    Organisasi
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600"></span>
                    Seminar
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                    Prestasi
                  </span>
                </div>
              }
            >
              <TableFrame>
                <DataTable
                  loading={loading}
                  data={laporanData?.komparasi?.items || []}
                  emptyText="Belum ada data peringkat komparasi."
                  columns={[
                    {
                      key: 'ranking',
                      label: 'Peringkat',
                      render: (item) => (
                        <div className="flex justify-center">
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                              item.ranking === 1
                                ? 'bg-yellow-500'
                                : item.ranking === 2
                                ? 'bg-gray-400'
                                : item.ranking === 3
                                ? 'bg-amber-700'
                                : 'bg-brand-dark'
                            }`}
                          >
                            {item.ranking}
                          </span>
                        </div>
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
                      render: (item) => <span className="text-center block text-black">{item.totalMahasiswa} orang</span>,
                    },
                    {
                      key: 'totalPoin',
                      label: 'Total Poin',
                      render: (item) => (
                        <span className="text-center block font-bold text-brand-dark">
                          {Number(item.totalPoin || 0).toLocaleString('id-ID')}
                        </span>
                      ),
                    },
                    {
                      key: 'rataRataPoin',
                      label: 'Rata-rata Poin',
                      render: (item) => <span className="text-center block text-black">{item.rataRataPoin} poin</span>,
                    },
                    {
                      key: 'rataRataPersentase',
                      label: 'Rata-rata Capaian',
                      render: (item) => (
                        <span className="text-center block font-semibold text-emerald-700">
                          {item.rataRataPersentase}%
                        </span>
                      ),
                    },
                    {
                      key: 'kategoriPoin',
                      label: 'Distribusi Poin',
                      render: (item) => {
                        const kp = item.kategoriPoin || {}
                        const org = pickKategoriValue(kp, ['organisasi', 'ukm'])
                        const sem = pickKategoriValue(kp, ['seminar', 'pelatihan', 'workshop'])
                        const pres = pickKategoriValue(kp, ['prestasi', 'lomba', 'kompetisi'])
                        return (
                          <div className="flex justify-center">
                            <KategoriPoinBar organisasi={org} seminar={sem} prestasi={pres} />
                          </div>
                        )
                      },
                    },
                  ]}
                />
              </TableFrame>
            </TableCard>
          </div>
        )}

        {/* TAB 2: DATA CAPAIAN MAHASISWA */}
        {activeTab === 'mahasiswa' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-xl border border-[#e9ebf8] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari NIM, Nama Mahasiswa, atau Prodi..."
                  value={searchMahasiswa}
                  onChange={(e) => setSearchMahasiswa(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 pl-9 pr-4 py-2 text-xs focus:border-brand-dark focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-600">Status Kelulusan:</label>
                <select
                  value={filterStatusMahasiswa}
                  onChange={(e) => setFilterStatusMahasiswa(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-brand-dark focus:outline-none"
                >
                  <option value="semua">Semua Status ({laporanData?.mahasiswaList?.length || 0})</option>
                  <option value="tercapai">Tercapai (Memenuhi Syarat)</option>
                  <option value="belum">Belum Tercapai (Perlu Perhatian)</option>
                </select>
              </div>
            </div>

            <TableCard
              title="Daftar Capaian Poin Mahasiswa"
              description={`Menampilkan ${filteredMahasiswa.length} mahasiswa`}
            >
              <TableFrame>
                <DataTable
                  loading={loading}
                  data={filteredMahasiswa}
                  emptyText="Tidak ada data mahasiswa yang sesuai dengan filter."
                  columns={[
                    {
                      key: 'nim',
                      label: 'NIM',
                      render: (row) => <span className="font-mono font-semibold text-brand-dark">{row.nim}</span>,
                    },
                    {
                      key: 'nama',
                      label: 'Nama Mahasiswa',
                      render: (row) => <span className="font-medium text-black">{row.nama}</span>,
                    },
                    {
                      key: 'prodi',
                      label: 'Program Studi / Fakultas',
                      render: (row) => (
                        <div>
                          <p className="text-xs font-semibold text-black">{row.prodi}</p>
                          <p className="text-[10px] text-gray-500">{row.fakultas}</p>
                        </div>
                      ),
                    },
                    {
                      key: 'angkatan',
                      label: 'Angkatan',
                      render: (row) => <span className="text-center block text-black">{row.angkatan || '-'}</span>,
                    },
                    {
                      key: 'poinTahun1',
                      label: 'Thn 1',
                      render: (row) => <span className="text-center block text-black">{row.poinTahun1}</span>,
                    },
                    {
                      key: 'poinTahun2',
                      label: 'Thn 2',
                      render: (row) => <span className="text-center block text-black">{row.poinTahun2}</span>,
                    },
                    {
                      key: 'poinTahun3',
                      label: 'Thn 3',
                      render: (row) => <span className="text-center block text-black">{row.poinTahun3}</span>,
                    },
                    {
                      key: 'poinTahun4',
                      label: 'Thn 4',
                      render: (row) => <span className="text-center block text-black">{row.poinTahun4}</span>,
                    },
                    {
                      key: 'totalPoin',
                      label: 'Total Poin',
                      render: (row) => (
                        <span className="text-center block font-bold text-brand-dark">
                          {row.totalPoin} / {row.targetPoin}
                        </span>
                      ),
                    },
                    {
                      key: 'persentase',
                      label: 'Capaian (%)',
                      render: (row) => (
                        <span className="text-center block font-semibold text-emerald-700">
                          {row.persentase}%
                        </span>
                      ),
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
                          {row.statusTarget === 'Tercapai' ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          {row.statusTarget}
                        </span>
                      ),
                    },
                  ]}
                />
              </TableFrame>
            </TableCard>
          </div>
        )}

        {/* TAB 3: REKAP PRESTASI (SIMKATMAWA) */}
        {activeTab === 'prestasi' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-xl border border-[#e9ebf8] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari prestasi, mahasiswa, atau kompetisi..."
                  value={searchPrestasi}
                  onChange={(e) => setSearchPrestasi(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 pl-9 pr-4 py-2 text-xs focus:border-brand-dark focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-600">Skala Kompetisi:</label>
                <select
                  value={filterSkalaPrestasi}
                  onChange={(e) => setFilterSkalaPrestasi(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-brand-dark focus:outline-none"
                >
                  <option value="semua">Semua Skala</option>
                  <option value="internasional">Internasional</option>
                  <option value="nasional">Nasional</option>
                  <option value="wilayah">Wilayah / Provinsi</option>
                </select>
              </div>
            </div>

            <TableCard
              title="Rekapitulasi Prestasi Mahasiswa (SIMKATMAWA)"
              description="Daftar kejuaraan dan capaian mahasiswa yang telah diverifikasi"
            >
              <TableFrame>
                <DataTable
                  loading={loading}
                  data={filteredPrestasi}
                  emptyText="Belum ada data rekap prestasi mahasiswa."
                  columns={[
                    {
                      key: 'namaMahasiswa',
                      label: 'Mahasiswa',
                      render: (row) => (
                        <div>
                          <p className="font-semibold text-black">{row.namaMahasiswa}</p>
                          <p className="font-mono text-[10px] text-gray-500">{row.nim}</p>
                        </div>
                      ),
                    },
                    {
                      key: 'fakultas',
                      label: 'Fakultas / Prodi',
                      render: (row) => (
                        <div>
                          <p className="text-xs font-medium text-black">{row.prodi}</p>
                          <p className="text-[10px] text-gray-500">{row.fakultas}</p>
                        </div>
                      ),
                    },
                    {
                      key: 'namaKegiatan',
                      label: 'Nama Kegiatan & Penyelenggara',
                      render: (row) => (
                        <div>
                          <p className="font-semibold text-brand-dark">{row.namaKegiatan}</p>
                          <p className="text-[10px] text-gray-500">Oleh: {row.penyelenggara || '-'}</p>
                        </div>
                      ),
                    },
                    {
                      key: 'skala',
                      label: 'Skala',
                      render: (row) => {
                        const isInter = row.skala?.toLowerCase().includes('internasional')
                        const isNas = row.skala?.toLowerCase().includes('nasional')
                        return (
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              isInter
                                ? 'bg-purple-100 text-purple-800'
                                : isNas
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {row.skala}
                          </span>
                        )
                      },
                    },
                    {
                      key: 'peran',
                      label: 'Peringkat / Peran',
                      render: (row) => <span className="font-semibold text-black">{row.peran}</span>,
                    },
                    {
                      key: 'poin',
                      label: 'Poin',
                      render: (row) => (
                        <span className="text-center block font-bold text-brand-dark">
                          +{row.poin}
                        </span>
                      ),
                    },
                    {
                      key: 'tanggal',
                      label: 'Tanggal',
                      render: (row) => <span className="text-xs text-gray-500">{row.tanggal}</span>,
                    },
                  ]}
                />
              </TableFrame>
            </TableCard>
          </div>
        )}

        {/* TAB 4: KEAKTIFAN ORMAWA */}
        {activeTab === 'ormawa' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-xl border border-[#e9ebf8] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari organisasi atau fakultas..."
                  value={searchOrmawa}
                  onChange={(e) => setSearchOrmawa(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 pl-9 pr-4 py-2 text-xs focus:border-brand-dark focus:outline-none"
                />
              </div>
            </div>

            <TableCard
              title="Aktivitas & Kinerja Organisasi Mahasiswa (UKM / UKMF)"
              description="Rekapitulasi event yang terselenggara dan poin yang didistribusikan"
            >
              <TableFrame>
                <DataTable
                  loading={loading}
                  data={filteredOrmawa}
                  emptyText="Belum ada data keaktifan ormawa."
                  columns={[
                    {
                      key: 'nama',
                      label: 'Nama Organisasi',
                      render: (row) => (
                        <div>
                          <p className="font-semibold text-black">{row.nama}</p>
                          <p className="text-[10px] text-gray-500">{row.fakultas}</p>
                        </div>
                      ),
                    },
                    {
                      key: 'tipe',
                      label: 'Tipe',
                      render: (row) => (
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            row.tipe === 'UKM'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {row.tipe}
                        </span>
                      ),
                    },
                    {
                      key: 'totalKegiatan',
                      label: 'Total Kegiatan Disetujui',
                      render: (row) => (
                        <span className="text-center block font-bold text-black">
                          {row.totalKegiatan} Event
                        </span>
                      ),
                    },
                    {
                      key: 'totalPeserta',
                      label: 'Total Partisipasi Mahasiswa',
                      render: (row) => (
                        <span className="text-center block text-black">
                          {Number(row.totalPeserta || 0).toLocaleString('id-ID')} Mahasiswa
                        </span>
                      ),
                    },
                    {
                      key: 'totalPoinDidistribusikan',
                      label: 'Poin Didistribusikan',
                      render: (row) => (
                        <span className="text-center block font-bold text-brand-dark">
                          {Number(row.totalPoinDidistribusikan || 0).toLocaleString('id-ID')} Poin
                        </span>
                      ),
                    },
                  ]}
                />
              </TableFrame>
            </TableCard>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default LaporanPimpinan
