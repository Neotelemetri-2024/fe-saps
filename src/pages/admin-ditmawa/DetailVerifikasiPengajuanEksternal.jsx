import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import {
  getPengajuanEksternalById,
  teruskanKePimpinanDitmawa,
  verifikasiPengajuanEksternal,
} from '../../services/pengajuanService'

const JENIS_LABEL = {
  prestasi: 'Kompetisi',
  organisasi: 'Organisasi',
  pelatihan: 'Pelatihan',
}

const SKALA_LABEL = {
  internasional: 'Internasional',
  nasional: 'Nasional',
  regional: 'Regional',
  lokal: 'Internal (UNAND)',
}

const DEFAULT_DETAIL = {
  deskripsi:
    'Deskripsi kegiatan belum diisi oleh mahasiswa. Silakan tinjau data yang tersedia sebelum memverifikasi.',
  capaian: ['Fondasi', 'Penguatan'],
  subCapaian: [
    { label: 'Public Speaking', persen: '30%' },
    { label: 'Leadership', persen: '40%' },
  ],
}

function DetailRow({ label, value, multiline = false }) {
  return (
    <div className={`grid grid-cols-1 gap-1 sm:grid-cols-[220px_1fr] sm:gap-6 ${multiline ? 'items-start' : 'items-baseline'}`}>
      <p className="text-sm font-medium text-[#333]">{label}</p>
      <p className={`text-sm text-[#111] ${multiline ? 'leading-relaxed' : ''}`}>{value || '-'}</p>
    </div>
  )
}

function DetailVerifikasiPengajuanEksternal() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()

  const [item, setItem] = useState(location.state?.item || null)
  const [loading, setLoading] = useState(!location.state?.item)
  const [showConfirmSetujui, setShowConfirmSetujui] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState(null)
  const [alasan, setAlasan] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (location.state?.item) {
      setItem(location.state.item)
      setLoading(false)
      return
    }
    setLoading(true)
    getPengajuanEksternalById(id)
      .then(setItem)
      .catch(() => setItem(null))
      .finally(() => setLoading(false))
  }, [id, location.state])

  const backToList = () => navigate('/admin-ditmawa/verifikasi-pengajuan-eksternal')

  const handleSetujui = async () => {
    setSubmitting(true)
    try {
      await teruskanKePimpinanDitmawa(id)
      toast.success('Diteruskan ke Pimpinan Ditmawa', {
        description: `Pengajuan "${item?.kegiatan}" telah diteruskan.`,
      })
      setShowConfirmSetujui(false)
      backToList()
    } catch (err) {
      toast.error('Gagal', { description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const openAction = (type) => {
    setActionType(type)
    setAlasan('')
    setShowActionModal(true)
  }

  const handleKirimAction = async () => {
    if (!alasan.trim()) {
      toast.error('Gagal!', { description: 'Alasan tidak boleh kosong.' })
      return
    }
    setSubmitting(true)
    try {
      const status = actionType === 'revisi' ? 'revisi' : 'ditolak'
      await verifikasiPengajuanEksternal(id, status, alasan.trim())
      toast.success(actionType === 'revisi' ? 'Revisi Dikirim!' : 'Ditolak!', {
        description:
          actionType === 'revisi'
            ? 'Catatan revisi telah dikirim ke mahasiswa.'
            : `Pengajuan "${item?.kegiatan}" telah ditolak.`,
      })
      setShowActionModal(false)
      backToList()
    } catch (err) {
      toast.error('Gagal', { description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="admin-ditmawa" userName="Dr. Efa Yonnedi, SE. MPPM, Akt, CA, CRGP" userRole="Dosen Pembimbing">
        <p className="py-20 text-center text-sm text-[#616161]">Memuat detail...</p>
      </DashboardLayout>
    )
  }

  if (!item) {
    return (
      <DashboardLayout role="admin-ditmawa" userName="Dr. Efa Yonnedi, SE. MPPM, Akt, CA, CRGP" userRole="Dosen Pembimbing">
        <div className="flex flex-col items-center gap-4 py-20">
          <p className="text-lg font-semibold text-[#616161]">Data tidak ditemukan.</p>
          <button
            type="button"
            onClick={backToList}
            className="rounded-lg bg-brand-dark px-6 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Kembali
          </button>
        </div>
      </DashboardLayout>
    )
  }

  const d = {
    ...DEFAULT_DETAIL,
    ...item,
    jenisLabel: JENIS_LABEL[item.jenis] || item.jenis || '-',
    skalaLabel: SKALA_LABEL[item.skala] || item.skala || '-',
    capaian: item.capaian?.length ? item.capaian : DEFAULT_DETAIL.capaian,
    subCapaian: item.subCapaian?.length ? item.subCapaian : DEFAULT_DETAIL.subCapaian,
    deskripsi: item.deskripsi || DEFAULT_DETAIL.deskripsi,
    email: item.emailPenyelenggara || item.email || '-',
    linkWebsite: item.linkWebsite || '-',
  }

  const canAct = item.status === 'pending'

  return (
    <DashboardLayout role="admin-ditmawa" userName="Dr. Efa Yonnedi, SE. MPPM, Akt, CA, CRGP" userRole="Dosen Pembimbing">
      <ConfirmModal
        isOpen={showConfirmSetujui}
        title="Apakah anda yakin menyetujui kegiatan ini ?"
        message="Apakah Anda yakin ingin menyetujui pengajuan ini dan meneruskannya ke Pimpinan Ditmawa?"
        confirmText={submitting ? 'Memproses...' : 'TERUSKAN KE PIMPINAN'}
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
          className="w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
          rows="4"
          placeholder={actionType === 'revisi' ? 'Tuliskan catatan revisi...' : 'Tuliskan alasan penolakan...'}
          value={alasan}
          onChange={(e) => setAlasan(e.target.value)}
        />
        <div className="mt-6 flex justify-end gap-4">
          <button
            type="button"
            disabled={submitting}
            onClick={handleKirimAction}
            className={`rounded-lg px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60 ${
              actionType === 'revisi' ? 'bg-orange-500' : 'bg-red-600'
            }`}
          >
            {submitting ? 'Mengirim...' : actionType === 'revisi' ? 'Kirim Revisi' : 'Tolak Pengajuan'}
          </button>
          <button
            type="button"
            onClick={() => setShowActionModal(false)}
            className="rounded-lg border border-gray-400 px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100"
          >
            Batal
          </button>
        </div>
      </Modal>

      <div className="space-y-5">
        <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Detail</h2>

        <button
          type="button"
          onClick={backToList}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-dark hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-8">
            <section className="space-y-3">
              <h3 className="text-base font-bold text-[#111]">Kegiatan</h3>
              <div className="space-y-2.5">
                <DetailRow label="Nama Kegiatan" value={d.kegiatan} />
                <DetailRow label="Jenis Kegiatan" value={d.jenisLabel} />
                <DetailRow label="Skala" value={d.skalaLabel} />
                <DetailRow label="Tanggal" value={d.tanggal} />
                <DetailRow label="Penyelenggara" value={d.penyelenggara} />
                <DetailRow label="Email" value={d.email} />
                <DetailRow label="Link website Penyelenggara" value={d.linkWebsite} />
                <DetailRow label="Deskripsi Kegiatan" value={d.deskripsi} multiline />
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-[#111]">Capaian</h3>
              <div className="space-y-1.5 text-sm text-[#111]">
                {d.capaian.map((c) => (
                  <p key={typeof c === 'string' ? c : c.label}>{typeof c === 'string' ? c : c.label}</p>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-[#111]">Sub Capaian</h3>
              <div className="space-y-2.5">
                {d.subCapaian.map((sc) => (
                  <DetailRow
                    key={sc.label}
                    label={sc.label}
                    value={sc.persen || (sc.poin != null ? `${sc.poin}%` : '-')}
                  />
                ))}
              </div>
            </section>
          </div>
        </div>

        {canAct && (
          <div className="grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setShowConfirmSetujui(true)}
              className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition hover:opacity-90"
            >
              Setuju
            </button>
            <button
              type="button"
              onClick={() => openAction('revisi')}
              className="rounded-lg bg-orange-500 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-orange-600"
            >
              Revisi
            </button>
            <button
              type="button"
              onClick={() => openAction('tolak')}
              className="rounded-lg bg-red-700 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-red-800"
            >
              Tolak
            </button>
          </div>
        )}

        {!canAct && (
          <div className="rounded-xl border border-[#e9ebf8] bg-white px-6 py-4 text-sm text-[#616161]">
            Pengajuan ini sudah diverifikasi dengan status:{' '}
            <span className="font-semibold capitalize text-brand-dark">{item.status}</span>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default DetailVerifikasiPengajuanEksternal
