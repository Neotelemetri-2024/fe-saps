import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Clock, Eye, Search } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import DataTable from '../../components/dashboard/DataTable'
import KegiatanCell from '../../components/dashboard/KegiatanCell'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import { subscribeDataUpdate } from '../../services/pengajuanService'
import { getKegiatanVerifikasi } from '../../services/kegiatanService'
import { getCurrentUser } from '../../services/authService'
import ActionMenu from '../../components/ui/ActionMenu'
import InfoTooltip from '../../components/ui/InfoTooltip'
import { statusOptionsFromRows } from '../../utils/statusFilter'

function normalizeKegiatan(k) {
  const pembuat = k.pembuat || {}
  const mhs = pembuat.mahasiswa || {}
  // isUlang: pernah ada approval dengan keputusan perlu_revisi sebelumnya
  const approvals = Array.isArray(k.kegiatanApproval) ? k.kegiatanApproval : []
  const isUlang = approvals.some((a) => a.keputusan === 'revisi')
  return {
    id: k.id,
    namaMahasiswa: pembuat.nama || '-',
    nim: mhs.nim || '-',
    prodi: mhs.prodi?.nama || '-',
    kegiatan: k.nama || '-',
    kategori: k.kategori?.nama || '-',
    skala: k.skala?.nama?.toLowerCase() || '',
    tanggal: k.tanggalMulai
      ? new Date(k.tanggalMulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      : '-',
    dibuatPada: k.createdAt || k.tanggalMulai,
    diajukanPada: k.createdAt
      ? new Date(k.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      : '-',
    status: k.status,
    isUlang,
    penyelenggara: k.penyelenggaraExt || '-',
    deskripsi: k.deskripsi || '',
  }
}

const PAGE_SIZE = 10

const SKALA_LABEL = {
  internasional: 'Internasional',
  nasional: 'Nasional',
  regional: 'Regional',
  lokal: 'Internal (UNAND)',
}

function VerifikasiPengajuanEksternal() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [kategori, setKategori] = useState('')
  const [status, setStatus] = useState('')
  const [skala, setSkala] = useState('')
  const [page, setPage] = useState(1)
  const [userName, setUserName] = useState('Admin Ditmawa')

  // Pilih Beberapa state
  const [pilihanMode, setPilihanMode] = useState(false)
  const [selected, setSelected] = useState(new Set())

  const handleLanjutKePemetaan = () => {
    const ids = [...selected].filter((id) => items.find((i) => i.id === id)?.status === 'diajukan')
    if (ids.length === 0) {
      toast.error('Pilih minimal satu pengajuan berstatus Diajukan.')
      return
    }
    navigate('/admin_ditmawa/pemetaan-capaian-massal', { state: { kegiatanIds: ids } })
  }

  const load = () => {
    setLoading(true)
    getKegiatanVerifikasi({ asal: 'eksternal', limit: 100 })
      .then((res) => {
        const raw = Array.isArray(res) ? res : (res?.data || [])
        setItems(raw.map(normalizeKegiatan))
      })
      .catch((err) => toast.error('Gagal memuat data', { description: err.message }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    const u = getCurrentUser()
    if (u?.nama) setUserName(u.nama)
    return subscribeDataUpdate((detail) => {
      if (!detail?.type || detail.type === 'pengajuan') load()
    })
  }, [])

  const kategoriOptions = useMemo(() => {
    const set = new Set(items.map((i) => i.kategori).filter(Boolean))
    return [...set]
  }, [items])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((item) => {
      if (status && item.status !== status) return false
      if (kategori && item.kategori !== kategori) return false
      if (skala && item.skala !== skala) return false
      if (!q) return true
      return (
        (item.namaMahasiswa || '').toLowerCase().includes(q) ||
        (item.nim || '').toLowerCase().includes(q) ||
        (item.kegiatan || '').toLowerCase().includes(q) ||
        (item.kategori || '').toLowerCase().includes(q) ||
        (item.prodi || '').toLowerCase().includes(q)
      )
    })
  }, [items, search, kategori, status, skala])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageItems = filtered.slice(start, start + PAGE_SIZE)
  const statusOptions = useMemo(() => statusOptionsFromRows(items, 'status'), [items])
  const resetFilter = () => {
    setSearch('')
    setKategori('')
    setStatus('')
    setSkala('')
    setPage(1)
  }

  const togglePilihanMode = () => {
    setPilihanMode((v) => !v)
    setSelected(new Set())
  }

  const toggleSelect = (id) => {
    const item = items.find((i) => i.id === id)
    if (item && item.status !== 'diajukan') {
      toast.error('Hanya pengajuan berstatus Diajukan yang dapat dipilih.')
      return
    }
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const centangSemua = () => {
    const selectableItems = pageItems.filter((i) => i.status === 'diajukan')
    const allSelected = selectableItems.length > 0 && selectableItems.every((i) => selected.has(i.id))
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(selectableItems.map((i) => i.id)))
    }
  }

  const columns = useMemo(() => [
    { key: 'no', label: 'No', render: (row) => <span className="text-[#616161]">{start + pageItems.indexOf(row) + 1}</span> },
    { key: 'mahasiswa', label: 'Mahasiswa', render: (row) => (
      <div className="flex flex-col gap-0.5">
        <p className="font-bold uppercase text-[#333]">{row.namaMahasiswa || '-'}</p>
        <p className="text-sm font-medium text-orange-500">{row.nim || '-'}</p>
        <p className="text-sm text-sky-500">{row.prodi || '-'}</p>
      </div>
    )},
    { key: 'kegiatan', label: 'Kegiatan', render: (row) => <KegiatanCell nama={row.kegiatan || '-'} tanggal={row.diajukanPada} /> },
    { key: 'kategori', label: 'Kategori', render: (row) => <span className="text-[#616161]">{row.kategori || '-'}</span> },
    { key: 'tanggal', label: 'Tanggal', render: (row) => <span className="text-[#616161]">{row.tanggal || '-'}</span> },
    { key: 'status', label: 'Status', render: (row) =>
      row.isUlang && row.status === 'diajukan' ? (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">Diajukan Ulang</span>
      ) : row.status === 'disetujui' ? (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">Disetujui Pimpinan</span>
      ) : (
        <StatusBadge status={row.status} />
      )
    },
    { key: 'aksi', label: 'Aksi', stopPropagation: true, render: (row) => (
      <ActionMenu
        items={[
          {
            label: 'Detail',
            icon: <Eye className="h-4 w-4" />,
            color: 'text-blue-600',
            onClick: () => navigate(`/admin_ditmawa/verifikasi-pengajuan-eksternal/${row.id}`, { state: { item: row } }),
          },
        ]}
      />
    )},
  ], [pageItems, start, navigate])

  return (
    <DashboardLayout role="admin_ditmawa" userName={userName} userRole="Admin Ditmawa">
      <div className="space-y-5">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-2xl font-extrabold text-[#222] sm:text-3xl">
              Verifikasi Pengajuan Kegiatan Eksternal
            </h2>
            <InfoTooltip message="Pengajuan kegiatan nasional/internasional oleh mahasiswa." />
          </div>
        </div>

        <TableCard title="Daftar Pengajuan Eksternal">
          <div className="mb-3 flex flex-col gap-3 lg:flex-row">
            <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#cfd6df] bg-white px-4 py-2.5 shadow-sm">
              <Search className="h-4 w-4 shrink-0 text-[#9aa0a6]" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Cari mahasiswa atau kegiatan..."
                className="w-full text-sm outline-none"
              />
            </div>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-3">
            <select
              value={kategori}
              onChange={(e) => { setKategori(e.target.value); setPage(1) }}
              className="rounded-lg border border-[#d9dce7] bg-white px-4 py-2.5 text-sm text-[#616161] outline-none"
            >
              <option value="">Semua Kategori</option>
              {kategoriOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1) }}
              className="rounded-lg border border-[#d9dce7] bg-white px-4 py-2.5 text-sm text-[#616161] outline-none"
            >
              <option value="">Semua Status</option>
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select
              value={skala}
              onChange={(e) => { setSkala(e.target.value); setPage(1) }}
              className="rounded-lg border border-[#d9dce7] bg-white px-4 py-2.5 text-sm text-[#616161] outline-none"
            >
              <option value="">Semua Skala</option>
              {Object.entries(SKALA_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            {(search || kategori || status || skala) && (
              <button
                type="button"
                onClick={resetFilter}
                className="rounded-lg border border-brand-dark bg-white px-4 py-2 text-sm font-medium text-brand-dark outline-none transition hover:bg-[#f5f6f8]"
              >
                Reset filter
              </button>
            )}

            {/* Pilih Beberapa toggle */}
            <button
              type="button"
              onClick={togglePilihanMode}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition ${
                pilihanMode
                  ? 'bg-brand-dark'
                  : 'bg-gradient-to-r from-brand-dark to-brand-light hover:opacity-90'
              }`}
            >
              Pilih Beberapa
            </button>
          </div>

          {/* Pilih Beberapa action bar */}
          {pilihanMode && (
            <div className="mb-3 flex items-center gap-3 rounded-lg border border-[#e9ebf8] bg-[#f9fafb] px-4 py-3">
              <span className="text-sm text-[#616161]">
                {selected.size} dipilih
              </span>
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={() => { setPilihanMode(false); setSelected(new Set()) }}
                  className="rounded-lg border border-[#d9dce7] px-4 py-2 text-sm font-semibold text-[#616161] transition hover:bg-white"
                >
                  Batal Pilih
                </button>
                <button
                  type="button"
                  onClick={handleLanjutKePemetaan}
                  className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-6 py-2 text-sm font-bold text-white transition hover:opacity-90"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
          <TableFrame>
            <DataTable
              columns={columns}
              data={pageItems}
              loading={loading}
              emptyText="Belum ada pengajuan."
              selectable={pilihanMode}
              selected={selected}
              onSelect={toggleSelect}
              onSelectAll={centangSemua}
              isSelectable={(row) => row.status === 'diajukan'}
              page={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </TableFrame>
        </TableCard>
      </div>
    </DashboardLayout>
  )
}

export default VerifikasiPengajuanEksternal
