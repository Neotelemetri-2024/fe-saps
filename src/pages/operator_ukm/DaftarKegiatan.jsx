import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Eye, Pencil, Plus, RefreshCw, Send, Trash2, Users } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import DataTable from '../../components/dashboard/DataTable'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { getCurrentUser } from '../../services/authService'
import {
  getKegiatan,
  ajukanKegiatan,
  deleteKegiatan,
  importPesertaCSV,
} from '../../services/kegiatanService'

function labelOf(value) {
  if (value == null || value === '') return '-'
  if (typeof value === 'object') return value.nama || value.name || '-'
  return String(value)
}

function formatTanggal(value) {
  if (!value) return '-'
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function DaftarKegiatan() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const fileRef = useRef(null)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [konfirmasi, setKonfirmasi] = useState(null) // { type, id }
  const [actionLoading, setActionLoading] = useState(false)

  const load = () => {
    setLoading(true)
    getKegiatan()
      .then((res) => setData(Array.isArray(res) ? res : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function statusLower(item) {
    return String(item?.status || '').toLowerCase()
  }

  const bisaEdit = (item) => ['draft', 'perlu_revisi'].includes(statusLower(item))
  const bisaHapus = (item) => ['draft', 'perlu_revisi', 'ditolak'].includes(statusLower(item))
  const bisaKirim = (item) => statusLower(item) === 'draft'
  const bisaAjukanUlang = (item) => statusLower(item) === 'perlu_revisi'
  const bisaPeserta = (item) => !['draft'].includes(statusLower(item))

  const handleAjukan = async (id) => {
    setActionLoading(true)
    try {
      await ajukanKegiatan(id)
      toast.success('Kegiatan berhasil dikirim')
      load()
    } catch (err) {
      toast.error('Gagal', { description: err.message })
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
    } catch (err) {
      toast.error('Gagal hapus', { description: err.message })
    } finally {
      setActionLoading(false)
      setKonfirmasi(null)
    }
  }

  const handleImportCSV = async (kegiatanId, file) => {
    try {
      await importPesertaCSV(kegiatanId, file)
      toast.success('Import peserta berhasil')
    } catch (err) {
      toast.error('Gagal import', { description: err.message })
    }
  }

  const confirmMessage = () => {
    if (konfirmasi?.type === 'kirim') {
      return 'Setelah dikirim, kegiatan tidak dapat diedit. Lanjutkan?'
    }
    if (konfirmasi?.type === 'ajukan') {
      return 'Ajukan ulang kegiatan ini setelah revisi?'
    }
    return 'Hapus kegiatan draft ini secara permanen?'
  }

  const confirmText = () => {
    if (konfirmasi?.type === 'kirim') return actionLoading ? 'Mengirim…' : 'Ya, Kirim'
    if (konfirmasi?.type === 'ajukan') return 'Ya, Ajukan Ulang'
    return 'Ya, Hapus'
  }

  const onConfirm = () => {
    if (!konfirmasi) return
    if (konfirmasi.type === 'kirim' || konfirmasi.type === 'ajukan') return handleAjukan(konfirmasi.id)
    return handleHapus(konfirmasi.id)
  }

  return (
    <DashboardLayout role="operator_ukm" userName={user?.nama || 'Operator UKM'} userRole="Operator UKM">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Daftar Kegiatan</h2>
            <p className="mt-1 text-sm text-[#616161]">
              Simpan draft dulu, lalu kirim ke Admin Ditmawa setelah siap.
            </p>
          </div>
          <button
            onClick={() => navigate('/operator_ukm/buat-kegiatan')}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Buat Kegiatan
          </button>
        </div>

        <div className="flex items-start gap-3 rounded-lg bg-[#fff6ad] px-5 py-4 text-sm text-brand-dark shadow-sm">
          <p>
            Kegiatan berstatus <b>draft</b> bisa diedit/dihapus. Setelah <b>Kirim</b>, tidak dapat diedit.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-bold text-brand-dark">Kegiatan Saya</h3>

          <DataTable
            loading={loading}
            data={data}
            emptyText="Belum ada kegiatan."
            columns={[
              { key: 'no', label: 'No', render: (_item, i) => i + 1 },
              { key: 'nama', label: 'Nama Kegiatan', render: (item) => item.nama || item.judul || '-' },
              { key: 'jenis', label: 'Jenis', render: (item) => labelOf(item.jenis || item.kategori) },
              { key: 'skala', label: 'Skala', render: (item) => labelOf(item.skala) },
              { key: 'tanggal', label: 'Tanggal', render: (item) => formatTanggal(item.tanggalMulai || item.tanggal || item.tgl) },
              { key: 'status', label: 'Status', render: (item) => <StatusBadge status={item.status} /> },
              {
                key: 'aksi', label: 'Aksi', stopPropagation: true,
                render: (item) => (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button type="button" title="Detail"
                      onClick={() => navigate(`/operator_ukm/daftar-kegiatan/${item.id}`)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-400 bg-blue-50 text-blue-600 transition hover:bg-blue-500 hover:text-white">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button type="button" title="Manajemen Peserta"
                        onClick={() => navigate(`/operator_ukm/daftar-kegiatan/${item.id}/manajemen-peserta`)}
                        disabled={!bisaPeserta(item)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-yellow-400 bg-amber-50 text-yellow-600 transition hover:bg-yellow-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">
                        <Users className="h-4 w-4" />
                      </button>
                    <button type="button" title="Edit"
                        onClick={() => navigate('/operator_ukm/buat-kegiatan', { state: { edit: item } })}
                        disabled={!bisaEdit(item)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-yellow-400 bg-amber-50 text-yellow-600 transition hover:bg-yellow-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">
                        <Pencil className="h-4 w-4" />
                      </button>
                    <button type="button" title="Kirim"
                        onClick={() => setKonfirmasi({ type: 'kirim', id: item.id })}
                        disabled={!bisaKirim(item)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-dark bg-[#eaf5ec] text-brand-dark transition hover:bg-brand-dark hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">
                        <Send className="h-4 w-4" />
                      </button>
                    <button type="button" title="Ajukan Ulang"
                        onClick={() => setKonfirmasi({ type: 'ajukan', id: item.id })}
                        disabled={!bisaAjukanUlang(item)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-400 bg-amber-50 text-amber-600 transition hover:bg-amber-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    <button type="button" title="Hapus"
                        onClick={() => setKonfirmasi({ type: 'hapus', id: item.id })}
                        disabled={!bisaHapus(item)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-400 bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed">
                        <Trash2 className="h-4 w-4" />
                      </button>
                  </div>
                ),
              },
            ]}
          />
        </div>

        <ConfirmModal
          isOpen={!!konfirmasi}
          message={confirmMessage()}
          confirmText={confirmText()}
          cancelText="Batal"
          onConfirm={onConfirm}
          onCancel={() => !actionLoading && setKonfirmasi(null)}
        />

        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file && fileRef.current?._kegiatanId) {
              handleImportCSV(fileRef.current._kegiatanId, file)
            }
            e.target.value = ''
          }}
        />
      </div>
    </DashboardLayout>
  )
}

export default DaftarKegiatan
