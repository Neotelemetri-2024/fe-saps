import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Search, Eye, Pencil, Plus, RefreshCw, Trash2, Users } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import KegiatanCell from '../../components/dashboard/KegiatanCell'
import ConfirmModal from '../../components/ui/ConfirmModal'
import InfoTooltip from '../../components/ui/InfoTooltip'
import ActionMenu from '../../components/ui/ActionMenu'
import { getCurrentUser } from '../../services/authService'
import { statusOptionsFromRows } from '../../utils/statusFilter'
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
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterKategori, setFilterKategori] = useState('')
  const [filterSkala, setFilterSkala] = useState('')
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.filter((item) => {
      if (filterStatus && statusLower(item) !== filterStatus) return false
      if (filterKategori && labelOf(item.kategori || item.jenis) !== filterKategori) return false
      if (filterSkala && labelOf(item.skala) !== filterSkala) return false
      if (!q) return true
      return (
        (item.nama || '').toLowerCase().includes(q) ||
        labelOf(item.kategori).toLowerCase().includes(q) ||
        labelOf(item.jenis).toLowerCase().includes(q)
      )
    })
  }, [data, search, filterStatus, filterKategori, filterSkala])

  const kategoriOptions = useMemo(() => {
    return [...new Set(data.map((item) => labelOf(item.kategori || item.jenis)).filter((k) => k && k !== '-'))].sort()
  }, [data])

  const skalaOptions = useMemo(() => {
    return [...new Set(data.map((item) => labelOf(item.skala)).filter((s) => s && s !== '-'))].sort()
  }, [data])

  const statusOptions = useMemo(
    () => statusOptionsFromRows(data.map((item) => ({ status: statusLower(item) })), 'status'),
    [data],
  )

  const columns = [
    {
      key: 'no',
      label: 'No',
      render: (_item, index) => (
        <span className="text-black">
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
        <span className="text-black">
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
        <span className="text-black">
          {labelOf(item.skala)}
        </span>
      ),
    },
    {
      key: 'tanggal',
      label: 'Tanggal',
      render: (item) => (
        <span className="text-black">
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
        <ActionMenu
          items={[
            {
              label: 'Detail',
              icon: <Eye className="h-4 w-4" />,
              color: 'text-blue-600',
              onClick: () => navigate(`/operator_ukm/daftar-kegiatan/${item.id}`),
            },
            {
              label: 'Manajemen Peserta',
              icon: <Users className="h-4 w-4" />,
              color: 'text-yellow-600',
              disabled: !bisaPeserta(item),
              onClick: () => navigate(`/operator_ukm/daftar-kegiatan/${item.id}/manajemen-peserta`),
            },
            {
              label: 'Edit',
              icon: <Pencil className="h-4 w-4" />,
              color: 'text-yellow-600',
              disabled: !bisaEdit(item),
              onClick: () => navigate('/operator_ukm/buat-kegiatan', { state: { edit: item } }),
            },
            {
              label: 'Ajukan Ulang',
              icon: <RefreshCw className="h-4 w-4" />,
              color: 'text-amber-600',
              disabled: !bisaAjukanUlang(item) || actionLoading,
              onClick: () => setKonfirmasi({ type: 'ajukan', id: item.id }),
            },
            {
              label: 'Hapus',
              icon: <Trash2 className="h-4 w-4" />,
              color: 'text-red-500',
              disabled: !bisaHapus(item) || actionLoading,
              onClick: () => setKonfirmasi({ type: 'hapus', id: item.id }),
            },
          ]}
        />
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
              <select value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-[#d9dce7] px-3 py-2 text-sm text-[#444] outline-none">
                <option value="">Semua Kategori</option>
                {kategoriOptions.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-[#d9dce7] px-3 py-2 text-sm text-[#444] outline-none">
                <option value="">Semua Status</option>
                {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <select value={filterSkala} onChange={(e) => setFilterSkala(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-[#d9dce7] px-3 py-2 text-sm text-[#444] outline-none">
                <option value="">Semua Skala</option>
                {skalaOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {(search || filterStatus || filterKategori || filterSkala) && (
                <button type="button" onClick={() => { setSearch(''); setFilterStatus(''); setFilterKategori(''); setFilterSkala('') }} className="rounded-lg border border-brand-dark bg-white px-3 py-2 text-sm font-medium text-brand-dark transition hover:bg-[#f5f5f5]">Reset Filter</button>
              )}
            </div>
          </div>
          <TableFrame>
            <DataTable
              loading={loading}
              data={filtered}
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