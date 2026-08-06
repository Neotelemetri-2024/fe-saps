import { useEffect, useMemo, useState } from 'react'
import { Search, History } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import KegiatanCell from '../../components/dashboard/KegiatanCell'
import { getCurrentUser } from '../../services/authService'
import { getRiwayatKegiatanInternal } from '../../services/kegiatanService'
import { statusOptionsFromRows } from '../../utils/statusFilter'

function formatTanggal(start, end) {
  if (!start) return '-'
  try {
    const opts = { day: 'numeric', month: 'short', year: 'numeric' }
    const ds = new Date(start)
    if (Number.isNaN(ds.getTime())) return '-'
    const s = ds.toLocaleDateString('id-ID', opts)
    if (!end) return s
    const de = new Date(end)
    if (Number.isNaN(de.getTime())) return s
    const e = de.toLocaleDateString('id-ID', opts)
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
  { key: 'poin', label: 'POIN', center: true },
]

function RiwayatKegiatanInternal() {
  const user = getCurrentUser()
  const [loading, setLoading] = useState(true)
  const [riwayat, setRiwayat] = useState([])
  const [search, setSearch] = useState('')
  const [filterJenis, setFilterJenis] = useState('')
  const [filterKehadiran, setFilterKehadiran] = useState('')
  const [filterPenyelenggara, setFilterPenyelenggara] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSkala, setFilterSkala] = useState('')

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
  const skalaOptions = useMemo(
    () => [...new Set(riwayat.map((r) => r.skala).filter((s) => s && s !== '-'))].sort(),
    [riwayat],
  )
  const statusOptions = useMemo(
    () => statusOptionsFromRows(riwayat, 'status'),
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
        if (filterStatus && r.status !== filterStatus) return false
        if (filterSkala && r.skala !== filterSkala) return false
        return true
      })
      .map((r, i) => ({
        ...r,
        no: i + 1,
        diajukanPada: formatTanggal(r.tanggalDiajukan || r.createdAt || r.dibuatPada),
      }))
  }, [riwayat, search, filterJenis, filterKehadiran, filterPenyelenggara, filterStatus, filterSkala])

  const resetFilter = () => {
    setSearch('')
    setFilterJenis('')
    setFilterKehadiran('')
    setFilterPenyelenggara('')
    setFilterStatus('')
    setFilterSkala('')
  }

  return (
    <DashboardLayout role="mahasiswa" userName={user?.nama || 'Mahasiswa'} userRole="Mahasiswa">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
    
          <h2 className="text-xl font-bold text-[#222] sm:text-2xl">Riwayat Kegiatan Internal</h2>
        </div>
        <p className="text-sm text-[#616161]">Rekap seluruh kegiatan internal (UKM, UKMF, dan Universitas) yang pernah Anda ikuti.</p>

        <TableCard title="Riwayat Kegiatan Internal">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative flex w-full sm:flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0a6]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kegiatan..."
                className="w-full rounded-lg border border-[#d9dce7] py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-dark"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-[#d9dce7] px-3 py-2 text-sm text-[#444] outline-none">
                <option value="">Semua Jenis</option>
                {jenisOptions.map((j) => <option key={j} value={j}>{j}</option>)}
              </select>
              <select value={filterKehadiran} onChange={(e) => setFilterKehadiran(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-[#d9dce7] px-3 py-2 text-sm text-[#444] outline-none">
                <option value="">Semua Kehadiran</option>
                <option value="Hadir">Hadir</option>
                <option value="Tidak Hadir">Tidak Hadir</option>
                <option value="Belum Tercatat">Belum Tercatat</option>
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-[#d9dce7] px-3 py-2 text-sm text-[#444] outline-none">
                <option value="">Semua Status</option>
                {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <select value={filterSkala} onChange={(e) => setFilterSkala(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-[#d9dce7] px-3 py-2 text-sm text-[#444] outline-none">
                <option value="">Semua Skala</option>
                {skalaOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filterPenyelenggara} onChange={(e) => setFilterPenyelenggara(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-[#d9dce7] px-3 py-2 text-sm text-[#444] outline-none">
                <option value="">Semua Penyelenggara</option>
                {penyelenggaraOptions.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              {(search || filterJenis || filterKehadiran || filterStatus || filterSkala || filterPenyelenggara) && (
                <button type="button" onClick={resetFilter} className="rounded-lg border border-brand-dark bg-white px-3 py-2 text-sm font-medium text-brand-dark transition hover:bg-[#f5f5f5]">Reset Filter</button>
              )}
            </div>
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
