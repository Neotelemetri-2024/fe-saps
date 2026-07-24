import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { StackedBarChart } from '../../components/charts'

const statCards = [
  { label: 'PENDING', value: 4, border: 'border-green-600', numColor: 'text-green-800' },
  { label: 'DISETUJUI', value: 1, border: 'border-green-600', numColor: 'text-green-800' },
  { label: 'MENUNGGU PIMPINAN', value: 0, border: 'border-green-600', numColor: 'text-green-600' },
  { label: 'DITOLAK', value: 0, border: 'border-red-400', numColor: 'text-red-500' },
]

const riwayatData = [
  { id: 1, kegiatan: 'Lomba Hackathon', namaUKMF: 'Hima FT UNAND', jenis: 'Kompetisi', skala: 'Nasional', tanggal: '12 Feb – 14 Feb 2026', status: 'Pending' },
  { id: 2, kegiatan: 'Lomba AI & Teknologi', namaUKMF: 'Hima FT UNAND', jenis: 'Kompetisi', skala: 'Nasional', tanggal: '12 Feb – 14 Feb 2026', status: 'Pending' },
  { id: 3, kegiatan: 'Lomba AI & Teknologi', namaUKMF: 'Hima FT UNAND', jenis: 'Kompetisi', skala: 'Nasional', tanggal: '12 Feb – 14 Feb 2026', status: 'Pending' },
]

const statusStyle = {
  Pending: 'bg-yellow-100 text-yellow-600 border border-yellow-300',
  Disetujui: 'bg-green-100 text-green-700 border border-green-300',
  Ditolak: 'bg-red-100 text-red-600 border border-red-300',
  Revisi: 'bg-orange-100 text-orange-600 border border-orange-300',
}

// Grouped bar chart: Rata-rata Capaian per prodi
// Kategori: Organisasi (biru), Seminar (hijau), Prestasi (kuning)
const chartData = [
  { prodi: 'Informatika', organisasi: 600, seminar: 400, prestasi: 250 },
  { prodi: 'Sistem\nInformasi', organisasi: 550, seminar: 370, prestasi: 310 },
  { prodi: 'Teknik\nKomputer', organisasi: 620, seminar: 420, prestasi: 280 },
]

function Dashboard() {
  const navigate = useNavigate()

  return (
    <DashboardLayout role="admin-fakultas" userName="Nouval Rafiif Irwan" userRole="Operator UKM">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-brand-dark sm:text-2xl lg:text-3xl">
            Dasboard Fakultas <span className="text-[#222]">Teknologi Informasi</span>
          </h2>
          <p className="mt-1 text-sm text-[#616161]">Verifikasi dan ajukan lanjutan kegiatan dari UKMF ke Pimpinan Fakultas</p>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.label} className={`rounded-xl border-2 ${card.border} bg-white p-4 shadow-sm sm:p-5 lg:p-6`}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#616161]">{card.label}</p>
              <p className={`mt-2 text-3xl font-extrabold ${card.numColor}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Tabel Riwayat */}
        <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
          <div className="border-b border-[#e5e7eb] px-6 py-4">
            <h3 className="text-base font-bold text-[#222]">Riwayat Terbaru Pengajuan kegiatan dari UKMF</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-white">
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">NO</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">KEGIATAN</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">NAMA UKMF</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">JENIS</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">SKALA</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">TANGGAL</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">STATUS</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {riwayatData.map((row, i) => (
                  <tr key={row.id} className="hover:bg-[#f9fafb]">
                    <td className="px-4 py-3.5 text-[#616161]">{i + 1}.</td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-[#222]">{row.kegiatan}</p>
                    </td>
                    <td className="px-4 py-3.5 text-[#616161]">{row.namaUKMF}</td>
                    <td className="px-4 py-3.5 text-[#616161]">{row.jenis}</td>
                    <td className="px-4 py-3.5 text-[#616161]">{row.skala}</td>
                    <td className="px-4 py-3.5 text-[#616161] whitespace-nowrap">{row.tanggal}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[row.status]}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin-fakultas/verifikasi-pengajuan-ukmf/${row.id}`)}
                          className="rounded border border-brand-dark px-2.5 py-1 text-xs font-semibold text-brand-dark hover:bg-brand-dark hover:text-white"
                        >
                          Detail
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/admin-fakultas/verifikasi-pengajuan-ukmf/${row.id}`)}
                          className="rounded border border-[#2563eb] px-2.5 py-1 text-xs font-semibold text-[#2563eb] hover:bg-[#2563eb] hover:text-white"
                        >
                          verifikasi
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex flex-col gap-3 border-t border-[#f0f0f0] px-6 py-3 text-xs text-[#888] sm:flex-row sm:items-center sm:justify-between">
            <span>Showing 1 – 10 from Total 20</span>
            <div className="flex flex-wrap items-center gap-1">
              <span>Page 1 of 2</span>
              <div className="ml-3 flex flex-wrap gap-1">
                {['Previous', '1', '2', '...', '4', '5', 'Next'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`rounded px-2 py-1 text-xs ${p === '1' ? 'bg-brand-dark text-white' : 'border border-[#d1d5db] text-[#555] hover:bg-[#f5f5f5]'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom row: Chart + Download */}
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-[#222]">Rata rata Capaian per prodi</h3>
            <StackedBarChart
              labels={chartData.map((d) => d.prodi.replace('\n', ' '))}
              datasets={[
                { label: 'organisasi', data: chartData.map((d) => d.organisasi), color: '#3b82f6' },
                { label: 'seminar',    data: chartData.map((d) => d.seminar),    color: '#16a34a' },
                { label: 'prestasi',  data: chartData.map((d) => d.prestasi),   color: '#eab308' },
              ]}
              height={280}
            />
          </div>

          <div className="flex items-start">
            <div className="w-full rounded-xl bg-gradient-to-r from-brand-dark to-brand-light p-5 shadow-sm">
              <h3 className="text-sm font-bold text-white">Download Panduan</h3>
              <div className="mt-3 flex items-start gap-3 text-white/90">
                <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <p className="text-xs leading-snug">Admin Fakultas – Panduan Penggunaan Website MyUnand Student Connect.pdf</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Dashboard
