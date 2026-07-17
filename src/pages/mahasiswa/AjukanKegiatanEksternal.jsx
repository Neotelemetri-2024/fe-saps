import { PlusCircle, Search, Filter } from 'lucide-react'
import Swal from 'sweetalert2'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import StatusBadge from '../../components/dashboard/StatusBadge'

const pengajuanData = [
  { no: 1, kegiatan: 'SEMINAR AI & TEKNOLOGI', tanggalInput: 'Selasa, 4 Feb 2025, 15:37', jenis: 'Kompetisi', peran: 'Peserta', penyelenggara: 'Hima FTI UNPAD', tanggal: '12 Feb - 15 Feb 2026', skala: 'Nasional', status: 'pending' },
  { no: 2, kegiatan: 'WORKSHOP GRAPHIC DESIGN', tanggalInput: 'Selasa, 4 Feb 2025, 15:37', jenis: 'Pelatihan', peran: 'Peserta', penyelenggara: 'Hima FTI UNPAD', tanggal: '12 Feb - 15 Feb 2026', skala: 'Regional', status: 'pending' },
  { no: 3, kegiatan: 'LOMBA KARYA TULIS ILMIAH', tanggalInput: 'Selasa, 4 Feb 2025, 15:37', jenis: 'Lomba', peran: 'Juara 1', penyelenggara: 'Universitas Indonesia', tanggal: '12 Feb - 15 Feb 2026', skala: 'Nasional', status: 'ditolak', alasan: 'Berkas persyaratan tidak lengkap. Silakan lengkapi dokumen pendukung dan ajukan kembali.' },
]

const columns = [
  { key: 'no', label: 'NO' },
  { key: 'kegiatan', label: 'KEGIATAN' },
  { key: 'jenis', label: 'JENIS' },
  { key: 'peran', label: 'PERAN' },
  { key: 'penyelenggara', label: 'PENYELENGGARA' },
  { key: 'tanggal', label: 'TANGGAL' },
  { key: 'skala', label: 'SKALA' },
  { key: 'status', label: 'STATUS', render: (row) => <StatusBadge status={row.status} /> },
  {
    key: 'aksi',
    label: 'AKSI',
    render: (row) =>
      row.status === 'ditolak' ? (
        <button
          onClick={() =>
            Swal.fire({
              title: 'Alasan Penolakan',
              text: row.alasan || 'Tidak ada alasan tercantum.',
              icon: 'info',
              confirmButtonText: 'Tutup',
              confirmButtonColor: '#1C4122',
            })
          }
          className="text-sm font-medium text-red-600 underline hover:text-red-800"
        >
          Lihat Alasan
        </button>
      ) : (
        <span className="text-gray-400">-</span>
      ),
  },
]

function AjukanKegiatanEksternal() {
  const navigate = useNavigate()

  return (
    <DashboardLayout role="mahasiswa" userName="Amara Marshinta" userRole="Mahasiswa">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-brand-dark">Daftar Pengajuan</h2>

        {/* Tombol Tambah Ajukan Kegiatan */}
        <button
          onClick={() => navigate('/mahasiswa/kegiatan-eksternal/ajukan')}
          className="flex items-center gap-2 rounded-xl bg-brand-dark px-6 py-3 text-white font-semibold shadow-md transition hover:opacity-90"
        >
          <PlusCircle className="h-5 w-5" />
          Tambah ajukan kegiatan
        </button>

        {/* Kegiatan yang telah diajukan */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-brand-dark">Kegiatan yang telah diajukan</h3>
          
          {/* Search and Filters */}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#e9ebf8] px-4 py-2">
              <Search className="h-4 w-4 text-[#616161]" />
              <input
                type="text"
                placeholder="Cari dari mahasiswa atau kegiatan..."
                className="flex-1 text-sm outline-none"
              />
            </div>
            <button className="flex items-center gap-2 rounded-lg bg-brand-light px-4 py-2 text-sm font-medium text-white transition hover:opacity-90">
              <Filter className="h-4 w-4" />
              Filter
            </button>
            
            {/* Filter dropdowns */}
            <select className="rounded-lg border border-[#e9ebf8] px-4 py-2 text-sm text-[#333] outline-none">
              <option>Kategori</option>
            </select>
            <select className="rounded-lg border border-[#e9ebf8] px-4 py-2 text-sm text-[#333] outline-none">
              <option>Peran</option>
            </select>
            <select className="rounded-lg border border-[#e9ebf8] px-4 py-2 text-sm text-[#333] outline-none">
              <option>Status</option>
            </select>
            <select className="rounded-lg border border-[#e9ebf8] px-4 py-2 text-sm text-[#333] outline-none">
              <option>Skala</option>
            </select>
            <select className="rounded-lg border border-[#e9ebf8] px-4 py-2 text-sm text-[#333] outline-none">
              <option>Tahun</option>
            </select>
            <button className="text-sm font-medium text-[#616161] hover:underline">Reset Filter</button>
          </div>

          {/* DataTable */}
          <div className="mt-6">
            <DataTable columns={columns} data={pengajuanData} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AjukanKegiatanEksternal
