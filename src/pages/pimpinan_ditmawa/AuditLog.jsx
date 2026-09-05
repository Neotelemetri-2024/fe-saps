import { useEffect, useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Search, Shield, RefreshCw } from 'lucide-react'
import StatusBadge from '../../components/dashboard/StatusBadge'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import { getCurrentUser } from '../../services/authService'
import { get } from '../../services/apiClient'

function formatTanggal(value) {
  if (!value) return '-'
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '-'
    return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return '-' }
}

function mapStatus(status) {
  const s = String(status || '').toLowerCase()
  if (['berhasil', 'success', 'created', 'updated', 'deleted', 'setuju', 'disetujui', 'aktif', 'dibaca'].includes(s)) return 'disetujui'
  if (['gagal', 'error', 'failed', 'ditolak', 'invalid'].includes(s)) return 'ditolak'
  return 'pending'
}

function AuditLog() {
  const user = getCurrentUser()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [entitas, setEntitas] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  const load = () => {
    setLoading(true)
    get('/api/umum/audit-log', { limit: 200 })
      .then((res) => {
        const data = res?.data || res
        setItems(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        toast.error('Gagal memuat audit log', { description: err.message })
        setItems([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const entitasOptions = useMemo(() => [...new Set(items.map((i) => i.entitas).filter(Boolean))], [items])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((item) => {
      if (entitas && item.entitas !== entitas) return false
      if (!q) return true
      return (
        (item.aksi || '').toLowerCase().includes(q) ||
        (item.entitas || '').toLowerCase().includes(q) ||
        String(item.entitasId || '').includes(q) ||
        (item.aktor?.nama || '').toLowerCase().includes(q)
      )
    })
  }, [items, search, entitas])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageItems = filtered.slice(start, start + PAGE_SIZE)

  const columns = useMemo(() => [
    { key: 'no', label: 'No', render: (_, i) => <span className="text-black">{start + i + 1}</span> },
    { key: 'waktu', label: 'Waktu', render: (row) => <span className="text-black">{formatTanggal(row.createdAt)}</span> },
    { key: 'entitas', label: 'Entitas', render: (row) => (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#f0f4f8] px-2.5 py-0.5 text-xs font-medium text-[#333]">
        <Shield className="h-3 w-3" /> {row.entitas || '-'}
      </span>
    )},
    { key: 'aksi', label: 'Aksi', render: (row) => <span className="font-medium text-black">{row.aksi || '-'}</span> },
    { key: 'entitasId', label: 'ID', render: (row) => <span className="text-black">{row.entitasId || '-'}</span> },
    { key: 'status', label: 'Status', render: (row) => {
      const status = row.statusBaru ? mapStatus(row.statusBaru) : row.statusLama ? 'pending' : 'disetujui'
      return <StatusBadge status={status} />
    }},
    { key: 'aktor', label: 'Aktor', render: (row) => <span className="text-black">{row.aktor?.nama || row.aktorId || '-'}</span> },
    { key: 'perubahan', label: 'Perubahan', render: (row) => (
      <div className="max-w-[200px] truncate text-xs text-[#616161]">
        {row.statusLama && row.statusBaru ? `${row.statusLama} -> ${row.statusBaru}` : row.statusBaru || row.statusLama || '-'}
      </div>
    )},
  ], [start])

  return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-[#222] sm:text-3xl">Audit Log</h2>
            <p className="mt-1 text-sm text-[#616161]">Jejak riwayat aktivitas seluruh pengguna sistem.</p>
          </div>
          <button type="button" onClick={load}
            className="inline-flex items-center gap-2 rounded-lg border border-brand-dark bg-white px-4 py-2.5 text-sm font-semibold text-brand-dark transition hover:bg-[#f5f6f8]">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        <TableCard title="Riwayat Aktivitas">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#cfd6df] bg-white px-4 py-2.5 shadow-sm">
              <Search className="h-4 w-4 shrink-0 text-[#9aa0a6]" />
              <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Cari aksi, entitas, atau aktor..."
                className="w-full text-sm outline-none" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select value={entitas} onChange={(e) => { setEntitas(e.target.value); setPage(1) }}
              className="min-w-0 flex-1 rounded-lg border border-[#d9dce7] bg-white px-4 py-2.5 text-sm text-[#616161] outline-none">
              <option value="">Semua Entitas</option>
              {entitasOptions.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
            {(search || entitas) && (
              <button type="button" onClick={() => { setSearch(''); setEntitas(''); setPage(1) }}
                className="rounded-lg border border-brand-dark bg-white px-4 py-2 text-sm font-medium text-brand-dark outline-none transition hover:bg-[#f5f6f8]">
                Reset filter
              </button>
            )}
          </div>
          <TableFrame>
            <DataTable
              loading={loading}
              data={pageItems}
              emptyText="Tidak ada data audit log."
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
              columns={columns}
            />
          </TableFrame>
        </TableCard>
      </div>
  )
}

export default AuditLog
