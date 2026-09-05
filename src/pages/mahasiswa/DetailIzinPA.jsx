import { useNavigate, useLocation } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { getCurrentUser } from '../../services/authService'
import {
  InfoRow,
  SectionCard,
  DetailBackButton,
  DetailHeader,
  DecisionNote,
  EmptyDetail,
} from '../../components/ui/DetailComponents'

function formatTanggal(val) {
  if (val == null || val === '') return '-'
  const s = String(val).trim()
  if (!s || s === '-') return '-'
  if (/[a-zA-ZÀ-ÿ]/.test(s) && !/^\d{4}-\d{2}-\d{2}/.test(s) && !/T\d{2}:/.test(s)) return s
  try {
    const d = new Date(val)
    if (Number.isNaN(d.getTime())) return s
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return s
  }
}

function DetailIzinPAMahasiswa() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getCurrentUser()
  const row = location.state?.row

  if (!row) {
    return (
      <DashboardLayout role="mahasiswa" userName={user?.nama || 'Mahasiswa'} userRole="Mahasiswa">
        <EmptyDetail onBack={() => navigate(-1)} />
      </DashboardLayout>
    )
  }

  const kg = row.partisipasi?.kegiatan || (typeof row.kegiatan === 'object' && row.kegiatan ? row.kegiatan : {}) || {}
  const tanggalKegiatan = formatTanggal(
    kg.tanggalMulai || row.tanggalMulai || row.tanggalPelaksanaan || row.tanggal
  )
  const tanggalDiajukan = formatTanggal(
    row.tanggalDiajukan || row.createdAt || row.diajukanPada
  )
  const namaKegiatan = typeof row.kegiatan === 'string' ? row.kegiatan : (kg.nama || '-')
  const skala = kg.skala?.nama || (typeof kg.skala === 'string' ? kg.skala : null) || row.skala || '-'
  const status = row.isUlang && (row.status === 'pending' || row.status === 'diajukan')
    ? 'diajukan_ulang'
    : row.status
  const noteTitle = row.status === 'ditolak'
    ? 'Alasan penolakan dosen PA'
    : row.status === 'revisi'
      ? 'Catatan revisi dosen PA'
      : undefined

  return (
    <DashboardLayout role="mahasiswa" userName={user?.nama || 'Mahasiswa'} userRole="Mahasiswa">
      <div className="space-y-5">
        <DetailBackButton onClick={() => navigate(-1)} />
        <DetailHeader
          title="Detail izin dosen PA"
          description="Informasi kegiatan yang dimintakan persetujuan ke dosen PA."
          status={status}
        />

        <DecisionNote status={row.status} alasan={row.alasan} title={noteTitle} />

        <SectionCard title="Detail kegiatan">
          <InfoRow label="Nama kegiatan" value={namaKegiatan} />
          <InfoRow label="Jenis / kategori" value={row.jenis} />
          <InfoRow label="Skala" value={skala} />
          <InfoRow label="Peran / pencapaian" value={row.peran} />
          <InfoRow label="Penyelenggara" value={row.penyelenggara} />
          <InfoRow label="Tanggal pelaksanaan" value={tanggalKegiatan} />
          <InfoRow label="Tanggal diajukan ke PA" value={tanggalDiajukan} />
          {(kg.linkPenyelenggara || kg.linkWebsite || row.linkWebsite) ? (
            <InfoRow label="Website" value={kg.linkPenyelenggara || kg.linkWebsite || row.linkWebsite} href={kg.linkPenyelenggara || kg.linkWebsite || row.linkWebsite} />
          ) : null}
          {(kg.emailPenyelenggara || row.emailPenyelenggara) ? (
            <InfoRow label="Email penyelenggara" value={kg.emailPenyelenggara || row.emailPenyelenggara} href={`mailto:${kg.emailPenyelenggara || row.emailPenyelenggara}`} />
          ) : null}
          {(kg.deskripsi || row.deskripsi) ? <InfoRow label="Deskripsi" value={kg.deskripsi || row.deskripsi} multiline /> : null}
        </SectionCard>
      </div>
    </DashboardLayout>
  )
}

export default DetailIzinPAMahasiswa
