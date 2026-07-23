import { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'

const DEFAULT_ITEM = {
  kegiatan: 'Lomba Hackathon',
  namaUkm: 'UKM Neo Telemetri',
  jenis: 'Kompetisi',
  skala: 'Nasional',
  tanggal: '12 - 13 Feb 2026',
  penyelenggara: 'Hima FTI Universitas Indonesia',
  email: 'himatfi@gmail.com',
  linkWebsite: 'https://...',
  deskripsi: 'Hackathon merupakan kompetisi di bidang teknologi yang mempertemukan peserta untuk merancang dan mengembangkan sebuah solusi digital dalam kurun waktu tertentu.',
  capaian: ['Fondasi', 'Penguatan'],
  subCapaian: [
    { label: 'Public Speaking', persen: '30%' },
    { label: 'Leadership', persen: '40%' },
  ],
  bukti: null,
  status: 'pending',
}

function DetailRow({ label, value, multiline = false }) {
  return (
    <div className={`grid grid-cols-1 gap-1 sm:grid-cols-[220px_1fr] sm:gap-6 ${multiline ? 'items-start' : 'items-baseline'}`}>
      <p className="text-sm font-medium text-[#333]">{label}</p>
      <p className={`text-sm text-[#111] ${multiline ? 'leading-relaxed' : ''}`}>{value || '-'}</p>
    </div>
  )
}

function DetailVerifikasiPengajuanUKM() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()

  const [item, setItem] = useState({
    ...DEFAULT_ITEM,
    ...(location.state?.item || {}),
    status: location.state?.item?.status || 'pending',
  })

  const [showConfirmSetujui, setShowConfirmSetujui] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState(null)
  const [alasan, setAlasan] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const backToList = () => navigate('/pimpinan-ditmawa/verifikasi-pengajuan-ukm')

  const handleSetujui = async () => {
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 400))
    setItem((prev) => ({ ...prev, status: 'disetujui' }))
    toast.success('Pengajuan UKM disetujui!')
    setShowConfirmSetujui(false)
    setSubmitting(false)
  }

  const handleKirimAction = async () => {
    if (!alasan.trim()) {
      toast.error('Alasan tidak boleh kosong.')
      return
    }
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 400))
    const newStatus = actionType === 'revisi' ? 'revisi' : 'ditolak'
    setItem((prev) => ({ ...prev, status: newStatus, alasan: alasan.trim() }))
    toast.success(actionType === 'revisi' ? 'Revisi dikirim!' : 'Ditolak!')
    setShowActionModal(false)
    setSubmitting(false)
  }

  const canAct = item.status === 'pending'

  return (
    <DashboardLayout role="pimpinan-ditmawa" userName="Dr. Dendi Adi Saputra" userRole="Pimpinan Ditmawa">
      <ConfirmModal
        isOpen={showConfirmSetujui}
        title="Apakah anda yakin menyetujui kegiatan ini?"
        message="Pengajuan ini akan disetujui dan poin akan diberikan."
        confirmText={submitting ? 'Memproses...' : 'SETUJUI'}
        cancelText="BATAL"
        onConfirm={handleSetujui}
        onCancel={() => setShowConfirmSetujui(false)}
      />

      <Modal
        isOpen={showActionModal}
        onClose={() => setShowActionModal(false)}
        title={actionType === 'revisi' ? 'Revisi Pengajuan' : 'Tolak Pengajuan'}
      >
        <p className="mb-2 text-sm font-medium text-black">
          Alasan {actionType === 'revisi' ? 'Revisi' : 'Tolak'}
          <span className="text-red-500">*</span>
        </p>
        <textarea
          className="w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark"
          rows="4"
          placeholder={actionType === 'revisi' ? 'Tuliskan catatan revisi...' : 'Tuliskan alasan penolakan...'}
          value={alasan}
          onChange={(e) => setAlasan(e.target.value)}
        />
        <div className="mt-6 flex justify-end gap-4">
          <button type="button" disabled={submitting} onClick={handleKirimAction}
            className={`rounded-lg px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60 ${actionType === 'revisi' ? 'bg-orange-500' : 'bg-red-600'}`}>
            {submitting ? 'Mengirim...' : actionType === 'revisi' ? 'Kirim Revisi' : 'Tolak Pengajuan'}
          </button>
          <button type="button" onClick={() => setShowActionModal(false)}
            className="rounded-lg border border-gray-400 px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100">
            Batal
          </button>
        </div>
      </Modal>

      <div className="space-y-5">
        <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Detail</h2>

        <button type="button" onClick={backToList}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-dark hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-8">
            <section className="space-y-3">
              <h3 className="text-base font-bold text-[#111]">Kegiatan</h3>
              <div className="space-y-2.5">
                <DetailRow label="Nama Kegiatan" value={item.kegiatan} />
                <DetailRow label="Nama UKM" value={item.namaUkm} />
                <DetailRow label="Jenis Kegiatan" value={item.jenis} />
                <DetailRow label="Skala" value={item.skala} />
                <DetailRow label="Tanggal" value={item.tanggal} />
                <DetailRow label="Penyelenggara" value={item.penyelenggara} />
                <DetailRow label="Email" value={item.email} />
                <DetailRow label="Link website Penyelenggara" value={item.linkWebsite} />
                <DetailRow label="Deskripsi Kegiatan" value={item.deskripsi} multiline />
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-[#111]">Bukti</h3>
              {item.bukti ? (
                <img src={item.bukti} alt="Bukti kegiatan"
                  className="max-h-64 rounded-lg border border-[#e9ebf8] object-contain" />
              ) : (
                <div className="flex h-32 w-48 items-center justify-center rounded-lg border-2 border-dashed border-[#d9dce7] bg-[#f9fafb]">
                  <div className="flex flex-col items-center gap-1 text-[#9aa0a6]">
                    <ImageIcon className="h-8 w-8" />
                    <p className="text-xs">Tidak ada bukti</p>
                  </div>
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-[#111]">Capaian</h3>
              <div className="space-y-1.5 text-sm text-[#111]">
                {(item.capaian || []).map((c) => (
                  <p key={typeof c === 'string' ? c : c.label}>{typeof c === 'string' ? c : c.label}</p>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-[#111]">Sub Capaian</h3>
              <div className="space-y-2.5">
                {(item.subCapaian || []).map((sc) => (
                  <DetailRow key={sc.label} label={sc.label} value={sc.persen || `${sc.poin || 0}%`} />
                ))}
              </div>
            </section>
          </div>
        </div>

        {!canAct && (
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-[#9aa0a6]">Status</p>
            {item.status === 'disetujui' && (
              <p className="text-2xl font-extrabold text-brand-dark">DISETUJUI</p>
            )}
            {item.status === 'revisi' && (
              <p className="text-2xl font-extrabold text-orange-500">REVISI</p>
            )}
            {item.status === 'ditolak' && (
              <p className="text-2xl font-extrabold text-red-600">DITOLAK</p>
            )}
            {item.alasan && (
              <p className="mt-1 text-sm text-[#616161]">
                <span className="font-medium">Alasan:</span> {item.alasan}
              </p>
            )}
          </div>
        )}

        {canAct && (
          <div className="grid gap-3 sm:grid-cols-3">
            <button type="button" onClick={() => setShowConfirmSetujui(true)}
              className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition hover:opacity-90">
              Setuju
            </button>
            <button type="button" onClick={() => { setActionType('revisi'); setAlasan(''); setShowActionModal(true) }}
              className="rounded-lg bg-orange-500 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-orange-600">
              Revisi
            </button>
            <button type="button" onClick={() => { setActionType('tolak'); setAlasan(''); setShowActionModal(true) }}
              className="rounded-lg bg-red-700 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-red-800">
              Tolak
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default DetailVerifikasiPengajuanUKM
