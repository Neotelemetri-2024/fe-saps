import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Eye, Pencil, Plus, RefreshCw, Trash2, Users } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import KegiatanCell from '../../components/dashboard/KegiatanCell'
import ConfirmModal from '../../components/ui/ConfirmModal'
import InfoTooltip from '../../components/ui/InfoTooltip'
import { getCurrentUser } from '../../services/authService'
import {
  getKegiatan,
  ajukanKegiatan,
  deleteKegiatan,
  importPesertaCSV,
} from '../../services/kegiatanService'

function labelOf(value) {
  if (value == null || value === '') return '-'

  if (typeof value === 'object') {
    return value.nama || value.name || '-'
  }

  return String(value)
}

function formatTanggal(value) {
  if (!value) return '-'

  const date = value instanceof Date
    ? value
    : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function DaftarKegiatan() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const fileRef = useRef(null)

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [konfirmasi, setKonfirmasi] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const load = () => {
    setLoading(true)

    getKegiatan()
      .then((response) => {
        setData(
          Array.isArray(response)
            ? response
            : []
        )
      })
      .catch(() => {
        setData([])
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    load()
  }, [])

  const statusLower = (item) => {
    return String(item?.status || '').toLowerCase()
  }

  const bisaEdit = (item) => {
    return [
      'draft',
      'perlu_revisi',
    ].includes(statusLower(item))
  }

  const bisaHapus = (item) => {
    return [
      'draft',
      'perlu_revisi',
      'ditolak',
    ].includes(statusLower(item))
  }

  const bisaAjukanUlang = (item) => {
    return statusLower(item) === 'perlu_revisi'
  }

  const bisaPeserta = (item) => {
    return statusLower(item) !== 'draft'
  }

  const handleAjukan = async (id) => {
    setActionLoading(true)

    try {
      await ajukanKegiatan(id)

      toast.success('Kegiatan berhasil dikirim')
      load()
    } catch (error) {
      toast.error('Gagal', {
        description: error.message,
      })
    } finally {
      setActionLoading(false)
      setKonfirmasi(null)
    }
  }

  const handleHapus = async (id) => {
    setActionLoading(true)

    try {
      await deleteKegiatan(id)

      toast.success('Kegiatan dihapus')
      load()
    } catch (error) {
      toast.error('Gagal hapus', {
        description: error.message,
      })
    } finally {
      setActionLoading(false)
      setKonfirmasi(null)
    }
  }

  const handleImportCSV = async (
    kegiatanId,
    file
  ) => {
    try {
      await importPesertaCSV(
        kegiatanId,
        file
      )

      toast.success(
        'Import peserta berhasil'
      )
    } catch (error) {
      toast.error('Gagal import', {
        description: error.message,
      })
    }
  }

  const confirmMessage = () => {
    if (konfirmasi?.type === 'ajukan') {
      return 'Ajukan ulang kegiatan ini setelah revisi?'
    }

    return 'Hapus kegiatan draft ini secara permanen?'
  }

  const confirmText = () => {
    if (konfirmasi?.type === 'ajukan') {
      return actionLoading
        ? 'Mengajukan…'
        : 'Ya, Ajukan Ulang'
    }

    return actionLoading
      ? 'Menghapus…'
      : 'Ya, Hapus'
  }

  const onConfirm = () => {
    if (!konfirmasi || actionLoading) return

    if (konfirmasi.type === 'ajukan') {
      handleAjukan(konfirmasi.id)
      return
    }

    handleHapus(konfirmasi.id)
  }

  const columns = [
    {
      key: 'no',
      label: 'No',
      render: (_item, index) => (
        <span className="text-[#616161]">
          {index + 1}
        </span>
      ),
    },
    {
      key: 'nama',
      label: 'Nama Kegiatan',
      render: (item) => (
        <KegiatanCell
          nama={
            item.nama ||
            item.judul ||
            '-'
          }
          tanggal={formatTanggal(
            item.diajukanPada ||
            item.createdAt
          )}
        />
      ),
    },
    {
      key: 'jenis',
      label: 'Jenis',
      render: (item) => (
        <span className="text-[#616161]">
          {labelOf(
            item.jenis ||
            item.kategori
          )}
        </span>
      ),
    },
    {
      key: 'skala',
      label: 'Skala',
      render: (item) => (
        <span className="text-[#616161]">
          {labelOf(item.skala)}
        </span>
      ),
    },
    {
      key: 'tanggal',
      label: 'Tanggal',
      render: (item) => (
        <span className="text-[#616161]">
          {formatTanggal(
            item.tanggalMulai ||
            item.tanggal ||
            item.tgl
          )}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <StatusBadge status={item.status} />
      ),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      stopPropagation: true,
      render: (item) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            title="Detail"
            onClick={() =>
              navigate(
                `/operator_ukm/daftar-kegiatan/${item.id}`
              )
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-400 bg-blue-50 text-blue-600 transition hover:bg-blue-500 hover:text-white"
          >
            <Eye className="h-4 w-4" />
          </button>

          <button
            type="button"
            title="Manajemen Peserta"
            onClick={() =>
              navigate(
                `/operator_ukm/daftar-kegiatan/${item.id}/manajemen-peserta`
              )
            }
            disabled={!bisaPeserta(item)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-yellow-400 bg-amber-50 text-yellow-600 transition hover:bg-yellow-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Users className="h-4 w-4" />
          </button>

          <button
            type="button"
            title="Edit"
            onClick={() =>
              navigate(
                '/operator_ukm/buat-kegiatan',
                {
                  state: {
                    edit: item,
                  },
                }
              )
            }
            disabled={!bisaEdit(item)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-yellow-400 bg-amber-50 text-yellow-600 transition hover:bg-yellow-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Pencil className="h-4 w-4" />
          </button>

          <button
            type="button"
            title="Ajukan Ulang"
            onClick={() =>
              setKonfirmasi({
                type: 'ajukan',
                id: item.id,
              })
            }
            disabled={
              !bisaAjukanUlang(item) ||
              actionLoading
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-400 bg-amber-50 text-amber-600 transition hover:bg-amber-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          <button
            type="button"
            title="Hapus"
            onClick={() =>
              setKonfirmasi({
                type: 'hapus',
                id: item.id,
              })
            }
            disabled={
              !bisaHapus(item) ||
              actionLoading
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-400 bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <DashboardLayout
      role="operator_ukm"
      userName={
        user?.nama || 'Operator UKM'
      }
      userRole="Operator UKM"
    >
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-2xl font-extrabold text-[#222] sm:text-3xl">
                Daftar Kegiatan
              </h2>
              <InfoTooltip message={<>Kegiatan berstatus <strong>draft</strong> dapat diedit atau dihapus. Setelah <strong>Kirim</strong>, kegiatan tidak dapat diedit.</>} />
            </div>

            <p className="mt-1 text-sm text-[#616161]">
              Simpan draft terlebih dahulu,
              lalu kirim ke Admin Ditmawa
              setelah siap.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate(
                '/operator_ukm/buat-kegiatan'
              )
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 sm:w-auto"
          >
            <Plus className="h-4 w-4" /> Buat Kegiatan
          </button>
        </div>

        <TableCard title="Kegiatan Saya">
          <TableFrame>
            <DataTable
              loading={loading}
              data={data}
              emptyText="Belum ada kegiatan."
              columns={columns}
            />
          </TableFrame>
        </TableCard>

        <ConfirmModal
          isOpen={Boolean(konfirmasi)}
          message={confirmMessage()}
          confirmText={confirmText()}
          cancelText="Batal"
          onConfirm={onConfirm}
          onCancel={() => {
            if (!actionLoading) {
              setKonfirmasi(null)
            }
          }}
        />

        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(event) => {
            const file =
              event.target.files?.[0]

            if (
              file &&
              fileRef.current?._kegiatanId
            ) {
              handleImportCSV(
                fileRef.current._kegiatanId,
                file
              )
            }

            event.target.value = ''
          }}
        />
      </div>
    </DashboardLayout>
  )
}

export default DaftarKegiatan