import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { DetailSkeleton } from '../../components/dashboard/Skeleton'
import { getKegiatanById, approvalKegiatan } from '../../services/kegiatanService'
import {
  InfoRow,
  SectionCard,
  DetailBackButton,
  DetailHeader,
  DecisionNote,
  RejectForm,
  DecisionActions,
  EmptyDetail,
} from '../../components/ui/DetailComponents'

function formatDate(val) {
  if (!val) return '-'
  try {
    const d = new Date(val)
    if (Number.isNaN(d.getTime())) return '-'
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch {
    return '-'
  }
}

function normalizeKegiatanDetail(k) {
  if (!k) return null
  const pembuat = k.pembuat || {}
  const mhs = pembuat.mahasiswa || {}
  const approval = Array.isArray(k.kegiatanApproval) ? k.kegiatanApproval : []
  const latestApproval = approval[0]
  const capaianList = []
  const subCapaianList = []
  const kurikulumList = (k.kegiatanCapaian || []).map((kc) => kc.subCapaian?.capaian?.kurikulum?.nama).filter(Boolean)
  const kurikulumNama = k.kurikulumNama || k.kurikulum?.nama || mhs.kurikulum?.nama || kurikulumList[0] || (typeof k.kurikulum === 'string' ? k.kurikulum : '-')
  ;(k.kegiatanCapaian || []).forEach((kc) => {
    const nama = kc.subCapaian?.capaian?.nama
    if (nama && !capaianList.find((c) => c.label === nama)) capaianList.push({ label: nama })
    if (kc.subCapaian?.nama) subCapaianList.push({ label: kc.subCapaian.nama, capaian: nama || '', persen: kc.alokasiPersen ?? null })
  })
  return {
    id: k.id,
    namaMahasiswa: pembuat.nama || '-',
    nim: mhs.nim || '-',
    prodi: mhs.prodi?.nama || '-',
    fakultas: mhs.prodi?.fakultas?.nama || '-',
    tanggalPengajuan: formatDate(k.createdAt),
    kegiatan: k.nama || '-',
    kategori: k.kategori?.nama || '-',
    skala: k.skala?.nama || '-',
    tanggal: formatDate(k.tanggalMulai),
    penyelenggara: k.penyelenggaraExt || '-',
    email: k.emailPenyelenggara || k.emailExt || '-',
    linkWebsite: k.linkPenyelenggara || k.linkWebsite || '-',
    deskripsi: k.deskripsi || '',
    status: k.status,
    alasan: latestApproval?.alasan || '',
    kurikulumNama: mhs.kurikulum?.nama || k.kurikulumNama || k.kurikulum?.nama || null,
    capaian: capaianList,
    subCapaian: subCapaianList,
    kurikulum: kurikulumNama,
  }
}

function DetailVerifikasiPengajuanEksternal() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showConfirmSetujui, setShowConfirmSetujui] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [alasan, setAlasan] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setLoading(true)
    getKegiatanById(id)
      .then((k) => setItem(normalizeKegiatanDetail(k)))
      .catch(() => setItem(null))
      .finally(() => setLoading(false))
  }, [id])

  const backToList = () => navigate('/pimpinan_ditmawa/verifikasi-pengajuan-eksternal')

  const handleSetujui = async () => {
    setSubmitting(true)
    try {
      await approvalKegiatan(id, { keputusan: 'setuju' })
      toast.success('Pengajuan disetujui!')
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
      await approvalKegiatan(id, { keputusan: 'tolak', alasan: alasan.trim() })
      toast.success('Pengajuan ditolak!')
      setShowActionModal(false)
      backToList()
    } catch (err) {
      toast.error('Gagal', { description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <DetailSkeleton />

  if (!item) return <EmptyDetail onBack={backToList} />

  const canAct = item.status === 'terverifikasi'

  return (
    <>
      <ConfirmModal
        isOpen={showConfirmSetujui}
        message="Pengajuan ini akan disetujui dan poin akan diberikan kepada mahasiswa."
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
          title="Detail pengajuan eksternal"
          description="Tinjau informasi kegiatan sebelum memberi keputusan."
          status={item.status}
        />

        {!canAct && item.alasan ? <DecisionNote status={item.status} alasan={item.alasan} /> : null}


        <SectionCard title="Informasi mahasiswa">
          <InfoRow label="Nama" value={item.namaMahasiswa} />
          <InfoRow label="NIM" value={item.nim} />
          <InfoRow label="Program studi" value={item.prodi} />
          <InfoRow label="Fakultas" value={item.fakultas} />
          <InfoRow label="Tanggal pengajuan" value={item.tanggalPengajuan} />
        </SectionCard>

        <SectionCard title="Detail kegiatan">
          <InfoRow label="Nama kegiatan" value={item.kegiatan} />
          {item.kurikulum && item.kurikulum !== '-' ? <InfoRow label="Kurikulum Terkait" value={item.kurikulum} /> : null}
          <InfoRow label="Kategori" value={item.kategori} />
          <InfoRow label="Skala" value={item.skala} />
          <InfoRow label="Tanggal pelaksanaan" value={item.tanggal} />
          <InfoRow label="Penyelenggara" value={item.penyelenggara} />
          {item.email && item.email !== '-' ? <InfoRow label="Email" value={item.email} href={`mailto:${item.email}`} /> : null}
          {item.linkWebsite && item.linkWebsite !== '-' ? <InfoRow label="Website" value={item.linkWebsite} href={item.linkWebsite} /> : null}
          {item.deskripsi ? <InfoRow label="Deskripsi" value={item.deskripsi} multiline /> : null}
        </SectionCard>

        <SectionCard title="Kurikulum Mahasiswa">
          <InfoRow label="Kurikulum" value={item.kurikulumNama || '-'} />
        </SectionCard>

        {item.capaian?.length > 0 ? (
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
              {item.capaian.map((c, i) => <p key={i} className="text-sm font-medium text-base-content">{c.label || c}</p>)}
            </div>
          ) : (
            <p className="text-sm text-base-content/50">Belum ada pemetaan capaian</p>
          )}
        </SectionCard>
        ) : null}

        {item.subCapaian?.length > 0 ? (
          <SectionCard title="Sub capaian">
            {item.subCapaian.map((sc, i) => (
              <InfoRow key={i} label={sc.label} sublabel={sc.capaian} value={sc.persen != null ? `${sc.persen}%` : '—'} />
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

export default DetailVerifikasiPengajuanEksternal
