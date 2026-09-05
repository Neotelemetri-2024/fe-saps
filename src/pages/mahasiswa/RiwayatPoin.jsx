import { useEffect, useMemo, useState } from 'react'
import { Search, CheckCircle, X } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import StatusBadge from '../../components/dashboard/StatusBadge'
import KegiatanCell from '../../components/dashboard/KegiatanCell'
import ProgressBar from '../../components/dashboard/ProgressBar'
import { RadarChartCJ } from '../../components/charts'
import { getCurrentUser } from '../../services/authService'
import { get } from '../../services/apiClient'
import { statusOptionsFromRows } from '../../utils/statusFilter'

function formatTanggal(val) {
  if (!val) return '-'
  try {
    const d = new Date(val)
    if (Number.isNaN(d.getTime())) return String(val)
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return String(val)
  }
}

function mapStatus(status) {
  const s = String(status || '').toLowerCase()
  if (s.includes('disetujui')) return 'disetujui'
  if (s.includes('ditolak')) return 'ditolak'
  return 'pending'
}

function buildProgressLabel(item) {
  const pct = item.persentase ?? 0
  if (item.status === 'completed' || pct >= 100) return 'COMPLETED'
  return 'PROGRESS'
}

const columns = [
  { key: 'no', label: 'NO' },
  { key: 'kegiatan', label: 'KEGIATAN', render: (row) => <KegiatanCell nama={row.kegiatan} tanggal={row.diajukanPada} /> },
  { key: 'jenis', label: 'JENIS' },
  { key: 'peran', label: 'PERAN' },
  { key: 'skala', label: 'SKALA' },
  { key: 'penyelenggara', label: 'PENYELENGGARA' },
  { key: 'tanggal', label: 'TANGGAL' },
  {
    key: 'bukti',
    label: 'BUKTI',
    render: (row) =>
      row.buktiUrl ? (
        <a href={row.buktiUrl} target="_blank" rel="noreferrer" className="text-brand-dark underline">
          {row.bukti}
        </a>
      ) : (
        <span className="text-base-content/50">{row.bukti}</span>
      ),
  },
  { key: 'poin', label: 'POIN' },
  { key: 'status', label: 'STATUS', render: (row) => <StatusBadge status={row.status} /> },
]

function RiwayatPoin() {
  const user = getCurrentUser()
  const [loading, setLoading] = useState(true)
  const [totalPoin, setTotalPoin] = useState(0)
  const [totalPoinProgres, setTotalPoinProgres] = useState(0)
  const [totalTarget, setTotalTarget] = useState(0)
  const [progressData, setProgressData] = useState([])
  const [selectedCapaianId, setSelectedCapaianId] = useState(null)
  const [riwayat, setRiwayat] = useState([])
  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState('')
  const [filterPeran, setFilterPeran] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPenyelenggara, setFilterPenyelenggara] = useState('')
  const [filterSkala, setFilterSkala] = useState('')

  useEffect(() => {
    setLoading(true)
    get('/api/mahasiswa/riwayat-poin')
      .then((res) => {
        const data = res?.data || res || {}
        setTotalPoin(data.totalPoin ?? 0)
        setTotalPoinProgres(data.totalPoinProgres ?? data.totalPoin ?? 0)
        setTotalTarget(data.totalTarget ?? 0)

        const progress = Array.isArray(data.progressTahun || data.progresTahunan) ? (data.progressTahun || data.progresTahunan) : []
        setProgressData(
          progress.map((item) => {
            const current = item.poinProgres ?? Math.min(item.poinTerkumpul ?? item.current ?? 0, item.targetPoin ?? item.target ?? 1)
            const target = item.targetPoin ?? item.target ?? 1
            const pct = item.persentase ?? (target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0)
            const onTrack = pct >= 100
            return {
              id: item.id,
              nama: item.nama || `Capaian ${item.urutan || ''}`,
              tahun: (item.nama || `TAHUN ${item.urutan || ''}`).toUpperCase(),
              current,
              target,
              poinTerkumpul: item.poinTerkumpul ?? current,
              poinLebih: item.poinLebih || 0,
              label: buildProgressLabel({ ...item, persentase: pct }),
              onTrack,
              subCapaian: Array.isArray(item.subCapaian) ? item.subCapaian : [],
            }
          }),
        )

        const list = Array.isArray(data.riwayat) ? data.riwayat : Array.isArray(data.klaim) ? data.klaim : []
        setRiwayat(
          list.map((item, i) => ({
            no: item.no ?? i + 1,
            kegiatan: item.namaKegiatan || item.kegiatan || '-',
            diajukanPada: formatTanggal(item.tanggalKlaim || item.tanggalDiajukan || item.dibuatPada || item.createdAt),
            jenis: item.jenisKegiatan || item.jenis || '-',
            peran: item.peran || '-',
            skala: item.skala || '-',
            penyelenggara: item.penyelenggara || '-',
            tanggal: formatTanggal(item.tanggal),
            bukti: item.bukti ? (String(item.bukti).split('/').pop() || 'Bukti') : '-',
            buktiUrl: item.bukti || null,
            poin: item.poin ?? '-',
            status: mapStatus(item.status),
          })),
        )
      })
      .catch((err) => {
        setProgressData([])
        setRiwayat([])
        toast.error('Gagal memuat riwayat poin', { description: err.message })
      })
      .finally(() => setLoading(false))
  }, [])

  const selectedCapaian = useMemo(
    () => progressData.find((c) => c.id === selectedCapaianId) || null,
    [progressData, selectedCapaianId]
  )

  const pctTotal = totalTarget > 0 ? Math.min(100, Math.round((totalPoinProgres / totalTarget) * 100)) : 0

  const kategoriOptions = useMemo(() => [...new Set(riwayat.map((r) => r.jenis).filter((v) => v && v !== '-'))], [riwayat])
  const peranOptions = useMemo(() => [...new Set(riwayat.map((r) => r.peran).filter((v) => v && v !== '-'))], [riwayat])
  const penyelenggaraOptions = useMemo(
    () => [...new Set(riwayat.map((r) => r.penyelenggara).filter((v) => v && v !== '-'))],
    [riwayat],
  )
  const skalaOptions = useMemo(() => [...new Set(riwayat.map((r) => r.skala).filter((s) => s && s !== '-'))].sort(), [riwayat])
  const statusOptions = useMemo(() => statusOptionsFromRows(riwayat, 'status'), [riwayat])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return riwayat.filter((r) => {
      if (q && !r.kegiatan.toLowerCase().includes(q) && !r.penyelenggara.toLowerCase().includes(q)) return false
      if (filterKategori && r.jenis !== filterKategori) return false
      if (filterPeran && r.peran !== filterPeran) return false
      if (filterStatus && r.status !== filterStatus) return false
      if (filterPenyelenggara && r.penyelenggara !== filterPenyelenggara) return false
      if (filterSkala && r.skala !== filterSkala) return false
      return true
    })
  }, [riwayat, search, filterKategori, filterPeran, filterStatus, filterPenyelenggara, filterSkala])

  const resetFilter = () => {
    setSearch('')
    setFilterKategori('')
    setFilterPeran('')
    setFilterStatus('')
    setFilterPenyelenggara('')
    setFilterSkala('')
  }

  return (
    <DashboardLayout role="mahasiswa" userName={user?.nama || 'Mahasiswa'} userRole="Mahasiswa">
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-base-content sm:text-2xl">Riwayat Poin</h2>
        <p className="text-sm text-base-content/60">Rekap seluruh kegiatan dan poin yang telah terkumpul sesuai kurikulum.</p>

        <div className="rounded-xl border border-base-300 bg-base-100 p-4 sm:p-6 shadow-sm">
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-base-300 pb-4">
            <div>
              <h3 className="text-base font-bold text-base-content sm:text-lg">Progress Kurikulum</h3>
              <p className="mt-0.5 text-xs text-base-content/60">
                Poin yang dihitung masuk ke progres dibatasi maksimal sesuai target capaian kurikulum.
              </p>
            </div>
            <div className="flex items-center gap-5 sm:gap-6">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-base-content/50">Progress Target</p>
                <p className="mt-0.5 text-base font-bold text-base-content sm:text-lg">
                  {loading ? '…' : totalPoinProgres}<span className="text-xs font-normal text-base-content/60">/{totalTarget} poin ({pctTotal}%)</span>
                </p>
              </div>
              <div className="h-9 w-px bg-base-300" />
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-base-content/50">Total Poin Diperoleh</p>
                <p className="mt-0.5 text-base sm:text-lg font-bold text-base-content">
                  {loading ? '…' : totalPoin} <span className="text-xs font-normal text-base-content/60">poin</span>
                </p>
              </div>
            </div>
          </div>
          {loading ? (
            <p className="py-8 text-center text-sm text-base-content/50">Memuat progress…</p>
          ) : progressData.length === 0 ? (
            <p className="py-8 text-center text-sm text-base-content/50">Belum ada data progress kurikulum.</p>
          ) : (
            <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {progressData.map((item, index) => {
                const isSelected = selectedCapaianId === item.id
                return (
                  <div
                    key={item.id ?? index}
                    onClick={() => setSelectedCapaianId((prev) => (prev === item.id ? null : item.id))}
                    className={`relative rounded-lg border p-4 text-center cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-brand-dark ring-2 ring-brand-dark/20 bg-base-200 shadow-sm'
                        : 'border-base-300 hover:border-brand-dark/50 hover:bg-base-200 bg-base-100'
                    }`}
                  >
                    <p className="text-xs font-semibold text-base-content/60">{item.tahun}</p>
                    <p className="mt-1 text-2xl font-bold leading-none text-base-content">
                      {item.current}
                      <span className="text-sm font-normal text-base-content/60">/{item.target} poin</span>
                    </p>
                    <div className="mt-1 flex items-center justify-center gap-1 text-xs text-base-content/60">
                      {item.onTrack && <CheckCircle className="h-3.5 w-3.5 text-base-content" />}
                      <span>{item.label}</span>
                    </div>
                    <div className="mt-2">
                      <ProgressBar value={item.current} max={item.target || 1} height={6} />
                    </div>
                    {item.poinLebih > 0 && (
                      <p className="mt-1.5 text-[11px] text-base-content/50">
                        +{item.poinLebih} poin lebih di riwayat
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Visualisasi Sub Capaian yang Dipilih (seperti tampilan Dosen PA) */}
          {selectedCapaian && (
            <div className="mt-6 rounded-xl bg-gradient-to-br from-brand-dark to-brand-light p-5 sm:p-6 text-white shadow-sm transition-all animate-in fade-in duration-200">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-extrabold text-white">Sub Capaian</h3>
                  <p className="mt-0.5 text-xs text-white/70">
                    Sub Capaian dalam kategori {selectedCapaian.nama?.toLowerCase()}
                  </p>
                  <p className="mt-2 text-sm font-bold text-white/90">
                    {selectedCapaian.nama}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedCapaian.id}
                    onChange={(e) => {
                      const targetId = Number(e.target.value) || e.target.value
                      setSelectedCapaianId(targetId)
                    }}
                    className="rounded-lg border border-white/40 bg-base-100/10 px-3 py-1.5 text-xs text-white outline-none backdrop-blur-sm cursor-pointer"
                  >
                    {progressData.map((c) => (
                      <option key={c.id} value={c.id} className="text-base-content">
                        {c.nama}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setSelectedCapaianId(null)}
                    className="rounded-lg p-1.5 text-white/70 hover:bg-base-100/10 hover:text-white transition-colors"
                    title="Tutup"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {selectedCapaian.subCapaian.length === 0 ? (
                <p className="py-10 text-center text-xs text-white/70">
                  Belum ada rincian sub capaian pada capaian ini.
                </p>
              ) : (
                <>
                  {/* Radar Chart */}
                  <div className="mt-4 flex justify-center">
                    <div className="w-full max-w-[340px]">
                      <RadarChartCJ
                        labels={selectedCapaian.subCapaian.map((sc) => sc.nama)}
                        values={selectedCapaian.subCapaian.map((sc) => sc.poinTerkumpul ?? sc.poinProgres ?? 0)}
                        darkBg
                        height={230}
                      />
                    </div>
                  </div>

                  {/* Sub Capaian Bars List */}
                  <div className="mt-5 space-y-3">
                    {selectedCapaian.subCapaian.map((sc, idx) => {
                      const val = sc.poinTerkumpul ?? sc.poinProgres ?? 0
                      const target = sc.targetPoin || 0
                      const pct = target > 0 ? Math.min(100, Math.round((val / target) * 100)) : (val > 0 ? 100 : 0)
                      return (
                        <div key={sc.id ?? idx} className="flex items-center gap-3">
                          <span className="w-48 sm:w-64 shrink-0 truncate text-xs text-white/85" title={sc.nama}>
                            {sc.nama}
                          </span>
                          <div className="flex-1 overflow-hidden rounded-full bg-base-100/20" style={{ height: 6 }}>
                            <div
                              className="h-full rounded-full transition-all bg-[#ff7b72]"
                              style={{ width: `${Math.min(100, Math.max(pct, val > 0 ? 5 : 0))}%` }}
                            />
                          </div>
                          <span className="w-8 shrink-0 text-right text-xs font-bold text-white">
                            {val}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <TableCard title="Riwayat Poin">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative flex w-full sm:flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/50" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kegiatan..."
                className="input w-full"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-base-300 px-3 py-2 text-sm text-base-content/80 outline-none">
                <option value="">Semua Kategori</option>
                {kategoriOptions.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
              <select value={filterPeran} onChange={(e) => setFilterPeran(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-base-300 px-3 py-2 text-sm text-base-content/80 outline-none">
                <option value="">Semua Peran</option>
                {peranOptions.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-base-300 px-3 py-2 text-sm text-base-content/80 outline-none">
                <option value="">Semua Status</option>
                {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <select value={filterSkala} onChange={(e) => setFilterSkala(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-base-300 px-3 py-2 text-sm text-base-content/80 outline-none">
                <option value="">Semua Skala</option>
                {skalaOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filterPenyelenggara} onChange={(e) => setFilterPenyelenggara(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-base-300 px-3 py-2 text-sm text-base-content/80 outline-none">
                <option value="">Semua Penyelenggara</option>
                {penyelenggaraOptions.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              {(search || filterKategori || filterPeran || filterStatus || filterSkala || filterPenyelenggara) && (
                <button type="button" onClick={resetFilter} className="rounded-lg border border-brand-dark bg-base-100 px-3 py-2 text-sm font-medium text-brand-dark transition hover:bg-base-200">Reset Filter</button>
              )}
            </div>
          </div>

          <TableFrame>
            {loading ? (
              <p className="py-8 text-center text-sm text-base-content/50">Memuat riwayat…</p>
            ) : (
              <DataTable columns={columns} data={filtered} />
            )}
          </TableFrame>
        </TableCard>
      </div>
    </DashboardLayout>
  )
}

export default RiwayatPoin
