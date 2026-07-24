import { Clock, Download } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'

const riwayatData = [
  {
    no: 1,
    kegiatan: 'Lomba AI & Teknologi',
    submitted: 'Selasa, 4 Feb 2025, 15:37',
    jenis: 'Kompetisi',
    skala: 'Nasional',
    tgl: '12 Feb - 15 Feb 2026',
    status: 'pending',
  },
  {
    no: 2,
    kegiatan: 'Seminar UI/UX untuk Pemula',
    submitted: 'Selasa, 4 Feb 2025, 15:37',
    jenis: 'Seminar',
    skala: 'Universitas',
    tgl: '15 Feb 2026',
    status: 'disetujui',
  },
  {
    no: 3,
    kegiatan: 'Lomba Mobile Legends',
    submitted: 'Selasa, 4 Feb 2025, 15:37',
    jenis: 'Kompetisi',
    skala: 'Universitas',
    tgl: '12 Feb - 15 Feb 2026',
    status: 'ditolak',
  },
]

function UKMDashboard() {
  return (
    <DashboardLayout role="ukm" userName="Nouval Rafiif Irwan" userRole="Operator UKM">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">
            Dasboard UKM Neo Telemetri
          </h2>
          <p className="mt-1 text-sm text-[#616161]">Kelola event dan verifikasi Kehadiran Peserta</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border-2 border-green-600 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#616161]">Pending</p>
            <p className="mt-2 text-3xl font-extrabold text-brand-dark">4</p>
          </div>
          <div className="rounded-xl border-2 border-green-600 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#616161]">Disetujui</p>
            <p className="mt-2 text-3xl font-extrabold text-brand-dark">1</p>
          </div>
          <div className="rounded-xl border-2 border-brand-dark bg-white p-5 shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#616161]">Ditolak</p>
            <p className="mt-2 text-3xl font-extrabold text-brand-dark">0</p>
          </div>
          <div className="rounded-xl border-2 border-brand-dark bg-white p-5 shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#616161]">Event Aktif</p>
            <p className="mt-2 text-3xl font-extrabold text-brand-dark">6</p>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-bold text-brand-dark">Riwayat Terbaru Pengajuan Kegiatan</h3>

          <div className="overflow-hidden rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-xs font-semibold uppercase tracking-wide text-white">
                    <th className="px-4 py-4 text-center">No</th>
                    <th className="px-4 py-4 text-center">Kegiatan</th>
                    <th className="px-4 py-4 text-center">Jenis</th>
                    <th className="px-4 py-4 text-center">Skala</th>
                    <th className="px-4 py-4 text-center">Tanggal</th>
                    <th className="px-4 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {riwayatData.map((r) => (
                    <tr key={r.no} className="border-b border-[#e9ebf8] last:border-0 hover:bg-[#f9fafb]">
                      <td className="px-4 py-4 text-[#616161]">{r.no}</td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-[#333]">{r.kegiatan}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-[#9a9a9a]">
                          <Clock className="h-3 w-3" />
                          {r.submitted}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-[#616161]">{r.jenis}</td>
                      <td className="px-4 py-4 text-[#616161]">{r.skala}</td>
                      <td className="px-4 py-4 text-[#616161]">{r.tgl}</td>
                      <td className="px-4 py-4"><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-[#e9ebf8] px-4 py-4 text-xs text-[#616161] sm:flex-row sm:items-center sm:justify-between">
              <span>Showing 1 - 10 From Total 20</span>
              <span>Page 1 of 2</span>
              <div className="flex items-center gap-1">
                <button className="rounded px-2 py-1 text-[#616161] hover:bg-[#f0f4f0]">Previous</button>
                <button className="rounded bg-brand-dark px-2 py-1 text-white">1</button>
                <button className="rounded px-2 py-1 hover:bg-[#f0f4f0]">2</button>
                <span className="px-1">...</span>
                <button className="rounded px-2 py-1 hover:bg-[#f0f4f0]">3</button>
                <button className="rounded px-2 py-1 hover:bg-[#f0f4f0]">4</button>
                <button className="rounded px-2 py-1 hover:bg-[#f0f4f0]">Next</button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-sm rounded-xl bg-gradient-to-r from-brand-dark to-brand-light p-5 shadow-sm">
          <h3 className="text-sm font-bold text-white">Download Panduan</h3>
          <div className="mt-3 flex items-start gap-3 text-white/90">
            <Download className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-xs leading-snug">
              UKM – Panduan Penggunaan Website MyUnand Student Connect 2026.pdf
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default UKMDashboard