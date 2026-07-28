import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, CalendarDays, CheckCircle2, XCircle, RotateCcw } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { getCurrentUser } from '../../services/authService'
import { getKegiatanById, approvalKegiatan } from '../../services/kegiatanService'

function InfoRow({ label, value, href, multiline = false }) {
  return (
    <div className={`flex flex-col gap-0.5 sm:flex-row sm:gap-4 ${multiline ? 'sm:items-start' : 'sm:items-baseline'}`}>
      <p className="w-full shrink-0 text-xs font-semibold uppercase tracking-wide text-[#9aa0a6] sm:w-44">{label}</p>
      {href && value && value !== '-' ? (
        <a href={href} target="_blank" rel="noopener noreferrer"
          className="break-all text-sm text-brand-dark underline hover:opacity-75">{value}</a>
      ) : (
        <p className={`text-sm font-medium text-[#111] ${multiline ? 'leading-relaxed' : ''}`}>{value || '-'}</p>
      )}
    </div>
  )
}

function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="rounded-xl border border-[#e9ebf8] bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-[#e9ebf8] bg-[#f9fafb] px-5 py-3.5">
        {Icon && <Icon className="h-4 w-4 text-brand-dark" />}
        <h3 className="text-sm font-bold text-brand-dark">{title}</h3>
      </div>
      <div className="space-y-3.5 p-5">{children}</div>
    </div>
  )
}

function mapUiStatus(status) {
  const s = String(status || '').toLowerCase()
  if (['diajukan', 'pending', 'terverifikasi'].includes(s)) return 'pending'
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
    namaUkm: raw.organisasi?.nama || raw.namaUkm || '-',
    jenis: raw.kategori?.nama || raw.jenis || '-',
    skala: raw.skala?.nama || raw.skala || '-',
    tanggal: formatTanggal(raw.tanggalMulai, raw.tanggalSelesai) || raw.tanggal || '-',
    penyelenggara: raw.penyelenggaraExt || raw.organisasi?.nama || raw.penyelenggara || '-',
    email: raw.email || '-',
    linkWebsite: raw.linkWebsite || raw.website || '-',
    deskripsi: raw.deskripsi || '',
    capaian: capaian.length ? capaian : (raw.capaian || []),
    subCapaian: subCapaian.length ? subCapaian : (raw.subCapaian || []),
    status: mapUiStatus(raw.status || raw.rawStatus || raw.updatedStatus),
    alasan: raw.alasan || raw.kegiatanApproval?.[0]?.alasan || '',
  }
}

function DetailVerifikasiUKMF() {
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
          setItem(normalizeDetail({ ...location.state.item, nama: location.state.item.kegiatan }))
        } else {
          setItem(null)
          toast.error('Gagal memuat detail', { description: err.message })
        }
      })
      .finally(() => setLoading(false))
  }, [id, location.state])

  const backToList = () => navigate('/pimpinan_fakultas/verifikasi-pengajuan-ukmf')

  const handleSetujui = async () => {
    setSubmitting(true)
    try {
      await approvalKegiatan(id, { keputusan: 'setuju' })
      toast.success('Disetujui!', { description: `Pengajuan "${item?.kegiatan}" telah disetujui.` })
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
      toast.success(actionType === 'revisi' ? 'Revisi dikirim!' : 'Ditolak!', {
        description: actionType === 'revisi'
          ? 'Catatan revisi dikirim ke pengaju.'
          : `Pengajuan "${item?.kegiatan}" ditolak.`,
      })
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
      <DashboardLayout role="pimpinan_fakultas" userName={user?.nama || 'Pimpinan Fakultas'} userRole="Pimpinan Fakultas">
        <div className="py-24 text-center text-sm text-[#9aa0a6]">Memuat detail…</div>
      </DashboardLayout>
    )
  }

  if (!item) {
    return (
      <DashboardLayout role="pimpinan_fakultas" userName={user?.nama || 'Pimpinan Fakultas'} userRole="Pimpinan Fakultas">
        <div className="flex flex-col items-center gap-4 py-20">
          <p className="text-base font-semibold text-[#616161]">Data tidak ditemukan.</p>
          <button type="button" onClick={backToList}
            className="rounded-lg bg-brand-dark px-6 py-2 text-sm font-semibold text-white hover:opacity-90">
            Kembali
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="pimpinan_fakultas" userName={user?.nama || 'Pimpinan Fakultas'} userRole="Pimpinan Fakultas">
      <ConfirmModal
        isOpen={showConfirmSetujui}
        message={`Pengajuan kegiatan "${item?.kegiatan}" akan disetujui.`}
        confirmText={submitting ? 'Memproses...' : 'Ya, Setujui'}
        cancelText="Batal"
        onConfirm={handleSetujui}
        onCancel={() => setShowConfirmSetujui(false)}
      />

      <Modal isOpen={showActionModal} onClose={() => !submitting && setShowActionModal(false)} size="md">
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#111]">
              {actionType === 'revisi' ? 'Minta Revisi' : 'Tolak Pengajuan'}
            </h3>
            <p className="mt-0.5 text-sm text-[#616161]">
              {actionType === 'revisi'
                ? 'Tuliskan catatan yang perlu diperbaiki.'
                : 'Tuliskan alasan penolakan pengajuan ini.'}
            </p>
          </div>
          <textarea
            className="w-full rounded-xl border border-[#e9ebf8] p-3 text-sm text-[#333] outline-none focus:border-brand-dark focus:ring-1 focus:ring-brand-dark"
            rows={4}
            placeholder={actionType === 'revisi' ? 'Tuliskan catatan revisi...' : 'Tuliskan alasan penolakan...'}
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
          />
          <div className="flex gap-3 pt-1">
            <button type="button" disabled={submitting} onClick={handleKirimAction}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60 ${actionType === 'revisi' ? 'bg-orange-500' : 'bg-red-600'}`}>
              {submitting ? 'Mengirim…' : actionType === 'revisi' ? 'Kirim Revisi' : 'Tolak Pengajuan'}
            </button>
            <button type="button" disabled={submitting} onClick={() => setShowActionModal(false)}
              className="flex-1 rounded-xl border border-[#d9dce7] py-2.5 text-sm font-semibold text-[#333] hover:bg-[#f5f6f8]">
              Batal
            </button>
          </div>
        </div>
      </Modal>

      <div className="space-y-5">
        <button type="button" onClick={backToList}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-dark hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Daftar
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-brand-dark sm:text-2xl">Detail Pengajuan Kegiatan UKMF</h2>
            <p className="mt-1 text-sm text-[#616161]">Tinjau informasi kegiatan sebelum memberikan keputusan.</p>
          </div>
          <div className="shrink-0"><StatusBadge status={item.status} /></div>
        </div>

        {!canAct && item.alasan && (
          <div className={`rounded-xl border p-4 ${item.status === 'ditolak' ? 'border-red-200 bg-red-50' : item.status === 'revisi' ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'}`}>
            <p className={`text-xs font-semibold mb-1 ${item.status === 'ditolak' ? 'text-red-700' : item.status === 'revisi' ? 'text-yellow-700' : 'text-green-700'}`}>
              {item.status === 'ditolak' ? 'Alasan Penolakan' : 'Catatan Revisi'}
            </p>
            <p className={`text-sm whitespace-pre-wrap ${item.status === 'ditolak' ? 'text-red-800' : item.status === 'revisi' ? 'text-yellow-800' : 'text-green-800'}`}>
              {item.alasan}
            </p>
          </div>
        )}

        {!canAct && !item.alasan && (
          <div className="rounded-xl border border-[#e9ebf8] bg-[#f9fafb] px-5 py-3.5 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#9aa0a6]" />
            <p className="text-sm text-[#616161]">
              Pengajuan ini sudah diverifikasi dengan status <StatusBadge status={item.status} />
            </p>
          </div>
        )}

        <SectionCard title="Detail Kegiatan" icon={CalendarDays}>
          <InfoRow label="Nama Kegiatan" value={item.kegiatan} />
          <InfoRow label="Nama UKMF" value={item.namaUkm} />
          <InfoRow label="Jenis Kegiatan" value={item.jenis} />
          <InfoRow label="Skala" value={item.skala} />
          <InfoRow label="Tanggal Pelaksanaan" value={item.tanggal} />
          <InfoRow label="Penyelenggara" value={item.penyelenggara} />
          {item.email && item.email !== '-' && (
            <InfoRow label="Email Penyelenggara" value={item.email} href={`mailto:${item.email}`} />
          )}
          {item.linkWebsite && item.linkWebsite !== '-' && (
            <InfoRow label="Link Website" value={item.linkWebsite} href={item.linkWebsite} />
          )}
          {item.deskripsi && (
            <InfoRow label="Deskripsi" value={item.deskripsi} multiline />
          )}
        </SectionCard>

        {item.capaian.length > 0 && (
          <SectionCard title="Capaian Kurikulum">
            <div className="space-y-1.5">
              {item.capaian.map((c) => (
                <p key={typeof c === 'string' ? c : c.label} className="text-sm font-medium text-[#111]">
                  {typeof c === 'string' ? c : c.label}
                </p>
              ))}
            </div>
          </SectionCard>
        )}

        {item.subCapaian.length > 0 && (
          <SectionCard title="Sub Capaian & Bobot">
            <div className="space-y-3.5">
              {item.subCapaian.map((sc, i) => (
                <InfoRow key={i} label={sc.label} value={sc.persen || `${sc.poin || 0}%`} />
              ))}
            </div>
          </SectionCard>
        )}

        {canAct && (
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-[#333]">Keputusan Verifikasi</h3>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => setShowConfirmSetujui(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90">
                <CheckCircle2 className="h-4 w-4" /> Setujui
              </button>
              <button type="button" onClick={() => { setActionType('revisi'); setAlasan(''); setShowActionModal(true) }}
                className="inline-flex items-center gap-2 rounded-xl border border-orange-400 bg-orange-50 px-5 py-2.5 text-sm font-bold text-orange-600 transition hover:bg-orange-500 hover:text-white">
                <RotateCcw className="h-4 w-4" /> Minta Revisi
              </button>
              <button type="button" onClick={() => { setActionType('tolak'); setAlasan(''); setShowActionModal(true) }}
                className="inline-flex items-center gap-2 rounded-xl border border-red-400 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-600 hover:text-white">
                <XCircle className="h-4 w-4" /> Tolak
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default DetailVerifikasiUKMF
