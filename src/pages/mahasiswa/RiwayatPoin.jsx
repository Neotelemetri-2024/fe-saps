import { useEffect, useMemo, useState } from 'react'
import { Search, CheckCircle, X } from 'lucide-react'
import { ChartSkeleton } from '../../components/dashboard/Skeleton'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import StatusBadge from '../../components/dashboard/StatusBadge'
import KegiatanCell from '../../components/dashboard/KegiatanCell'
import ProgressBar from '../../components/dashboard/ProgressBar'
import { RadarChartCJ } from '../../components/charts'
import { getCurrentUser } from '../../services/authService'
import { get, resolveUploadUrl } from '../../services/apiClient'
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
  if (item.status === 'completed' || pct >= 100) return 'Selesai'
  return 'Berlangsung'
}

const columns = [
  { key: 'no', label: 'No' },
  { key: 'kegiatan', label: 'Kegiatan', render: (row) => <KegiatanCell nama={row.kegiatan} tanggal={row.diajukanPada} /> },
  { key: 'jenis', label: 'Jenis' },
  { key: 'peran', label: 'Peran' },
  { key: 'skala', label: 'Skala' },
  { key: 'penyelenggara', label: 'Penyelenggara' },
  { key: 'tanggal', label: 'Tanggal' },
  {
    key: 'bukti',
    label: 'Bukti',
    render: (row) =>
      row.buktiUrl ? (
        <a href={row.buktiUrl} target="_blank" rel="noreferrer" className="link link-primary">
          {row.bukti}
        </a>
      ) : (
        <span className="text-base-content/50">{row.bukti}</span>
      ),
  },
  { key: 'poin', label: 'Poin' },
  { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
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
              tahun: item.nama || `Tahun ${item.urutan || ''}`,
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
            buktiUrl: resolveUploadUrl(item.bukti || item.buktiUrl || null),
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
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-extrabold text-base-content">Riwayat poin</h2>
          <p className="mt-1 text-sm text-base-content/60">Kegiatan dan poin sesuai kurikulum</p>
        </div>

        <div className="card bg-base-100 p-5">
          <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-sm font-semibold text-base-content">Progres kurikulum</h3>
              <p className="mt-0.5 text-xs text-base-content/60">
                Poin progres dibatasi sesuai target capaian.
              </p>
            </div>
            <div className="flex items-center gap-5">
              <div>
                <p className="text-xs text-base-content/60">Progres target</p>
                <p className="mt-0.5 text-base font-extrabold text-base-content">
                  {loading ? '…' : totalPoinProgres}
                  <span className="text-xs font-normal text-base-content/60">/{totalTarget} ({pctTotal}%)</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-base-content/60">Total diperoleh</p>
                <p className="mt-0.5 text-base font-extrabold text-base-content">
                  {loading ? '…' : totalPoin}
                  <span className="text-xs font-normal text-base-content/60"> poin</span>
                </p>
              </div>
            </div>
          </div>
          {loading ? (
            <ChartSkeleton height={140} />
          ) : progressData.length === 0 ? (
            <p className="py-8 text-center text-sm text-base-content/50">Belum ada data progress kurikulum.</p>
          ) : (
            <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {progressData.map((item, index) => {
                const isSelected = selectedCapaianId === item.id
                return (
                  <button
                    key={item.id ?? index}
                    type="button"
                    onClick={() => setSelectedCapaianId((prev) => (prev === item.id ? null : item.id))}
                    className={`rounded-lg border p-4 text-center ${
                      isSelected ? 'border-primary bg-base-200' : 'border-base-300 bg-base-100'
                    }`}
                  >
                    <p className="text-xs text-base-content/60">{item.tahun}</p>
                    <p className="mt-1 text-2xl font-extrabold leading-none text-base-content">
                      {item.current}
                      <span className="text-sm font-normal text-base-content/60">/{item.target} poin</span>
                    </p>
                    <div className="mt-1 flex items-center justify-center gap-1 text-xs text-base-content/60">
                      {item.onTrack ? <CheckCircle className="h-3.5 w-3.5 text-base-content" /> : null}
                      <span>{item.label}</span>
                    </div>
                    <div className="mt-2">
                      <ProgressBar value={item.current} max={item.target || 1} height={6} />
                    </div>
                    {item.poinLebih > 0 ? (
                      <p className="mt-1.5 text-[11px] text-base-content/50">
                        +{item.poinLebih} poin lebih di riwayat
                      </p>
                    ) : null}
                  </button>
                )
              })}
            </div>
          )}

          {selectedCapaian ? (
            <div className="mt-5 border-t border-base-300 pt-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-base-content">Sub capaian</h3>
                  <p className="mt-0.5 text-xs text-base-content/60">{selectedCapaian.nama}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedCapaian.id}
                    onChange={(e) => {
                      const targetId = Number(e.target.value) || e.target.value
                      setSelectedCapaianId(targetId)
                    }}
                    className="select select-sm"
                  >
                    {progressData.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nama}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setSelectedCapaianId(null)}
                    className="btn btn-ghost btn-sm btn-square"
                    title="Tutup"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {selectedCapaian.subCapaian.length === 0 ? (
                <p className="py-8 text-center text-sm text-base-content/50">
                  Belum ada rincian sub capaian pada capaian ini.
                </p>
              ) : (
                <>
                  <div className="mt-3 overflow-visible">
                    <RadarChartCJ
                      labels={selectedCapaian.subCapaian.map((sc) => sc.nama)}
                      values={selectedCapaian.subCapaian.map((sc) => sc.poinTerkumpul ?? sc.poinProgres ?? 0)}
                      height={360}
                    />
                  </div>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    {selectedCapaian.subCapaian.map((sc, idx) => {
                      const val = sc.poinTerkumpul ?? sc.poinProgres ?? 0
                      const target = sc.targetPoin || 100
                      return (
                        <ProgressBar
                          key={sc.id ?? idx}
                          value={val}
                          max={target || 100}
                          height={6}
                          label={sc.nama}
                          showPercent
                        />
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>

        <TableCard title="Riwayat poin">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <label className="input input-sm flex-1">
              <Search className="h-4 w-4 shrink-0 opacity-50" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kegiatan"
              />
            </label>
            <select value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)} className="select select-sm sm:w-40">
              <option value="">Semua kategori</option>
              {kategoriOptions.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            <select value={filterPeran} onChange={(e) => setFilterPeran(e.target.value)} className="select select-sm sm:w-36">
              <option value="">Semua peran</option>
              {peranOptions.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="select select-sm sm:w-36">
              <option value="">Semua status</option>
              {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select value={filterSkala} onChange={(e) => setFilterSkala(e.target.value)} className="select select-sm sm:w-36">
              <option value="">Semua skala</option>
              {skalaOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterPenyelenggara} onChange={(e) => setFilterPenyelenggara(e.target.value)} className="select select-sm sm:w-44">
              <option value="">Semua penyelenggara</option>
              {penyelenggaraOptions.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            {(search || filterKategori || filterPeran || filterStatus || filterSkala || filterPenyelenggara) ? (
              <button type="button" onClick={resetFilter} className="btn btn-ghost btn-sm">Reset</button>
            ) : null}
          </div>

          <TableFrame>
            <DataTable columns={columns} data={filtered} loading={loading} emptyText="Belum ada riwayat poin." />
          </TableFrame>
        </TableCard>
      </div>
    </DashboardLayout>
  )
}

export default RiwayatPoin
