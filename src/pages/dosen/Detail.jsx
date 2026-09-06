import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Download } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import ProgressBar from '../../components/dashboard/ProgressBar'
import StatusBadge from '../../components/dashboard/StatusBadge'
import { DetailSkeleton } from '../../components/dashboard/Skeleton'
import { RadarChartCJ, HorizontalBarChart } from '../../components/charts'
import { DetailBackButton } from '../../components/ui/DetailComponents'
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
          totalPoinProgres: data.totalPoinProgres ?? data.totalPoin ?? prev.poin,
          targetPoin: data.totalTarget ?? prev.targetPoin ?? 200,
          persentaseTotal: data.persentaseTotal,
          isLulus: data.isLulus,
          statusKelulusan: data.statusKelulusan,
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
  const pctTarget = m.persentaseTotal ?? (m.targetPoin > 0 ? Math.min(100, Math.round(((m.totalPoinProgres ?? m.poin) / m.targetPoin) * 100)) : 0)
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

  const kelulusanStatus = m.isLulus || pctTarget >= 100 ? 'lulus' : 'belum_lulus'

  return (
    <DashboardLayout role="dosen" userName={user?.nama || 'Dosen Pembimbing'} userRole="Dosen Pembimbing">
      <div className="space-y-5">
        <DetailBackButton onClick={() => navigate(-1)} />

        {loading && m.nama === '-' ? (
          <DetailSkeleton />
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold text-base-content">{m.nama}</h2>
              <p className="mt-1 text-sm text-base-content/60">
                {m.nim} · {m.prodi} · Angkatan {m.angkatan} · IPK {m.ipk}
              </p>
            </div>
            <div className="sm:min-w-44 sm:text-right">
              <StatusBadge status={kelulusanStatus} />
              <p className="mt-2 text-2xl font-extrabold text-base-content">
                {m.totalPoinProgres ?? m.poin}
              </p>
              <p className="text-sm text-base-content/60">/ {m.targetPoin ?? 200} poin target</p>
              {m.poin > (m.totalPoinProgres ?? m.poin) && (
                <p className="mt-0.5 text-xs text-base-content/60">
                  Total riil: {m.poin} poin
                </p>
              )}
              <div className="mt-2 w-full sm:w-44 sm:ml-auto">
                <ProgressBar value={m.totalPoinProgres ?? m.poin} max={m.targetPoin ?? 200} height={6} />
              </div>
              <p className="mt-1 text-xs text-base-content/50">{pctTarget}% dari target</p>
            </div>
          </div>
        )}

        <div className="card bg-base-100 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-base-content">Sub capaian</h3>
              <p className="mt-0.5 text-xs text-base-content/60">Poin per sub capaian</p>
            </div>
            <select
              value={activeCapaian}
              onChange={(e) => setActiveCapaian(e.target.value)}
              className="select select-sm sm:max-w-64"
            >
              <option value="">Pilih capaian</option>
              {capaianOptions.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {activeCapaian ? (
            <p className="mt-3 text-xs text-base-content/70">{activeCapaian}</p>
          ) : null}

          <div className="mt-2">
            <RadarChartCJ
              labels={radarItems.map((r) => r.label)}
              values={radarItems.map((r) => r.value)}
              height={360}
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {radarItems.map((item) => (
              <ProgressBar
                key={item.label}
                value={item.value}
                max={100}
                height={6}
                label={item.label}
                showPercent
              />
            ))}
          </div>
        </div>

        <div className="card bg-base-100 p-5">
          <h3 className="text-sm font-semibold text-base-content">Total poin per capaian</h3>
          <p className="mt-0.5 text-xs text-base-content/60">Distribusi poin per area</p>
          <div className="mt-5">
            {totalPoinData.length === 0 ? (
              <p className="py-12 text-center text-sm text-base-content/50">Belum ada data poin per capaian.</p>
            ) : (
              <HorizontalBarChart
                labels={totalPoinData.map((d) => d.category)}
                values={totalPoinData.map((d) => d.value)}
                max={100}
                height={260}
              />
            )}
          </div>
        </div>

        <div className="card bg-base-100 p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-base-content">Timeline aktivitas</h3>
              <p className="mt-0.5 text-xs text-base-content/60">Kegiatan mahasiswa bimbingan</p>
            </div>
            {timelineAktivitas.length > 0 ? (
              <span className="text-xs text-base-content/50">{timelineAktivitas.length} aktivitas</span>
            ) : null}
          </div>

          {timelineAktivitas.length === 0 ? (
            <p className="py-6 text-center text-sm text-base-content/50">Belum ada timeline aktivitas.</p>
          ) : (
            <ul className="divide-y divide-base-300">
              {displayedTimeline.map((act, i) => (
                <li key={`${act.event}-${act.date}-${i}`} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-base-content">{act.event}</p>
                      <p className="mt-1 text-xs text-base-content/50">
                        {act.date}
                        {act.kategori && act.kategori !== '-' ? ` · ${act.kategori}` : ''}
                      </p>
                    </div>
                    <StatusBadge status={act.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}

          {timelineAktivitas.length > TIMELINE_PREVIEW ? (
            <button
              type="button"
              onClick={() => setShowAllTimeline((v) => !v)}
              className="btn btn-ghost btn-sm mt-3"
            >
              {showAllTimeline
                ? 'Sembunyikan'
                : `Lihat semua (${timelineAktivitas.length})`}
            </button>
          ) : null}
        </div>

        <div className="card bg-base-100 p-5">
          <h3 className="mb-3 text-sm font-semibold text-base-content">Pesan untuk mahasiswa</h3>
          <textarea
            value={pesan}
            onChange={(e) => setPesan(e.target.value)}
            rows={4}
            placeholder="Tulis saran bimbingan"
            className="textarea w-full"
          />
          <button
            type="button"
            onClick={handleKirimPesan}
            disabled={sendingPesan}
            className="btn btn-primary btn-sm mt-3"
          >
            {sendingPesan ? 'Mengirim…' : 'Kirim pesan'}
          </button>
        </div>

        <div className="card bg-base-100 p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-base-content">Riwayat catatan</h3>
            <button
              type="button"
              onClick={handleDownloadCatatanPdf}
              disabled={riwayatCatatan.length === 0}
              className="btn btn-outline btn-primary btn-sm"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </button>
          </div>
          {riwayatCatatan.length === 0 ? (
            <p className="py-4 text-center text-sm text-base-content/50">Belum ada catatan.</p>
          ) : (
            <div className="divide-y divide-base-300">
              {displayedCatatan.map((c, i) => (
                <div key={i} className="py-3">
                  <p className="text-sm leading-relaxed text-base-content">{c.message}</p>
                  <p className="mt-1 text-xs text-base-content/50">{c.date}</p>
                </div>
              ))}
            </div>
          )}
          {riwayatCatatan.length > 2 ? (
            <button
              type="button"
              onClick={() => setShowAllCatatan((v) => !v)}
              className="btn btn-ghost btn-sm mt-2"
            >
              {showAllCatatan ? 'Sembunyikan' : 'Lihat semua catatan'}
            </button>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default DosenPADetail
