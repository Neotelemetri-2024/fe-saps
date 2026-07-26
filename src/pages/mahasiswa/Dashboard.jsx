import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { RadarChartCJ } from '../../components/charts'
import { getCurrentUser } from '../../services/authService'
import { get } from '../../services/apiClient'
import { getPersetujuanMahasiswa } from '../../services/pengajuanService'
import { getPengajuan } from '../../services/pengajuanService'
import { getKlaim } from '../../services/poinService'

function StatusBadge({ status }) {
  const s = String(status || '').toLowerCase()
  const map = {
    pending:    { cls: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-500', label: 'Pending' },
    disetujui:  { cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500', label: 'Disetujui' },
    ditolak:    { cls: 'bg-red-50 text-red-600 border border-red-200', dot: 'bg-red-500', label: 'Ditolak' },
    diteruskan: { cls: 'bg-blue-50 text-blue-600 border border-blue-200', dot: 'bg-blue-500', label: 'Diteruskan' },
  }
  const style = map[s] || { cls: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400', label: status }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${style.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  )
}

function TahunBadge({ status }) {
  const map = { TUNTAS: 'bg-emerald-50 text-emerald-700', BERJALAN: 'bg-amber-100 text-amber-700', BELUM: 'bg-gray-100 text-gray-400' }
  return <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${map[status] || 'bg-gray-100 text-gray-400'}`}>{status}</span>
}

function KegiatanCell({ nama, tanggal }) {
  return (
    <td className="px-4 py-4 align-top">
      <p className="font-semibold text-[#333]">{nama || '-'}</p>
      {tanggal && (
        <p className="mt-1 flex items-center gap-1 text-xs text-[#9aa0a6]">
          <Clock className="h-3 w-3" /> {tanggal}
        </p>
      )}
    </td>
  )
}

function RiwayatTable({ title, columns, rows, renderRow, loading }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
      <div className="p-6 pb-0">
        <h3 className="text-lg font-bold text-brand-dark">{title}</h3>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-left text-xs font-semibold uppercase tracking-wide text-white">
              {columns.map((c) => <th key={c} className="whitespace-nowrap px-4 py-3">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-[#9aa0a6]">Memuat data...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-[#9aa0a6]">Belum ada data.</td></tr>
            ) : rows.map((row, i) => (
              <tr key={i} className="border-b border-[#e9ebf8] last:border-0 hover:bg-[#f9fafb]">{renderRow(row, i)}</tr>
            ))}
          </tbody>
        </table>
      </div>
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

  useEffect(() => {
    get('/api/mahasiswa/dashboard')
      .then((res) => setDashData(res?.data || res))
      .catch(() => setDashData(null))
      .finally(() => setLoadingDash(false))

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

  const totalPoin = dashData?.totalPoin ?? dashData?.poin ?? 0
  const maxPoin = dashData?.targetPoin ?? dashData?.maxPoin ?? 550
  const pctTotal = maxPoin > 0 ? Math.round((totalPoin / maxPoin) * 100) : 0

  const tahunanProgress = dashData?.progresCapaian || dashData?.tahunan || [
    { no: '01', label: 'Tahun 1: Dasar', target: 100, poin: 0, status: 'BELUM' },
    { no: '02', label: 'Tahun 2: Menengah', target: 150, poin: 0, status: 'BELUM' },
    { no: '03', label: 'Tahun 3: Mahir', target: 200, poin: 0, status: 'BELUM' },
    { no: '04', label: 'Tahun 4: Akhir', target: 100, poin: 0, status: 'BELUM' },
  ]

  const radarRaw = dashData?.radar || dashData?.capaian || FALLBACK_RADAR
  const radarLabels = radarRaw.map((d) => d.label || d.nama || '')
  const radarValues = radarRaw.map((d) => d.value ?? d.poin ?? 0)

  return (
    <DashboardLayout role="mahasiswa" userName={user?.nama || 'Mahasiswa'} userRole="Mahasiswa">
      <div className="space-y-4 sm:space-y-6">
        {/* Welcome + Radar */}
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-4 shadow-sm sm:p-6">
            <h2 className="bg-gradient-to-r from-brand-dark to-brand-light bg-clip-text text-xl font-extrabold text-transparent sm:text-2xl lg:text-3xl">
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
                <div className="h-2.5 w-full rounded-full bg-[#e9ebf8]">
                  <div className="h-2.5 rounded-full bg-brand-dark transition-all" style={{ width: `${pctTotal}%` }} />
                </div>
              </div>
              <span className="text-xs text-[#616161]">{pctTotal}% Selesai</span>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-b from-brand-dark to-brand-light p-4 text-center shadow-sm sm:p-6">
            <h3 className="text-sm font-bold text-white">Radar Karakter Andalasian</h3>
            <RadarChartCJ labels={radarLabels} values={radarValues} darkBg height={220} />
          </div>
        </div>

        {/* Progres Tahunan */}
        <div>
          <h3 className="text-lg font-bold text-brand-dark">Progres Capaian Tahunan</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tahunanProgress.map((t, i) => {
              const pct = t.target > 0 ? Math.round(((t.poin || 0) / t.target) * 100) : 0
              const inactive = (t.status || 'BELUM') === 'BELUM'
              return (
                <div key={i} className={`rounded-xl border p-5 shadow-sm ${t.status === 'BERJALAN' ? 'border-brand-dark' : 'border-[#e9ebf8]'} bg-white`}>
                  <div className="flex items-start justify-between">
                    <span className={`text-2xl font-extrabold ${inactive ? 'text-gray-300' : 'text-brand-dark'}`}>{t.no || String(i+1).padStart(2,'0')}</span>
                    <TahunBadge status={t.status || 'BELUM'} />
                  </div>
                  <p className={`mt-3 text-sm font-bold ${inactive ? 'text-gray-400' : 'text-brand-dark'}`}>{t.label}</p>
                  <p className="text-xs text-[#9aa0a6]">Target: {t.target} Poin</p>
                  <div className="mt-3 h-2 w-full rounded-full bg-[#e9ebf8]">
                    <div className={`h-2 rounded-full ${inactive ? 'bg-gray-300' : 'bg-brand-dark'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-2 text-right text-xs font-semibold text-[#616161]">{t.poin || 0} / {t.target}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tabel Persetujuan Dosen */}
        <RiwayatTable
          title="Riwayat Persetujuan Dosen PA"
          columns={['NO', 'KEGIATAN', 'JENIS', 'PERAN', 'PENYELENGGARA', 'TANGGAL', 'STATUS']}
          rows={persetujuan.slice(0, 5)}
          loading={loadingTables}
          renderRow={(row, i) => (
            <>
              <td className="px-4 py-4">{i + 1}</td>
              <KegiatanCell nama={row.kegiatan || row.namaKegiatan} tanggal={row.dibuatPada || row.tanggal} />
              <td className="px-4 py-4">{row.jenis || '-'}</td>
              <td className="px-4 py-4">{row.peran || '-'}</td>
              <td className="px-4 py-4">{row.penyelenggara || '-'}</td>
              <td className="px-4 py-4">{row.tanggal || '-'}</td>
              <td className="px-4 py-4"><StatusBadge status={row.status} /></td>
            </>
          )}
        />

        {/* Tabel Pengajuan Eksternal */}
        <RiwayatTable
          title="Riwayat Pengajuan Kegiatan Eksternal"
          columns={['NO', 'KEGIATAN', 'JENIS', 'PERAN', 'PENYELENGGARA', 'TANGGAL', 'STATUS']}
          rows={pengajuan.slice(0, 5)}
          loading={loadingTables}
          renderRow={(row, i) => (
            <>
              <td className="px-4 py-4">{i + 1}</td>
              <KegiatanCell nama={row.kegiatan || row.namaKegiatan} tanggal={row.diajukanPada} />
              <td className="px-4 py-4">{row.jenis || '-'}</td>
              <td className="px-4 py-4">{row.peran || '-'}</td>
              <td className="px-4 py-4">{row.penyelenggara || '-'}</td>
              <td className="px-4 py-4">{row.tanggal || '-'}</td>
              <td className="px-4 py-4"><StatusBadge status={row.status} /></td>
            </>
          )}
        />

        {/* Tabel Klaim Poin */}
        <RiwayatTable
          title="Riwayat Klaim Poin"
          columns={['NO', 'KEGIATAN', 'JENIS', 'PERAN', 'POIN', 'STATUS']}
          rows={klaim.slice(0, 5)}
          loading={loadingTables}
          renderRow={(row, i) => (
            <>
              <td className="px-4 py-4">{i + 1}</td>
              <KegiatanCell nama={row.kegiatan || row.namaKegiatan} tanggal={row.tanggal} />
              <td className="px-4 py-4">{row.jenis || '-'}</td>
              <td className="px-4 py-4">{row.peran || '-'}</td>
              <td className="px-4 py-4 font-bold text-brand-dark">{row.poin ?? '-'}</td>
              <td className="px-4 py-4"><StatusBadge status={row.status} /></td>
            </>
          )}
        />
      </div>
    </DashboardLayout>
  )
}

export default MahasiswaDashboard
