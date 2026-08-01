import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import StatusBadge from '../../components/dashboard/StatusBadge'
import { getCurrentUser } from '../../services/authService'
import { getKlaim } from '../../services/poinService'
import KegiatanCell from '../../components/dashboard/KegiatanCell'

const columns = [
  { key: 'no', label: 'NO' },
  {
    key: 'kegiatan',
    label: 'KEGIATAN',
    render: (row) => <KegiatanCell nama={row.kegiatan} tanggal={row.diajukanPada} />,
  },
  { key: 'jenis', label: 'JENIS' },
  { key: 'peran', label: 'PERAN' },
  { key: 'penyelenggara', label: 'PENYELENGGARA' },
  { key: 'tanggal', label: 'TANGGAL' },
  { key: 'skala', label: 'SKALA' },
  { key: 'status', label: 'STATUS', render: (row) => <StatusBadge status={row.status} /> },
  {
    key: 'aksi',
    label: 'AKSI',
    render: () => <span className="text-gray-400">-</span>,
  },
]

function mapRiwayat(item, i) {
  return {
    no: i + 1,
    id: item.id,
    kegiatan: item.namaKegiatan || item.kegiatan || '-',
    diajukanPada: item.tanggalKlaim
      ? new Date(item.tanggalKlaim).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      : '',
    jenis: item.jenisKegiatan || item.jenis || '-',
    peran: item.peran || '-',
    penyelenggara: item.penyelenggara || '-',
    tanggal: item.tanggalPelaksanaan
      ? new Date(item.tanggalPelaksanaan).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      : item.tanggal || '-',
    skala: item.skala || '-',
    status: String(item.status || 'pending').toLowerCase(),
    alasan: item.alasan || null,
  }
}

function KlaimPoinCapaian() {
  const user = getCurrentUser()
  const [data, setData] = useState([])

  const loadRiwayat = () => {
    getKlaim()
      .then((res) => setData((Array.isArray(res) ? res : []).map(mapRiwayat)))
      .catch(() => setData([]))
  }

  useEffect(() => {
    loadRiwayat()
  }, [])

  return (
    <DashboardLayout
      role="mahasiswa"
      userName={user?.nama || user?.name || 'Mahasiswa'}
      userRole="Mahasiswa"
    >
      <div className="space-y-6">
        <h2 className="text-xl font-extrabold text-brand-dark sm:text-2xl">Klaim Poin Capaian</h2>

        <TableCard title="Klaim Poin Anda">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-lg border border-[#e9ebf8] px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-[#9aa0a6]" />
              <input type="text" placeholder="Cari kegiatan..." className="flex-1 text-sm outline-none" />
            </div>
          </div>
          <TableFrame>
            <DataTable columns={columns} data={data} />
          </TableFrame>
        </TableCard>
      </div>
    </DashboardLayout>
  )
}

export default KlaimPoinCapaian
