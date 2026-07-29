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

function DetailPengajuanMahasiswa() {
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

  const statusRaw = row.statusRaw || row.status || ''
  const isRevisi = statusRaw === 'revisi' || statusRaw === 'perlu_revisi'
  const isDitolak = statusRaw === 'ditolak'

  return (
    <DashboardLayout role="mahasiswa" userName={user?.nama || 'Mahasiswa'} userRole="Mahasiswa">
      <div className="space-y-5">
        <button type="button" onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-dark hover:underline">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-brand-dark sm:text-2xl">Detail Pengajuan Kegiatan</h2>
            <p className="mt-1 text-sm text-[#616161]">Informasi lengkap kegiatan yang telah diajukan.</p>
          </div>
          <div className="shrink-0"><StatusBadge status={row.status} /></div>
        </div>

        {(isRevisi || isDitolak) && row.alasan && (
          <div className={`rounded-xl border p-4 ${isRevisi ? 'border-yellow-200 bg-yellow-50' : 'border-red-200 bg-red-50'}`}>
            <p className={`text-xs font-semibold mb-1 ${isRevisi ? 'text-yellow-700' : 'text-red-700'}`}>
              {isRevisi ? 'Catatan Revisi' : 'Alasan Penolakan'}
            </p>
            <p className={`text-sm whitespace-pre-wrap ${isRevisi ? 'text-yellow-800' : 'text-red-800'}`}>{row.alasan}</p>
          </div>
        )}

        <SectionCard title="Detail Kegiatan" icon={CalendarDays}>
          <InfoRow label="Nama Kegiatan" value={row.namaKegiatan || row.kegiatan} />
          <InfoRow label="Jenis / Kategori" value={row.jenisKegiatan || row.jenis} />
          <InfoRow label="Skala" value={row.skala} />
          <InfoRow label="Penyelenggara" value={row.penyelenggara} />
          <InfoRow label="Tanggal Pelaksanaan" value={formatTanggal(row.tanggalPelaksanaan || row.tanggal)} />
          <InfoRow label="Tanggal Pengajuan" value={formatTanggal(row.tanggalPengajuan || row.dibuatPada)} />
          {row.linkWebsite && row.linkWebsite !== '-' && (
            <InfoRow label="Link Website" value={row.linkWebsite} href={row.linkWebsite} />
          )}
          {row.emailPenyelenggara && row.emailPenyelenggara !== '-' && (
            <InfoRow label="Email Penyelenggara" value={row.emailPenyelenggara} href={`mailto:${row.emailPenyelenggara}`} />
          )}
          {row.deskripsi && <InfoRow label="Deskripsi" value={row.deskripsi} multiline />}
        </SectionCard>
      </div>
    </DashboardLayout>
  )
}

export default DetailPengajuanMahasiswa
