import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import ProgressBar from '../../components/dashboard/ProgressBar'
import { RadarChartCJ, HorizontalBarChart } from '../../components/charts'
import { getCurrentUser } from '../../services/authService'
import { getKurikulumAktif } from '../../services/kurikulumService'
import { get } from '../../services/apiClient'

const defaultMahasiswa = {
  nama: '-',
  nim: '-',
  prodi: '-',
  angkatan: '-',
  ipk: '-',
  poin: 0,
  targetPoin: 550,
}

const FALLBACK_CAPAIAN = [
  'Religion Character Development (Religius)',
  'Social Contribution',
  'Global Citizenship',
]

const radarDataByCapaian = {
  'Religion Character Development (Religius)': [
    { label: 'Leadership', value: 0 },
    { label: 'Global', value: 0 },
    { label: 'Comm.', value: 0 },
  ],
  'Social Contribution': [
    { label: 'Leadership', value: 0 },
    { label: 'Global', value: 0 },
    { label: 'Comm.', value: 0 },
  ],
  'Global Citizenship': [
    { label: 'Leadership', value: 0 },
    { label: 'Global', value: 0 },
    { label: 'Comm.', value: 0 },
  ],
}

function formatTanggal(val) {
  if (!val) return '-'
  try {
    return new Date(val).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return String(val)
  }
}

function statusDotColor(status) {
  const s = String(status || '').toLowerCase()
  if (s.includes('tolak')) return 'bg-red-500'
  if (s.includes('pending') || s.includes('menunggu')) return 'bg-yellow-400'
  return 'bg-green-500'
}

function DosenPADetail() {
  const navigate = useNavigate()
  const { nim } = useParams()
  const location = useLocation()
  const user = getCurrentUser()
  const stateMhs = location.state?.mahasiswa

  const [m, setM] = useState({
    ...defaultMahasiswa,
    ...(stateMhs || {}),
    nim: stateMhs?.nim || nim || '-',
    poin: stateMhs?.poin ?? stateMhs?.totalPoin ?? 0,
  })

  const [capaianOptions, setCapaianOptions] = useState(FALLBACK_CAPAIAN)
  const [capaianRadarMap, setCapaianRadarMap] = useState(radarDataByCapaian)
  const [activeCapaian, setActiveCapaian] = useState(FALLBACK_CAPAIAN[0])
  const [totalPoinData, setTotalPoinData] = useState([])
  const [timelineAktivitas, setTimelineAktivitas] = useState([])
  const [riwayatCatatan, setRiwayatCatatan] = useState([])
  const [pesan, setPesan] = useState('')
  const [showAllCatatan, setShowAllCatatan] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load capaian dari kurikulum aktif (dropdown)
  useEffect(() => {
    getKurikulumAktif()
      .then((kur) => {
        const list = Array.isArray(kur?.capaian) ? kur.capaian : []
        if (!list.length) return
        const names = list.map((c) => c.nama).filter(Boolean)
        if (!names.length) return
        setCapaianOptions(names)
        setActiveCapaian(names[0])
        const map = {}
        list.forEach((c) => {
          const subs = Array.isArray(c.subCapaian) ? c.subCapaian : []
          map[c.nama] = subs.length
            ? subs.map((s) => ({ label: s.nama, value: Number(s.bobotPersen ?? s.bobot) || 0 }))
            : [{ label: c.nama, value: 0 }]
        })
        setCapaianRadarMap(map)
      })
      .catch(() => { /* keep fallback */ })
  }, [])

  // Optional: load detail mahasiswa
  useEffect(() => {
    const mahasiswaId = stateMhs?.mahasiswaId || nim
    if (!mahasiswaId) {
      setLoading(false)
      return
    }

    setLoading(true)
    get(`/api/dosen/mahasiswa-bimbingan/${mahasiswaId}`)
      .then((res) => {
        const data = res?.data || res || {}
        const profil = data.profil || {}

        setM((prev) => ({
          ...prev,
          nama: profil.nama || prev.nama,
          nim: profil.nim || prev.nim,
          prodi: profil.prodi || prev.prodi,
          angkatan: profil.angkatan || prev.angkatan,
          ipk: profil.ipk ?? prev.ipk,
          poin: data.totalPoin ?? prev.poin,
          targetPoin: data.totalTarget ?? prev.targetPoin ?? 550,
          mahasiswaId,
        }))

        // Radar dari subCapaianData (poin aktual)
        if (Array.isArray(data.subCapaianData) && data.subCapaianData.length) {
          const names = data.subCapaianData.map((c) => c.capaianNama).filter(Boolean)
          if (names.length) {
            setCapaianOptions(names)
            setActiveCapaian(names[0])
            const map = {}
            data.subCapaianData.forEach((c) => {
              const subs = Array.isArray(c.subCapaian) ? c.subCapaian : []
              map[c.capaianNama] = subs.length
                ? subs.map((s) => ({
                    label: s.nama,
                    value: Math.min(100, Number(s.poinTerkumpul) || 0),
                  }))
                : [{ label: c.capaianNama, value: 0 }]
            })
            setCapaianRadarMap(map)
          }
        }

        // Total poin per capaian (horizontal bar)
        if (Array.isArray(data.totalPoinPerCapaian)) {
          setTotalPoinData(
            data.totalPoinPerCapaian.map((c) => ({
              category: c.nama,
              value: c.persentase ?? 0,
            })),
          )
        }

        // Timeline
        if (Array.isArray(data.timeline)) {
          setTimelineAktivitas(
            data.timeline.map((act) => ({
              event: act.namaKegiatan || act.event || '-',
              date: formatTanggal(act.tanggal || act.date),
              kategori: act.jenisKegiatan || act.kategori || '-',
              status: act.status || 'Pending',
              dotColor: statusDotColor(act.status),
            })),
          )
        }

        // Riwayat catatan
        if (Array.isArray(data.riwayatCatatan)) {
          setRiwayatCatatan(
            data.riwayatCatatan.map((c) => ({
              message: c.isi || c.message || '',
              date: formatTanggal(c.tanggal || c.date),
            })),
          )
        }
      })
      .catch(() => {
        // Keep state/fallback data — detail optional
      })
      .finally(() => setLoading(false))
  }, [nim, stateMhs?.mahasiswaId])

  const radarItems = capaianRadarMap[activeCapaian]
    ?? capaianRadarMap[capaianOptions[0]]
    ?? []
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
    <DashboardLayout role="dosen" userName={user?.nama || 'Dosen Pembimbing'} userRole="Dosen Pembimbing">
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>

        <div className="overflow-hidden rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-dark text-xl font-extrabold text-white">
                {(m.nama || '?').split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-brand-dark">{loading ? 'Memuat…' : m.nama}</h2>
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

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl bg-gradient-to-br from-brand-dark to-brand-light p-5 text-white shadow-sm">
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

            {activeCapaian && (
              <p className="mt-3 text-xs font-semibold text-white/80">{activeCapaian}</p>
            )}

            <div className="mt-3 flex justify-center">
              <RadarChartCJ
                labels={radarItems.map((r) => r.label)}
                values={radarItems.map((r) => r.value)}
                darkBg
                height={220}
              />
            </div>

            <div className="mt-4 space-y-2.5">
              {radarItems.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="w-44 shrink-0 truncate text-[11px] text-white/80">{item.label}</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-white/20" style={{ height: 6 }}>
                    <div
                      className={`h-full rounded-full transition-all ${item.value >= 60 ? 'bg-white' : 'bg-red-400'}`}
                      style={{ width: `${Math.min(100, item.value)}%` }}
                    />
                  </div>
                  <span className="w-7 shrink-0 text-right text-[11px] font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-[#222]">Total Poin per Capaian</h3>
            <p className="mt-0.5 text-xs text-[#888]">Distribusi poin mahasiswa di setiap area pengembangan</p>
            <div className="mt-5">
              {totalPoinData.length === 0 ? (
                <p className="py-12 text-center text-sm text-[#9aa0a6]">Belum ada data poin per capaian.</p>
              ) : (
                <HorizontalBarChart
                  labels={totalPoinData.map((d) => d.category)}
                  values={totalPoinData.map((d) => d.value)}
                  max={100}
                  color="#1a5c38"
                  height={220}
                />
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-base font-bold text-brand-dark">Timeline Aktivitas</h3>
          {timelineAktivitas.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#9aa0a6]">Belum ada timeline aktivitas.</p>
          ) : (
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
                      String(act.status).toLowerCase().includes('pending')
                        ? 'border-yellow-300 bg-yellow-50 text-yellow-600'
                        : 'border-green-300 bg-green-50 text-green-700'
                    }`}>
                      {act.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {timelineAktivitas.length > 0 && (
            <button type="button" className="mt-4 text-xs text-[#888] hover:underline">
              menampilkan semua Timeline Aktivitas
            </button>
          )}
        </div>

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

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-bold text-brand-dark">Riwayat Catatan</h3>
          {riwayatCatatan.length === 0 ? (
            <p className="py-4 text-center text-sm text-[#9aa0a6]">Belum ada catatan.</p>
          ) : (
            <div className="divide-y divide-[#f0f0f0]">
              {displayedCatatan.map((c, i) => (
                <div key={i} className="py-3">
                  <p className="text-sm leading-relaxed text-[#333]">{c.message}</p>
                  <p className="mt-1 text-xs text-[#888]">{c.date}</p>
                </div>
              ))}
            </div>
          )}
          {riwayatCatatan.length > 2 && (
            <button
              type="button"
              onClick={() => setShowAllCatatan((v) => !v)}
              className="mt-3 text-xs font-semibold text-brand-dark hover:underline"
            >
              {showAllCatatan ? 'Sembunyikan catatan' : 'lihat semua catatan ›'}
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default DosenPADetail
