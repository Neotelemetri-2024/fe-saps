import { useEffect, useMemo, useState } from 'react'
import { Search, History } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import KegiatanCell from '../../components/dashboard/KegiatanCell'
import { getCurrentUser } from '../../services/authService'
import { getRiwayatKegiatanInternal } from '../../services/kegiatanService'

function formatTanggal(start, end) {
  if (!start) return '-'
  try {
    const opts = { day: 'numeric', month: 'short', year: 'numeric' }
    const s = new Date(start).toLocaleDateString('id-ID', opts)
    if (!end) return s
    const e = new Date(end).toLocaleDateString('id-ID', opts)
    return s === e ? s : `${s} - ${e}`
  } catch {
    return '-'
  }
}

function KehadiranBadge({ status }) {
  const cfg =
    status === 'Hadir'
      ? { bg: 'bg-green-100', text: 'text-green-800' }
      : status === 'Tidak Hadir'
        ? { bg: 'bg-red-100', text: 'text-red-800' }
        : { bg: 'bg-gray-100', text: 'text-gray-700' }
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {status}
    </span>
  )
}

const columns = [
  { key: 'no', label: 'NO' },
  { key: 'namaKegiatan', label: 'KEGIATAN', render: (row) => <KegiatanCell nama={row.namaKegiatan} tanggal={row.diajukanPada} /> },
  { key: 'jenisKegiatan', label: 'JENIS' },
  { key: 'skala', label: 'SKALA' },
  { key: 'penyelenggara', label: 'PENYELENGGARA' },
  { key: 'tanggal', label: 'TANGGAL', render: (row) => formatTanggal(row.tanggalMulai, row.tanggalSelesai) },
  { key: 'peran', label: 'PERAN' },
  {
    key: 'kehadiran',
    label: 'KEHADIRAN',
    render: (row) => (
      <div className="flex w-full justify-center">
        <KehadiranBadge status={row.kehadiran} />
      </div>
    ),
  },
  { key: 'poin', label: 'POIN' },
]

function RiwayatKegiatanInternal() {
  const user = getCurrentUser()
  const [loading, setLoading] = useState(true)
  const [riwayat, setRiwayat] = useState([])
  const [search, setSearch] = useState('')
  const [filterJenis, setFilterJenis] = useState('')
  const [filterKehadiran, setFilterKehadiran] = useState('')
  const [filterPenyelenggara, setFilterPenyelenggara] = useState('')

  useEffect(() => {
    setLoading(true)
    getRiwayatKegiatanInternal()
      .then((data) => {
        const list = Array.isArray(data.riwayat) ? data.riwayat : []
        setRiwayat(list)
      })
      .catch((err) => {
        setRiwayat([])
        toast.error('Gagal memuat riwayat kegiatan internal', { description: err.message })
      })
      .finally(() => setLoading(false))
  }, [])

  const jenisOptions = useMemo(
    () => [...new Set(riwayat.map((r) => r.jenisKegiatan).filter((v) => v && v !== '-'))],
    [riwayat],
  )
  const penyelenggaraOptions = useMemo(
    () => [...new Set(riwayat.map((r) => r.penyelenggara).filter((v) => v && v !== '-'))],
    [riwayat],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return riwayat
      .filter((r) => {
        if (q && !String(r.namaKegiatan || '').toLowerCase().includes(q) && !String(r.penyelenggara || '').toLowerCase().includes(q)) return false
        if (filterJenis && r.jenisKegiatan !== filterJenis) return false
        if (filterKehadiran && r.kehadiran !== filterKehadiran) return false
        if (filterPenyelenggara && r.penyelenggara !== filterPenyelenggara) return false
        return true
      })
      .map((r, i) => ({
        ...r,
        no: i + 1,
        diajukanPada: formatTanggal(r.tanggalDiajukan || r.createdAt || r.dibuatPada),
      }))
  }, [riwayat, search, filterJenis, filterKehadiran, filterPenyelenggara])

  const resetFilter = () => {
    setSearch('')
    setFilterJenis('')
    setFilterKehadiran('')
    setFilterPenyelenggara('')
  }

  return (
    <DashboardLayout role="mahasiswa" userName={user?.nama || 'Mahasiswa'} userRole="Mahasiswa">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
    
          <h2 className="text-xl font-bold text-[#222] sm:text-2xl">Riwayat Kegiatan Internal</h2>
        </div>
        <p className="text-sm text-[#616161]">Rekap seluruh kegiatan internal (UKM, UKMF, dan Universitas) yang pernah Anda ikuti.</p>

        <TableCard title="Riwayat Kegiatan Internal">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#e9ebf8] px-4 py-2">
              <Search className="h-4 w-4 text-[#616161]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kegiatan..."
                className="flex-1 text-sm outline-none"
              />
            </div>

            <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)} className="rounded-lg border border-[#e9ebf8] px-4 py-2 text-sm text-[#333] outline-none">
              <option value="">Jenis</option>
              {jenisOptions.map((j) => <option key={j} value={j}>{j}</option>)}
            </select>
            <select value={filterKehadiran} onChange={(e) => setFilterKehadiran(e.target.value)} className="rounded-lg border border-[#e9ebf8] px-4 py-2 text-sm text-[#333] outline-none">
              <option value="">Kehadiran</option>
              <option value="Hadir">Hadir</option>
              <option value="Tidak Hadir">Tidak Hadir</option>
              <option value="Belum Tercatat">Belum Tercatat</option>
            </select>
            <select value={filterPenyelenggara} onChange={(e) => setFilterPenyelenggara(e.target.value)} className="rounded-lg border border-[#e9ebf8] px-4 py-2 text-sm text-[#333] outline-none">
              <option value="">Penyelenggara</option>
              {penyelenggaraOptions.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <button type="button" onClick={resetFilter} className="rounded-lg border border-brand-dark bg-white px-3 py-2 text-sm font-medium text-brand-dark transition hover:bg-[#f5f5f5]">Reset Filter</button>
          </div>

          <TableFrame>
            <DataTable columns={columns} data={filtered} loading={loading} emptyText="Belum ada riwayat kegiatan internal." />
          </TableFrame>
        </TableCard>
      </div>
    </DashboardLayout>
  )
}

export default RiwayatKegiatanInternal
