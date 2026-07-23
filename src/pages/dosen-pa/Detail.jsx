import { useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import ProgressBar from '../../components/dashboard/ProgressBar'

// ── DATA FALLBACK ──
const defaultMahasiswa = {
  nama: 'Shafa Salsabilla',
  nim: '2311121063',
  prodi: 'Teknik Mesin',
  angkatan: '23',
  ipk: '3.80',
  poin: 470,
  targetPoin: 550,
}

const capaianOptions = [
  'Religion Character Development (Religius)',
  'Social Contribution',
  'Global Citizenship',
]

const radarDataByCapaian = {
  'Religion Character Development (Religius)': [
    { label: 'Leadership', value: 85 },
    { label: 'Global', value: 60 },
    { label: 'Comm.', value: 70 },
    { label: 'Public Speaking & Habit Mastery (Bakti)', value: 80 },
    { label: 'Critical', value: 75 },
    { label: 'Social Entrepreneurship', value: 65 },
    { label: 'Growth Mindset & Resilience', value: 90 },
    { label: 'Dig Lit & Literacy & literasi (Digital)', value: 72 },
  ],
  'Social Contribution': [
    { label: 'Leadership', value: 60 },
    { label: 'Global', value: 80 },
    { label: 'Comm.', value: 55 },
    { label: 'Critical', value: 70 },
    { label: 'Social Entrepreneurship', value: 90 },
    { label: 'Growth Mindset & Resilience', value: 65 },
    { label: 'Dig Lit & Literacy & literasi (Digital)', value: 50 },
    { label: 'Public Speaking & Habit Mastery (Bakti)', value: 75 },
  ],
  'Global Citizenship': [
    { label: 'Leadership', value: 75 },
    { label: 'Global', value: 90 },
    { label: 'Comm.', value: 80 },
    { label: 'Critical', value: 60 },
    { label: 'Social Entrepreneurship', value: 50 },
    { label: 'Growth Mindset & Resilience', value: 70 },
    { label: 'Dig Lit & Literacy & literasi (Digital)', value: 85 },
    { label: 'Public Speaking & Habit Mastery (Bakti)', value: 65 },
  ],
}

const totalPoinData = [
  { category: 'Fondasi', value: 80 },
  { category: 'Penguatan', value: 90 },
  { category: 'Pemantapan', value: 72 },
  { category: 'Aktualisasi', value: 65 },
]

const timelineAktivitas = [
  { event: 'Seminar nasional AI dan Teknologi', date: '5 Juni 2026', kategori: 'Communication', status: 'Disetujui Universitas', dotColor: 'bg-green-500' },
  { event: 'Bakti Sosial Lingkungan Kampus', date: '3 Juni 2026', kategori: 'social contribution', status: 'Disetujui Fakultas', dotColor: 'bg-green-500' },
  { event: 'Pelatihan kewirausahaan muda', date: '10 Mei 2026', kategori: 'entrepreneurship', status: 'Pending', dotColor: 'bg-yellow-400' },
]

const riwayatCatatan = [
  {
    message: '"Tingkatkan capaian Social Contribution. Segera ikuti KKN dan kegiatan bakti sebelum akhir semester ini. Progress akademik sudah sangat baik, pertahankan IPK anda."',
    date: '5 Mei 2026',
  },
  {
    message: 'Ikuti good laboratory practices untuk meningkatkan skill SOP dalam labor.',
    date: '5 Mei 2026',
  },
]

// ── RadarChart SVG ──
function RadarChart({ items }) {
  const n = items.length
  const cx = 90; const cy = 90; const R = 68
  const levels = 4

  const angleStep = (2 * Math.PI) / n
  const getPoint = (i, r) => {
    const angle = i * angleStep - Math.PI / 2
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    }
  }

  const webLines = Array.from({ length: levels }, (_, li) => {
    const r = (R * (li + 1)) / levels
    const pts = Array.from({ length: n }, (_, i) => getPoint(i, r))
    return pts.map((p, pi) => (pi === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ') + 'Z'
  })

  const dataPoints = items.map((item, i) => getPoint(i, (item.value / 100) * R))
  const dataPoly = dataPoints.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ') + 'Z'

  return (
    <svg className="w-[140px] h-[140px] sm:w-[180px] sm:h-[180px]" viewBox="0 0 180 180">
      {webLines.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const p = getPoint(i, R)
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
      })}
      <path d={dataPoly} fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.9)" strokeWidth={1.5} />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="white" />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const p = getPoint(i, R + 14)
        const shortLabel = items[i].label.length > 12 ? items[i].label.slice(0, 12) + '…' : items[i].label
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize={7} fill="rgba(255,255,255,0.85)">
            {shortLabel}
          </text>
        )
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={8} fill="white" fontWeight="600">Capaian per Bidang</text>
    </svg>
  )
}

function DosenPADetail() {
  const navigate = useNavigate()
  const { nim } = useParams()
  const location = useLocation()
  const m = location.state?.mahasiswa ?? { ...defaultMahasiswa, nim }

  const [activeCapaian, setActiveCapaian] = useState(capaianOptions[0])
  const [pesan, setPesan] = useState('')
  const [showAllCatatan, setShowAllCatatan] = useState(false)

  const radarItems = radarDataByCapaian[activeCapaian] ?? radarDataByCapaian[capaianOptions[0]]
  const pctTarget = Math.round((m.poin / (m.targetPoin ?? 550)) * 100)
  const displayedCatatan = showAllCatatan ? riwayatCatatan : riwayatCatatan.slice(0, 2)

  const handleKirimPesan = () => {
    if (!pesan.trim()) {
      toast.error('Pesan kosong', { description: 'Tuliskan pesan terlebih dahulu.' })
      return
    }
    toast.success('Pesan Terkirim!', { description: 'Pesan kepada mahasiswa berhasil dikirim.' })
    setPesan('')
  }

  return (
    <DashboardLayout role="dosen-pa" userName="Dr. Efa Yonnedi, SE, MPPM, Akt, CA, CRGP" userRole="Dosen Pembimbing">
      <div className="space-y-6">
        {/* Kembali */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>

        {/* Header Mahasiswa */}
        <div className="overflow-hidden rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-dark text-xl font-extrabold text-white">
                {m.nama?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-brand-dark">{m.nama}</h2>
                <p className="text-sm text-[#555]">{m.nim} • {m.prodi}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-brand-dark px-3 py-0.5 text-xs font-semibold text-white">
                    Angkatan {m.angkatan}
                  </span>
                  <span className="text-sm font-semibold text-[#555]">• IPK {m.ipk}</span>
                </div>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-4xl font-extrabold text-brand-dark">{m.poin}</p>
              <p className="text-sm text-[#888]">/ {m.targetPoin ?? 550} Poin</p>
              <div className="mt-2 w-full sm:w-40">
                <ProgressBar value={m.poin} max={m.targetPoin ?? 550} height={6} />
              </div>
              <p className="mt-1 text-xs text-[#888]">{pctTarget} % dari target yudisium</p>
            </div>
          </div>
        </div>

        {/* Sub Capaian + Total Poin */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Sub Capaian — bg hijau gelap */}
          <div className="rounded-xl bg-brand-dark p-6 text-white shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold">Sub Capaian</h3>
                <p className="mt-0.5 text-xs text-white/70">Sub Capaian dalam kategori fondasi</p>
              </div>
              <select
                value={activeCapaian}
                onChange={(e) => setActiveCapaian(e.target.value)}
                className="rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-xs text-white outline-none"
              >
                {capaianOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <p className="mb-4 text-xs font-semibold text-white/80">{activeCapaian}</p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              {/* Radar */}
              <div className="shrink-0">
                <RadarChart items={radarItems} />
              </div>
              {/* Progress list */}
              <div className="flex-1 space-y-2 w-full">
                {radarItems.map((item) => (
                  <div key={item.label} className="space-y-0.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-white/80 truncate max-w-[160px]">{item.label}</span>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                      <div
                        className="h-full rounded-full bg-white transition-all"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Total Poin per Capaian */}
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-brand-dark">Total Poin per Capaian</h3>
            <p className="mt-0.5 text-xs text-[#888]">Distribusi poin mahasiswa di setiap area pengembangan</p>
            <div className="mt-5 space-y-4">
              {totalPoinData.map((item) => (
                <div key={item.category} className="flex items-center gap-2 sm:gap-3">
                  <span className="w-20 sm:w-24 shrink-0 text-xs sm:text-sm text-[#444]">{item.category}</span>
                  <div className="flex-1">
                    <div className="h-2.5 sm:h-3 overflow-hidden rounded-full bg-[#e9ebf8]">
                      <div
                        className="h-full rounded-full bg-brand-dark transition-all"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                  <div className="hidden sm:flex gap-2 text-xs shrink-0">
                    <span>0</span>
                    <span className="text-[#888]">25</span>
                    <span className="text-[#888]">50</span>
                    <span className="text-[#888]">75</span>
                    <span className="text-[#888]">100</span>
                  </div>
                  <span className="text-xs font-semibold text-brand-dark sm:hidden">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline Aktivitas */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-base font-bold text-brand-dark">Timeline Aktivitas</h3>
          <div className="space-y-5">
            {timelineAktivitas.map((act, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="flex flex-col items-center pt-1">
                  <span className={`h-3 w-3 shrink-0 rounded-full ${act.dotColor}`} />
                  {i < timelineAktivitas.length - 1 && (
                    <div className="mt-1 h-8 w-px bg-[#e0e0e0]" />
                  )}
                </div>
                <div className="flex flex-1 flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[#222]">{act.event}</p>
                    <p className="text-xs text-[#888]">
                      {act.date} &nbsp;•&nbsp; <span className="text-[#555]">{act.kategori}</span>
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-3 py-0.5 text-xs font-semibold ${
                    act.status === 'Pending'
                      ? 'border-yellow-300 bg-yellow-50 text-yellow-600'
                      : 'border-green-300 bg-green-50 text-green-700'
                  }`}>
                    {act.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="mt-4 text-xs text-[#888] hover:underline"
          >
            menampilkan semua Timeline Aktivitas
          </button>
        </div>

        {/* Pesan untuk Mahasiswa */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-bold text-brand-dark">Pesan untuk Mahasiswa</h3>
          <textarea
            value={pesan}
            onChange={(e) => setPesan(e.target.value)}
            rows={4}
            placeholder="Tuliskan saran bimbingan akademik dan konseling disini"
            className="w-full rounded-lg border border-[#d1d5db] p-4 text-sm text-[#333] outline-none focus:border-brand-dark"
          />
          <button
            type="button"
            onClick={handleKirimPesan}
            className="mt-3 w-full rounded-lg bg-gradient-to-r from-brand-dark to-brand-light py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
          >
            Kirim Pesan
          </button>
        </div>

        {/* Riwayat Catatan */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-bold text-brand-dark">Riwayat Catatan</h3>
          <div className="divide-y divide-[#f0f0f0]">
            {displayedCatatan.map((c, i) => (
              <div key={i} className="py-3">
                <p className="text-sm leading-relaxed text-[#333]">{c.message}</p>
                <p className="mt-1 text-xs text-[#888]">{c.date}</p>
              </div>
            ))}
          </div>
          {riwayatCatatan.length > 2 && (
            <button
              type="button"
              onClick={() => setShowAllCatatan((v) => !v)}
              className="mt-3 text-xs font-semibold text-brand-dark hover:underline"
            >
              {showAllCatatan ? 'Sembunyikan catatan' : `lihat semua catatan ›`}
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default DosenPADetail
