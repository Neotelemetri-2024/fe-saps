import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, BookOpen, CheckCircle2, FileText, RotateCcw, User, XCircle } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { getCurrentUser } from '../../services/authService'
import { getKlaimById, verifikasiKlaim } from '../../services/poinService'
import { getApiBase } from '../../services/apiClient'
import { InfoRow, SectionCard, formatTanggal } from '../../components/ui/DetailComponents'

function mapStatus(status) {
  const s = String(status || '').toLowerCase()
  if (['menunggu_validasi', 'pending', 'menunggu_pimpinan'].includes(s)) return 'pending'
  if (['perlu_revisi', 'revisi'].includes(s)) return 'revisi'
  if (['disetujui'].includes(s)) return 'disetujui'
  if (['ditolak'].includes(s)) return 'ditolak'
  return s || 'pending'
}

function normalizeDetail(raw) {
  if (!raw) return null
  const part = raw.partisipasi || {}
  const kegiatan = part.kegiatan || {}
  const mahasiswa = part.mahasiswa || {}
  const capaianList = (kegiatan.kegiatanCapaian || []).map((kc) => kc.subCapaian?.capaian?.nama).filter(Boolean)
  const buktiUrl = raw.bukti?.[0]?.url || raw.buktiUrl || null
  const apiBase = getApiBase()
  return {
    id: String(raw.id),
    mahasiswa: mahasiswa.user?.nama || raw.mahasiswa || '-',
    nim: mahasiswa.nim || '-',
    prodi: mahasiswa.prodi?.nama || '-',
    kegiatan: kegiatan.nama || raw.kegiatan || '-',
    kategori: kegiatan.kategori?.nama || '-',
    peran: raw.peranUsulan?.nama || part.peranVerif?.nama || '-',
    tanggal: formatTanggal(kegiatan.tanggalMulai, kegiatan.tanggalSelesai),
    penyelenggara: kegiatan.penyelenggaraExt || kegiatan.organisasi?.nama || '-',
    email: kegiatan.emailExt || mahasiswa.user?.email || '-',
    linkWebsite: kegiatan.linkWebsiteExt || '-',
    deskripsi: kegiatan.deskripsi || '-',
    bukti: buktiUrl ? (buktiUrl.startsWith('http') ? buktiUrl : `${apiBase}${buktiUrl}`) : null,
    capaian: [...new Set(capaianList)],
    subCapaian: (kegiatan.kegiatanCapaian || []).map((kc) => ({
      label: kc.subCapaian?.nama || '-',
      capaian: kc.subCapaian?.capaian?.nama || '',
      persen: kc.alokasiPersen != null ? `${kc.alokasiPersen}%` : kc.persentase != null ? `${kc.persentase}%` : '-',
    })),
    status: mapStatus(raw.status),
    alasan: raw.alasan || null,
  }
}

function DetailVerifikasiKlaimPoin() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const user = getCurrentUser()

  const [item, setItem] = useState(location.state?.item ? normalizeDetail({ ...location.state.item, status: location.state.item.statusRaw || location.state.item.status }) : null)
  const [loading, setLoading] = useState(!location.state?.item)
  const [showConfirmSetujui, setShowConfirmSetujui] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState(null)
  const [alasan, setAlasan] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setLoading(true)
    getKlaimById(id)
      .then((data) => setItem(normalizeDetail(data)))
      .catch((err) => { if (!location.state?.item) { toast.error('Gagal memuat detail', { description: err.message }); setItem(null) } })
      .finally(() => setLoading(false))
  }, [id])

  const backToList = () => navigate('/admin_ditmawa/verifikasi-klaim')

  const handleSetujui = async () => {
    setSubmitting(true)
    try {
      await verifikasiKlaim(id, { keputusan: 'disetujui' })
      toast.success('Klaim poin disetujui!', { description: `Poin untuk "${item?.kegiatan}" telah diberikan.` })
      setShowConfirmSetujui(false)
      backToList()
    } catch (err) { toast.error('Gagal', { description: err.message }) }
    finally { setSubmitting(false) }
  }

  const handleKirimAction = async () => {
    if (!alasan.trim()) { toast.error('Alasan tidak boleh kosong.'); return }
    setSubmitting(true)
    try {
      const keputusan = actionType === 'revisi' ? 'perlu_revisi' : 'ditolak'
      await verifikasiKlaim(id, { keputusan, alasan: alasan.trim() })
      toast.success(actionType === 'revisi' ? 'Revisi dikirim!' : 'Ditolak!', {
        description: actionType === 'revisi' ? 'Catatan revisi dikirim ke mahasiswa.' : `Klaim "${item?.kegiatan}" ditolak.`,
      })
      setShowActionModal(false)
      backToList()
    } catch (err) { toast.error('Gagal', { description: err.message }) }
    finally { setSubmitting(false) }
  }

  const canAct = item?.status === 'pending'

  if (loading && !item) return (
    <DashboardLayout role="admin_ditmawa" userName={user?.nama || 'Admin Ditmawa'} userRole="Admin Ditmawa">
      <div className="py-24 text-center text-sm text-[#9aa0a6]">Memuat detail…</div>
    </DashboardLayout>
  )

  if (!item) return (
    <DashboardLayout role="admin_ditmawa" userName={user?.nama || 'Admin Ditmawa'} userRole="Admin Ditmawa">
      <div className="flex flex-col items-center gap-4 py-20">
        <p className="text-base font-semibold text-[#616161]">Data klaim tidak ditemukan.</p>
        <button type="button" onClick={backToList} className="rounded-lg bg-brand-dark px-6 py-2 text-sm font-semibold text-white hover:opacity-90">Kembali</button>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout role="admin_ditmawa" userName={user?.nama || 'Admin Ditmawa'} userRole="Admin Ditmawa">
      <ConfirmModal
        isOpen={showConfirmSetujui}
        message={`Klaim poin "${item?.kegiatan}" oleh ${item?.mahasiswa} akan disetujui.`}
        confirmText={submitting ? 'Memproses...' : 'YA, SETUJUI'}
        cancelText="BATAL"
        onConfirm={handleSetujui}
        onCancel={() => setShowConfirmSetujui(false)}
      />
      <Modal isOpen={showActionModal} onClose={() => !submitting && setShowActionModal(false)} size="md">
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#111]">{actionType === 'revisi' ? 'Minta Revisi' : 'Tolak Klaim'}</h3>
            <p className="mt-0.5 text-sm text-[#616161]">{actionType === 'revisi' ? 'Tuliskan catatan yang perlu diperbaiki.' : 'Tuliskan alasan penolakan klaim.'}</p>
          </div>
          <textarea className="w-full rounded-xl border border-[#e9ebf8] p-3 text-sm text-[#333] outline-none focus:border-brand-dark focus:ring-1 focus:ring-brand-dark" rows={4}
            placeholder={actionType === 'revisi' ? 'Contoh: Bukti belum lengkap...' : 'Contoh: Kegiatan tidak memenuhi syarat...'}
            value={alasan} onChange={(e) => setAlasan(e.target.value)} />
          <div className="flex gap-3 pt-1">
            <button type="button" disabled={submitting} onClick={handleKirimAction}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60 ${actionType === 'revisi' ? 'bg-orange-500' : 'bg-red-600'}`}>
              {submitting ? 'Mengirim…' : actionType === 'revisi' ? 'Kirim Revisi' : 'Tolak Klaim'}
            </button>
            <button type="button" disabled={submitting} onClick={() => setShowActionModal(false)}
              className="flex-1 rounded-xl border border-[#d9dce7] py-2.5 text-sm font-semibold text-[#333] hover:bg-[#f5f6f8]">Batal</button>
          </div>
        </div>
      </Modal>

      <div className="space-y-5">
        <button type="button" onClick={backToList}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-dark hover:underline">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[#222] sm:text-2xl">Detail Klaim Poin</h2>
            <p className="mt-1 text-sm text-[#616161]">Tinjau informasi klaim sebelum memberikan keputusan.</p>
          </div>
          <div className="shrink-0"><StatusBadge status={item.status} /></div>
        </div>

        {!canAct && item.alasan && (
          <div className={`rounded-xl border p-4 ${item.status === 'ditolak' ? 'border-red-200 bg-red-50' : item.status === 'revisi' ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'}`}>
            <p className={`text-xs font-semibold mb-1 ${item.status === 'ditolak' ? 'text-red-700' : item.status === 'revisi' ? 'text-yellow-700' : 'text-green-700'}`}>
              {item.status === 'ditolak' ? 'Alasan Penolakan' : 'Catatan Revisi'}
            </p>
            <p className={`text-sm whitespace-pre-wrap ${item.status === 'ditolak' ? 'text-red-800' : item.status === 'revisi' ? 'text-yellow-800' : 'text-green-800'}`}>{item.alasan}</p>
          </div>
        )}

        {!canAct && !item.alasan && (
          <div className="rounded-xl border border-[#e9ebf8] bg-[#f9fafb] px-5 py-3.5 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <p className="text-sm text-[#616161]">Klaim sudah diverifikasi dengan status <StatusBadge status={item.status} /></p>
          </div>
        )}

        <SectionCard title="Informasi Mahasiswa" icon={User}>
          <InfoRow label="Nama Mahasiswa" value={item.mahasiswa} />
          <InfoRow label="NIM" value={item.nim} />
          <InfoRow label="Program Studi" value={item.prodi} />
        </SectionCard>

        <SectionCard title="Detail Kegiatan" icon={FileText}>
          <InfoRow label="Nama Kegiatan" value={item.kegiatan} />
          <InfoRow label="Kategori" value={item.kategori} />
          <InfoRow label="Peran" value={item.peran} />
          <InfoRow label="Tanggal" value={item.tanggal} />
          <InfoRow label="Penyelenggara" value={item.penyelenggara} />
          {item.email && item.email !== '-' && <InfoRow label="Email" value={item.email} href={`mailto:${item.email}`} />}
          {item.linkWebsite && item.linkWebsite !== '-' && <InfoRow label="Link Website" value={item.linkWebsite} href={item.linkWebsite} />}
          {item.deskripsi && item.deskripsi !== '-' && <InfoRow label="Deskripsi" value={item.deskripsi} multiline />}
        </SectionCard>

        <SectionCard title="Bukti Dokumen">
          {item.bukti ? (
            <a href={item.bukti} target="_blank" rel="noreferrer" className="text-sm font-medium text-brand-dark underline hover:opacity-75">
              Lihat bukti dokumen
            </a>
          ) : (
            <p className="text-sm text-[#9aa0a6]">Tidak ada bukti</p>
          )}
        </SectionCard>

        {item.capaian?.length > 0 && (
          <SectionCard title="Capaian Kurikulum" icon={BookOpen}>
            {item.capaian.map((c, i) => <p key={i} className="text-sm font-medium text-[#111]">{c}</p>)}
          </SectionCard>
        )}

        {item.subCapaian?.length > 0 && (
          <SectionCard title="Sub Capaian & Bobot">
            {item.subCapaian.map((sc, i) => <InfoRow key={i} label={sc.label} sublabel={sc.capaian} value={sc.persen} />)}
          </SectionCard>
        )}

        {canAct && (
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-bold text-[#333]">Keputusan Verifikasi</h3>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setShowConfirmSetujui(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90">
                <CheckCircle2 className="h-4 w-4" /> Setujui Klaim
              </button>
              <button type="button" onClick={() => { setActionType('revisi'); setAlasan(''); setShowActionModal(true) }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-400 bg-orange-50 px-5 py-2.5 text-sm font-bold text-orange-600 transition hover:bg-orange-500 hover:text-white">
                <RotateCcw className="h-4 w-4" /> Minta Revisi
              </button>
              <button type="button" onClick={() => { setActionType('tolak'); setAlasan(''); setShowActionModal(true) }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-600 hover:text-white">
                <XCircle className="h-4 w-4" /> Tolak
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default DetailVerifikasiKlaimPoin
