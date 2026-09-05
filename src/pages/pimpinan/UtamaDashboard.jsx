import React from 'react'
import { ChevronRight, Download } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import ProgressBar from '../../components/dashboard/ProgressBar'
import { StackedBarChart } from '../../components/charts'

// ---------------------------------------------------------------------------
// Mock data — swap these for real API data
// ---------------------------------------------------------------------------
const stats = [
  { label: 'TOTAL MAHASISWA AKTIF', value: '12.300', tone: 'emerald' },
  { label: 'RATA RATA CAPAIAN', value: '72%', tone: 'emerald' },
  { label: 'KEGIATAN PERLU PERSETUJUAN', value: '4', tone: 'emerald' },
  { label: 'KURIKULUM AKTIF', value: '1', tone: 'emerald' },
]

const rankingFakultas = [
  { name: 'Teknologi Informasi', prodi: '1. Program Studi', progress: 90 },
  { name: 'Teknologi Informasi', prodi: '2. Program Studi', progress: 80 },
  { name: 'Teknologi Informasi', prodi: '3. Program Studi', progress: 80 },
]

const prodiChart = [
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
// Small helpers (moved from DosenPADashboard)
// ---------------------------------------------------------------------------
const toneStyles = {
  emerald: { border: 'border-emerald-300', label: 'text-emerald-700', value: 'text-brand-dark' },
}

function StatBox({ label, value, tone }) {
  const s = toneStyles[tone]
  return (
    <div className={`rounded-xl border-2 bg-base-100 p-5 shadow-sm ${s.border}`}>
      <p className={`text-xs font-semibold tracking-wide ${s.label}`}>{label}</p>
      <p className={`mt-2 text-3xl font-extrabold ${s.value}`}>
        {value}
      </p>
    </div>
  )
}


// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
function PimpinanUtamaDashboard() {
  const navigate = useNavigate()

  return (
    <DashboardLayout role="pimpinan_utama" userName="Dr. Efa Yonnedi, SE. MPPM, Akt, CA, CRGP" userRole="Pimpinan Utama (Rektor)">
      <div className="space-y-6">
        {/* Welcome header */}
        <div>
          <h2 className="bg-gradient-to-r from-brand-dark to-brand-light bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl">
            Selamat Datang<br />Dr. Efa Yonnedi, SE. MPPM, Akt, CA, CRGP
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-base-content/60">
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
        <div className="card bg-base-100 p-6">
          <h3 className="mb-4 text-center text-lg font-bold text-base-content">Grafik poin per Fakultas berdasarkan Jenis Kegiatan</h3>
          <StackedBarChart
            labels={prodiChart.map((d) => d.fakultas)}
            datasets={[
              { label: 'Organisasi', data: prodiChart.map((d) => d.organisasi), color: '#3b82f6' },
              { label: 'Seminar', data: prodiChart.map((d) => d.seminar), color: '#15803d' },
              { label: 'Prestasi', data: prodiChart.map((d) => d.prestasi), color: '#eab308' },
            ]}
            height={360}
          />
        </div>

        {/* Ranking Fakultas */}
        <div className="card bg-base-100 p-6">
          <h3 className="mb-4 text-lg font-bold text-base-content">Ranking Fakultas</h3>
          <p className="text-sm text-base-content/60 mb-4">Daftar peringkat seluruh fakultas berdasarkan total poin semua matriks</p>
          <div className="space-y-4">
            {rankingFakultas.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <span className="w-6 text-lg font-bold text-brand-dark">{index + 1}.</span>
                <div className="flex-1">
                  <p className="font-medium text-brand-dark">{item.name}</p>
                  <p className="text-xs text-base-content/60">{item.prodi}</p>
                  <ProgressBar value={item.progress} max={100} height={8} color="bg-brand-light" />
                </div>
                <span className="text-sm font-medium text-brand-dark">{item.progress}%</span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-right">
            <a href="#" className="inline-flex items-center gap-1 text-sm font-medium text-brand-dark">
              Lihat Detail <ChevronRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PimpinanUtamaDashboard