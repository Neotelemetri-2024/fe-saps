import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import { RadarChartCJ } from '../../components/charts'
import ProgressBar from '../../components/dashboard/ProgressBar'
import { getCurrentUser } from '../../services/authService'
import { get } from '../../services/apiClient'
import { getPersetujuanMahasiswa } from '../../services/pengajuanService'
import { getPengajuan } from '../../services/pengajuanService'
import { getKlaim } from '../../services/poinService'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import PanduanCard from '../../components/dashboard/PanduanCard'

function LihatSelengkapnyaButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-brand-dark bg-white px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-[#f5f7f5]"
    >
      Lihat selengkapnya →
    </button>
  )
}

function StatusBadge({ status }) {
  const s = String(status || '').toLowerCase()
  const map = {
    pending:    { cls: 'bg-amber-50 text-amber-700 border border-amber-200', label: 'Pending' },
    disetujui:  { cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: 'Disetujui' },
    ditolak:    { cls: 'bg-red-50 text-red-600 border border-red-200', label: 'Ditolak' },
    diteruskan: { cls: 'bg-blue-50 text-blue-600 border border-blue-200', label: 'Diteruskan' },
  }
  const style = map[s] || { cls: 'bg-gray-100 text-gray-600', label: status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending' }
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${style.cls}`}>
      {style.label}
    </span>
  )
}

function buildProgressLabel(pct) {
  if (pct >= 100) return 'COMPLETED'
  return 'PROGRESS'
}

function formatTanggal(value) {
  if (value == null || value === '') return null
  const s = String(value).trim()
  if (!s || s === '-') return null
  // Sudah diformat di service (mis. "19 Agu 2026") — jangan parse ulang
  if (/[a-zA-ZÀ-ÿ]/.test(s) && !/^\d{4}-\d{2}-\d{2}/.test(s) && !/T\d{2}:/.test(s)) return s
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return null
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return null
  }
}

function formatTanggalJam(value) {
  if (!value) return null
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return null
    const tanggal = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    const jam = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
    return `${tanggal}, ${jam}`
  } catch {
    return null
  }
}

function KegiatanCell({ nama, diajukanPada }) {
  const tanggal = formatTanggal(diajukanPada)
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-black">{nama || '-'}</p>
      {tanggal && <p className="text-xs text-[#616161]">Diajukan: {tanggal}</p>}
    </div>
  )
}
const FALLBACK_RADAR = [
  { label: 'Fondasi', value: 0 },
  { label: 'Penguatan', value: 0 },
  { label: 'Pemantapan', value: 0 },
  { label: 'Aktualisasi', value: 0 },
]

function MahasiswaDashboard() {
  const navigate = useNavigate()
  const user = getCurrentUser()

  const [dashData, setDashData] = useState(null)
  const [loadingDash, setLoadingDash] = useState(true)
  const [persetujuan, setPersetujuan] = useState([])
  const [pengajuan, setPengajuan] = useState([])
  const [klaim, setKlaim] = useState([])
  const [loadingTables, setLoadingTables] = useState(true)
  const [saranPa, setSaranPa] = useState([])
  const [loadingSaran, setLoadingSaran] = useState(true)

  useEffect(() => {
    get('/api/mahasiswa/dashboard')
      .then((res) => setDashData(res?.data || res))
      .catch(() => setDashData(null))
      .finally(() => setLoadingDash(false))

    get('/api/mahasiswa/saran-pa')
      .then((res) => {
        const list = res?.data || res || []
        setSaranPa(Array.isArray(list) ? list : [])
      })
      .catch(() => setSaranPa([]))
      .finally(() => setLoadingSaran(false))

    Promise.all([
      getPersetujuanMahasiswa().catch(() => []),
      getPengajuan().catch(() => []),
      getKlaim().catch(() => []),
    ]).then(([p, e, k]) => {
      setPersetujuan(Array.isArray(p) ? p : [])
      setPengajuan(Array.isArray(e) ? e : [])
      setKlaim(Array.isArray(k) ? k : [])
    }).finally(() => setLoadingTables(false))
  }, [])

  const rawProgres = dashData?.progresTahunan || dashData?.progressTahun || []
  const progressData = (Array.isArray(rawProgres) ? rawProgres : []).map((item) => {
    const current = item.poinTerkumpul ?? item.current ?? 0
    const target = item.targetPoin ?? item.target ?? 1
    const pct = item.persentase ?? (target > 0 ? Math.round((current / target) * 100) : 0)
    return {
      tahun: (item.nama || `TAHUN ${item.urutan || ''}`).toUpperCase(),
      current,
      target,
      pct,
      label: buildProgressLabel(pct),
      onTrack: pct >= 100,
    }
  })

  const totalPoin = dashData?.totalPoin ?? progressData.reduce((sum, t) => sum + (t.current || 0), 0)
  const maxPoin = dashData?.totalTarget ?? 0
  const pctTotal = maxPoin > 0 ? Math.round((totalPoin / maxPoin) * 100) : 0

  const radarRaw = dashData?.radarData || dashData?.radar || dashData?.capaian || FALLBACK_RADAR
  const radarLabels = radarRaw.map((d) => d.label || d.nama || '')
  const radarValues = radarRaw.map((d) => d.value ?? d.poin ?? 0)

  return (
    <DashboardLayout role="mahasiswa" userName={user?.nama || 'Mahasiswa'} userRole="Mahasiswa">
      <div className="space-y-4 sm:space-y-6">
        {/* Welcome + Radar */}
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0 rounded-xl border border-[#e9ebf8] bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-xl font-extrabold text-black sm:text-2xl lg:text-3xl">
              Selamat Datang,<br />{user?.nama || 'Mahasiswa'}!
            </h2>
            <p className="mt-3 max-w-lg text-sm text-[#616161]">
              Pantau aktivitas akademik, capaian poin, dan sertifikasi kamu secara real-time.
            </p>
            <p className="mt-6 text-sm font-medium text-[#616161]">Total Capaian Poin</p>
            <div className="mt-1 flex flex-wrap items-end gap-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-brand-dark">{loadingDash ? '…' : totalPoin}</span>
                <span className="text-lg font-semibold text-[#9aa0a6]">/ {maxPoin}</span>
              </div>
              <div className="min-w-[200px] flex-1">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#e9ebf8]">
                  <div className="h-2.5 rounded-full bg-brand-dark transition-all" style={{ width: `${Math.min(pctTotal, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="min-w-0 overflow-hidden rounded-xl bg-gradient-to-b from-brand-dark to-brand-light p-4 text-center shadow-sm sm:p-6">
            <h3 className="text-sm font-bold text-white">Radar Karakter Andalasian</h3>
            <div className="mx-auto mt-2 max-w-[260px]">
              <RadarChartCJ labels={radarLabels} values={radarValues} darkBg height={200} />
            </div>
          </div>
        </div>

        {/* Progress per Tahun Kurikulum */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-3 sm:p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-[#222] sm:text-lg">Progress Poin</h3>
              <p className="mt-0.5 text-sm font-medium text-brand-dark">
                Total Capaian: <span className="font-bold">{loadingDash ? '…' : totalPoin}</span> / {maxPoin} poin
              </p>
            </div>
            <LihatSelengkapnyaButton onClick={() => navigate('/mahasiswa/riwayat-poin')} />
          </div>
          {loadingDash ? (
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pesan dari Dosen PA */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-[#222]">Pesan dari Dosen PA</h3>
            <LihatSelengkapnyaButton onClick={() => navigate('/mahasiswa/pesan-dosen-pa')} />
          </div>
          {loadingSaran ? (
            <p className="py-6 text-center text-sm text-[#9aa0a6]">Memuat pesan…</p>
          ) : saranPa.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#9aa0a6]">Belum ada pesan dari Dosen PA.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {saranPa.slice(0, 3).map((s) => {
                const waktu = formatTanggalJam(s.createdAt || s.tanggal)
                return (
                  <div key={s.id} className="rounded-lg border border-[#e9ebf8] bg-[#f9fafb] px-4 py-3">
                    <p className="text-sm leading-relaxed text-[#333]">{s.isi}</p>
                    <p className="mt-1 text-xs text-[#888]">
                      {waktu ? `${waktu} · ` : ''}Dosen PA
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Tabel Pengajuan Eksternal */}
        <TableCard
          title="Riwayat Pengajuan Kegiatan Eksternal"
          headerRight={<LihatSelengkapnyaButton onClick={() => navigate('/mahasiswa/kegiatan-eksternal')} />}
        >
          <TableFrame>
            <DataTable
              columns={[
                { key: '_no', label: 'No' },
                { key: 'kegiatan', label: 'Kegiatan', render: (row) => <KegiatanCell nama={row.kegiatan || row.namaKegiatan} diajukanPada={row.tanggalPengajuan || row.dibuatPada || row.createdAt} /> },
                { key: 'jenis', label: 'Jenis' },
                { key: 'penyelenggara', label: 'Penyelenggara' },
                { key: 'tanggal', label: 'Tanggal', render: (row) => formatTanggal(row.tanggalPelaksanaan || row.tanggalMulai || row.tanggal) || '-' },
                { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
              ]}
              data={pengajuan.slice(0, 5).map((r, i) => ({ ...r, _no: i + 1 }))}
              loading={loadingTables}
              emptyText="Belum ada data."
            />
          </TableFrame>
        </TableCard>

        {/* Tabel Persetujuan Dosen */}
        <TableCard
          title="Riwayat Persetujuan Dosen PA"
          headerRight={<LihatSelengkapnyaButton onClick={() => navigate('/mahasiswa/persetujuan-dosen')} />}
        >
          <TableFrame>
            <DataTable
              columns={[
                { key: '_no', label: 'No' },
                { key: 'kegiatan', label: 'Kegiatan', render: (row) => <KegiatanCell nama={row.kegiatan || row.namaKegiatan} diajukanPada={row.tanggalDiajukan || row.createdAt} /> },
                { key: 'jenis', label: 'Jenis' },
                { key: 'peran', label: 'Peran' },
                { key: 'penyelenggara', label: 'Penyelenggara' },
                { key: 'tanggal', label: 'Tanggal', render: (row) => formatTanggal(row.tanggalPelaksanaan || row.tanggalMulai || row.tanggal) || '-' },
                { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
              ]}
              data={persetujuan.slice(0, 5).map((r, i) => ({ ...r, _no: i + 1 }))}
              loading={loadingTables}
              emptyText="Belum ada data."
            />
          </TableFrame>
        </TableCard>

        {/* Tabel Klaim Poin */}
        <TableCard
          title="Riwayat Klaim Poin"
          headerRight={<LihatSelengkapnyaButton onClick={() => navigate('/mahasiswa/klaim-poin')} />}
        >
          <TableFrame>
            <DataTable
              columns={[
                { key: '_no', label: 'No' },
                { key: 'kegiatan', label: 'Kegiatan', render: (row) => <KegiatanCell nama={row.namaKegiatan || row.kegiatan} diajukanPada={row.tanggalKlaim || row.createdAt} /> },
                { key: 'jenis', label: 'Jenis', render: (row) => row.jenisKegiatan || row.jenis || '-' },
                { key: 'peran', label: 'Peran' },
                { key: 'poin', label: 'Poin', render: (row) => <span className="font-bold text-brand-dark">{row.poin ?? '-'}</span> },
                { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
              ]}
              data={klaim.slice(0, 5).map((r, i) => ({ ...r, _no: i + 1 }))}
              loading={loadingTables}
              emptyText="Belum ada data."
            />
          </TableFrame>
        </TableCard>

        <PanduanCard
          className="max-w-lg"
          title="Manual Book User Mahasiswa"
          description="Panduan Penggunaan Website SAPS untuk Mahasiswa"
        />
      </div>
    </DashboardLayout>
  )
}

export default MahasiswaDashboard
