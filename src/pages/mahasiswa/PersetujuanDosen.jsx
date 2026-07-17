import React, { useState } from 'react'
import { PlusCircle, Search, Filter } from 'lucide-react'
import Swal from 'sweetalert2'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import StatusBadge from '../../components/dashboard/StatusBadge'
import AjukanPersetujuanDosenModal from '../../components/mahasiswa/AjukanPersetujuanDosenModal'

const pengajuanData = [
  { no: 1, kegiatan: 'LOMBA AI & TEKNOLOGI', jenis: 'Kompetisi', peran: 'Juara 1', penyelenggara: 'Hima FTI UNAND', tanggal: '12 Feb - 15 Feb 2026', status: 'pending' },
  { no: 2, kegiatan: 'LOMBA AI & TEKNOLOGI', jenis: 'Kompetisi', peran: 'Juara 1', penyelenggara: 'Hima FTI UNAND', tanggal: '12 Feb - 15 Feb 2026', status: 'disetujui' },
  { no: 3, kegiatan: 'LOMBA AI & TEKNOLOGI', jenis: 'Kompetisi', peran: 'Juara 1', penyelenggara: 'Hima FTI UNAND', tanggal: '12 Feb - 15 Feb 2026', status: 'ditolak', alasan: 'Bukti yang terlampir disertifikat tidak sesuai dengan peran yang anda ajukan ! Silakan lakukan perbaikan.' },
]

const columns = [
  { key: 'no', label: 'NO' },
  { key: 'kegiatan', label: 'KEGIATAN' },
  { key: 'jenis', label: 'JENIS' },
  { key: 'peran', label: 'PERAN' },
  { key: 'penyelenggara', label: 'PENYELENGGARA' },
  { key: 'tanggal', label: 'TANGGAL' },
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
      ) : row.status === 'disetujui' ? (
        <span className="text-sm font-medium text-green-600">Disetujui Dosen PA</span>
      ) : (
        <span className="text-gray-400">-</span>
      ),
  },
]

function PersetujuanDosen() {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)

  return (
    <DashboardLayout role="mahasiswa" userName="Amara Marshinta" userRole="Mahasiswa">
      <AjukanPersetujuanDosenModal isOpen={showModal} onClose={() => setShowModal(false)} />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-brand-dark">Persetujuan Dosen PA</h2>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl bg-brand-dark px-6 py-3 text-white font-semibold shadow-md transition hover:opacity-90"
          >
            <PlusCircle className="h-5 w-5" /> Minta Persetujuan
          </button>
        </div>

        {/* Kegiatan yang telah diajukan */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-brand-dark">Kegiatan yang telah di ajukan ke Dosen PA</h3>
          
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

        {/* Catatan Dosen PA */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-2 text-lg font-bold text-brand-dark">Catatan Dosen PA</h3>
          <p className="text-sm text-[#616161]">Dr. Eka Wahyuni, SE, MPPM, Akt, CA, CRGP</p>
          
          <div className="mt-4 space-y-3">
            <div className="rounded-lg bg-[#f9fafb] p-3">
              <p className="text-sm text-[#333]">"Tingkatkan capaian Social Contribution. Segera ikuti KKN dan kegiatan bakti sebelum akhir semester ini. Progress akademik sudah sangat baik, pertahankan IPK anda."</p>
              <p className="mt-1 text-xs text-[#616161]">Selasa, 4 Feb 2025, 15:37</p>
            </div>
            <div className="rounded-lg bg-[#f9fafb] p-3">
              <p className="text-sm text-[#333]">Ikuti good laboratory practices untuk meningkatkan skill SOP dalam labor</p>
              <p className="mt-1 text-xs text-[#616161]">Selasa, 4 Feb 2025, 15:37</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PersetujuanDosen