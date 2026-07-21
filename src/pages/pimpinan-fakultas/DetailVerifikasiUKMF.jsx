import { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { updateKegiatan } from '../../services/kegiatanService'

const detailFallback = {
  penyelenggara: 'Hima Teknologi Informasi Universitas Andalas',
  lokasi: 'Universitas Andalas',
  kuota: 100,
  deskripsi: 'Kegiatan yang diselenggarakan oleh UKMF dalam rangka pengembangan soft skill mahasiswa.',
  capaian: [
    { label: 'Fondasi', poin: 30 },
    { label: 'Penguatan', poin: 20 },
  ],
  subCapaian: [
    { label: 'Public Speaking', poin: 10 },
    { label: 'Leadership', poin: 10 },
  ],
  totalBobot: 20,
}

function DetailVerifikasiUKMF() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const item = location.state?.item
  const d = { ...detailFallback, ...item }

  const initialStatus = item?.updatedStatus || null
  const [statusVerifikasi, setStatusVerifikasi] = useState(initialStatus)
  const [isActionTaken, setIsActionTaken] = useState(initialStatus !== null)

  // confirm modal
  const [showConfirmSetujui, setShowConfirmSetujui] = useState(false)

  // revisi/tolak modal
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState(null)
  const [alasan, setAlasan] = useState('')

  if (!item) {
    return (
      <DashboardLayout role="pimpinan-fakultas" userName="Dr. Andi Wijaya" userRole="Pimpinan Fakultas">
        <div className="flex flex-col items-center gap-4 py-20">
          <p className="text-lg font-semibold text-[#616161]">Data tidak ditemukan.</p>
          <button onClick={() => navigate('/pimpinan-fakultas/verifikasi-pengajuan-ukmf')} className="rounded-lg bg-brand-dark px-6 py-2 text-sm font-semibold text-white transition hover:opacity-90">
            Kembali
          </button>
        </div>
      </DashboardLayout>
    )
  }

  const handleSetujuiConfirm = async () => {
    setIsActionTaken(true)
    setStatusVerifikasi('Disetujui')
    setShowConfirmSetujui(false)
    try {
      await updateKegiatan(id, { status: 'disetujui', updatedStatus: 'Disetujui' })
      toast.success('Disetujui!', {
        description: `Pengajuan "${d.kegiatan}" telah disetujui.`,
      })
    } catch (err) {
      toast.error('Gagal', { description: err.message })
    }
    navigate('/pimpinan-fakultas/verifikasi-pengajuan-ukmf', {
      state: { updatedId: Number(id), newStatus: 'disetujui', updatedStatus: 'Disetujui' },
    })
  }

  const handleOpenRevisi = () => {
    setActionType('revisi')
    setAlasan('')
    setShowActionModal(true)
  }

  const handleOpenTolak = () => {
    setActionType('tolak')
    setAlasan('')
    setShowActionModal(true)
  }

  const handleKirimAction = async () => {
    if (!alasan.trim()) {
      toast.error('Gagal!', {
        description: 'Alasan tidak boleh kosong.',
      })
      return
    }

    setIsActionTaken(true)
    const statusText = actionType === 'revisi' ? 'Revisi' : 'Ditolak'
    setStatusVerifikasi(statusText)
    setShowActionModal(false)

    const statusKey = actionType === 'revisi' ? 'revisi' : 'ditolak'
    try {
      await updateKegiatan(id, { status: statusKey, updatedStatus: statusText, alasan: alasan.trim() })
      toast.success(actionType === 'revisi' ? 'Revisi Dikirim!' : 'Ditolak!', {
        description: actionType === 'revisi'
          ? 'Catatan revisi telah dikirim ke UKMF terkait.'
          : `Pengajuan "${d.kegiatan}" telah ditolak.`,
      })
    } catch (err) {
      toast.error('Gagal', { description: err.message })
    }
    navigate('/pimpinan-fakultas/verifikasi-pengajuan-ukmf', {
      state: { updatedId: Number(id), newStatus: statusKey, updatedStatus: statusText },
    })
  }

  return (
    <DashboardLayout role="pimpinan-fakultas" userName="Dr. Andi Wijaya" userRole="Pimpinan Fakultas">
      <div className="space-y-5">
        {/* Confirm Setujui Modal */}
        <ConfirmModal
          isOpen={showConfirmSetujui}
          title="Apakah anda yakin menyetujui kegiatan ini?"
          message=""
          confirmText="SETUJU"
          cancelText="BATAL"
          onConfirm={handleSetujuiConfirm}
          onCancel={() => setShowConfirmSetujui(false)}
        />

        {/* Revisi / Tolak Modal */}
        <Modal
          isOpen={showActionModal}
          onClose={() => setShowActionModal(false)}
          title={actionType === 'revisi' ? 'Revisi Pengajuan' : 'Tolak Pengajuan'}
        >
          <p className="mb-2 text-sm font-medium text-black">
            Alasan {actionType === 'revisi' ? 'Revisi' : 'Tolak'}<span className="text-red-500">*</span>
          </p>
          <textarea
            className="w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
            rows="4"
            placeholder={actionType === 'revisi' ? 'Tuliskan catatan revisi...' : 'Tuliskan alasan penolakan...'}
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
          ></textarea>
          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={handleKirimAction}
              className={`rounded-lg px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 ${actionType === 'revisi' ? 'bg-yellow-500' : 'bg-red-600'}`}
            >
              {actionType === 'revisi' ? 'Kirim Revisi' : 'Tolak Pengajuan'}
            </button>
            <button
              onClick={() => setShowActionModal(false)}
              className="rounded-lg border border-gray-400 px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100"
            >
              Batal
            </button>
          </div>
        </Modal>

        {/* Kembali */}
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>

        <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Detail Verifikasi Pengajuan UKMF</h2>

        {/* Detail Kegiatan */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-brand-dark">Detail Kegiatan</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9aa0a6]">Nama Kegiatan</p>
              <p className="mt-1 text-sm font-semibold text-brand-dark">{d.kegiatan}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9aa0a6]">Nama UKMF</p>
              <p className="mt-1 text-sm text-[#616161]">{d.namaUkmf}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9aa0a6]">Jenis</p>
              <p className="mt-1 text-sm text-[#616161]">{d.jenis}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9aa0a6]">Skala</p>
              <p className="mt-1 text-sm text-[#616161]">{d.skala}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9aa0a6]">Tanggal</p>
              <p className="mt-1 text-sm text-[#616161]">{d.tanggal}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9aa0a6]">Penyelenggara</p>
              <p className="mt-1 text-sm text-[#616161]">{d.penyelenggara}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9aa0a6]">Lokasi</p>
              <p className="mt-1 text-sm text-[#616161]">{d.lokasi}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9aa0a6]">Kuota</p>
              <p className="mt-1 text-sm text-[#616161]">{d.kuota}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#9aa0a6]">Deskripsi</p>
            <p className="mt-1 text-sm text-[#616161]">{d.deskripsi}</p>
          </div>
        </div>

        {/* Detail Capaian */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-brand-dark">Detail Capaian</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {d.capaian.map((c) => (
              <div key={c.label} className="flex items-center justify-between rounded-lg bg-[#f9fafb] px-4 py-3">
                <span className="text-sm font-medium text-[#333]">{c.label}</span>
                <span className="text-sm font-bold text-brand-dark">{c.poin} Poin</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Sub Capaian */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-brand-dark">Detail Sub Capaian</h3>
          <div className="space-y-3">
            {d.subCapaian.map((sc) => (
              <div key={sc.label} className="flex items-center justify-between rounded-lg bg-[#f9fafb] px-4 py-3">
                <span className="text-sm font-medium text-[#333]">{sc.label}</span>
                <span className="text-sm font-bold text-brand-dark">{sc.poin} Poin</span>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-lg border border-brand-dark px-4 py-3">
              <span className="text-sm font-bold text-brand-dark">Total Bobot</span>
              <span className="text-sm font-bold text-brand-dark">{d.totalBobot} Poin</span>
            </div>
          </div>
        </div>

        {/* Status Verifikasi */}
        {statusVerifikasi && (
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-brand-dark">Status Verifikasi</h3>
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white"
              style={{
                backgroundColor:
                  statusVerifikasi === 'Disetujui' ? '#16a34a' :
                  statusVerifikasi === 'Revisi' ? '#ca8a04' : '#dc2626'
              }}
            >
              {statusVerifikasi === 'Disetujui' && '✓'}
              {statusVerifikasi === 'Revisi' && '↻'}
              {statusVerifikasi === 'Ditolak' && '✕'}
              {' '}{statusVerifikasi}
            </div>
          </div>
        )}

        {/* Tombol Aksi */}
        {!isActionTaken && (
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setShowConfirmSetujui(true)} className="rounded-lg bg-green-600 px-8 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-700">
              SETUJUI
            </button>
            <button onClick={handleOpenRevisi} className="rounded-lg bg-yellow-500 px-8 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-yellow-600">
              REVISI
            </button>
            <button onClick={handleOpenTolak} className="rounded-lg bg-red-600 px-8 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700">
              TOLAK
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default DetailVerifikasiUKMF