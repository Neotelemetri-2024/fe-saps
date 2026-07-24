import { useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import ProgressBar from '../../components/dashboard/ProgressBar'
import { RadarChartCJ, HorizontalBarChart } from '../../components/charts'

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
          <div className="rounded-xl bg-gradient-to-br from-brand-dark to-brand-light p-5 text-white shadow-sm">
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold">Sub Capaian</h3>
                <p className="mt-0.5 text-[11px] text-white/60">Sub Capaian dalam kategori fondasi</p>
              </div>
              <select
                value={activeCapaian}
                onChange={(e) => setActiveCapaian(e.target.value)}
                className="rounded-lg border border-white/40 bg-white/10 px-3 py-1.5 text-[11px] text-white outline-none backdrop-blur-sm"
              >
                <option value="">---Pilih Capaian---</option>
                {capaianOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Active capaian label */}
            {activeCapaian && (
              <p className="mt-3 text-xs font-semibold text-white/80">{activeCapaian}</p>
            )}

            {/* Radar chart centered */}
            <div className="mt-3 flex justify-center">
              <RadarChartCJ
                labels={radarItems.map((r) => r.label)}
                values={radarItems.map((r) => r.value)}
                darkBg
                height={220}
              />
            </div>

            {/* Progress bars */}
            <div className="mt-4 space-y-2.5">
              {radarItems.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="w-44 shrink-0 truncate text-[11px] text-white/80">{item.label}</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-white/20" style={{ height: 6 }}>
                    <div
                      className={`h-full rounded-full transition-all ${item.value >= 60 ? 'bg-white' : 'bg-red-400'}`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                  <span className="w-7 shrink-0 text-right text-[11px] font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total Poin per Capaian */}
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-[#222]">Total Poin per Capaian</h3>
            <p className="mt-0.5 text-xs text-[#888]">Distribusi poin mahasiswa di setiap area pengembangan</p>
            <div className="mt-5">
              <HorizontalBarChart
                labels={totalPoinData.map((d) => d.category)}
                values={totalPoinData.map((d) => d.value)}
                max={100}
                color="#1a5c38"
                height={220}
              />
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
