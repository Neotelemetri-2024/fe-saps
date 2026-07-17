import React, { useState } from 'react'
import { Search, Filter, Pencil } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import StatusBadge from '../../components/dashboard/StatusBadge'
import SetujuiKegiatanModal from '../../components/dosen-pa/SetujuiKegiatanModal'

const permintaanPersetujuanData = [
  { no: 1, kegiatan: 'LOMBA AI & TEKNOLOGI', jenis: 'Kompetisi', peran: 'Juara 1', penyelenggara: 'Hima FTI UNAND', tanggal: '12 Feb - 15 Feb 2026', status: 'pending' },
  { no: 2, kegiatan: 'LOMBA AI & TEKNOLOGI', jenis: 'Kompetisi', peran: 'Juara 1', penyelenggara: 'Hima FTI UNAND', tanggal: '12 Feb - 15 Feb 2026', status: 'pending' },
  { no: 3, kegiatan: 'LOMBA AI & TEKNOLOGI', jenis: 'Kompetisi', peran: 'Juara 1', penyelenggara: 'Hima FTI UNAND', tanggal: '12 Feb - 15 Feb 2026', status: 'pending' },
]

const columns = (openModal) => [
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
    render: (row) => (
      <button
        onClick={() => openModal(row.kegiatan)}
        className="rounded p-1 text-brand-dark transition hover:bg-green-50"
      >
        <Pencil className="h-4 w-4" />
      </button>
    ),
  },
]

function PermintaanPersetujuan() {
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedKegiatan, setSelectedKegiatan] = useState('')

  const openModal = (kegiatan) => {
    setSelectedKegiatan(kegiatan)
    setModalOpen(true)
  }

  return (
    <DashboardLayout role="dosen-pa" userName="Dr. Efa Yonnedi, SE, MPPM, Akt, CA, CRGP" userRole="Dosen Pembimbing">
      <SetujuiKegiatanModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        kegiatan={selectedKegiatan}
      />
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-brand-dark">Permintaan Persetujuan</h2>
        
        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#e9ebf8] px-4 py-2">
            <Search className="h-4 w-4 text-[#616161]" />
            <input
              type="text"
              placeholder="Cari mahasiswa atau kegiatan..."
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
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-brand-dark">Permintaan Persetujuan</h3>
          <DataTable columns={columns(openModal)} data={permintaanPersetujuanData} />
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PermintaanPersetujuan