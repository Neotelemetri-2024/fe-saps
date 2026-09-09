import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { DetailSkeleton } from '../../components/dashboard/Skeleton'
import { getCurrentUser } from '../../services/authService'
import { getKlaimById, verifikasiKlaim } from '../../services/poinService'
import { resolveUploadUrl } from '../../services/apiClient'
import {
  InfoRow,
  SectionCard,
  CurriculumAchievementCard,
  formatTanggal,
  DetailBackButton,
  DetailHeader,
  DecisionNote,
  RejectForm,
  DecisionActions,
  EmptyDetail,
} from '../../components/ui/DetailComponents'

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
  const mhsKurNama = mahasiswa.kurikulum?.nama || (typeof mahasiswa.kurikulum === 'string' ? mahasiswa.kurikulum : null) || raw.kurikulumNama || raw.kurikulum?.nama || null
  const allKc = kegiatan.kegiatanCapaian || []
  const matched = mhsKurNama
    ? allKc.filter((kc) => kc.subCapaian?.capaian?.kurikulum?.nama === mhsKurNama)
    : []
  const targetKc = matched.length > 0 ? matched : allKc
  const kurikulumDisplay = mhsKurNama || targetKc[0]?.subCapaian?.capaian?.kurikulum?.nama || '-'

  const capaianMap = new Map()
  const subCapaianList = []

  targetKc.forEach((kc) => {
    const capNama = kc.subCapaian?.capaian?.nama
    const kurNama = kc.subCapaian?.capaian?.kurikulum?.nama || kurikulumDisplay
    if (capNama && !capaianMap.has(capNama)) {
      capaianMap.set(capNama, { label: capNama, kurikulum: kurNama })
    }
    if (kc.subCapaian?.nama) {
      subCapaianList.push({
        label: kc.subCapaian.nama,
        capaian: capNama || '',
        kurikulum: kurNama,
        persen: kc.alokasiPersen != null ? `${kc.alokasiPersen}%` : kc.persentase != null ? `${kc.persentase}%` : '-',
      })
    }
  })

  const buktiRaw =
    (typeof raw.bukti === 'string' ? raw.bukti : null) ||
    raw.bukti?.[0]?.url ||
    raw.buktiUrl ||
    null
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
    bukti: resolveUploadUrl(buktiRaw),
    kurikulum: kurikulumDisplay,
    capaian: Array.from(capaianMap.values()),
    subCapaian: subCapaianList,
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

  if (loading && !item) {
    return (
      <DashboardLayout role="admin_ditmawa" userName={user?.nama || 'Admin Ditmawa'} userRole="Admin Ditmawa">
        <DetailSkeleton />
      </DashboardLayout>
    )
  }

  if (!item) {
    return (
      <DashboardLayout role="admin_ditmawa" userName={user?.nama || 'Admin Ditmawa'} userRole="Admin Ditmawa">
        <EmptyDetail onBack={backToList} message="Data klaim tidak ditemukan." />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="admin_ditmawa" userName={user?.nama || 'Admin Ditmawa'} userRole="Admin Ditmawa">
      <ConfirmModal
        isOpen={showConfirmSetujui}
        message={`Klaim poin "${item?.kegiatan}" oleh ${item?.mahasiswa} akan disetujui.`}
        confirmText={submitting ? 'Memproses…' : 'Setujui'}
        cancelText="Batal"
        onConfirm={handleSetujui}
        onCancel={() => setShowConfirmSetujui(false)}
      />
      <Modal isOpen={showActionModal} onClose={() => !submitting && setShowActionModal(false)} size="md">
        <RejectForm
          title={actionType === 'revisi' ? 'Minta revisi' : 'Tolak klaim'}
          description={actionType === 'revisi' ? 'Tuliskan catatan yang perlu diperbaiki.' : 'Tuliskan alasan penolakan klaim.'}
          placeholder={actionType === 'revisi' ? 'Contoh: Bukti belum lengkap.' : 'Contoh: Kegiatan tidak memenuhi syarat.'}
          submitLabel={actionType === 'revisi' ? 'Kirim revisi' : 'Tolak'}
          variant={actionType === 'revisi' ? 'warning' : 'error'}
          alasan={alasan}
          onChange={setAlasan}
          onSubmit={handleKirimAction}
          onCancel={() => setShowActionModal(false)}
          submitting={submitting}
        />
      </Modal>

      <div className="space-y-5">
        <DetailBackButton onClick={backToList} />
        <DetailHeader
          title="Detail klaim poin"
          description="Tinjau informasi klaim sebelum memberi keputusan."
          status={item.status}
        />

        {!canAct && item.alasan ? <DecisionNote status={item.status} alasan={item.alasan} /> : null}

        <SectionCard title="Informasi Mahasiswa">
          <InfoRow label="Nama Mahasiswa" value={item.mahasiswa} />
          <InfoRow label="NIM" value={item.nim} />
          <InfoRow label="Program Studi" value={item.prodi} />
        </SectionCard>

        <SectionCard title="Detail Kegiatan">
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
            <a href={item.bukti} target="_blank" rel="noreferrer" className="link link-primary text-sm">
              Lihat bukti dokumen
            </a>
          ) : (
            <p className="text-sm text-base-content/50">Tidak ada bukti</p>
          )}
        </SectionCard>

        <CurriculumAchievementCard
          kurikulum={item.kurikulum}
          capaian={item.capaian}
          subCapaian={item.subCapaian}
        />

        {canAct ? (
          <DecisionActions
            onReject={() => { setActionType('tolak'); setAlasan(''); setShowActionModal(true) }}
            onRevise={() => { setActionType('revisi'); setAlasan(''); setShowActionModal(true) }}
            onApprove={() => setShowConfirmSetujui(true)}
            approveLabel="Setujui klaim"
          />
        ) : null}
      </div>
    </DashboardLayout>
  )
}

export default DetailVerifikasiKlaimPoin
