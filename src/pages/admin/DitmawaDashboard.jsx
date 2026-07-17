import Swal from 'sweetalert2'
import { CheckCircle, FileText, Trash2, Users, Edit } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatCard from '../../components/dashboard/StatCard'
import StatusBadge from '../../components/dashboard/StatusBadge'
import DataTable from '../../components/dashboard/DataTable'

const kegiatanData = [
  { id: 1, kegiatan: 'PKM 2026', pengaju: 'Shafa Salsabilla', nim: '2311121063', skala: 'Nasional', tgl: '12 Jul 2026', status: 'pending' },
  { id: 2, kegiatan: 'Lomba Debat Nasional', pengaju: 'Tim Debat Unand', nim: '20231001', skala: 'Nasional', tgl: '10 Jul 2026', status: 'disetujui' },
  { id: 3, kegiatan: 'Seminar Internasional', pengaju: 'BEM FISIP', nim: '20231002', skala: 'Internasional', tgl: '8 Jul 2026', status: 'ditolak' },
  { id: 4, kegiatan: 'Workshop IoT', pengaju: 'HME', nim: '20231003', skala: 'Nasional', tgl: '5 Jul 2026', status: 'pending' },
  { id: 5, kegiatan: 'PKM Pendanaan', pengaju: 'Shafa Salsabilla', nim: '2311121063', skala: 'Nasional', tgl: '1 Jul 2026', status: 'disetujui' },
]

const columns = [
  { key: 'kegiatan', label: 'Kegiatan' },
  { key: 'pengaju', label: 'Pengaju' },
  { key: 'nim', label: 'NIM' },
  { key: 'skala', label: 'Skala' },
  { key: 'tgl', label: 'Tanggal' },
  { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  {
    key: 'aksi',
    label: 'Aksi',
    render: (row) => (
      <div className="flex gap-2">
        <button
          className="rounded p-1 text-blue-600 transition hover:bg-blue-50"
          onClick={() =>
            Swal.fire({
              icon: 'success',
              title: 'Berhasil!',
              text: `Kegiatan "${row.kegiatan}" telah diperbarui.`,
              confirmButtonColor: '#1C4122',
            })
          }
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          className="rounded p-1 text-red-600 transition hover:bg-red-50"
          onClick={() =>
            Swal.fire({
              title: 'Hapus kegiatan?',
              text: `Yakin ingin menghapus "${row.kegiatan}"?`,
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#d33',
              cancelButtonColor: '#6b7280',
              confirmButtonText: 'Ya, hapus!',
              cancelButtonText: 'Batal',
            }).then((result) => {
              if (result.isConfirmed) {
                Swal.fire({
                  icon: 'success',
                  title: 'Dihapus!',
                  text: `Kegiatan "${row.kegiatan}" berhasil dihapus.`,
                  confirmButtonColor: '#1C4122',
                })
              }
            })
          }
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    ),
  },
]

function AdminDitmawaDashboard() {
  return (
    <DashboardLayout role="admin-ditmawa" userName="Admin Ditmawa" userRole="Admin Ditmawa">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<CheckCircle className="h-5 w-5" />} label="Disetujui" value="3" />
          <StatCard icon={<FileText className="h-5 w-5" />} label="Pending" value="4" sublabel="Perlu verifikasi" />
          <StatCard icon={<Trash2 className="h-5 w-5" />} label="Ditolak" value="3" />
          <StatCard icon={<Users className="h-5 w-5" />} label="Event Global Aktif" value="3" />
        </div>
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-brand-dark">Verifikasi Kegiatan</h3>
          <DataTable columns={columns} data={kegiatanData} />
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AdminDitmawaDashboard
