import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { getCurrentUser } from '../../services/authService'
import { getKegiatanById, approvalKegiatan } from '../../services/kegiatanService'

function DetailRow({ label, value, multiline = false }) {
  return (
    <div className={`grid grid-cols-1 gap-1 sm:grid-cols-[220px_1fr] sm:gap-6 ${multiline ? 'items-start' : 'items-baseline'}`}>
      <p className="text-sm font-medium text-[#333]">{label}</p>
      <p className={`text-sm text-[#111] ${multiline ? 'leading-relaxed' : ''}`}>{value || '-'}</p>
    </div>
  )
}

function mapUiStatus(status) {
  const s = String(status || '').toLowerCase()
  if (['terverifikasi', 'pending', 'diajukan'].includes(s)) return 'pending'
  if (['perlu_revisi', 'revisi'].includes(s)) return 'revisi'
  if (['ditolak'].includes(s)) return 'ditolak'
  if (['disetujui', 'terpublikasi'].includes(s)) return 'disetujui'
  return s || 'pending'
}

function formatTanggal(start, end) {
  if (!start) return '-'
  try {
    const a = new Date(start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    if (!end) return a
    const b = new Date(end).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    return `${a} - ${b}`
  } catch {
    return String(start)
  }
}

function normalizeDetail(raw) {
  if (!raw) return null
  const capaian = []
  const subCapaian = []
  ;(raw.kegiatanCapaian || []).forEach((kc) => {
    const capNama = kc.subCapaian?.capaian?.nama
    if (capNama && !capaian.includes(capNama)) capaian.push(capNama)
    if (kc.subCapaian?.nama) {
      subCapaian.push({
        label: kc.subCapaian.nama,
        persen: `${kc.alokasiPersen ?? kc.persen ?? 0}%`,
      })
    }
  })

  return {
    id: raw.id,
    kegiatan: raw.nama || raw.kegiatan || '-',
    namaUkm: raw.organisasi?.nama || raw.namaOrganisasi || raw.namaUkm || '-',
    jenis: raw.kategori?.nama || raw.kategori || raw.jenis || '-',
    skala: raw.skala?.nama || raw.skala || '-',
    tanggal: formatTanggal(raw.tanggalMulai, raw.tanggalSelesai) || raw.tanggal || '-',
    penyelenggara: raw.penyelenggaraExt || raw.organisasi?.nama || raw.penyelenggara || '-',
    email: raw.email || '-',
    linkWebsite: raw.linkWebsite || raw.website || '-',
    deskripsi: raw.deskripsi || '-',
    capaian: capaian.length ? capaian : (raw.capaian || []),
    subCapaian: subCapaian.length ? subCapaian : (raw.subCapaian || []),
    bukti: raw.bukti || raw.buktiUrl || null,
    status: mapUiStatus(raw.status),
    alasan: raw.alasan || raw.kegiatanApproval?.[0]?.alasan || '',
  }
}

function DetailVerifikasiPengajuanUKM() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const user = getCurrentUser()

  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showConfirmSetujui, setShowConfirmSetujui] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState(null)
  const [alasan, setAlasan] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setLoading(true)
    getKegiatanById(id)
      .then((data) => setItem(normalizeDetail(data)))
      .catch((err) => {
        if (location.state?.item) {
          setItem(normalizeDetail({
            ...location.state.item,
            nama: location.state.item.kegiatan,
            organisasi: { nama: location.state.item.namaOrganisasi || location.state.item.namaUkm },
          }))
        } else {
          setItem(null)
          toast.error('Gagal memuat detail', { description: err.message })
        }
      })
      .finally(() => setLoading(false))
  }, [id, location.state])

  const backToList = () => navigate('/pimpinan_ditmawa/verifikasi-pengajuan-ukm')

  const handleSetujui = async () => {
    setSubmitting(true)
    try {
      await approvalKegiatan(id, { keputusan: 'setuju' })
      toast.success('Pengajuan UKM disetujui!')
      setShowConfirmSetujui(false)
      backToList()
    } catch (err) {
      toast.error('Gagal', { description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleKirimAction = async () => {
    if (!alasan.trim()) {
      toast.error('Alasan tidak boleh kosong.')
      return
    }
    setSubmitting(true)
    try {
      const keputusan = actionType === 'revisi' ? 'revisi' : 'tolak'
      await approvalKegiatan(id, { keputusan, alasan: alasan.trim() })
      toast.success(actionType === 'revisi' ? 'Revisi dikirim!' : 'Ditolak!')
      setShowActionModal(false)
      backToList()
    } catch (err) {
      toast.error('Gagal', { description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const canAct = item?.status === 'pending'

  if (loading) {
    return (
      <DashboardLayout role="pimpinan_ditmawa" userName={user?.nama || 'Pimpinan Ditmawa'} userRole="Pimpinan Ditmawa">
        <p className="text-sm text-[#616161]">Memuat detail…</p>
      </DashboardLayout>
    )
  }

  if (!item) {
    return (
      <DashboardLayout role="pimpinan_ditmawa" userName={user?.nama || 'Pimpinan Ditmawa'} userRole="Pimpinan Ditmawa">
        <p className="text-sm text-[#616161]">Data tidak ditemukan.</p>
        <button type="button" onClick={backToList} className="mt-3 text-sm font-medium text-brand-dark hover:underline">
          Kembali
        </button>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="pimpinan_ditmawa" userName={user?.nama || 'Pimpinan Ditmawa'} userRole="Pimpinan Ditmawa">
      <ConfirmModal
        isOpen={showConfirmSetujui}
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
                <DetailRow label="Link Website Penyelenggara" value={item.linkWebsite} />
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
                {(item.capaian || []).length === 0 ? (
                  <p className="text-[#9aa0a6]">-</p>
                ) : (
                  (item.capaian || []).map((c) => (
                    <p key={typeof c === 'string' ? c : c.label}>{typeof c === 'string' ? c : c.label}</p>
                  ))
                )}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-[#111]">Sub Capaian</h3>
              <div className="space-y-2.5">
                {(item.subCapaian || []).length === 0 ? (
                  <p className="text-sm text-[#9aa0a6]">-</p>
                ) : (
                  (item.subCapaian || []).map((sc) => (
                    <DetailRow key={sc.label} label={sc.label} value={sc.persen || `${sc.poin || 0}%`} />
                  ))
                )}
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
