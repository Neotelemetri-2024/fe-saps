import { useEffect, useState } from 'react'
import { PlusCircle, Search, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import StatusBadge from '../../components/dashboard/StatusBadge'
import { getPengajuan, subscribeDataUpdate } from '../../services/pengajuanService'

const peranLabel = {
  // Prestasi & Kompetisi
  juara1: 'Juara 1 / Emas',
  juara2: 'Juara 2 / Perak',
  juara3: 'Juara 3 / Perunggu',
  finalis: 'Penghargaan / Finalis / Peserta',
  // Organisasi
  ketua_umum: 'Ketua Umum / Presiden Mahasiswa',
  pengurus_inti: 'Pengurus Inti',
  anggota_aktif: 'Anggota Aktif / Staff',
  ketua_panitia: 'Ketua Panitia / Pelaksana Event',
  // Pelatihan & Seminar
  pembicara: 'Pembicara / Narasumber / Fasilitator',
  moderator: 'Moderator / Panitia Eksekutif',
  peserta_terstruktur: 'Peserta Pelatihan Terstruktur',
  peserta_umum: 'Peserta Pelatihan Umum / Webinar',
  // Jenis
  prestasi: 'Prestasi/Kompetisi',
  organisasi: 'Organisasi/Volunteer',
  pelatihan: 'Pelatihan/Seminar',
  // Skala
  internasional: 'Internasional',
  nasional: 'Nasional',
  regional: 'Regional',
  lokal: 'Internal (UNAND)',
}

function formatLabel(value) {
  if (!value) return '-'
  return peranLabel[value] || value
}

function formatTanggal(value) {
  if (!value) return '-'
  if (typeof value === 'string') return value
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }
  return String(value)
}

function mapPengajuanRows(items) {
  return items.map((item, i) => ({
    ...item,
    no: i + 1,
    kegiatan: item.kegiatan,
    jenis: formatLabel(item.jenis),
    peran: formatLabel(item.peran),
    skala: formatLabel(item.skala),
    tanggal: formatTanggal(item.tanggal),
  }))
}

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
            toast.info('Alasan Penolakan', {
              description: row.alasan || 'Tidak ada alasan tercantum.',
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
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    getPengajuan('mahasiswa')
      .then((res) => setData(mapPengajuanRows(res)))
      .catch((err) => toast.error('Gagal memuat data', { description: err.message }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    return subscribeDataUpdate((detail) => {
      if (!detail?.type || detail.type === 'pengajuan') load()
    })
  }, [])

  return (
    <DashboardLayout role="mahasiswa" userName="Amara Marshinta" userRole="Mahasiswa">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-brand-dark sm:text-2xl">Daftar Pengajuan</h2>
          <button
            onClick={() => navigate('/mahasiswa/kegiatan-eksternal/ajukan')}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90 sm:px-6 sm:py-3"
          >
            <PlusCircle className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
            <span className="sm:hidden">Ajukan Baru</span>
            <span className="hidden sm:inline">Tambah Ajukan Kegiatan</span>
          </button>
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-3 shadow-sm sm:p-6">
          <h3 className="text-sm font-bold text-brand-dark sm:text-lg">Kegiatan yang telah diajukan</h3>

          <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex w-full items-center gap-2 rounded-lg border border-[#e9ebf8] px-3 py-2 sm:w-auto sm:flex-1 sm:px-4">
              <Search className="h-3.5 w-3.5 shrink-0 text-[#616161] sm:h-4 sm:w-4" />
              <input
                type="text"
                placeholder="Cari kegiatan..."
                className="w-full text-xs outline-none sm:text-sm"
              />
            </div>

            <details className="w-full sm:hidden">
              <summary className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2 text-sm font-semibold text-white">
                <Filter className="h-4 w-4" />
                Filter
              </summary>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <select className="rounded-lg border border-[#e9ebf8] px-3 py-2 text-xs text-[#333] outline-none">
                  <option>Kategori</option>
                </select>
                <select className="rounded-lg border border-[#e9ebf8] px-3 py-2 text-xs text-[#333] outline-none">
                  <option>Peran</option>
                </select>
                <select className="rounded-lg border border-[#e9ebf8] px-3 py-2 text-xs text-[#333] outline-none">
                  <option>Status</option>
                </select>
                <select className="rounded-lg border border-[#e9ebf8] px-3 py-2 text-xs text-[#333] outline-none">
                  <option>Skala</option>
                </select>
                <select className="col-span-2 rounded-lg border border-[#e9ebf8] px-3 py-2 text-xs text-[#333] outline-none">
                  <option>Tahun</option>
                </select>
              </div>
              <button className="mt-2 w-full text-center text-xs font-medium text-[#616161] hover:underline">Reset Filter</button>
            </details>

            <div className="hidden items-center gap-3 sm:flex">
              <button className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
                <Filter className="h-4 w-4" />
                Filter
              </button>
              <select className="rounded-lg border border-[#e9ebf8] px-3 py-2 text-sm text-[#333] outline-none">
                <option>Kategori</option>
              </select>
              <select className="rounded-lg border border-[#e9ebf8] px-3 py-2 text-sm text-[#333] outline-none">
                <option>Peran</option>
              </select>
              <select className="rounded-lg border border-[#e9ebf8] px-3 py-2 text-sm text-[#333] outline-none">
                <option>Status</option>
              </select>
              <select className="rounded-lg border border-[#e9ebf8] px-3 py-2 text-sm text-[#333] outline-none">
                <option>Skala</option>
              </select>
              <select className="rounded-lg border border-[#e9ebf8] px-3 py-2 text-sm text-[#333] outline-none">
                <option>Tahun</option>
              </select>
              <button className="whitespace-nowrap text-sm font-medium text-[#616161] hover:underline">Reset Filter</button>
            </div>
          </div>

          <div className="mt-8">
            {loading ? (
              <p className="py-8 text-center text-sm text-[#616161]">Memuat data...</p>
            ) : (
              <DataTable columns={columns} data={data} />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AjukanKegiatanEksternal
