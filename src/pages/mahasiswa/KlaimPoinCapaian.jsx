import React, { useState } from 'react'
import { Search, Filter, PlusCircle } from 'lucide-react'
import Swal from 'sweetalert2'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import StatusBadge from '../../components/dashboard/StatusBadge'
import KlaimPoinFormModal from '../../components/mahasiswa/KlaimPoinFormModal'

const pengajuanData = [
  { no: 1, kegiatan: 'SEMINAR AI & TEKNOLOGI', jenis: 'Kompetisi', peran: 'Peserta', penyelenggara: 'Hima FTI UNAND', tanggal: '12 Feb - 15 Feb 2026', skala: 'Nasional', status: 'pending' },
  { no: 2, kegiatan: 'SEMINAR AI & TEKNOLOGI', jenis: 'Kompetisi', peran: 'Peserta', penyelenggara: 'Hima FTI UNAND', tanggal: '12 Feb - 15 Feb 2026', skala: 'Nasional', status: 'pending' },
  { no: 3, kegiatan: 'SEMINAR AI & TEKNOLOGI', jenis: 'Kompetisi', peran: 'Peserta', penyelenggara: 'Hima FTI UNAND', tanggal: '12 Feb - 15 Feb 2026', skala: 'Nasional', status: 'ditolak', alasan: 'Bukti tidak relevan. Silakan upload bukti yang sesuai.' },
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
              html: `<p class="text-sm text-gray-600">${row.alasan}</p>`,
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

function KlaimPoinCapaian() {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)

  return (
    <DashboardLayout role="mahasiswa" userName="Amara Marshinta" userRole="Mahasiswa">
      <KlaimPoinFormModal isOpen={showModal} onClose={() => setShowModal(false)} />
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-brand-dark">Klaim Poin Capaian</h2>
        
        {/* Tombol Tambah Klaim Poin */}
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-xl bg-brand-dark px-6 py-3 text-white font-semibold shadow-md transition hover:opacity-90">
          <PlusCircle className="h-5 w-5" /> Tambah Klaim Poin
        </button>

        {/* Kegiatan yang telah diajukan */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-brand-dark">Klaim Poin Anda</h3>
          
          {/* Search and Filters */}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#e9ebf8] px-4 py-2">
              <Search className="h-4 w-4 text-[#616161]" />
              <input
                type="text"
                placeholder="Cari kegiatan..."
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
              <option>Penyelenggara</option>
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

export default KlaimPoinCapaian