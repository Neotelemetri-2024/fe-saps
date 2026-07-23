import { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'

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
  deskripsi: 'Deskripsi kegiatan belum diisi oleh mahasiswa.',
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

  const stateItem = location.state?.item || {
    id,
    namaMahasiswa: 'AUFA ALATA',
    nim: '2310512011',
    prodi: 'Teknik Komputer, S1',
    kegiatan: 'Lomba Hackathon',
    jenis: 'prestasi',
    skala: 'nasional',
    tanggal: '01 Feb - 15 Nov 2026',
    penyelenggara: 'Hima FTI Universitas Indonesia',
    email: 'himatfi@gmail.com',
    linkWebsite: 'https://...',
    deskripsi: DEFAULT_DETAIL.deskripsi,
    capaian: DEFAULT_DETAIL.capaian,
    subCapaian: DEFAULT_DETAIL.subCapaian,
    status: 'pending',
  }

  const [item, setItem] = useState(stateItem)
  const [showConfirmSetujui, setShowConfirmSetujui] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState(null)
  const [alasan, setAlasan] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const backToList = () => navigate('/pimpinan-ditmawa/verifikasi-pengajuan-eksternal')

  const d = {
    ...DEFAULT_DETAIL,
    ...item,
    jenisLabel: JENIS_LABEL[item.jenis] || item.jenis || '-',
    skalaLabel: SKALA_LABEL[item.skala] || item.skala || '-',
    capaian: item.capaian?.length ? item.capaian : DEFAULT_DETAIL.capaian,
    subCapaian: item.subCapaian?.length ? item.subCapaian : DEFAULT_DETAIL.subCapaian,
  }

  const handleSetujui = async () => {
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 400))
    setItem((prev) => ({ ...prev, status: 'disetujui' }))
    toast.success('Pengajuan disetujui!')
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
        message="Pengajuan ini akan disetujui dan poin akan diberikan kepada mahasiswa."
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
              <h3 className="text-base font-bold text-[#111]">Informasi Mahasiswa</h3>
              <div className="space-y-2.5">
                <DetailRow label="Nama Mahasiswa" value={d.namaMahasiswa} />
                <DetailRow label="NIM" value={d.nim} />
                <DetailRow label="Program Studi" value={d.prodi} />
              </div>
            </section>

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

export default DetailVerifikasiPengajuanEksternal
