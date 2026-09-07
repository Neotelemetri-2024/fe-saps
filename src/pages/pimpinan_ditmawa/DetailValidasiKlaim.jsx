import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { DetailSkeleton } from '../../components/dashboard/Skeleton'
import { getKlaimById, verifikasiKlaim } from '../../services/poinService'
import { getApiBase } from '../../services/apiClient'
import {
  InfoRow,
  SectionCard,
  formatTanggal,
  DetailBackButton,
  DetailHeader,
  DecisionNote,
  RejectForm,
  VerifiedBanner,
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
  const capaianList = (kegiatan.kegiatanCapaian || []).map((kc) => kc.subCapaian?.capaian?.nama).filter(Boolean)
  const kurikulumList = (kegiatan.kegiatanCapaian || []).map((kc) => kc.subCapaian?.capaian?.kurikulum?.nama).filter(Boolean)
  const kurikulumNama = raw.kurikulumNama || raw.kurikulum?.nama || kegiatan.kurikulum?.nama || mahasiswa.kurikulum?.nama || kurikulumList[0] || (typeof raw.kurikulum === 'string' ? raw.kurikulum : '-')
  const buktiUrl = raw.bukti?.[0]?.url || raw.buktiUrl || null
  const apiBase = getApiBase()
  return {
    id: String(raw.id),
    mahasiswa: mahasiswa.user?.nama || raw.mahasiswa || '-',
    nim: mahasiswa.nim || '-',
    prodi: mahasiswa.prodi?.nama || '-',
    fakultas: mahasiswa.prodi?.fakultas?.nama || '-',
    kegiatan: kegiatan.nama || raw.kegiatan || '-',
    kategori: kegiatan.kategori?.nama || '-',
    skala: kegiatan.skala?.nama || '-',
    peran: raw.peranUsulan?.nama || part.peranVerif?.nama || '-',
    tanggal: formatTanggal(kegiatan.tanggalMulai, kegiatan.tanggalSelesai),
    penyelenggara: kegiatan.penyelenggaraExt || kegiatan.organisasi?.nama || '-',
    email: kegiatan.emailExt || mahasiswa.user?.email || '-',
    linkWebsite: kegiatan.linkWebsiteExt || '-',
    deskripsi: kegiatan.deskripsi || '-',
    bukti: buktiUrl ? (buktiUrl.startsWith('http') ? buktiUrl : `${apiBase}${buktiUrl}`) : null,
    kurikulum: kurikulumNama,
    capaian: [...new Set(capaianList)],
    subCapaian: (kegiatan.kegiatanCapaian || []).map((kc) => ({
      label: kc.subCapaian?.nama || '-',
      capaian: kc.subCapaian?.capaian?.nama || '',
      persen: kc.alokasiPersen != null ? `${kc.alokasiPersen}%` : '-',
    })),
    status: mapStatus(raw.status),
    statusRaw: raw.status,
    alasan: raw.alasan || null,
  }
}

function DetailValidasiKlaim() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()

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

  const backToList = () => navigate('/pimpinan_ditmawa/verifikasi-klaim')

  const handleSetujui = async () => {
    setSubmitting(true)
    try {
      await verifikasiKlaim(id, { keputusan: 'disetujui' })
      toast.success('Klaim poin disetujui!')
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
      toast.success(actionType === 'revisi' ? 'Revisi dikirim!' : 'Ditolak!')
      setShowActionModal(false)
      backToList()
    } catch (err) { toast.error('Gagal', { description: err.message }) }
    finally { setSubmitting(false) }
  }

  const canAct = item?.status === 'pending'

  if (loading && !item) return <DetailSkeleton />
  if (!item) return <EmptyDetail onBack={backToList} message="Data klaim tidak ditemukan." />

  return (
      <>
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
        <DetailBackButton onClick={backToList}>Kembali ke daftar</DetailBackButton>
        <DetailHeader
          title="Detail klaim poin"
          description="Tinjau informasi klaim sebelum memberi keputusan."
          status={item.status}
        />

        {!canAct && item.alasan ? <DecisionNote status={item.status} alasan={item.alasan} /> : null}
        {!canAct && !item.alasan ? <VerifiedBanner status={item.status} noun="Klaim" /> : null}

        <SectionCard title="Informasi Mahasiswa">
          <InfoRow label="Nama Mahasiswa" value={item.mahasiswa} />
          <InfoRow label="NIM" value={item.nim} />
          <InfoRow label="Program Studi" value={item.prodi} />
          <InfoRow label="Fakultas" value={item.fakultas} />
        </SectionCard>

        <SectionCard title="Detail Kegiatan">
          <InfoRow label="Nama Kegiatan" value={item.kegiatan} />
          {item.kurikulum && item.kurikulum !== '-' ? <InfoRow label="Kurikulum Terkait" value={item.kurikulum} /> : null}
          <InfoRow label="Kategori" value={item.kategori} />
          <InfoRow label="Skala" value={item.skala} />
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

        {((item.kurikulum && item.kurikulum !== '-') || item.capaian?.length > 0) && (
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
              {item.capaian.map((c, i) => <p key={i} className="text-sm font-medium text-base-content">{c}</p>)}
            </div>
          ) : (
            <p className="text-sm text-base-content/50">Tidak ada capaian kurikulum</p>
          )}
        </SectionCard>
        )}

        {item.subCapaian?.length > 0 && (
          <SectionCard title="Sub Capaian & Bobot">
            {item.subCapaian.map((sc, i) => <InfoRow key={i} label={sc.label} sublabel={sc.capaian} value={sc.persen} />)}
          </SectionCard>
        )}

        {canAct ? (
          <DecisionActions
            onReject={() => { setActionType('tolak'); setAlasan(''); setShowActionModal(true) }}
            onRevise={() => { setActionType('revisi'); setAlasan(''); setShowActionModal(true) }}
            onApprove={() => setShowConfirmSetujui(true)}
            approveLabel="Setujui klaim"
          />
        ) : null}
      </div>
      </>
  )
}

export default DetailValidasiKlaim
