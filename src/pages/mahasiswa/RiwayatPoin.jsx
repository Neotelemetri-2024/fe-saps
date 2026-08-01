import { useEffect, useMemo, useState } from 'react'
import { Search, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import StatusBadge from '../../components/dashboard/StatusBadge'
import KegiatanCell from '../../components/dashboard/KegiatanCell'
import ProgressBar from '../../components/dashboard/ProgressBar'
import { getCurrentUser } from '../../services/authService'
import { get } from '../../services/apiClient'

function formatTanggal(val) {
  if (!val) return '-'
  try {
    return new Date(val).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
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
  if (item.status === 'completed' || pct >= 100) return `${pct}% COMPLETED`
  if (pct >= 80) return `${pct}% ON TRACK`
  return `${pct}% PROGRESS`
}

const columns = [
  { key: 'no', label: 'NO' },
  { key: 'kegiatan', label: 'KEGIATAN', render: (row) => <KegiatanCell nama={row.kegiatan} tanggal={row.diajukanPada} /> },
  { key: 'jenis', label: 'JENIS' },
  { key: 'peran', label: 'PERAN' },
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
        <span className="text-[#9aa0a6]">{row.bukti}</span>
      ),
  },
  { key: 'poin', label: 'POIN' },
  { key: 'status', label: 'STATUS', render: (row) => <StatusBadge status={row.status} /> },
]

function RiwayatPoin() {
  const user = getCurrentUser()
  const [loading, setLoading] = useState(true)
  const [totalPoin, setTotalPoin] = useState(0)
  const [totalTarget, setTotalTarget] = useState(550)
  const [progressData, setProgressData] = useState([])
  const [riwayat, setRiwayat] = useState([])
  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState('')
  const [filterPeran, setFilterPeran] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPenyelenggara, setFilterPenyelenggara] = useState('')

  useEffect(() => {
    setLoading(true)
    get('/api/mahasiswa/riwayat-poin')
      .then((res) => {
        const data = res?.data || res || {}
        setTotalPoin(data.totalPoin ?? 0)
        setTotalTarget(data.totalTarget ?? 550)

        const progress = Array.isArray(data.progressTahun) ? data.progressTahun : []
        setProgressData(
          progress.map((item) => {
            const current = item.poinTerkumpul ?? item.current ?? 0
            const target = item.targetPoin ?? item.target ?? 1
            const pct = item.persentase ?? (target > 0 ? Math.round((current / target) * 100) : 0)
            const onTrack = pct >= 50
            return {
              tahun: (item.nama || `TAHUN ${item.urutan || ''}`).toUpperCase(),
              current,
              target,
              label: buildProgressLabel({ ...item, persentase: pct }),
              onTrack,
              remaining: pct < 100 && pct >= 80 ? `${Math.max(0, target - current)} remaining` : undefined,
              status: pct < 50 ? 'In Progress' : undefined,
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

  const kategoriOptions = useMemo(() => [...new Set(riwayat.map((r) => r.jenis).filter((v) => v && v !== '-'))], [riwayat])
  const peranOptions = useMemo(() => [...new Set(riwayat.map((r) => r.peran).filter((v) => v && v !== '-'))], [riwayat])
  const penyelenggaraOptions = useMemo(
    () => [...new Set(riwayat.map((r) => r.penyelenggara).filter((v) => v && v !== '-'))],
    [riwayat],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return riwayat.filter((r) => {
      if (q && !r.kegiatan.toLowerCase().includes(q) && !r.penyelenggara.toLowerCase().includes(q)) return false
      if (filterKategori && r.jenis !== filterKategori) return false
      if (filterPeran && r.peran !== filterPeran) return false
      if (filterStatus && r.status !== filterStatus) return false
      if (filterPenyelenggara && r.penyelenggara !== filterPenyelenggara) return false
      return true
    })
  }, [riwayat, search, filterKategori, filterPeran, filterStatus, filterPenyelenggara])

  const resetFilter = () => {
    setSearch('')
    setFilterKategori('')
    setFilterPeran('')
    setFilterStatus('')
    setFilterPenyelenggara('')
  }

  return (
    <DashboardLayout role="mahasiswa" userName={user?.nama || 'Mahasiswa'} userRole="Mahasiswa">
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-brand-dark sm:text-2xl">Riwayat Poin</h2>
        <p className="text-sm text-[#616161]">Rekap seluruh kegiatan dan poin yang telah terkumpul sesuai kurikulum.</p>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-3 sm:p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-brand-dark sm:text-lg">Progress per Tahun Kurikulum</h3>
            <div className="flex items-center gap-2 text-sm font-medium text-brand-dark">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-light text-white text-xs">⭐</span>
              Total Capaian: <span className="font-bold">{loading ? '…' : totalPoin}</span> / {totalTarget} poin
            </div>
          </div>
          {loading ? (
            <p className="py-8 text-center text-sm text-[#9aa0a6]">Memuat progress…</p>
          ) : progressData.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#9aa0a6]">Belum ada data progress kurikulum.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {progressData.map((item, index) => (
                <div key={index} className="rounded-lg border border-[#e9ebf8] p-4 text-center">
                  <p className="text-xs font-semibold text-[#616161]">{item.tahun}</p>
                  <p className="mt-1 text-2xl font-bold text-brand-dark">
                    {item.current}
                    <span className="text-sm font-normal text-[#616161]">/{item.target} poin</span>
                  </p>
                  <div className="mt-2 flex justify-center">
                    <ProgressBar value={item.current} max={item.target || 1} height={6} />
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-1 text-sm text-[#616161]">
                    {item.onTrack && <CheckCircle className="h-4 w-4 text-emerald-600" />}
                    <span>{item.label}</span>
                    {item.remaining && <span className="font-medium text-brand-dark">{item.remaining}</span>}
                    {item.status && <span className="font-medium text-[#616161]">{item.status}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <TableCard title="Riwayat Poin">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#e9ebf8] px-4 py-2">
              <Search className="h-4 w-4 text-[#616161]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kegiatan..."
                className="flex-1 text-sm outline-none"
              />
            </div>

            <select value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)} className="rounded-lg border border-[#e9ebf8] px-4 py-2 text-sm text-[#333] outline-none">
              <option value="">Kategori</option>
              {kategoriOptions.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            <select value={filterPeran} onChange={(e) => setFilterPeran(e.target.value)} className="rounded-lg border border-[#e9ebf8] px-4 py-2 text-sm text-[#333] outline-none">
              <option value="">Peran</option>
              {peranOptions.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-[#e9ebf8] px-4 py-2 text-sm text-[#333] outline-none">
              <option value="">Status</option>
              <option value="pending">Pending</option>
              <option value="disetujui">Disetujui</option>
              <option value="ditolak">Ditolak</option>
            </select>
            <select value={filterPenyelenggara} onChange={(e) => setFilterPenyelenggara(e.target.value)} className="rounded-lg border border-[#e9ebf8] px-4 py-2 text-sm text-[#333] outline-none">
              <option value="">Penyelenggara</option>
              {penyelenggaraOptions.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <button type="button" onClick={resetFilter} className="rounded-lg border border-brand-dark bg-white px-3 py-2 text-sm font-medium text-brand-dark transition hover:bg-[#f5f5f5]">Reset Filter</button>
          </div>

          <TableFrame>
            {loading ? (
              <p className="py-8 text-center text-sm text-[#9aa0a6]">Memuat riwayat…</p>
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
