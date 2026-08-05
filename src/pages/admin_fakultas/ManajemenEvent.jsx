import { useEffect, useMemo, useState } from 'react'
import { Search, Pencil, Plus, Trash2, Send, RefreshCw, Users } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import ConfirmModal from '../../components/ui/ConfirmModal'
import ActionMenu from '../../components/ui/ActionMenu'
import EventForm from '../../components/EventForm'
import { toast } from 'sonner'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getCurrentUser } from '../../services/authService'
import {
  getKegiatan,
  deleteKegiatan,
  ajukanKegiatan,
} from '../../services/kegiatanService'
import { statusOptionsFromRows } from '../../utils/statusFilter'

const statusStyle = {
  Draft: 'bg-gray-100 text-gray-700 border border-gray-300',
  'Disetujui Pimpinan':
    'bg-green-100 text-green-700 border border-green-300',
  Pending: 'bg-yellow-100 text-yellow-600 border border-yellow-300',
  Ditolak: 'bg-red-100 text-red-600 border border-red-300',
  Revisi: 'bg-orange-100 text-orange-600 border border-orange-300',
  Aktif: 'bg-green-100 text-green-700 border border-green-300',
}

const PAGE_SIZE = 10

function mapStatusLabel(status) {
  const s = String(status || '').toLowerCase()

  if (s === 'draft') return 'Draft'

  if (['disetujui', 'terpublikasi'].includes(s)) {
    return 'Disetujui Pimpinan'
  }

  if (['diajukan', 'terverifikasi'].includes(s)) {
    return 'Pending'
  }

  if (s === 'ditolak') return 'Ditolak'

  if (['perlu_revisi', 'revisi'].includes(s)) {
    return 'Revisi'
  }

  return status || 'Pending'
}

function formatTanggal(start, end) {
  if (!start) return '-'

  try {
    const tanggalMulai = new Date(start).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

    if (!end) return tanggalMulai

    const tanggalSelesai = new Date(end).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

    return `${tanggalMulai} – ${tanggalSelesai}`
  } catch {
    return String(start)
  }
}

function normalizeEvent(item) {
  const rawStatus = String(item.status || '').toLowerCase()
  const pesertaCount = item._count?.partisipasi ?? 0

  return {
    id: item.id,
    kegiatan: item.nama || '-',
    submitted: item.createdAt
      ? new Date(item.createdAt).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '-',
    kategori: item.kategori?.nama || '-',
    skala: item.skala?.nama || '-',
    tanggal: formatTanggal(item.tanggalMulai, item.tanggalSelesai),
    peserta: pesertaCount || item.kuota || '-',
    status: mapStatusLabel(item.status),
    rawStatus,
  }
}

function ManajemenEvent() {
  const navigate = useNavigate()
  const user = getCurrentUser()

  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSkala, setFilterSkala] = useState('')

  const [deleteId, setDeleteId] = useState(null)
  const [kirimTarget, setKirimTarget] = useState(null)
  const [page, setPage] = useState(1)

  /*
   * Mode dan target edit disimpan dalam URL:
   * ?mode=create
   * ?mode=edit&id=1
   */
  const modeParam = searchParams.get('mode')
  const editIdParam = searchParams.get('id')

  const mode =
    modeParam === 'create' || modeParam === 'edit'
      ? modeParam
      : 'list'

  const editTarget =
    mode === 'edit' && editIdParam
      ? { id: Number(editIdParam) }
      : null

  const goToCreate = () => {
    setSearchParams({ mode: 'create' })
  }

  const goToEdit = (row) => {
    setSearchParams({
      mode: 'edit',
      id: String(row.id),
    })
  }

  const goToList = () => {
    setSearchParams({})
  }

  const load = () => {
    setLoading(true)

    getKegiatan()
      .then((res) => {
        const list = Array.isArray(res) ? res : []

        /*
         * Hanya event yang dibuat langsung oleh Admin Fakultas.
         * Event dari operator UKMF tidak ditampilkan.
         */
        const eventAdmin = list.filter((item) => {
          const asal = String(item.asal || '').toLowerCase()

          return (
            asal === 'kurikuler_ukmf' &&
            !item.organisasiId
          )
        })

        setData(eventAdmin.map(normalizeEvent))
      })
      .catch((err) => {
        setData([])

        toast.error('Gagal memuat event', {
          description: err.message,
        })
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    load()
  }, [])

  const kategoriOptions = useMemo(() => {
    return [...new Set(data.map((item) => item.kategori).filter(Boolean))]
  }, [data])

  const skalaOptions = useMemo(() => {
    return [...new Set(data.map((item) => item.skala).filter(Boolean))]
  }, [data])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return data.filter((event) => {
      if (
        q &&
        !event.kegiatan.toLowerCase().includes(q)
      ) {
        return false
      }

      if (
        filterKategori &&
        event.kategori !== filterKategori
      ) {
        return false
      }

      if (
        filterStatus &&
        event.status !== filterStatus
      ) {
        return false
      }

      if (
        filterSkala &&
        event.skala !== filterSkala
      ) {
        return false
      }

      return true
    })
  }, [
    data,
    search,
    filterKategori,
    filterStatus,
    filterSkala,
  ])

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE)
  )

  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE

  const statusOptions = useMemo(() => statusOptionsFromRows(data, 'status'), [data])

  const pageItems = filtered.slice(
    start,
    start + PAGE_SIZE
  )

  const resetFilter = () => {
    setSearch('')
    setFilterKategori('')
    setFilterStatus('')
    setFilterSkala('')
    setPage(1)
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await deleteKegiatan(deleteId)

      setDeleteId(null)
      toast.success('Event berhasil dihapus.')
      load()
    } catch (err) {
      toast.error('Gagal menghapus', {
        description: err.message,
      })
    }
  }

  const handleKirim = async () => {
    if (!kirimTarget) return

    try {
      await ajukanKegiatan(kirimTarget.id)

      toast.success('Event dikirim ke Pimpinan')
      setKirimTarget(null)
      load()
    } catch (err) {
      toast.error('Gagal kirim', {
        description: err.message,
      })
    }
  }

  const bisaEdit = (event) => {
    return ['draft', 'perlu_revisi'].includes(
      event.rawStatus
    )
  }

  const bisaHapus = (event) => {
    return [
      'draft',
      'perlu_revisi',
      'ditolak',
    ].includes(event.rawStatus)
  }

  const bisaKirim = (event) => {
    return (
      event.rawStatus === 'draft' ||
      event.rawStatus === 'perlu_revisi'
    )
  }

  const bisaPeserta = (event) => {
    return [
      'disetujui',
      'terpublikasi',
    ].includes(event.rawStatus)
  }

  const columns = useMemo(
    () => [
      {
        key: 'no',
        label: 'NO',
        render: (row) => (
          <span className="text-[#616161]">
            {start + pageItems.indexOf(row) + 1}
          </span>
        ),
      },
      {
        key: 'kegiatan',
        label: 'NAMA KEGIATAN',
        render: (row) => (
          <div>
            <p className="font-medium text-[#222]">
              {row.kegiatan}
            </p>

            {row.submitted &&
              row.submitted !== '-' && (
                <p className="mt-0.5 text-xs text-[#616161]">
                  Diajukan: {row.submitted}
                </p>
              )}
          </div>
        ),
      },
      {
        key: 'kategori',
        label: 'KATEGORI',
        render: (row) => (
          <span className="text-[#616161]">
            {row.kategori}
          </span>
        ),
      },
      {
        key: 'skala',
        label: 'SKALA',
        render: (row) => (
          <span className="text-[#616161]">
            {row.skala}
          </span>
        ),
      },
      {
        key: 'tanggal',
        label: 'TANGGAL',
        render: (row) => (
          <span className="text-[#616161]">
            {row.tanggal}
          </span>
        ),
      },
      {
        key: 'peserta',
        label: 'PESERTA',
        render: (row) => (
          <span className="text-[#616161]">
            {row.peserta}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'STATUS',
        render: (row) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              statusStyle[row.status] ?? ''
            }`}
          >
            {row.status}
          </span>
        ),
      },
      {
        key: 'aksi',
        label: 'AKSI',
        stopPropagation: true,
        render: (row) => (
          <ActionMenu
            items={[
              bisaKirim(row)
                ? {
                    label: row.rawStatus === 'perlu_revisi' ? 'Ajukan Ulang' : 'Kirim',
                    icon: row.rawStatus === 'perlu_revisi' ? <RefreshCw className="h-4 w-4" /> : <Send className="h-4 w-4" />,
                    color: row.rawStatus === 'perlu_revisi' ? 'text-amber-600' : 'text-brand-dark',
                    onClick: () => setKirimTarget(row),
                  }
                : null,
              {
                label: 'Manajemen Peserta',
                icon: <Users className="h-4 w-4" />,
                color: 'text-blue-600',
                disabled: !bisaPeserta(row),
                onClick: () => navigate(`/admin_fakultas/manajemen-event/${row.id}/peserta`),
              },
              {
                label: 'Edit',
                icon: <Pencil className="h-4 w-4" />,
                color: 'text-yellow-600',
                disabled: !bisaEdit(row),
                onClick: () => goToEdit(row),
              },
              {
                label: 'Hapus',
                icon: <Trash2 className="h-4 w-4" />,
                color: 'text-red-500',
                disabled: !bisaHapus(row),
                onClick: () => setDeleteId(row.id),
              },
            ]}
          />
        ),
      },
    ],
    [pageItems, start, navigate]
  )

  if (mode === 'create' || mode === 'edit') {
    return (
      <DashboardLayout
        role="admin_fakultas"
        userName={user?.nama || 'Admin Fakultas'}
        userRole="Admin Fakultas"
      >
        <EventForm
          editItem={
            mode === 'edit'
              ? editTarget
              : null
          }
          asal="kurikuler_ukmf"
          onCancel={goToList}
          onSaved={() => {
            goToList()
            load()
          }}
        />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      role="admin_fakultas"
      userName={user?.nama || 'Admin Fakultas'}
      userRole="Admin Fakultas"
    >
      <ConfirmModal
        isOpen={deleteId !== null}
        message="Apakah kamu yakin ingin menghapus event ini?"
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmModal
        isOpen={Boolean(kirimTarget)}
        message="Setelah dikirim, kegiatan tidak dapat diedit. Lanjutkan?"
        confirmText={
          kirimTarget?.rawStatus === 'perlu_revisi'
            ? 'Ya, Ajukan Ulang'
            : 'Ya, Kirim'
        }
        cancelText="Batal"
        onConfirm={handleKirim}
        onCancel={() => setKirimTarget(null)}
      />

      <div className="space-y-4 sm:space-y-6">
        {/* Header halaman */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[#222] sm:text-2xl lg:text-3xl">
              Event Fakultas
            </h2>

            <p className="mt-1 text-sm text-[#616161]">
              Kelola event yang dibuat Admin Fakultas:
              buat, kirim, dan verifikasi pendaftaran
              peserta.
            </p>
          </div>

          <button
            type="button"
            onClick={goToCreate}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90 sm:w-auto"
          >
            <Plus className="h-4 w-4" /> Buat Event
          </button>
        </div>

        {/*
         * CARD PUTIH
         * Filter dan tabel dibungkus dalam card yang sama.
         */}
        <TableCard title="Daftar Event Fakultas">
          {/* Filter */}
          <div className="mt-4 flex flex-col gap-3 sm:mt-6 lg:flex-row lg:flex-wrap lg:items-center">
            {/* Pencarian */}
            <div className="relative w-full min-w-[200px] lg:flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0a6]" />

              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
                placeholder="Cari nama kegiatan..."
                className="w-full rounded-lg border border-[#e9ebf8] bg-white py-2.5 pl-9 pr-3 text-sm text-[#333] outline-none transition placeholder:text-[#9aa0a6] focus:border-brand-dark focus:ring-1 focus:ring-brand-dark"
              />
            </div>

            {/* Pilihan filter */}
            <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
              <select
                value={filterKategori}
                onChange={(event) => {
                  setFilterKategori(event.target.value)
                  setPage(1)
                }}
                className="min-w-[130px] flex-1 rounded-lg border border-[#e9ebf8] bg-white px-3 py-2.5 text-xs text-[#444] outline-none transition focus:border-brand-dark sm:text-sm lg:flex-none"
              >
                <option value="">Semua Kategori</option>

                {kategoriOptions.map((kategori) => (
                  <option
                    key={kategori}
                    value={kategori}
                  >
                    {kategori}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(event) => {
                  setFilterStatus(event.target.value)
                  setPage(1)
                }}
                className="min-w-[120px] flex-1 rounded-lg border border-[#e9ebf8] bg-white px-3 py-2.5 text-xs text-[#444] outline-none transition focus:border-brand-dark sm:text-sm lg:flex-none"
              >
                <option value="">Semua Status</option>
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>

              <select
                value={filterSkala}
                onChange={(event) => {
                  setFilterSkala(event.target.value)
                  setPage(1)
                }}
                className="min-w-[120px] flex-1 rounded-lg border border-[#e9ebf8] bg-white px-3 py-2.5 text-xs text-[#444] outline-none transition focus:border-brand-dark sm:text-sm lg:flex-none"
              >
                <option value="">Semua Skala</option>

                {skalaOptions.map((skala) => (
                  <option
                    key={skala}
                    value={skala}
                  >
                    {skala}
                  </option>
                ))}
              </select>

              {(search ||
                filterKategori ||
                filterStatus ||
                filterSkala) && (
                <button
                  type="button"
                  onClick={resetFilter}
                  className="rounded-lg border border-brand-dark bg-white px-3 py-2.5 text-xs font-medium text-brand-dark transition hover:bg-[#f5f5f5] sm:text-sm"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>

          {/* Tabel */}
          <TableFrame>
            <DataTable
              columns={columns}
              data={pageItems}
              loading={loading}
              emptyText="Tidak ada event ditemukan."
              page={currentPage}
              totalPages={totalPages}
              onPageChange={(newPage) => {
                setPage(newPage)
              }}
            />
          </TableFrame>
        </TableCard>
      </div>
    </DashboardLayout>
  )
}

export default ManajemenEvent