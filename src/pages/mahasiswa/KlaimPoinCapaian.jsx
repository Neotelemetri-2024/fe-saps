import { useEffect, useMemo, useState } from 'react'
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
      : (item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'),
    skala: item.skala || '-',
    status: String(item.status || 'pending').toLowerCase(),
    alasan: item.alasan || null,
  }
}

function KlaimPoinCapaian() {
  const user = getCurrentUser()
  const [data, setData] = useState([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const loadRiwayat = () => {
    getKlaim()
      .then((res) => setData((Array.isArray(res) ? res : []).map(mapRiwayat)))
      .catch(() => setData([]))
  }

  useEffect(() => {
    loadRiwayat()
  }, [])

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'disetujui', label: 'Disetujui' },
    { value: 'ditolak', label: 'Ditolak' },
  ]

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.filter((row) => {
      if (filterStatus && row.status !== filterStatus) return false
      if (!q) return true
      return (
        row.kegiatan.toLowerCase().includes(q) ||
        row.penyelenggara.toLowerCase().includes(q) ||
        row.jenis.toLowerCase().includes(q)
      )
    })
  }, [data, search, filterStatus])

  return (
    <DashboardLayout
      role="mahasiswa"
      userName={user?.nama || user?.name || 'Mahasiswa'}
      userRole="Mahasiswa"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-[#222] sm:text-2xl">Klaim Poin Capaian</h2>
          <p className="mt-1 text-sm text-[#616161]">Pantau riwayat klaim poin kegiatan eksternal yang telah Anda ajukan.</p>
        </div>

        <TableCard title="Riwayat Klaim Poin Anda">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-lg border border-[#e9ebf8] px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-[#9aa0a6]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kegiatan..."
                className="flex-1 text-sm outline-none"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-[#e9ebf8] px-3 py-2 text-sm text-[#333] outline-none"
            >
              <option value="">Semua Status</option>
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            {(search || filterStatus) && (
              <button
                type="button"
                onClick={() => { setSearch(''); setFilterStatus('') }}
                className="rounded-lg border border-brand-dark bg-white px-3 py-2 text-sm font-medium text-brand-dark transition hover:bg-[#f5f5f5]"
              >
                Reset Filter
              </button>
            )}
          </div>
          <TableFrame>
            <DataTable columns={columns} data={filtered} />
          </TableFrame>
        </TableCard>
      </div>
    </DashboardLayout>
  )
}

export default KlaimPoinCapaian
