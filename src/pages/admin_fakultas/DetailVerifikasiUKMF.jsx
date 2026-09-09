import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { DetailSkeleton } from '../../components/dashboard/Skeleton'
import { getCurrentUser } from '../../services/authService'
import { getKegiatanById, verifikasiKegiatan } from '../../services/kegiatanService'
import {
  InfoRow,
  SectionCard,
  CurriculumAchievementCard,
  mapUiStatus,
  formatTanggal,
  DetailBackButton,
  DetailHeader,
  DecisionNote,
  RejectForm,
  DecisionActions,
  EmptyDetail,
} from '../../components/ui/DetailComponents'

function normalizeDetail(raw) {
  if (!raw) return null
  const capaianMap = new Map()
  const subCapaianList = []
  const kurikulumList = (raw.kegiatanCapaian || []).map((kc) => kc.subCapaian?.capaian?.kurikulum?.nama).filter(Boolean)
  const kurikulumNama = raw.kurikulumNama || raw.kurikulum?.nama || kurikulumList[0] || (typeof raw.kurikulum === 'string' ? raw.kurikulum : '-')
  ;(raw.kegiatanCapaian || []).forEach((kc) => {
    const kurNama = kc.subCapaian?.capaian?.kurikulum?.nama || kurikulumNama
    const capNama = kc.subCapaian?.capaian?.nama
    if (capNama) {
      const capKey = `${kurNama}___${capNama}`
      if (!capaianMap.has(capKey)) {
        capaianMap.set(capKey, { label: capNama, kurikulum: kurNama })
      }
    }
    if (kc.subCapaian?.nama) {
      subCapaianList.push({
        label: kc.subCapaian.nama,
        capaian: capNama || '',
        kurikulum: kurNama,
        persen: `${kc.alokasiPersen ?? 0}%`,
      })
    }
  })
  return {
    id: raw.id,
    kegiatan: raw.nama || '-',
    namaUkm: raw.organisasi?.nama || '-',
    jenis: raw.kategori?.nama || '-',
    skala: raw.skala?.nama || '-',
    tanggal: formatTanggal(raw.tanggalMulai, raw.tanggalSelesai) || '-',
    deskripsi: raw.deskripsi || '-',
    capaian: Array.from(capaianMap.values()),
    subCapaian: subCapaianList,
    kurikulum: kurikulumNama,
    kegiatanCapaian: raw.kegiatanCapaian || [],
    status: mapUiStatus(raw.status || raw.rawStatus),
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
        if (location.state?.item) setItem(normalizeDetail({ ...location.state.item, nama: location.state.item.kegiatan }))
        else { setItem(null); toast.error('Gagal memuat detail', { description: err.message }) }
      })
      .finally(() => setLoading(false))
  }, [id, location.state])

  const backToList = () => navigate('/admin_fakultas/verifikasi-pengajuan-ukmf')

  const handleSetujui = async () => {
    setSubmitting(true)
    try {
      await verifikasiKegiatan(id, { keputusan: 'setuju' })
      toast.success('Diteruskan ke Pimpinan Fakultas', { description: `Pengajuan "${item?.kegiatan}" telah diteruskan.` })
      setShowConfirmSetujui(false)
      backToList()
    } catch (err) { toast.error('Gagal', { description: err.message }) }
    finally { setSubmitting(false) }
  }

  const handleKirimAction = async () => {
    if (!alasan.trim()) { toast.error('Alasan tidak boleh kosong.'); return }
    setSubmitting(true)
    try {
      const keputusan = actionType === 'revisi' ? 'revisi' : 'tolak'
      await verifikasiKegiatan(id, { keputusan, alasan: alasan.trim() })
      toast.success(actionType === 'revisi' ? 'Revisi dikirim!' : 'Ditolak!', {
        description: actionType === 'revisi' ? 'Catatan revisi dikirim ke pengaju.' : `Pengajuan "${item?.kegiatan}" ditolak.`,
      })
      setShowActionModal(false)
      backToList()
    } catch (err) { toast.error('Gagal', { description: err.message }) }
    finally { setSubmitting(false) }
  }

  const canAct = item?.status === 'pending'
  const isRevisi = actionType === 'revisi'

  if (loading) {
    return (
      <DashboardLayout role="admin_fakultas" userName={user?.nama || 'Admin Fakultas'} userRole="Admin Fakultas">
        <DetailSkeleton />
      </DashboardLayout>
    )
  }

  if (!item) {
    return (
      <DashboardLayout role="admin_fakultas" userName={user?.nama || 'Admin Fakultas'} userRole="Admin Fakultas">
        <EmptyDetail onBack={backToList} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="admin_fakultas" userName={user?.nama || 'Admin Fakultas'} userRole="Admin Fakultas">
      <ConfirmModal
        isOpen={showConfirmSetujui}
        message="Pengajuan ini akan diteruskan ke Pimpinan Fakultas?"
        confirmText={submitting ? 'Memproses…' : 'Teruskan ke pimpinan'}
        cancelText="Batal"
        onConfirm={handleSetujui}
        onCancel={() => setShowConfirmSetujui(false)}
      />
      <Modal isOpen={showActionModal} onClose={() => !submitting && setShowActionModal(false)} size="md">
        <RejectForm
          title={isRevisi ? 'Minta revisi' : 'Tolak pengajuan'}
          description={isRevisi ? 'Tuliskan catatan yang perlu diperbaiki.' : 'Tuliskan alasan penolakan.'}
          placeholder={isRevisi ? 'Contoh: Berkas belum lengkap.' : 'Contoh: Kegiatan tidak sesuai kriteria.'}
          submitLabel={isRevisi ? 'Kirim revisi' : 'Tolak'}
          variant={isRevisi ? 'warning' : 'error'}
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
          title="Detail pengajuan UKMF"
          description="Tinjau informasi kegiatan sebelum memberi keputusan."
          status={item.status}
        />

        {!canAct && item.alasan ? <DecisionNote status={item.status} alasan={item.alasan} /> : null}

        <SectionCard title="Detail kegiatan">
          <InfoRow label="Nama kegiatan" value={item.kegiatan} />
          <InfoRow label="Nama UKMF" value={item.namaUkm} />
          <InfoRow label="Jenis kegiatan" value={item.jenis} />
          <InfoRow label="Skala" value={item.skala} />
          <InfoRow label="Tanggal" value={item.tanggal} />
          {item.deskripsi && item.deskripsi !== '-' ? <InfoRow label="Deskripsi" value={item.deskripsi} multiline /> : null}
        </SectionCard>

        <CurriculumAchievementCard
          kurikulum={item.kurikulum}
          capaian={item.capaian}
          subCapaian={item.subCapaian}
          kegiatanCapaian={item.kegiatanCapaian}
        />

        {canAct ? (
          <DecisionActions
            onReject={() => { setActionType('tolak'); setAlasan(''); setShowActionModal(true) }}
            onRevise={() => { setActionType('revisi'); setAlasan(''); setShowActionModal(true) }}
            onApprove={() => setShowConfirmSetujui(true)}
            approveLabel="Teruskan ke pimpinan"
          />
        ) : null}
      </div>
    </DashboardLayout>
  )
}

export default DetailVerifikasiUKMF
