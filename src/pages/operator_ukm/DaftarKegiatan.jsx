import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Bell, Pencil, Plus, RefreshCw, Send, Trash2 } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import DataTable from '../../components/dashboard/DataTable'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { getCurrentUser } from '../../services/authService'
import {
  getKegiatan,
  ajukanKegiatan,
  publikasiKegiatan,
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

  const draftCount = data.filter((d) => statusLower(d) === 'draft').length
  const pending = data.filter((d) => ['diajukan', 'terverifikasi'].includes(statusLower(d))).length
  const disetujui = data.filter((d) => ['disetujui', 'terpublikasi'].includes(statusLower(d))).length
  const aktif = data.filter((d) => ['terpublikasi', 'berlangsung'].includes(statusLower(d))).length
  const stats = [
    { label: 'DRAFT', value: draftCount },
    { label: 'MENUNGGU', value: pending },
    { label: 'DISETUJUI', value: disetujui },
    { label: 'EVENT AKTIF', value: aktif },
  ]

  function statusLower(item) {
    return String(item?.status || '').toLowerCase()
  }

  const bisaEdit = (item) => ['draft', 'perlu_revisi'].includes(statusLower(item))
  const bisaHapus = (item) => ['draft', 'perlu_revisi', 'ditolak'].includes(statusLower(item))
  const bisaKirim = (item) => statusLower(item) === 'draft'
  const bisaAjukanUlang = (item) => statusLower(item) === 'perlu_revisi'
  const bisaPublish = (item) => statusLower(item) === 'disetujui'
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

  const handlePublish = async (id) => {
    setActionLoading(true)
    try {
      await publikasiKegiatan(id)
      toast.success('Kegiatan berhasil dipublikasikan')
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
    if (konfirmasi?.type === 'hapus') {
      return 'Hapus kegiatan draft ini secara permanen?'
    }
    return 'Publikasikan kegiatan ini agar mahasiswa bisa mendaftar?'
  }

  const confirmText = () => {
    if (konfirmasi?.type === 'kirim') return actionLoading ? 'Mengirim…' : 'Ya, Kirim'
    if (konfirmasi?.type === 'ajukan') return 'Ya, Ajukan Ulang'
    if (konfirmasi?.type === 'hapus') return 'Ya, Hapus'
    return 'Ya, Publikasi'
  }

  const onConfirm = () => {
    if (!konfirmasi) return
    if (konfirmasi.type === 'kirim' || konfirmasi.type === 'ajukan') return handleAjukan(konfirmasi.id)
    if (konfirmasi.type === 'hapus') return handleHapus(konfirmasi.id)
    return handlePublish(konfirmasi.id)
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
          <Bell className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
          <p>
            Kegiatan berstatus <b>draft</b> bisa diedit/dihapus. Setelah <b>Kirim</b>, tidak dapat diedit.
            Setelah disetujui, klik <b>Publikasi</b> agar mahasiswa bisa mendaftar.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ label, value }) => (
            <div key={label} className="rounded-xl border-2 border-brand-dark bg-white p-5 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#616161]">{label}</p>
              <p className="mt-2 text-3xl font-extrabold text-brand-dark">{value}</p>
            </div>
          ))}
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
                    {bisaPeserta(item) && (
                      <button type="button"
                        onClick={() => navigate(`/operator_ukm/daftar-kegiatan/${item.id}/manajemen-peserta`)}
                        className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-yellow-500">
                        Manajemen Peserta
                      </button>
                    )}
                    {bisaEdit(item) && (
                      <button type="button"
                        onClick={() => navigate('/operator_ukm/buat-kegiatan', { state: { edit: item } })}
                        className="inline-flex items-center gap-1 rounded-full border border-brand-dark px-3 py-1 text-xs font-semibold text-brand-dark hover:bg-brand-dark hover:text-white">
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                    )}
                    {bisaKirim(item) && (
                      <button type="button"
                        onClick={() => setKonfirmasi({ type: 'kirim', id: item.id })}
                        className="inline-flex items-center gap-1 rounded-full bg-brand-dark px-3 py-1 text-xs font-semibold text-white hover:opacity-90">
                        <Send className="h-3 w-3" /> Kirim
                      </button>
                    )}
                    {bisaAjukanUlang(item) && (
                      <button type="button"
                        onClick={() => setKonfirmasi({ type: 'ajukan', id: item.id })}
                        className="inline-flex items-center gap-1 rounded-full border border-amber-500 px-3 py-1 text-xs font-semibold text-amber-600 hover:bg-amber-50">
                        <RefreshCw className="h-3 w-3" /> Ajukan Ulang
                      </button>
                    )}
                    {bisaHapus(item) && (
                      <button type="button"
                        onClick={() => setKonfirmasi({ type: 'hapus', id: item.id })}
                        className="inline-flex items-center gap-1 rounded-full border border-red-500 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
                        <Trash2 className="h-3 w-3" /> Hapus
                      </button>
                    )}
                    {bisaPublish(item) && (
                      <button type="button"
                        onClick={() => setKonfirmasi({ type: 'publish', id: item.id })}
                        className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700">
                        Publikasi
                      </button>
                    )}
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
