import React from 'react'
import { Search, Filter, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import StatusBadge from '../../components/dashboard/StatusBadge'
import ProgressBar from '../../components/dashboard/ProgressBar'

const riwayatPoinData = [
  { no: 1, kegiatan: 'LOMBA AI & TEKNOLOGI', jenis: 'Kompetisi', peran: 'Juara 1', penyelenggara: 'Hima FTI UNAND', tanggal: '12 Feb - 15 Feb 2026', bukti: 'Sertifikat.pdf', poin: 10, status: 'pending' },
  { no: 2, kegiatan: 'LOMBA AI & TEKNOLOGI', jenis: 'Kompetisi', peran: 'Juara 1', penyelenggara: 'Hima FTI UNAND', tanggal: '12 Feb - 15 Feb 2026', bukti: 'Sertifikat.pdf', poin: 10, status: 'pending' },
  { no: 3, kegiatan: 'LOMBA AI & TEKNOLOGI', jenis: 'Kompetisi', peran: 'Juara 1', penyelenggara: 'Hima FTI UNAND', tanggal: '12 Feb - 15 Feb 2026', bukti: 'Sertifikat.pdf', poin: 10, status: 'disetujui' },
]

const columns = [
  { key: 'no', label: 'NO' },
  { key: 'kegiatan', label: 'KEGIATAN' },
  { key: 'jenis', label: 'JENIS' },
  { key: 'peran', label: 'PERAN' },
  { key: 'penyelenggara', label: 'PENYELENGGARA' },
  { key: 'tanggal', label: 'TANGGAL' },
  { key: 'bukti', label: 'BUKTI', render: (row) => <a href="#" className="text-brand-dark underline">{row.bukti}</a> },
  { key: 'poin', label: 'POIN' },
  { key: 'status', label: 'STATUS', render: (row) => <StatusBadge status={row.status} /> },
]

function RiwayatPoin() {
  const navigate = useNavigate()

  const progressData = [
    { tahun: 'TAHUN 1 - FONDASI', current: 102, target: 100, label: '100% COMPLETED', onTrack: true },
    { tahun: 'TAHUN 2 - PENGUATAN', current: 153, target: 150, label: '100% COMPLETED', onTrack: true },
    { tahun: 'TAHUN 3 - PEMANTAPAN', current: 185, target: 200, label: '93% ON TRACK', onTrack: true, remaining: '15 remaining' },
    { tahun: 'TAHUN 4 - AKTUALISASI', current: 30, target: 100, label: '30% PROGRESS', onTrack: false, status: 'In Progress' },
  ]

  return (
    <DashboardLayout role="mahasiswa" userName="Amara Marshinta" userRole="Mahasiswa">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-brand-dark">Riwayat Poin</h2>
        <p className="text-sm text-[#616161]">Rekap seluruh kegiatan dan poin yang telah terkumpul sesuai kurikulum.</p>

        {/* Progress per Tahun Kurikulum */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-brand-dark">Progress per Tahun Kurikulum</h3>
            <div className="flex items-center gap-2 text-sm font-medium text-brand-dark">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-light text-white text-xs">⭐</span>
              Total Capaian: <span className="font-bold">365</span> / 550 poin
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {progressData.map((item, index) => (
              <div key={index} className="rounded-lg border border-[#e9ebf8] p-4 text-center">
                <p className="text-xs font-semibold text-[#616161]">{item.tahun}</p>
                <p className="mt-1 text-2xl font-bold text-brand-dark">
                  {item.current}
                  <span className="text-sm font-normal text-[#616161]">/{item.target} poin</span>
                </p>
                <div className="mt-2 flex justify-center">
                  <ProgressBar value={item.current} max={item.target} height={6} />
                </div>
                <div className="mt-2 flex items-center justify-center gap-1 text-sm text-[#616161]">
                  {item.onTrack && <CheckCircle className="h-4 w-4 text-green-500" />}
                  <span>{item.label}</span>
                  {item.remaining && <span className="font-medium text-brand-dark">{item.remaining}</span>}
                  {item.status && <span className="font-medium text-[#616161]">{item.status}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Riwayat Poin */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-brand-dark">Riwayat Poin</h3>
          
          {/* Search and Filters */}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#e9ebf8] px-4 py-2">
              <Search className="h-4 w-4 text-[#616161]" />
              <input
                type="text"
                placeholder="Cari mahasiswa atau kegiatan..."
                className="flex-1 text-sm outline-none"
              />
            </div>
            <button className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
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
            <DataTable columns={columns} data={riwayatPoinData} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default RiwayatPoin