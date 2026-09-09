import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import Modal from '../../components/ui/Modal'
import { setujuiTolak } from '../../services/pengajuanService'
import { getCurrentUser } from '../../services/authService'
import {
  InfoRow,
  SectionCard,
  DetailBackButton,
  DetailHeader,
  DecisionActions,
  RejectForm,
  EmptyDetail,
  CurriculumAchievementCard,
} from '../../components/ui/DetailComponents'

function formatDate(val) {
  if (!val) return '-'
  try {
    const d = new Date(val)
    if (Number.isNaN(d.getTime())) return '-'
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return '-'
  }
}

function DetailPersetujuanDosen() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getCurrentUser()
  const row = location.state?.row

  const [showReject, setShowReject] = useState(false)
  const [alasan, setAlasan] = useState('')
  const [loading, setLoading] = useState(false)

  if (!row) {
    return (
      <DashboardLayout role="dosen" userName={user?.nama || 'Dosen PA'} userRole="Dosen Pembimbing">
        <EmptyDetail onBack={() => navigate(-1)} />
      </DashboardLayout>
    )
  }

  const kg = row.partisipasi?.kegiatan || {}
  const mhs = row.partisipasi?.mahasiswa || {}
  const nim = mhs.nim || '-'
  const prodi = mhs.prodi?.nama || '-'
  const fakultas = mhs.prodi?.fakultas?.nama || '-'
  const tanggalPengajuan = formatDate(row.tanggalDiajukan || row.createdAt)
  const tanggalKegiatan = formatDate(kg.tanggalMulai) || row.tanggal || '-'
  const isActionable = row.status === 'pending' || row.status === 'diajukan'
  const status = row.isUlang && isActionable ? 'diajukan_ulang' : row.status

  const handleSetuju = async () => {
    setLoading(true)
    try {
      await setujuiTolak(row.id, 'disetujui', '')
      toast.success('Disetujui!', { description: `Kegiatan "${row.kegiatan}" dari ${row.mahasiswa} berhasil disetujui.` })
      navigate(-1)
    } catch (err) { toast.error('Gagal', { description: err.message }) }
    finally { setLoading(false) }
  }

  const handleKirimAlasan = async () => {
    if (!alasan.trim()) { toast.error('Alasan tidak boleh kosong'); return }
    setLoading(true)
    try {
      await setujuiTolak(row.id, 'ditolak', alasan.trim())
      toast.success('Berhasil!', { description: 'Kegiatan berhasil ditolak.' })
      navigate(-1)
    } catch (err) { toast.error('Gagal', { description: err.message }) }
    finally { setLoading(false) }
  }

  return (
    <DashboardLayout role="dosen" userName={user?.nama || 'Dosen PA'} userRole="Dosen Pembimbing">
      <Modal isOpen={showReject} onClose={() => !loading && setShowReject(false)} size="md">
        <RejectForm
          alasan={alasan}
          onChange={setAlasan}
          onSubmit={handleKirimAlasan}
          onCancel={() => setShowReject(false)}
          submitting={loading}
        />
      </Modal>

      <div className="space-y-5">
        <DetailBackButton onClick={() => navigate(-1)} />
        <DetailHeader
          title="Detail permintaan persetujuan"
          description="Tinjau detail kegiatan sebelum memberi keputusan."
          status={status}
        />

        <SectionCard title="Identitas mahasiswa">
          <InfoRow label="Nama mahasiswa" value={row.mahasiswa} />
          <InfoRow label="NIM" value={nim} />
          <InfoRow label="Program studi" value={prodi} />
          <InfoRow label="Fakultas" value={fakultas} />
          <InfoRow label="Tanggal pengajuan" value={tanggalPengajuan} />
        </SectionCard>

        <SectionCard title="Detail kegiatan">
          <InfoRow label="Nama kegiatan" value={row.kegiatan} />
          <InfoRow label="Jenis / kategori" value={row.jenis} />
          <InfoRow label="Skala" value={kg.skala?.nama || '-'} />
          <InfoRow label="Peran / pencapaian" value={row.peran} />
          <InfoRow label="Penyelenggara" value={row.penyelenggara} />
          <InfoRow label="Tanggal pelaksanaan" value={tanggalKegiatan} />
          {(kg.linkPenyelenggara || kg.linkWebsite) ? (
            <InfoRow label="Website" value={kg.linkPenyelenggara || kg.linkWebsite} href={kg.linkPenyelenggara || kg.linkWebsite} />
          ) : null}
          {kg.emailPenyelenggara ? (
            <InfoRow label="Email penyelenggara" value={kg.emailPenyelenggara} href={`mailto:${kg.emailPenyelenggara}`} />
          ) : null}
          {kg.deskripsi ? <InfoRow label="Deskripsi" value={kg.deskripsi} multiline /> : null}
        </SectionCard>

        {(row.kurikulum || kg.kurikulum || row.capaian?.length > 0 || kg.capaian?.length > 0 || row.subCapaian?.length > 0 || kg.subCapaian?.length > 0 || kg.kegiatanCapaian?.length > 0) ? (
          <CurriculumAchievementCard
            kurikulum={row.kurikulum || kg.kurikulum?.nama || (typeof kg.kurikulum === 'string' ? kg.kurikulum : null) || row.kurikulumNama}
            capaian={row.capaian || kg.capaian || (kg.kegiatanCapaian ? [...new Set(kg.kegiatanCapaian.map(kc => kc.subCapaian?.capaian?.nama).filter(Boolean))] : [])}
            subCapaian={row.subCapaian || kg.subCapaian || (kg.kegiatanCapaian ? kg.kegiatanCapaian.map(kc => ({
              label: kc.subCapaian?.nama || '-',
              capaian: kc.subCapaian?.capaian?.nama || '',
              kurikulum: kc.subCapaian?.capaian?.kurikulum?.nama || '',
              persen: kc.alokasiPersen ?? null,
            })) : [])}
            kegiatanCapaian={kg.kegiatanCapaian || row.kegiatanCapaian}
          />
        ) : null}

        {isActionable ? (
          <DecisionActions
            onReject={() => { setShowReject(true); setAlasan('') }}
            onApprove={handleSetuju}
            approveLabel={loading ? 'Memproses…' : 'Setujui'}
          />
        ) : null}
      </div>
    </DashboardLayout>
  )
}

export default DetailPersetujuanDosen
