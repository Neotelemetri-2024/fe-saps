import { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle, XCircle, RotateCcw } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { updateKegiatan } from '../../services/kegiatanService'

const detailFallback = {
  penyelenggara: 'Hima Teknologi Informasi Universitas Andalas',
  lokasi: 'Universitas Andalas',
  kuota: 100,
  deskripsi: 'Kegiatan yang diselenggarakan oleh UKMF dalam rangka pengembangan soft skill mahasiswa.',
  capaian: [
    { label: 'Fondasi Karakter', bobot: 40 },
    { label: 'Penguatan Kompetensi', bobot: 60 },
  ],
  subCapaian: [
    { label: 'Public Speaking', bobot: 20 },
    { label: 'Leadership', bobot: 20 },
    { label: 'Komunikasi', bobot: 20 },
  ],
  totalBobot: 60,
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#9aa0a6]">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-[#333]">{value ?? '-'}</p>
    </div>
  )
}

// ── ConfirmSetujuiModal ──
function ConfirmSetujuiModal({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-7 w-7 text-green-600" />
          </div>
          <h3 className="text-base font-bold text-[#222]">Apakah anda yakin menyetujui kegiatan ini?</h3>
          <p className="text-sm text-[#616161]">Tindakan ini tidak dapat dibatalkan setelah dikonfirmasi.</p>
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-green-600 px-8 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-700"
          >
            SETUJU
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-[#444] shadow-sm transition hover:bg-gray-50"
          >
            BATAL
          </button>
        </div>
      </div>
    </div>
  )
}

// ── ActionModal (Revisi / Tolak) ──
function ActionModal({ isOpen, type, alasan, onChange, onSubmit, onCancel }) {
  if (!isOpen) return null
  const isRevisi = type === 'revisi'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isRevisi ? 'bg-yellow-100' : 'bg-red-100'}`}>
            {isRevisi ? <RotateCcw className="h-5 w-5 text-yellow-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
          </div>
          <h3 className="text-base font-bold text-[#222]">
            {isRevisi ? 'Revisi Pengajuan' : 'Tolak Pengajuan'}
          </h3>
        </div>
        <p className="mb-1.5 text-sm font-semibold text-[#333]">
          Alasan {isRevisi ? 'Revisi' : 'Penolakan'} <span className="text-red-500">*</span>
        </p>
        <textarea
          className="w-full rounded-lg border border-[#d1d5db] p-3 text-sm text-[#333] shadow-sm outline-none focus:border-brand-dark"
          rows={4}
          placeholder={isRevisi ? 'Tuliskan catatan revisi...' : 'Tuliskan alasan penolakan...'}
          value={alasan}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onSubmit}
            className={`rounded-lg px-7 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 ${isRevisi ? 'bg-yellow-500' : 'bg-red-600'}`}
          >
            {isRevisi ? 'Kirim Revisi' : 'Tolak Pengajuan'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#444] transition hover:bg-gray-50"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  )
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

  const [showConfirmSetujui, setShowConfirmSetujui] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState(null)
  const [alasan, setAlasan] = useState('')

  if (!item) {
    return (
      <DashboardLayout role="pimpinan-fakultas" userName="Dr. Eng. Ir. Dendi Adi Saputra M, S.T, M.T" userRole="Pimpinan">
        <div className="flex flex-col items-center gap-4 py-20">
          <p className="text-lg font-semibold text-[#616161]">Data tidak ditemukan.</p>
          <button
            type="button"
            onClick={() => navigate('/pimpinan-fakultas/verifikasi-pengajuan-ukmf')}
            className="rounded-lg bg-brand-dark px-6 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
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
      toast.success('Disetujui!', { description: `Pengajuan "${d.kegiatan}" telah disetujui.` })
    } catch (err) {
      toast.error('Gagal', { description: err.message })
    }
    navigate('/pimpinan-fakultas/verifikasi-pengajuan-ukmf', {
      state: { updatedId: Number(id), newStatus: 'disetujui', updatedStatus: 'Disetujui' },
    })
  }

  const handleKirimAction = async () => {
    if (!alasan.trim()) {
      toast.error('Gagal!', { description: 'Alasan tidak boleh kosong.' })
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

  const statusStyle = {
    Disetujui: 'bg-green-100 text-green-700 border border-green-300',
    Revisi: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
    Ditolak: 'bg-red-100 text-red-600 border border-red-300',
    pending: 'bg-yellow-50 text-yellow-600 border border-yellow-200',
  }

  return (
    <DashboardLayout role="pimpinan-fakultas" userName="Dr. Eng. Ir. Dendi Adi Saputra M, S.T, M.T" userRole="Pimpinan">
      <ConfirmSetujuiModal
        isOpen={showConfirmSetujui}
        onConfirm={handleSetujuiConfirm}
        onCancel={() => setShowConfirmSetujui(false)}
      />
      <ActionModal
        isOpen={showActionModal}
        type={actionType}
        alasan={alasan}
        onChange={setAlasan}
        onSubmit={handleKirimAction}
        onCancel={() => setShowActionModal(false)}
      />

      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Detail Verifikasi Pengajuan UKMF</h2>
          {statusVerifikasi && (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold ${statusStyle[statusVerifikasi] ?? 'bg-gray-100 text-gray-600'}`}>
              {statusVerifikasi === 'Disetujui' && <CheckCircle className="h-4 w-4" />}
              {statusVerifikasi === 'Revisi' && <RotateCcw className="h-4 w-4" />}
              {statusVerifikasi === 'Ditolak' && <XCircle className="h-4 w-4" />}
              {statusVerifikasi}
            </span>
          )}
        </div>

        {/* Informasi Kegiatan */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
          <div className="border-b border-[#e9ebf8] px-6 py-4">
            <h3 className="text-base font-bold text-brand-dark">Informasi Kegiatan</h3>
          </div>
          <div className="grid gap-5 p-6 sm:grid-cols-2">
            <InfoRow label="Nama Kegiatan" value={d.kegiatan} />
            <InfoRow label="Nama UKMF / Penyelenggara" value={d.penyelenggara || d.namaUkmf} />
            <InfoRow label="Jenis Kegiatan" value={d.jenis} />
            <InfoRow label="Skala Kegiatan" value={d.skala} />
            <InfoRow label="Tanggal" value={d.tanggal} />
            <InfoRow label="Lokasi" value={d.lokasi} />
            <InfoRow label="Kuota Peserta" value={d.kuota ? `${d.kuota} orang` : null} />
            <InfoRow label="Status" value={
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[d.status] ?? 'bg-gray-100 text-gray-500'}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {d.status}
              </span>
            } />
          </div>
          <div className="border-t border-[#e9ebf8] px-6 pb-6">
            <p className="pt-4 text-xs font-semibold uppercase tracking-wide text-[#9aa0a6]">Deskripsi</p>
            <p className="mt-1.5 text-sm leading-relaxed text-[#444]">{d.deskripsi}</p>
          </div>
        </div>

        {/* Pemetaan Capaian Kurikulum */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
          <div className="border-b border-[#e9ebf8] px-6 py-4">
            <h3 className="text-base font-bold text-brand-dark">Pemetaan Capaian Kurikulum</h3>
          </div>
          <div className="p-6 space-y-6">
            {/* Capaian */}
            <div>
              <p className="mb-3 text-sm font-semibold text-[#444]">Capaian yang Dipetakan</p>
              <div className="space-y-2">
                {d.capaian.map((c) => (
                  <div key={c.label} className="flex items-center justify-between rounded-lg bg-[#f9fafb] px-4 py-3 text-sm">
                    <span className="font-medium text-[#333]">{c.label}</span>
                    <span className="font-bold text-brand-dark">{c.bobot ?? c.poin} %</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub Capaian */}
            <div>
              <p className="mb-3 text-sm font-semibold text-[#444]">Sub Capaian &amp; Bobot</p>
              <div className="overflow-hidden rounded-xl border border-[#e9ebf8]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-white">
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">Sub Capaian</th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide">Bobot (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0f0]">
                    {d.subCapaian.map((sc) => (
                      <tr key={sc.label} className="hover:bg-[#f9fafb]">
                        <td className="px-4 py-3 text-[#333]">{sc.label}</td>
                        <td className="px-4 py-3 text-right font-semibold text-brand-dark">{sc.bobot ?? sc.poin}%</td>
                      </tr>
                    ))}
                    <tr className="bg-[#f0fdf4] font-bold">
                      <td className="px-4 py-3 text-brand-dark">Total Bobot</td>
                      <td className="px-4 py-3 text-right text-brand-dark">{d.totalBobot}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Tombol Aksi */}
        {!isActionTaken && (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowConfirmSetujui(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-8 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4" /> SETUJUI
            </button>
            <button
              type="button"
              onClick={() => { setActionType('revisi'); setAlasan(''); setShowActionModal(true) }}
              className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-8 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-yellow-600"
            >
              <RotateCcw className="h-4 w-4" /> REVISI
            </button>
            <button
              type="button"
              onClick={() => { setActionType('tolak'); setAlasan(''); setShowActionModal(true) }}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-8 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700"
            >
              <XCircle className="h-4 w-4" /> TOLAK
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default DetailVerifikasiUKMF
