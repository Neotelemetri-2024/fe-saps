import { Download } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'

const ukmData = [
  { label: 'Neo Telemetri', poin: 30 },
  { label: 'Bola Voli Pa/Pi', poin: 12 },
  { label: 'PKK', poin: 35 },
  { label: 'Pramuka', poin: 40 },
  { label: 'Sinematografi', poin: 42 },
  { label: 'Tapak', poin: 38 },
  { label: 'UKS', poin: 10 },
  { label: 'Forensic', poin: 15 },
  { label: 'Pancing', poin: 13 },
  { label: 'KKO', poin: 11 },
  { label: 'Penelitian', poin: 12 },
  { label: 'Karya Andalas', poin: 14 },
  { label: 'KBK Fast One Unand', poin: 13 },
  { label: 'Ptek', poin: 12 },
  { label: 'Raharayo', poin: 10 },
]

function VerticalBarChart({ data }) {
  const maxPoin = Math.max(...data.map((d) => d.poin))
  const chartHeight = 200

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: data.length * 52 + 40 }} className="flex items-end gap-0 px-4 pb-2">
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between pr-2 text-right" style={{ height: chartHeight + 24 }}>
          {[80, 60, 40, 20, 0].map((v) => (
            <span key={v} className="text-[10px] text-[#9aa0a6]">{v}</span>
          ))}
        </div>

        {/* Bars + x labels */}
        <div className="flex flex-1 items-end gap-0 border-l border-b border-[#e9ebf8]" style={{ height: chartHeight + 24 }}>
          {data.map((d) => {
            const barH = Math.max(4, (d.poin / 80) * chartHeight)
            return (
              <div key={d.label} className="flex flex-1 flex-col items-center justify-end" style={{ height: chartHeight + 24 }}>
                <div
                  className="w-6 rounded-t-sm bg-[#48a757]"
                  style={{ height: barH }}
                  title={`${d.label}: ${d.poin}`}
                />
                <div className="mt-1 w-full overflow-hidden px-0.5" style={{ height: 24 }}>
                  <p
                    className="text-[9px] text-[#616161] leading-tight"
                    style={{
                      writingMode: 'vertical-rl',
                      transform: 'rotate(180deg)',
                      whiteSpace: 'nowrap',
                      maxHeight: 22,
                    }}
                  >
                    {d.label}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Dashboard() {
  return (
    <DashboardLayout role="pimpinan-ditmawa" userName="Dr. Eng. Ir. Dendi Adi Saputra M, S.T, M.T" userRole="Pimpinan">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Dashboard</h2>
          <p className="mt-1 text-sm text-[#616161]">
            Hallo, selamat datang Dr. Eng. Ir. Dendi Adi Saputra M, S.T, M.T !
          </p>
        </div>

        <div>
          <p className="text-base font-bold text-[#333]">Progres Capaian Tahunan</p>
          <p className="text-xs text-[#9aa0a6]">Lacak kelengkapan poin setiap tahun akademik</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#616161]">Mahasiswa Aktif</p>
            <p className="mt-2 text-3xl font-extrabold text-brand-dark">12.110</p>
          </div>
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#616161]">Total Fakultas</p>
            <p className="mt-2 text-3xl font-extrabold text-brand-dark">15</p>
          </div>
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#616161]">Total Pending</p>
            <p className="mt-2 text-3xl font-extrabold text-brand-dark">3</p>
          </div>
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#616161]">Kurikulum Aktif</p>
            <p className="mt-3 text-sm font-bold text-brand-dark">Kurikulum Berjenjang 2022</p>
          </div>
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-bold text-[#333]">
            Grafik poin per UKM berdasarkan pengajuan Kegiatan
          </h3>
          <VerticalBarChart data={ukmData} />
        </div>

        <div className="max-w-sm rounded-xl bg-gradient-to-r from-brand-dark to-brand-light p-5 text-white shadow-sm">
          <h3 className="text-sm font-bold">Download Panduan</h3>
          <div className="mt-3 flex items-start gap-3 text-xs text-white/90">
            <Download className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="font-medium leading-snug">
              Pimpinan utama - Panduan Penggunaan Website MyUnand Student Connect 2026.pdf
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Dashboard
