import { toast } from 'sonner'
import { CheckCircle, Download } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatCard from '../../components/dashboard/StatCard'
import StatusBadge from '../../components/dashboard/StatusBadge'
import DataTable from '../../components/dashboard/DataTable'

const pengajuanData = [
  { id: 1, kegiatan: 'Seminar Kewirausahaan', ukm: 'HME', tgl: '12 Jul 2026', status: 'pending' },
  { id: 2, kegiatan: 'Bakti Sosial', ukm: 'BEM FISIP', tgl: '10 Jul 2026', status: 'disetujui' },
  { id: 3, kegiatan: 'Latihan Kepemimpinan', ukm: 'BEM FH', tgl: '8 Jul 2026', status: 'menunggu' },
  { id: 4, kegiatan: 'Pelatihan IT', ukm: 'HIMATIF', tgl: '5 Jul 2026', status: 'ditolak' },
]

const columns = [
  { key: 'kegiatan', label: 'Kegiatan' },
  { key: 'ukm', label: 'UKM' },
  { key: 'tgl', label: 'Tanggal' },
  { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  {
    key: 'aksi',
    label: 'Aksi',
    render: (row) => (
      <div className="flex gap-2">
        <button
          className="rounded-lg bg-brand-dark px-4 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
          onClick={() =>
            toast.success('Disetujui!', {
              description: `Pengajuan "${row.kegiatan}" dari ${row.ukm} telah disetujui.`,
            })
          }
        >
          Setujui
        </button>
        <button
          className="rounded-lg border border-red-500 px-4 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
          onClick={() =>
            toast.error('Ditolak!', {
              description: `Pengajuan "${row.kegiatan}" dari ${row.ukm} telah ditolak.`,
            })
          }
        >
          Tolak
        </button>
      </div>
    ),
  },
]

function AdminFakultasDashboard() {
  return (
    <DashboardLayout role="admin-fakultas" userName="Nouval Rafiif Irwan" userRole="Admin Fakultas">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<FileIcon className="h-5 w-5" />} label="Pending" value="4" />
          <StatCard icon={<CheckCircle className="h-5 w-5" />} label="Disetujui" value="1" />
          <StatCard icon={<ClockIcon className="h-5 w-5" />} label="Menunggu Pimpinan" value="0" />
          <StatCard icon={<XIcon className="h-5 w-5" />} label="Ditolak" value="0" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-brand-dark">Rata-rata Capaian per Prodi</h3>
            <div className="space-y-3">
              {[
                { prodi: 'Teknik Mesin', pct: 78 }, { prodi: 'Teknik Industri', pct: 72 }, { prodi: 'Informatika', pct: 85 },
                { prodi: 'Teknik Sipil', pct: 65 }, { prodi: 'Teknik Elektro', pct: 70 },
              ].map((p) => (
                <div key={p.prodi}>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#333]">{p.prodi}</span>
                    <span className="text-[#616161]">{p.pct}%</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-[#e9ebf8]">
                    <div className="h-2 rounded-full bg-brand-light" style={{ width: `${p.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#f0f4f0]">
                <Download className="h-6 w-6 text-brand-dark" />
              </div>
              <div>
                <p className="font-semibold text-brand-dark">Download Panduan Verifikasi</p>
                <p className="text-xs text-[#616161]">PDF - 3.1 MB</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-brand-dark">Pengajuan UKM</h3>
          <DataTable columns={columns} data={pengajuanData} />
        </div>
      </div>
    </DashboardLayout>
  )
}

function FileIcon(props) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
}
function ClockIcon(props) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
}
function XIcon(props) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="18" x2="6" y2="6" /><line x1="6" y1="18" x2="18" y2="6" /></svg>
}

export default AdminFakultasDashboard