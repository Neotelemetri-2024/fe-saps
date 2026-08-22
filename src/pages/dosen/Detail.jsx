import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Download } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import ProgressBar from '../../components/dashboard/ProgressBar'
import { RadarChartCJ, HorizontalBarChart } from '../../components/charts'
import { getCurrentUser } from '../../services/authService'
import { getKurikulumAktif } from '../../services/kurikulumService'
import { get, post } from '../../services/apiClient'

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
    const d = new Date(val)
    if (Number.isNaN(d.getTime())) return String(val)
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return String(val)
  }
}

function formatTanggalJam(val = new Date()) {
  try {
    const d = val instanceof Date ? val : new Date(val)
    if (Number.isNaN(d.getTime())) return '-'
    return d.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '-'
  }
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function statusBadgeClass(status) {
  const s = String(status || '').toLowerCase()
  if (s.includes('tolak')) return 'border-red-200 bg-red-50 text-red-700'
  if (s.includes('pending') || s.includes('menunggu')) return 'border-amber-200 bg-amber-50 text-amber-700'
  if (s.includes('universitas')) return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  return 'border-green-200 bg-green-50 text-green-700'
}

const TIMELINE_PREVIEW = 4

function buildCatatanPdfHtml({ mahasiswa, dosenNama, catatan }) {
  const m = mahasiswa || {}
  const totalCatatan = (catatan || []).length
  const rows = (catatan || []).map((c, i) => `
    <tr>
      <td class="no">${i + 1}</td>
      <td class="isi">${escapeHtml(c.message || '-')}</td>
      <td class="tgl">${escapeHtml(c.date || '-')}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title></title>
  <style>
    @page { size: A4; margin: 0; }
    body {
      margin: 0;
      padding: 16mm 14mm;
      font-family: Arial, Helvetica, sans-serif;
      color: #111;
      font-size: 11px;
      line-height: 1.45;
    }
    .kop { text-align: center; margin-bottom: 10px; }
    .kop .univ { font-size: 13px; font-weight: 700; text-transform: uppercase; }
    .kop .sistem { font-size: 11px; margin-top: 2px; }
    .kop .judul { margin-top: 8px; font-size: 14px; font-weight: 700; text-decoration: underline; }
    .meta-line { margin-top: 6px; font-size: 10px; color: #333; }
    hr.thick { border: none; border-top: 2px solid #111; margin: 10px 0 12px; }
    .box { margin-bottom: 14px; }
    .box-title {
      padding: 0 0 6px;
      font-weight: 700;
      font-size: 11px;
    }
    .box-body { padding: 0; }
    table.identitas { width: 100%; border-collapse: collapse; }
    table.identitas td { padding: 3px 4px; vertical-align: top; font-size: 11px; }
    table.identitas td.k { width: 120px; }
    table.identitas td.s { width: 10px; }
    table.identitas td.half-k { width: 70px; }
    table.catatan { width: 100%; border-collapse: collapse; }
    table.catatan th,
    table.catatan td {
      border: 1px solid #333;
      padding: 7px 8px;
      vertical-align: top;
      text-align: left;
    }
    table.catatan th { background: #efefef; font-size: 10px; font-weight: 700; text-align: center; }
    table.catatan td.no { width: 36px; text-align: center; }
    table.catatan td.tgl { width: 130px; white-space: nowrap; }
    table.catatan td.isi { white-space: pre-wrap; }
    .empty { padding: 16px 8px; text-align: center; color: #555; font-style: italic; }
    .bawah {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      margin-top: 22px;
    }
    .bawah .kiri { font-size: 10px; color: #333; max-width: 55%; }
    .ttd { width: 220px; text-align: center; font-size: 11px; }
    .ttd .space { height: 52px; }
    .ttd .nama { font-weight: 700; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="kop">
    <div class="judul">RIWAYAT CATATAN BIMBINGAN AKADEMIK</div>
    <div class="meta-line">Dosen PA: ${escapeHtml(dosenNama || '-')} &nbsp;|&nbsp; Dicetak: ${escapeHtml(formatTanggalJam())}</div>
  </div>
  <hr class="thick" />

  <div class="box">
    <div class="box-title">Identitas Mahasiswa</div>
    <div class="box-body">
      <table class="identitas">
        <tr>
          <td class="k">Nama</td><td class="s">:</td><td>${escapeHtml(m.nama || '-')}</td>
          <td class="half-k">NIM</td><td class="s">:</td><td>${escapeHtml(m.nim || '-')}</td>
        </tr>
        <tr>
          <td class="k">Program Studi</td><td class="s">:</td><td>${escapeHtml(m.prodi || '-')}</td>
          <td class="half-k">Angkatan</td><td class="s">:</td><td>${escapeHtml(m.angkatan || '-')}</td>
        </tr>
        <tr>
          <td class="k">IPK</td><td class="s">:</td><td>${escapeHtml(m.ipk ?? '-')}</td>
          <td class="half-k">Poin</td><td class="s">:</td><td>${escapeHtml(m.poin ?? 0)} / ${escapeHtml(m.targetPoin ?? 550)}</td>
        </tr>
      </table>
    </div>
  </div>

  <div class="box">
    <div class="box-title">Daftar Catatan</div>
    ${totalCatatan ? `
      <table class="catatan">
        <thead>
          <tr>
            <th style="width:36px;">No</th>
            <th>Isi Catatan</th>
            <th style="width:130px;">Tanggal</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    ` : '<div class="empty">Belum ada catatan bimbingan.</div>'}
  </div>

  <div class="bawah">
    <div class="kiri">
      Dokumen ini berisi rekap catatan bimbingan akademik mahasiswa di atas.
      Harap disimpan sebagai arsip bimbingan dosen PA.
    </div>
    <div class="ttd">
      <div>Dosen Pembimbing Akademik</div>
      <div class="space"></div>
      <div class="nama">${escapeHtml(dosenNama || '-')}</div>
    </div>
  </div>
</body>
</html>`
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
  const [showAllTimeline, setShowAllTimeline] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sendingPesan, setSendingPesan] = useState(false)

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
  const displayedTimeline = showAllTimeline
    ? timelineAktivitas
    : timelineAktivitas.slice(0, TIMELINE_PREVIEW)

  const handleKirimPesan = async () => {
    if (!pesan.trim()) {
      toast.error('Pesan kosong', { description: 'Tuliskan pesan terlebih dahulu.' })
      return
    }
    const mahasiswaId = m.mahasiswaId || stateMhs?.mahasiswaId
    if (!mahasiswaId) {
      toast.error('Data mahasiswa tidak ditemukan', { description: 'Tidak dapat mengirim pesan.' })
      return
    }
    setSendingPesan(true)
    try {
      await post('/api/dosen/saran', { mahasiswaId: String(mahasiswaId), isi: pesan.trim() })
      toast.success('Pesan Terkirim!', { description: 'Pesan kepada mahasiswa berhasil dikirim.' })
      setPesan('')
      const res = await get(`/api/dosen/mahasiswa-bimbingan/${mahasiswaId}`)
      const data = res?.data || res || {}
      if (Array.isArray(data.riwayatCatatan)) {
        setRiwayatCatatan(
          data.riwayatCatatan.map((c) => ({
            message: c.isi || c.message || '',
            date: formatTanggal(c.tanggal || c.date || c.createdAt),
          })),
        )
      }
    } catch (err) {
      toast.error('Gagal mengirim pesan', { description: err.message })
    } finally {
      setSendingPesan(false)
    }
  }

  const handleDownloadCatatanPdf = () => {
    if (riwayatCatatan.length === 0) {
      toast.error('Belum ada catatan', { description: 'Tidak ada riwayat catatan untuk diunduh.' })
      return
    }

    const html = buildCatatanPdfHtml({
      mahasiswa: m,
      dosenNama: user?.nama || 'Dosen Pembimbing',
      catatan: riwayatCatatan,
    })

    const existing = document.getElementById('catatan-pdf-print-frame')
    if (existing) existing.remove()

    const iframe = document.createElement('iframe')
    iframe.id = 'catatan-pdf-print-frame'
    iframe.setAttribute('aria-hidden', 'true')
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;'
    document.body.appendChild(iframe)

    const prevTitle = document.title
    document.title = ''

    const cleanup = () => {
      document.title = prevTitle
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
      }, 1000)
    }

    iframe.onload = () => {
      try {
        if (iframe.contentDocument) iframe.contentDocument.title = ''
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
      } catch {
        toast.error('Gagal membuka dialog cetak')
      } finally {
        cleanup()
      }
    }

    iframe.srcdoc = html
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
                <h2 className="text-lg font-extrabold text-[#222]">{loading ? 'Memuat…' : m.nama}</h2>
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
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-[#222]">Timeline Aktivitas</h3>
              <p className="mt-0.5 text-xs text-[#888]">Riwayat kegiatan mahasiswa yang sedang dibimbing</p>
            </div>
            {timelineAktivitas.length > 0 && (
              <span className="text-xs text-[#9aa0a6]">{timelineAktivitas.length} aktivitas</span>
            )}
          </div>

          {timelineAktivitas.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#9aa0a6]">Belum ada timeline aktivitas.</p>
          ) : (
            <ul className="space-y-3">
              {displayedTimeline.map((act, i) => (
                <li key={`${act.event}-${act.date}-${i}`} className="rounded-lg border border-[#eef0f6] bg-[#fafbfc] px-3.5 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-snug text-[#222]">{act.event}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#888]">
                        <span>{act.date}</span>
                        {act.kategori && act.kategori !== '-' && (
                          <>
                            <span className="text-[#d0d4dc]">•</span>
                            <span className="rounded bg-[#eef2ee] px-1.5 py-0.5 text-[11px] font-medium text-[#3d5c45]">
                              {act.kategori}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusBadgeClass(act.status)}`}>
                      {act.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {timelineAktivitas.length > TIMELINE_PREVIEW && (
            <button
              type="button"
              onClick={() => setShowAllTimeline((v) => !v)}
              className="mt-4 text-xs font-semibold text-brand-dark hover:underline"
            >
              {showAllTimeline
                ? 'Sembunyikan timeline'
                : `Lihat semua timeline (${timelineAktivitas.length}) ›`}
            </button>
          )}
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-bold text-[#222]">Pesan untuk Mahasiswa</h3>
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
            disabled={sendingPesan}
            className="mt-3 w-full rounded-lg bg-gradient-to-r from-brand-dark to-brand-light py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
          >
            {sendingPesan ? 'Mengirim…' : 'Kirim Pesan'}
          </button>
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-bold text-[#222]">Riwayat Catatan</h3>
            <button
              type="button"
              onClick={handleDownloadCatatanPdf}
              disabled={riwayatCatatan.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </button>
          </div>
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
