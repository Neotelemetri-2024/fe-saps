import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import DataTable from '../../components/dashboard/DataTable'

const kegiatanData = [
  { id: 1, kegiatan: 'PKM 2026', pengaju: 'Shafa Salsabilla', nim: '2311121063', tgl: '12 Jul 2026', status: 'pending' },
  { id: 2, kegiatan: 'Seminar AI', pengaju: 'Ahmad Fauzi', nim: '2311121064', tgl: '10 Jul 2026', status: 'pending' },
  { id: 3, kegiatan: 'Lomba Debat', pengaju: 'Siti Nurhaliza', nim: '2311121065', tgl: '8 Jul 2026', status: 'pending' },
  { id: 4, kegiatan: 'Bakti Sosial', pengaju: 'Budi Santoso', nim: '2311121066', tgl: '5 Jul 2026', status: 'pending' },
]

const columns = [
  { key: 'kegiatan', label: 'Kegiatan' },
  { key: 'pengaju', label: 'Pengaju' },
  { key: 'nim', label: 'NIM' },
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
              description: `Pengajuan "${row.kegiatan}" telah disetujui.`,
            })
          }
        >
          Setujui
        </button>
        <button
          className="rounded-lg border border-red-500 px-4 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
          onClick={() =>
            toast.error('Ditolak!', {
              description: `Pengajuan "${row.kegiatan}" telah ditolak.`,
            })
          }
        >
          Tolak
        </button>
      </div>
    ),
  },
]

function PimpinanFakultasPersetujuan() {
  return (
    <DashboardLayout role="pimpinan-fakultas" userName="Dr. Andi Wijaya" userRole="Pimpinan Fakultas">
      <div className="space-y-6">
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-brand-dark">Persetujuan Kegiatan</h3>
          <DataTable columns={columns} data={kegiatanData} />
        </div>
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-brand-dark">Alasan Penolakan</h3>
          <textarea className="w-full rounded-lg border border-[#e9ebf8] p-4 text-sm outline-none" rows={3} placeholder="Tuliskan alasan jika menolak pengajuan..." />
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PimpinanFakultasPersetujuan