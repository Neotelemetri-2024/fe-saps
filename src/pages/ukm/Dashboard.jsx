import { CheckCircle, Users, FileText, History, Download } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatCard from '../../components/dashboard/StatCard'
import StatusBadge from '../../components/dashboard/StatusBadge'

const riwayatData = [
  { no: 1, kegiatan: 'Seminar Nasional AI', jenis: 'Seminar', skala: 'Nasional', tgl: '12 Jul 2026', status: 'disetujui' },
  { no: 2, kegiatan: 'Workshop IoT', jenis: 'Workshop', skala: 'Lokal', tgl: '10 Jul 2026', status: 'pending' },
  { no: 3, kegiatan: 'Bakti Sosial Pesisir', jenis: 'Bakti', skala: 'Regional', tgl: '8 Jul 2026', status: 'ditolak' },
  { no: 4, kegiatan: 'Latihan Kepemimpinan', jenis: 'Pelatihan', skala: 'Lokal', tgl: '5 Jul 2026', status: 'disetujui' },
  { no: 5, kegiatan: 'PKM Pendanaan', jenis: 'Kompetisi', skala: 'Nasional', tgl: '1 Jul 2026', status: 'pending' },
  { no: 6, kegiatan: 'Webinar Startup', jenis: 'Seminar', skala: 'Internasional', tgl: '28 Jun 2026', status: 'disetujui' },
]

function UKMDashboard() {
  return (
    <DashboardLayout role="ukm" userName="Nouval Rafiif Irwan" userRole="Operator UKM">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<FileText className="h-5 w-5" />} label="Pending" value="4" sublabel="Perlu verifikasi" />
          <StatCard icon={<CheckCircle className="h-5 w-5" />} label="Disetujui" value="1" />
          <StatCard icon={<XCircleIcon className="h-5 w-5" />} label="Ditolak" value="0" />
          <StatCard icon={<Users className="h-5 w-5" />} label="Event Aktif" value="6" />
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#f0f4f0]">
              <Download className="h-6 w-6 text-brand-dark" />
            </div>
            <div>
              <p className="font-semibold text-brand-dark">Download Panduan Pengajuan Kegiatan UKM</p>
              <p className="text-xs text-[#616161]">PDF - 2.1 MB</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
          <div className="border-b border-[#e9ebf8] px-6 py-4">
            <h3 className="text-lg font-bold text-brand-dark">Riwayat Terbaru Pengajuan Kegiatan</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-left text-xs font-semibold uppercase tracking-wide text-white">
                  <th className="whitespace-nowrap px-6 py-3">No</th>
                  <th className="whitespace-nowrap px-6 py-3">Kegiatan</th>
                  <th className="whitespace-nowrap px-6 py-3">Jenis</th>
                  <th className="whitespace-nowrap px-6 py-3">Skala</th>
                  <th className="whitespace-nowrap px-6 py-3">Tanggal</th>
                  <th className="whitespace-nowrap px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {riwayatData.map((r) => (
                  <tr key={r.no} className="border-b border-[#e9ebf8] last:border-0 hover:bg-[#f9fafb]">
                    <td className="px-6 py-3 text-[#616161]">{r.no}</td>
                    <td className="px-6 py-3 font-medium text-[#333]">{r.kegiatan}</td>
                    <td className="px-6 py-3 text-[#616161]">{r.jenis}</td>
                    <td className="px-6 py-3 text-[#616161]">{r.skala}</td>
                    <td className="px-6 py-3 text-[#616161]">{r.tgl}</td>
                    <td className="px-6 py-3"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-[#e9ebf8] px-6 py-3">
            <span className="text-xs text-[#616161]">Menampilkan 1-6 dari 24</span>
            <div className="flex items-center gap-1 text-xs">
              <button className="rounded px-2 py-1 text-[#616161] hover:bg-[#f0f4f0]">Previous</button>
              <button className="rounded bg-brand-dark px-2 py-1 text-white">1</button>
              <button className="rounded px-2 py-1 text-[#616161] hover:bg-[#f0f4f0]">2</button>
              <button className="rounded px-2 py-1 text-[#616161] hover:bg-[#f0f4f0]">3</button>
              <button className="rounded px-2 py-1 text-[#616161] hover:bg-[#f0f4f0]">4</button>
              <button className="rounded px-2 py-1 text-[#616161] hover:bg-[#f0f4f0]">Next</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

function XCircleIcon(props) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
}

export default UKMDashboard
