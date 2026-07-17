import React from 'react'
import { ChevronRight, Download } from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import ProgressBar from '../../components/dashboard/ProgressBar'

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const stats = [
  { label: 'TOTAL MAHASISWA AKTIF', value: '12.300', tone: 'emerald' },
  { label: 'RATA RATA CAPAIAN', value: '72%', tone: 'emerald' },
  { label: 'KEGIATAN PERLU PERSETUJUAN', value: '4', tone: 'emerald' },
  { label: 'KURIKULUM AKTIF', value: '1', tone: 'emerald' },
]

const rankingFakultas = [
  { name: 'Teknologi Informasi', desc: '1. Program Studi', progress: 90 },
  { name: 'Teknologi Informasi', desc: '2. Program Studi', progress: 80 },
  { name: 'Teknologi Informasi', desc: '3. Program Studi', progress: 80 },
]

const chartData = [
  { fakultas: 'Teknik', organisasi: 200, seminar: 150, prestasi: 100 },
  { fakultas: 'Mipa', organisasi: 180, seminar: 170, prestasi: 120 },
  { fakultas: 'Kedokteran', organisasi: 220, seminar: 130, prestasi: 80 },
  { fakultas: 'Hukum', organisasi: 190, seminar: 160, prestasi: 110 },
  { fakultas: 'Ekonomi', organisasi: 210, seminar: 140, prestasi: 95 },
  { fakultas: 'Pertanian', organisasi: 170, seminar: 180, prestasi: 105 },
  { fakultas: 'Peternakan', organisasi: 200, seminar: 150, prestasi: 100 },
  { fakultas: 'Kedokteran Hewan', organisasi: 180, seminar: 170, prestasi: 120 },
  { fakultas: 'Keperawatan', organisasi: 220, seminar: 130, prestasi: 80 },
  { fakultas: 'Farmasi', organisasi: 190, seminar: 160, prestasi: 110 },
  { fakultas: 'Ilmu Budaya', organisasi: 210, seminar: 140, prestasi: 95 },
  { fakultas: 'Ekonomi dan Bisnis', organisasi: 170, seminar: 180, prestasi: 105 },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const toneStyles = {
  emerald: { border: 'border-emerald-300', label: 'text-emerald-700', value: 'text-brand-dark' },
}

function StatBox({ label, value, tone }) {
  const s = toneStyles[tone]
  return (
    <div className={`rounded-xl border-2 bg-white p-5 shadow-sm ${s.border}`}>
      <p className={`text-xs font-semibold tracking-wide ${s.label}`}>{label}</p>
      <p className={`mt-2 text-3xl font-extrabold ${s.value}`}>{value}</p>
    </div>
  )
}

function StackedChart({ data }) {
  const width = 800
  const height = 400
  const paddingLeft = 50
  const paddingBottom = 80
  const maxVal = 500
  const chartHeight = height - paddingBottom - 10
  const barWidth = 20
  const gap = (width - paddingLeft - barWidth * data.length) / (data.length + 1)
  const yTicks = [100, 200, 300, 400, 500]
  const colors = { organisasi: '#3b82f6', prestasi: '#eab308', seminar: '#15803d' }
  const scaleY = (v) => (v / maxVal) * chartHeight

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {yTicks.map((t) => {
          const y = height - paddingBottom - scaleY(t)
          return (
            <g key={t}>
              <line x1={paddingLeft} y1={y} x2={width} y2={y} stroke="#eef0f7" strokeWidth="1" />
              <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#9aa0a6">{t}</text>
            </g>
          )
        })}
        {data.map((d, i) => {
          const x = paddingLeft + gap + i * (barWidth + gap)
          const baseY = height - paddingBottom
          const hSem = scaleY(d.seminar)
          const hPre = scaleY(d.prestasi)
          const hOrg = scaleY(d.organisasi)
          const ySem = baseY - hSem
          const yPre = ySem - hPre
          const yOrg = yPre - hOrg

          return (
            <g key={d.fakultas}>
              <rect x={x} y={ySem} width={barWidth} height={hSem} fill={colors.seminar} rx="2" />
              <rect x={x} y={yPre} width={barWidth} height={hPre} fill={colors.prestasi} rx="2" />
              <rect x={x} y={yOrg} width={barWidth} height={hOrg} fill={colors.organisasi} rx="2" />
              <text
                x={x + barWidth / 2}
                y={baseY + 5}
                textAnchor="end"
                fontSize="11"
                fill="#616161"
                transform={`rotate(-45 ${x + barWidth / 2} ${baseY + 5})`}
              >
                {d.fakultas}
              </text>
            </g>
          )
        })}
        <line x1={paddingLeft} y1={height - paddingBottom} x2={width} y2={height - paddingBottom} stroke="#e9ebf8" strokeWidth="1" />
      </svg>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-[#616161]">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: colors.organisasi }} />organisasi</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: colors.seminar }} />seminar</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: colors.prestasi }} />prestasi</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function PimpinanUtamaDashboard() {
  return (
    <DashboardLayout role="pimpinan-utama" userName="Dr. Efa Yonnedi, SE. MPPM, Akt, CA, CRGP" userRole="Pimpinan Utama (Rektor)">
      <div className="space-y-6">
        {/* Welcome header */}
        <div>
          <h2 className="bg-gradient-to-r from-brand-dark to-brand-light bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl">
            Selamat Datang<br />Dr. Efa Yonnedi, SE. MPPM, Akt, CA, CRGP
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-[#616161]">
            Kelola persetujuan kegiatan, kurikulum berjenjang, dan pantau analitik universitas.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <StatBox key={s.label} {...s} />
          ))}
        </div>

        {/* Grafik poin per Fakultas */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-center text-lg font-bold text-brand-dark">Grafik poin per Fakultas berdasarkan Jenis Kegiatan</h3>
          <StackedChart data={chartData} />
        </div>

        {/* Ranking Fakultas */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-brand-dark">Ranking Fakultas</h3>
          <p className="text-sm text-[#616161] mb-4">Daftar peringkat seluruh fakultas berdasarkan total poin semua matriks</p>
          <div className="space-y-4">
            {rankingFakultas.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <span className="w-6 text-lg font-bold text-brand-dark">{index + 1}.</span>
                <div className="flex-1">
                  <p className="font-medium text-brand-dark">{item.name}</p>
                  <p className="text-xs text-[#616161]">{item.desc}</p>
                  <ProgressBar value={item.progress} max={100} height={8} color="bg-brand-light" />
                </div>
                <span className="text-sm font-medium text-brand-dark">{item.progress}%</span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-right">
            <Link to="/pimpinan-utama/detail-fakultas" className="inline-flex items-center gap-1 text-sm font-medium text-brand-dark">
              Lihat Detail <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Download Panduan */}
        <div className="rounded-xl bg-gradient-to-r from-brand-dark to-brand-light p-6 shadow-sm max-w-lg">
          <h3 className="text-lg font-bold text-white">Download Panduan</h3>
          <p className="mt-2 text-sm text-white/80 max-w-xl">
            Dapatkan panduan lengkap penggunaan dashboard SAPS untuk Pimpinan Utama.
          </p>
          <button className="mt-4 flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand-dark shadow transition hover:bg-gray-100">
            <Download className="h-4 w-4" /> Download PDF
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PimpinanUtamaDashboard