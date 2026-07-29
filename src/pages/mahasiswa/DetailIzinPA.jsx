import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, CalendarDays } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import { getCurrentUser } from '../../services/authService'
import { InfoRow, SectionCard } from '../../components/ui/DetailComponents'

function formatTanggal(val) {
  if (!val) return '-'
  try { return new Date(val).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return String(val) }
}

function DetailIzinPAMahasiswa() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getCurrentUser()
  const row = location.state?.row

  if (!row) {
    return (
      <DashboardLayout role="mahasiswa" userName={user?.nama || 'Mahasiswa'} userRole="Mahasiswa">
        <div className="py-16 text-center text-sm text-[#9aa0a6]">Data tidak ditemukan.</div>
      </DashboardLayout>
    )
  }

  const kg = row.partisipasi?.kegiatan || {}
  const isRevisi = row.status === 'revisi'
  const isDitolak = row.status === 'ditolak'
  const tanggalKegiatan = kg.tanggalMulai ? formatTanggal(kg.tanggalMulai) : row.tanggal || '-'

  return (
    <DashboardLayout role="mahasiswa" userName={user?.nama || 'Mahasiswa'} userRole="Mahasiswa">
      <div className="space-y-5">
        <button type="button" onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-dark hover:underline">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-brand-dark sm:text-2xl">Detail Izin Dosen PA</h2>
            <p className="mt-1 text-sm text-[#616161]">Informasi kegiatan yang dimintakan persetujuan ke Dosen PA.</p>
          </div>
          <div className="shrink-0">
            {row.isUlang && (row.status === 'pending' || row.status === 'diajukan') ? (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">Diajukan Ulang</span>
            ) : (
              <StatusBadge status={row.status} />
            )}
          </div>
        </div>

        {(isRevisi || isDitolak) && row.alasan && (
          <div className={`rounded-xl border p-4 ${isRevisi ? 'border-yellow-200 bg-yellow-50' : 'border-red-200 bg-red-50'}`}>
            <p className={`text-xs font-semibold mb-1 ${isRevisi ? 'text-yellow-700' : 'text-red-700'}`}>
              {isRevisi ? 'Catatan Revisi Dosen PA' : 'Alasan Penolakan Dosen PA'}
            </p>
            <p className={`text-sm whitespace-pre-wrap ${isRevisi ? 'text-yellow-800' : 'text-red-800'}`}>{row.alasan}</p>
          </div>
        )}

        <SectionCard title="Detail Kegiatan" icon={CalendarDays}>
          <InfoRow label="Nama Kegiatan" value={row.kegiatan} />
          <InfoRow label="Jenis / Kategori" value={row.jenis} />
          <InfoRow label="Skala" value={kg.skala?.nama || '-'} />
          <InfoRow label="Peran / Pencapaian" value={row.peran} />
          <InfoRow label="Penyelenggara" value={row.penyelenggara} />
          <InfoRow label="Tanggal Pelaksanaan" value={tanggalKegiatan} />
          <InfoRow label="Tanggal Diajukan ke PA" value={formatTanggal(row.tanggalDiajukan || row.createdAt)} />
          {(kg.linkPenyelenggara || kg.linkWebsite) && (
            <InfoRow label="Link Website" value={kg.linkPenyelenggara || kg.linkWebsite} href={kg.linkPenyelenggara || kg.linkWebsite} />
          )}
          {kg.emailPenyelenggara && (
            <InfoRow label="Email Penyelenggara" value={kg.emailPenyelenggara} href={`mailto:${kg.emailPenyelenggara}`} />
          )}
          {kg.deskripsi && <InfoRow label="Deskripsi" value={kg.deskripsi} multiline />}
        </SectionCard>
      </div>
    </DashboardLayout>
  )
}

export default DetailIzinPAMahasiswa
