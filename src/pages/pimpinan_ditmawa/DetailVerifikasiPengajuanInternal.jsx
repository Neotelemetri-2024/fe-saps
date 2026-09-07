import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { DetailSkeleton } from '../../components/dashboard/Skeleton'
import { getKegiatanById, approvalKegiatan } from '../../services/kegiatanService'
import {
  InfoRow,
  SectionCard,
  mapUiStatus,
  formatTanggal,
  DetailBackButton,
  DetailHeader,
  DecisionNote,
  RejectForm,
  VerifiedBanner,
  DecisionActions,
  EmptyDetail,
} from '../../components/ui/DetailComponents'

function normalizeDetail(raw) {
  if (!raw) return null
  const capaianList = []
  const subCapaianList = []
  const kurikulumList = (raw.kegiatanCapaian || []).map((kc) => kc.subCapaian?.capaian?.kurikulum?.nama).filter(Boolean)
  const kurikulumNama = raw.kurikulumNama || raw.kurikulum?.nama || kurikulumList[0] || (typeof raw.kurikulum === 'string' ? raw.kurikulum : '-')
  ;(raw.kegiatanCapaian || []).forEach((kc) => {
    const capNama = kc.subCapaian?.capaian?.nama
    if (capNama && !capaianList.includes(capNama)) capaianList.push(capNama)
    if (kc.subCapaian?.nama) subCapaianList.push({ label: kc.subCapaian.nama, capaian: capNama || '', persen: `${kc.alokasiPersen ?? kc.persen ?? 0}%` })
  })
  return {
    id: raw.id,
    kegiatan: raw.nama || '-',
    namaOrganisasi: raw.organisasi?.nama || (raw.asal === 'universitas' ? 'Universitas' : '-'),
    jenis: raw.kategori?.nama || '-',
    skala: raw.skala?.nama || '-',
    tanggal: formatTanggal(raw.tanggalMulai, raw.tanggalSelesai) || '-',
    deskripsi: raw.deskripsi || '-',
    capaian: capaianList.length ? capaianList : (raw.capaian || []),
    subCapaian: subCapaianList.length ? subCapaianList : (raw.subCapaian || []),
    kurikulum: kurikulumNama,
    status: mapUiStatus(raw.status),
    alasan: raw.alasan || raw.kegiatanApproval?.[0]?.alasan || '',
  }
}

function DetailVerifikasiPengajuanInternal() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()

  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showConfirmSetujui, setShowConfirmSetujui] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [alasan, setAlasan] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setLoading(true)
    getKegiatanById(id)
      .then((data) => setItem(normalizeDetail(data)))
      .catch((err) => {
        if (location.state?.item) setItem(normalizeDetail({ ...location.state.item, nama: location.state.item.kegiatan, organisasi: { nama: location.state.item.namaOrganisasi || location.state.item.namaUkm } }))
        else { setItem(null); toast.error('Gagal memuat detail', { description: err.message }) }
      })
      .finally(() => setLoading(false))
  }, [id, location.state])

  const backToList = () => navigate('/pimpinan_ditmawa/verifikasi-pengajuan-internal')

  const handleSetujui = async () => {
    setSubmitting(true)
    try {
      await approvalKegiatan(id, { keputusan: 'setuju' })
      toast.success('Pengajuan internal disetujui!')
      setShowConfirmSetujui(false)
      backToList()
    } catch (err) { toast.error('Gagal', { description: err.message }) }
    finally { setSubmitting(false) }
  }

  const handleKirimAction = async () => {
    if (!alasan.trim()) { toast.error('Alasan tidak boleh kosong.'); return }
    setSubmitting(true)
    try {
      await approvalKegiatan(id, { keputusan: 'tolak', alasan: alasan.trim() })
      toast.success('Ditolak!')
      setShowActionModal(false)
      backToList()
    } catch (err) { toast.error('Gagal', { description: err.message }) }
    finally { setSubmitting(false) }
  }

  const canAct = item?.status === 'diteruskan'

  if (loading) return <DetailSkeleton />
  if (!item) return <EmptyDetail onBack={backToList} />

  return (
    <>
      <ConfirmModal
        isOpen={showConfirmSetujui}
        message="Pengajuan ini akan disetujui."
        confirmText={submitting ? 'Memproses…' : 'Setujui'}
        cancelText="Batal"
        onConfirm={handleSetujui}
        onCancel={() => setShowConfirmSetujui(false)}
      />
      <Modal isOpen={showActionModal} onClose={() => !submitting && setShowActionModal(false)} size="md">
        <RejectForm
          alasan={alasan}
          onChange={setAlasan}
          onSubmit={handleKirimAction}
          onCancel={() => setShowActionModal(false)}
          submitting={submitting}
        />
      </Modal>

      <div className="space-y-5">
        <DetailBackButton onClick={backToList}>Kembali ke daftar</DetailBackButton>
        <DetailHeader
          title="Detail pengajuan internal"
          description="Tinjau informasi kegiatan sebelum memberi keputusan."
          status={item.status}
        />

        {!canAct && item.alasan ? <DecisionNote status={item.status} alasan={item.alasan} /> : null}
        {!canAct && !item.alasan ? <VerifiedBanner status={item.status} /> : null}

        <SectionCard title="Detail kegiatan">
          <InfoRow label="Nama kegiatan" value={item.kegiatan} />
          {item.kurikulum && item.kurikulum !== '-' ? <InfoRow label="Kurikulum Terkait" value={item.kurikulum} /> : null}
          <InfoRow label="Penyelenggara" value={item.namaOrganisasi} />
          <InfoRow label="Jenis kegiatan" value={item.jenis} />
          <InfoRow label="Skala" value={item.skala} />
          <InfoRow label="Tanggal" value={item.tanggal} />
          {item.deskripsi && item.deskripsi !== '-' ? <InfoRow label="Deskripsi" value={item.deskripsi} multiline /> : null}
        </SectionCard>

        <SectionCard title="Capaian Kurikulum">
          {item.kurikulum && item.kurikulum !== '-' ? (
            <div className="mb-3 pb-3 border-b border-base-200">
              <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60 block mb-1">
                Kurikulum Terkait
              </span>
              <span className="badge badge-primary badge-outline font-semibold text-xs py-2 px-3">
                {item.kurikulum}
              </span>
            </div>
          ) : null}
          {item.capaian?.length > 0 ? (
            <div>
              {item.kurikulum && item.kurikulum !== '-' && (
                <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60 block mb-1">
                  Daftar Capaian
                </span>
              )}
              {item.capaian.map((c, i) => <p key={i} className="text-sm font-medium text-base-content">{typeof c === 'string' ? c : c.label}</p>)}
            </div>
          ) : (
            <p className="text-sm text-base-content/50">Tidak ada capaian kurikulum</p>
          )}
        </SectionCard>

        {item.subCapaian?.length > 0 ? (
          <SectionCard title="Sub capaian">
            {item.subCapaian.map((sc, i) => (
              <InfoRow key={i} label={sc.label} sublabel={sc.capaian} value={sc.persen || `${sc.poin || 0}%`} />
            ))}
          </SectionCard>
        ) : null}

        {canAct ? (
          <DecisionActions
            onReject={() => { setShowActionModal(true); setAlasan('') }}
            onApprove={() => setShowConfirmSetujui(true)}
          />
        ) : null}
      </div>
    </>
  )
}

export default DetailVerifikasiPengajuanInternal
