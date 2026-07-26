import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Bell, Pencil, Plus, RefreshCw, Send, Trash2, Users } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { getCurrentUser } from '../../services/authService'
import {
  getKegiatan,
  ajukanKegiatan,
  publikasiKegiatan,
  deleteKegiatan,
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
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [konfirmasi, setKonfirmasi] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const load = () => {
    setLoading(true)
    getKegiatan()
      .then((res) => setData(Array.isArray(res) ? res : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const statusLower = (item) => String(item?.status || '').toLowerCase()
  const bisaEdit = (item) => ['draft', 'perlu_revisi'].includes(statusLower(item))
  const bisaHapus = (item) => ['draft', 'perlu_revisi', 'ditolak'].includes(statusLower(item))
  const bisaKirim = (item) => statusLower(item) === 'draft'
  const bisaAjukanUlang = (item) => statusLower(item) === 'perlu_revisi'
  const bisaPublish = (item) => statusLower(item) === 'disetujui'
  const bisaPeserta = (item) => statusLower(item) !== 'draft'

  const draftCount = data.filter((d) => statusLower(d) === 'draft').length
  const pending = data.filter((d) => ['diajukan', 'terverifikasi'].includes(statusLower(d))).length
  const disetujui = data.filter((d) => ['disetujui', 'terpublikasi'].includes(statusLower(d))).length
  const ditolak = data.filter((d) => statusLower(d) === 'ditolak').length
  const stats = [
    { label: 'DRAFT', value: draftCount },
    { label: 'MENUNGGU', value: pending },
    { label: 'DISETUJUI', value: disetujui },
    { label: 'DITOLAK', value: ditolak },
  ]

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

  const handlePublish = async (id) => {
    setActionLoading(true)
    try {
      await publikasiKegiatan(id)
      toast.success('Kegiatan dipublikasikan')
      load()
    } catch (err) {
      toast.error('Gagal', { description: err.message })
    } finally {
      setActionLoading(false)
      setKonfirmasi(null)
    }
  }

  const onConfirm = () => {
    if (!konfirmasi) return
    if (konfirmasi.type === 'kirim' || konfirmasi.type === 'ajukan') return handleAjukan(konfirmasi.id)
    if (konfirmasi.type === 'hapus') return handleHapus(konfirmasi.id)
    return handlePublish(konfirmasi.id)
  }

  return (
    <DashboardLayout role="operator_ukmf" userName={user?.nama || 'Operator UKMF'} userRole="Operator UKMF">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Daftar Kegiatan</h2>
            <p className="mt-1 text-sm text-[#616161]">
              Simpan draft dulu, lalu kirim ke Admin Fakultas setelah siap.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/operator_ukmf/buat-kegiatan')}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Buat Kegiatan
          </button>
        </div>

        <div className="flex items-start gap-3 rounded-lg bg-[#fff6ad] px-5 py-4 text-sm text-brand-dark shadow-sm">
          <Bell className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
          <p>
            Kegiatan <b>draft</b> bisa diedit/dihapus. Setelah <b>Kirim</b>, tidak dapat diedit.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border-2 border-brand-dark bg-white p-5 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#616161]">{stat.label}</p>
              <p className="mt-2 text-3xl font-extrabold text-brand-dark">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-xs font-semibold uppercase tracking-wide text-white">
                  <th className="px-4 py-4">Nama Kegiatan</th>
                  <th className="px-4 py-4">Jenis</th>
                  <th className="px-4 py-4">Skala</th>
                  <th className="px-4 py-4">Tanggal</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-[#9aa0a6]">Memuat…</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-[#9aa0a6]">Belum ada kegiatan.</td></tr>
                ) : data.map((item) => (
                  <tr key={item.id} className="border-b border-[#e9ebf8] last:border-0 hover:bg-[#f9fafb]">
                    <td className="px-4 py-4 font-medium text-[#333]">{item.nama || '-'}</td>
                    <td className="px-4 py-4 text-[#616161]">{labelOf(item.jenis || item.kategori)}</td>
                    <td className="px-4 py-4 text-[#616161]">{labelOf(item.skala)}</td>
                    <td className="px-4 py-4 text-[#616161]">{formatTanggal(item.tanggalMulai || item.tanggal)}</td>
                    <td className="px-4 py-4"><StatusBadge status={item.status} /></td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                        {bisaPeserta(item) && (
                          <button
                            type="button"
                            onClick={() => navigate(`/operator_ukmf/daftar-kegiatan/${item.id}/manajemen-peserta`)}
                            className="inline-flex items-center gap-1 rounded-full bg-yellow-400 px-3 py-1 text-xs font-semibold text-white hover:bg-yellow-500"
                          >
                            <Users className="h-3 w-3" /> Peserta
                          </button>
                        )}
                        {bisaEdit(item) && (
                          <button
                            type="button"
                            onClick={() => navigate('/operator_ukmf/buat-kegiatan', { state: { edit: item } })}
                            className="inline-flex items-center gap-1 rounded-full border border-brand-dark px-3 py-1 text-xs font-semibold text-brand-dark"
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </button>
                        )}
                        {bisaKirim(item) && (
                          <button
                            type="button"
                            onClick={() => setKonfirmasi({ type: 'kirim', id: item.id })}
                            className="inline-flex items-center gap-1 rounded-full bg-brand-dark px-3 py-1 text-xs font-semibold text-white"
                          >
                            <Send className="h-3 w-3" /> Kirim
                          </button>
                        )}
                        {bisaAjukanUlang(item) && (
                          <button
                            type="button"
                            onClick={() => setKonfirmasi({ type: 'ajukan', id: item.id })}
                            className="inline-flex items-center gap-1 rounded-full border border-amber-500 px-3 py-1 text-xs font-semibold text-amber-600"
                          >
                            <RefreshCw className="h-3 w-3" /> Ajukan Ulang
                          </button>
                        )}
                        {bisaHapus(item) && (
                          <button
                            type="button"
                            onClick={() => setKonfirmasi({ type: 'hapus', id: item.id })}
                            className="inline-flex items-center gap-1 rounded-full border border-red-500 px-3 py-1 text-xs font-semibold text-red-600"
                          >
                            <Trash2 className="h-3 w-3" /> Hapus
                          </button>
                        )}
                        {bisaPublish(item) && (
                          <button
                            type="button"
                            onClick={() => setKonfirmasi({ type: 'publish', id: item.id })}
                            className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white"
                          >
                            Publikasi
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <ConfirmModal
          isOpen={!!konfirmasi}
          message={
            konfirmasi?.type === 'kirim'
              ? 'Setelah dikirim, kegiatan tidak dapat diedit. Lanjutkan?'
              : konfirmasi?.type === 'ajukan'
                ? 'Ajukan ulang kegiatan ini setelah revisi?'
                : konfirmasi?.type === 'hapus'
                  ? 'Hapus kegiatan ini secara permanen?'
                  : 'Publikasikan kegiatan ini?'
          }
          confirmText={
            konfirmasi?.type === 'kirim'
              ? (actionLoading ? 'Mengirim…' : 'Ya, Kirim')
              : konfirmasi?.type === 'ajukan'
                ? 'Ya, Ajukan Ulang'
                : konfirmasi?.type === 'hapus'
                  ? 'Ya, Hapus'
                  : 'Ya, Publikasi'
          }
          cancelText="Batal"
          onConfirm={onConfirm}
          onCancel={() => !actionLoading && setKonfirmasi(null)}
        />
      </div>
    </DashboardLayout>
  )
}

export default DaftarKegiatan
