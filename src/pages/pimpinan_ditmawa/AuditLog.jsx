import { useEffect, useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Search, RefreshCw } from 'lucide-react'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import { get } from '../../services/apiClient'

function formatTanggal(value) {
  if (!value) return '—'
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

function perubahanText(row) {
  if (row.statusLama && row.statusBaru) return `${row.statusLama} → ${row.statusBaru}`
  return row.statusBaru || row.statusLama || '—'
}

function AuditLog() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [entitas, setEntitas] = useState('')

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

  const entitasOptions = useMemo(
    () => [...new Set(items.map((i) => i.entitas).filter(Boolean))],
    [items],
  )

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items
      .filter((item) => {
        if (entitas && item.entitas !== entitas) return false
        if (!q) return true
        return (
          (item.aksi || '').toLowerCase().includes(q) ||
          (item.entitas || '').toLowerCase().includes(q) ||
          String(item.entitasId || '').includes(q) ||
          (item.aktor?.nama || '').toLowerCase().includes(q)
        )
      })
      .map((item, i) => ({ ...item, no: i + 1 }))
  }, [items, search, entitas])

  const hasFilter = Boolean(search || entitas)

  const columns = useMemo(() => [
    { key: 'no', label: 'No', width: '64px' },
    {
      key: 'waktu',
      label: 'Waktu',
      render: (row) => formatTanggal(row.createdAt),
    },
    {
      key: 'aktor',
      label: 'Aktor',
      render: (row) => row.aktor?.nama || row.aktorId || '—',
    },
    {
      key: 'aksi',
      label: 'Aksi',
      render: (row) => row.aksi || '—',
    },
    {
      key: 'entitas',
      label: 'Entitas',
      render: (row) => {
        const id = row.entitasId ? ` #${row.entitasId}` : ''
        return `${row.entitas || '—'}${id}`
      },
    },
    {
      key: 'perubahan',
      label: 'Perubahan',
      render: (row) => <span className="text-base-content/70">{perubahanText(row)}</span>,
    },
  ], [])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold text-base-content">Audit log</h2>
        <p className="mt-1 text-sm text-base-content/60">
          Jejak aktivitas pengguna di sistem.
        </p>
      </div>

      <TableCard
        title="Riwayat aktivitas"
        description={loading ? undefined : `${rows.length} catatan`}
        headerRight={(
          <button type="button" onClick={load} className="btn btn-ghost btn-sm">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Muat ulang
          </button>
        )}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="input input-sm flex-1">
            <Search className="h-4 w-4 opacity-50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari aksi, entitas, atau aktor"
            />
          </label>
          <select
            value={entitas}
            onChange={(e) => setEntitas(e.target.value)}
            className="select select-sm sm:w-52"
          >
            <option value="">Semua entitas</option>
            {entitasOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          {hasFilter ? (
            <button
              type="button"
              onClick={() => { setSearch(''); setEntitas('') }}
              className="btn btn-ghost btn-sm"
            >
              Reset
            </button>
          ) : null}
        </div>

        <TableFrame>
          <DataTable
            loading={loading}
            data={rows}
            emptyText="Tidak ada data audit log."
            pageSize={20}
            columns={columns}
          />
        </TableFrame>
      </TableCard>
    </div>
  )
}

export default AuditLog
