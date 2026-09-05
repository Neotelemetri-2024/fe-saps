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

function DetailPengajuanMahasiswa() {
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

  const statusRaw = row.statusRaw || row.status || ''
  const tanggalPelaksanaan = formatTanggal(
    row.tanggalPelaksanaan || row.tanggalMulai || row.tanggal
  )
  const tanggalPengajuan = formatTanggal(
    row.tanggalPengajuan || row.tanggalDiajukan || row.createdAt || row.dibuatPada || row.diajukanPada
  )

  return (
    <DashboardLayout role="mahasiswa" userName={user?.nama || 'Mahasiswa'} userRole="Mahasiswa">
      <div className="space-y-5">
        <DetailBackButton onClick={() => navigate(-1)} />
        <DetailHeader
          title="Detail pengajuan kegiatan"
          description="Informasi lengkap kegiatan yang telah diajukan."
          status={row.status}
        />

        <DecisionNote status={statusRaw} alasan={row.alasan} />

        <SectionCard title="Detail kegiatan">
          <InfoRow label="Nama kegiatan" value={row.namaKegiatan || row.kegiatan} />
          <InfoRow label="Jenis / kategori" value={row.jenisKegiatan || row.jenis} />
          <InfoRow label="Skala" value={row.skala} />
          <InfoRow label="Penyelenggara" value={row.penyelenggara} />
          <InfoRow label="Tanggal pelaksanaan" value={tanggalPelaksanaan} />
          <InfoRow label="Tanggal pengajuan" value={tanggalPengajuan} />
          {row.linkWebsite && row.linkWebsite !== '-' ? (
            <InfoRow label="Website" value={row.linkWebsite} href={row.linkWebsite} />
          ) : null}
          {row.emailPenyelenggara && row.emailPenyelenggara !== '-' ? (
            <InfoRow label="Email penyelenggara" value={row.emailPenyelenggara} href={`mailto:${row.emailPenyelenggara}`} />
          ) : null}
          {row.deskripsi ? <InfoRow label="Deskripsi" value={row.deskripsi} multiline /> : null}
        </SectionCard>
      </div>
    </DashboardLayout>
  )
}

export default DetailPengajuanMahasiswa
