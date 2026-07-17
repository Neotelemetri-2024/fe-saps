import { Plus, Clock } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'

// ---------------------------------------------------------------------------
// Mock data — swap these for real API data
// ---------------------------------------------------------------------------
const totalPoin = 470
const maxPoin = 550
const pctTotal = Math.round((totalPoin / maxPoin) * 100)

const tahunanProgress = [
  { no: '01', label: 'Tahun 1: Dasar', target: 100, poin: 100, status: 'TUNTAS' },
  { no: '02', label: 'Tahun 2: Menengah', target: 150, poin: 110, status: 'BERJALAN' },
  { no: '03', label: 'Tahun 3: Mahir', target: 200, poin: 0, status: 'BELUM' },
  { no: '04', label: 'Tahun 4: Akhir', target: 100, poin: 0, status: 'BELUM' },
]

const radarData = [
  { label: 'Spiritual', value: 80 },
  { label: 'Ilmu', value: 92 },
  { label: 'Amal', value: 65 },
  { label: 'Sosial', value: 70 },
]

const persetujuanDosen = [
  { kegiatan: 'Lomba AI & Teknologi', tanggalInput: 'Selasa, 4 Feb 2025, 15:37', jenis: 'Kompetisi', peran: 'Juara 1', penyelenggara: 'Hima FTI UNAND', tanggal: '12 Feb - 15 Feb 2026', status: 'Pending' },
  { kegiatan: 'Lomba AI & Teknologi', tanggalInput: 'Selasa, 4 Feb 2025, 15:37', jenis: 'Kompetisi', peran: 'Juara 1', penyelenggara: 'Hima FTI UNAND', tanggal: '12 Feb - 15 Feb 2026', status: 'Pending' },
  { kegiatan: 'Lomba AI & Teknologi', tanggalInput: 'Selasa, 4 Feb 2025, 15:37', jenis: 'Kompetisi', peran: 'Juara 1', penyelenggara: 'Hima FTI UNAND', tanggal: '12 Feb - 15 Feb 2026', status: 'Disetujui Dosen PA' },
]

const pengajuanEksternal = [
  { kegiatan: 'Seminar AI & Teknologi', tanggalInput: 'Selasa, 4 Feb 2025, 15:37', jenis: 'Kompetisi', peran: 'Peserta', penyelenggara: 'Hima FTI UNPAD', tanggal: '12 Feb - 15 Feb 2026', skala: 'Nasional', status: 'Pending' },
  { kegiatan: 'Workshop Grapic Desain', tanggalInput: 'Selasa, 4 Feb 2025, 15:37', jenis: 'Pelatihan', peran: 'Peserta', penyelenggara: 'Hima FTI UNPAD', tanggal: '12 Feb - 15 Feb 2026', skala: 'Regional', status: 'Pending' },
  { kegiatan: 'Lomba Karya Tulis Ilmiah', tanggalInput: 'Selasa, 4 Feb 2025, 15:37', jenis: 'Lomba', peran: 'Juara 1', penyelenggara: 'Universitas Indonesia', tanggal: '12 Feb - 15 Feb 2026', skala: 'Nasional', status: 'Ditolak' },
]

const klaimPoin = [
  { kegiatan: 'Lomba AI & Teknologi', tanggalInput: 'Selasa, 4 Feb 2025, 15:37', jenis: 'Kompetisi', peran: 'Juara 1', penyelenggara: 'Hima FTI UNAND', tanggal: '12 Feb - 15 Feb 2026', bukti: 'Sertifikat.pdf', poin: '-', status: 'Pending' },
  { kegiatan: 'Lomba AI & Teknologi', tanggalInput: 'Selasa, 4 Feb 2025, 15:37', jenis: 'Kompetisi', peran: 'Juara 1', penyelenggara: 'Hima FTI UNAND', tanggal: '12 Feb - 15 Feb 2026', bukti: 'Sertifikat.pdf', poin: '-', status: 'Pending' },
  { kegiatan: 'Lomba AI & Teknologi', tanggalInput: 'Selasa, 4 Feb 2025, 15:37', jenis: 'Kompetisi', peran: 'Juara 1', penyelenggara: 'Hima FTI UNAND', tanggal: '12 Feb - 15 Feb 2026', bukti: 'Sertifikat.pdf', poin: 10, status: 'Disetujui' },
]

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
function StatusBadge({ status }) {
  const styles = {
    'Pending': 'bg-amber-50 text-amber-700 border border-amber-200',
    'Disetujui Dosen PA': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    'Disetujui': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    'Ditolak': 'bg-red-50 text-red-600 border border-red-200',
  }
  const dot = {
    'Pending': 'bg-amber-500',
    'Disetujui Dosen PA': 'bg-emerald-500',
    'Disetujui': 'bg-emerald-500',
    'Ditolak': 'bg-red-500',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot[status] || 'bg-gray-400'}`} />
      {status}
    </span>
  )
}

function TahunBadge({ status }) {
  const styles = {
    TUNTAS: 'bg-emerald-50 text-emerald-700',
    BERJALAN: 'bg-amber-100 text-amber-700',
    BELUM: 'bg-gray-100 text-gray-400',
  }
  return (
    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${styles[status]}`}>
      {status}
    </span>
  )
}

function Pagination({ page = 1, totalPages = 2, showingFrom = 1, showingTo = 10, totalItems = 20 }) {
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-[#e9ebf8] px-6 py-4 text-xs text-[#616161] sm:flex-row">
      <span>Showng {showingFrom} - {showingTo} From Total {totalItems}</span>
      <span>Page {page} of {totalPages}</span>
      <div className="flex items-center gap-1">
        <button className="rounded-md border border-[#e9ebf8] px-3 py-1 text-[#616161]">Previous</button>
        <button className="rounded-md bg-brand-dark px-3 py-1 font-semibold text-white">1</button>
        <button className="rounded-md border border-[#e9ebf8] px-3 py-1">2</button>
        <span className="px-1">...</span>
        <button className="rounded-md border border-[#e9ebf8] px-3 py-1">3</button>
        <button className="rounded-md border border-[#e9ebf8] px-3 py-1">4</button>
        <button className="rounded-md border border-[#e9ebf8] px-3 py-1">Next</button>
      </div>
    </div>
  )
}

// Diamond radar chart (4 axes: Spiritual, Ilmu, Amal, Sosial), drawn as raw SVG
function RadarChart({ data }) {
  const size = 220
  const center = size / 2
  const maxR = size / 2 - 30
  const angles = [-90, 0, 90, 180] // top, right, bottom, left (degrees)

  const pointFor = (value, angleDeg) => {
    const rad = (angleDeg * Math.PI) / 180
    const r = (value / 100) * maxR
    return [center + r * Math.cos(rad), center + r * Math.sin(rad)]
  }

  const rings = [0.25, 0.5, 0.75, 1]
  const dataPoints = data.map((d, i) => pointFor(d.value, angles[i]))
  const polygon = dataPoints.map((p) => p.join(',')).join(' ')

  const labelPos = {
    Spiritual: { x: center, y: 14, anchor: 'middle' },
    Ilmu: { x: size - 6, y: center + 4, anchor: 'end' },
    Amal: { x: center, y: size - 4, anchor: 'middle' },
    Sosial: { x: 6, y: center + 4, anchor: 'start' },
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto h-56 w-56">
      {rings.map((r, i) => {
        const ringPts = angles.map((a) => pointFor(r * 100, a))
        return (
          <polygon
            key={i}
            points={ringPts.map((p) => p.join(',')).join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1"
          />
        )
      })}
      {angles.map((a, i) => {
        const [x, y] = pointFor(100, a)
        return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      })}
      <polygon points={polygon} fill="rgba(255,255,255,0.35)" stroke="#ffffff" strokeWidth="2" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="#ffffff" />
      ))}
      {data.map((d) => {
        const pos = labelPos[d.label]
        return (
          <text key={d.label} x={pos.x} y={pos.y} textAnchor={pos.anchor} fontSize="12" fill="#ffffff" fontWeight="600">
            {d.label}
          </text>
        )
      })}
    </svg>
  )
}

function RiwayatTable({ title, columns, rows, renderRow }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
      <div className="p-6 pb-0">
        <h3 className="text-lg font-bold text-brand-dark">{title}</h3>
        <p className="mt-1 text-xs text-[#616161]">Update terakhir: 14 Okt 2023, 10:45</p>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-left text-xs font-semibold uppercase tracking-wide text-white">
              {columns.map((c) => (
                <th key={c} className="whitespace-nowrap px-4 py-3">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-[#e9ebf8] last:border-0">
                {renderRow(row, i)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination />
    </div>
  )
}

function KegiatanCell({ nama, tanggalInput }) {
  return (
    <td className="px-4 py-4 align-top">
      <p className="font-semibold text-[#333]">{nama}</p>
      <p className="mt-1 flex items-center gap-1 text-xs text-[#9aa0a6]">
        <Clock className="h-3 w-3" /> {tanggalInput}
      </p>
    </td>
  )
}

// ---------------------------------------------------------------------------
// Main component — nama tetap MahasiswaDashboard, hanya isinya yang diupdate
// ---------------------------------------------------------------------------
function MahasiswaDashboard() {
  return (
    <DashboardLayout role="mahasiswa" userName="Amara Marshinta" userRole="Mahasiswa">
      <div className="space-y-6">
        {/* Welcome + Radar */}
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
            <h2 className="bg-gradient-to-r from-brand-dark to-brand-light bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl">
              Selamat Datang,<br />Amara Marshinta!
            </h2>
            <p className="mt-3 max-w-lg text-sm text-[#616161]">
              Pantau aktivitas akademik, capaian poin, dan sertifikasi kamu secara real-time. Semangat berkarya!
            </p>

            <p className="mt-6 text-sm font-medium text-[#616161]">Total Capaian Poin</p>
            <div className="mt-1 flex flex-wrap items-end gap-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-brand-dark">{totalPoin}</span>
                <span className="text-lg font-semibold text-[#9aa0a6]">/ {maxPoin}</span>
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="h-2.5 w-full rounded-full bg-[#e9ebf8]">
                  <div className="h-2.5 rounded-full bg-brand-dark" style={{ width: `${pctTotal}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-4 whitespace-nowrap text-xs text-[#616161]">
                <span className="font-semibold text-brand-dark">Tahap II: Menengah</span>
                <span>{pctTotal}% Selesai</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button className="flex items-center justify-center gap-2 rounded-xl bg-brand-dark px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90">
              <Plus className="h-4 w-4" /> Ajukan Kegiatan Eksternal ( luar universitas)
            </button>
            <div className="flex-1 rounded-xl bg-gradient-to-b from-brand-dark to-brand-light p-6 text-center shadow-sm">
              <h3 className="text-sm font-bold text-white">Radar Karakter Andalasian</h3>
              <RadarChart data={radarData} />
            </div>
          </div>
        </div>

        {/* Progres Capaian Tahunan */}
        <div>
          <h3 className="text-lg font-bold text-brand-dark">Progres Capaian Tahunan</h3>
          <p className="mt-1 text-xs text-[#616161]">Lacak kelengkapan poin setiap tahun akademik</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tahunanProgress.map((t) => {
              const pct = Math.round((t.poin / t.target) * 100)
              const inactive = t.status === 'BELUM'
              return (
                <div
                  key={t.no}
                  className={`rounded-xl border p-5 shadow-sm ${
                    t.status === 'BERJALAN' ? 'border-brand-dark bg-white' : 'border-[#e9ebf8] bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className={`text-2xl font-extrabold ${inactive ? 'text-gray-300' : 'text-brand-dark'}`}>{t.no}</span>
                    <TahunBadge status={t.status} />
                  </div>
                  <p className={`mt-3 text-sm font-bold ${inactive ? 'text-gray-400' : 'text-brand-dark'}`}>{t.label}</p>
                  <p className="text-xs text-[#9aa0a6]">Target: {t.target} Poin</p>
                  <div className="mt-3 h-2 w-full rounded-full bg-[#e9ebf8]">
                    <div
                      className={`h-2 rounded-full ${inactive ? 'bg-gray-300' : 'bg-brand-dark'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-right text-xs font-semibold text-[#616161]">{t.poin} / {t.target}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Riwayat Kegiatan Persetujuan Dosen PA */}
        <RiwayatTable
          title="Riwayat Kegiatan Persetujuan Dosen PA"
          columns={['NO', 'KEGIATAN', 'JENIS', 'PERAN', 'PENYELENGGARA', 'TANGGAL', 'STATUS']}
          rows={persetujuanDosen}
          renderRow={(row, i) => (
            <>
              <td className="px-4 py-4 align-top">{i + 1}.</td>
              <KegiatanCell nama={row.kegiatan} tanggalInput={row.tanggalInput} />
              <td className="px-4 py-4 align-top">{row.jenis}</td>
              <td className="px-4 py-4 align-top">{row.peran}</td>
              <td className="px-4 py-4 align-top">{row.penyelenggara}</td>
              <td className="px-4 py-4 align-top">{row.tanggal}</td>
              <td className="px-4 py-4 align-top"><StatusBadge status={row.status} /></td>
            </>
          )}
        />

        {/* Riwayat Kegiatan Pengajuan Eksternal */}
        <RiwayatTable
          title="Riwayat Kegiatan Pengajuan Eksternal"
          columns={['NO', 'KEGIATAN', 'JENIS', 'PERAN', 'PENYELENGGARA', 'TANGGAL', 'SKALA', 'STATUS']}
          rows={pengajuanEksternal}
          renderRow={(row, i) => (
            <>
              <td className="px-4 py-4 align-top">{i + 1}.</td>
              <KegiatanCell nama={row.kegiatan} tanggalInput={row.tanggalInput} />
              <td className="px-4 py-4 align-top">{row.jenis}</td>
              <td className="px-4 py-4 align-top">{row.peran}</td>
              <td className="px-4 py-4 align-top">{row.penyelenggara}</td>
              <td className="px-4 py-4 align-top">{row.tanggal}</td>
              <td className="px-4 py-4 align-top">{row.skala}</td>
              <td className="px-4 py-4 align-top"><StatusBadge status={row.status} /></td>
            </>
          )}
        />

        {/* Riwayat Kegiatan Klaim Poin */}
        <RiwayatTable
          title="Riwayat Kegiatan Klaim Poin"
          columns={['NO', 'KEGIATAN', 'JENIS', 'PERAN', 'PENYELENGGARA', 'TANGGAL', 'BUKTI', 'POIN', 'STATUS']}
          rows={klaimPoin}
          renderRow={(row, i) => (
            <>
              <td className="px-4 py-4 align-top">{i + 1}.</td>
              <KegiatanCell nama={row.kegiatan} tanggalInput={row.tanggalInput} />
              <td className="px-4 py-4 align-top">{row.jenis}</td>
              <td className="px-4 py-4 align-top">{row.peran}</td>
              <td className="px-4 py-4 align-top">{row.penyelenggara}</td>
              <td className="px-4 py-4 align-top">{row.tanggal}</td>
              <td className="px-4 py-4 align-top">{row.bukti}</td>
              <td className="px-4 py-4 align-top">{row.poin}</td>
              <td className="px-4 py-4 align-top"><StatusBadge status={row.status} /></td>
            </>
          )}
        />
      </div>
    </DashboardLayout>
  )
}

export default MahasiswaDashboard