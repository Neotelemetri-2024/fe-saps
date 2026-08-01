import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, CalendarDays, CheckCircle2, RotateCcw, User, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import { setujuiTolak } from '../../services/pengajuanService'
import { getCurrentUser } from '../../services/authService'
import { InfoRow, SectionCard } from '../../components/ui/DetailComponents'

function DetailPersetujuanDosen() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getCurrentUser()
  const row = location.state?.row

  const [actionType, setActionType] = useState(null)
  const [alasan, setAlasan] = useState('')
  const [loading, setLoading] = useState(false)

  if (!row) {
    return (
      <DashboardLayout role="dosen" userName={user?.nama || 'Dosen PA'} userRole="Dosen Pembimbing">
        <div className="py-16 text-center text-sm text-[#9aa0a6]">Data tidak ditemukan.</div>
      </DashboardLayout>
    )
  }

  const kg = row.partisipasi?.kegiatan || {}
  const mhs = row.partisipasi?.mahasiswa || {}
  const nim = mhs.nim || '-'
  const prodi = mhs.prodi?.nama || '-'
  const fakultas = mhs.prodi?.fakultas?.nama || '-'
  const tanggalPengajuan = row.tanggalDiajukan || row.createdAt
    ? new Date(row.tanggalDiajukan || row.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    : '-'
  const tanggalKegiatan = kg.tanggalMulai
    ? new Date(kg.tanggalMulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    : row.tanggal || '-'
  const isActionable = row.status === 'pending' || row.status === 'diajukan'

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
      const statusKey = actionType === 'revisi' ? 'revisi' : 'ditolak'
      await setujuiTolak(row.id, statusKey, alasan.trim())
      toast.success('Berhasil!', { description: `Kegiatan berhasil di${actionType}.` })
      navigate(-1)
    } catch (err) { toast.error('Gagal', { description: err.message }) }
    finally { setLoading(false) }
  }

  return (
    <DashboardLayout role="dosen" userName={user?.nama || 'Dosen PA'} userRole="Dosen Pembimbing">
      <div className="space-y-5">
        <button type="button" onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-dark hover:underline">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-brand-dark sm:text-2xl">Detail Permintaan Persetujuan</h2>
            <p className="mt-1 text-sm text-[#616161]">Tinjau detail kegiatan sebelum memberikan keputusan.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {row.isUlang && isActionable ? (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">Diajukan Ulang</span>
            ) : (
              <StatusBadge status={row.status} />
            )}
          </div>
        </div>

        <SectionCard title="Identitas Mahasiswa" icon={User}>
          <InfoRow label="Nama Mahasiswa" value={row.mahasiswa} />
          <InfoRow label="NIM" value={nim} />
          <InfoRow label="Program Studi" value={prodi} />
          <InfoRow label="Fakultas" value={fakultas} />
          <InfoRow label="Tanggal Pengajuan" value={tanggalPengajuan} />
        </SectionCard>

        <SectionCard title="Detail Kegiatan" icon={CalendarDays}>
          <InfoRow label="Nama Kegiatan" value={row.kegiatan} />
          <InfoRow label="Jenis / Kategori" value={row.jenis} />
          <InfoRow label="Skala" value={kg.skala?.nama || '-'} />
          <InfoRow label="Peran / Pencapaian" value={row.peran} />
          <InfoRow label="Penyelenggara" value={row.penyelenggara} />
          <InfoRow label="Tanggal Pelaksanaan" value={tanggalKegiatan} />
          {(kg.linkPenyelenggara || kg.linkWebsite) && (
            <InfoRow label="Link Website" value={kg.linkPenyelenggara || kg.linkWebsite} href={kg.linkPenyelenggara || kg.linkWebsite} />
          )}
          {kg.emailPenyelenggara && (
            <InfoRow label="Email Penyelenggara" value={kg.emailPenyelenggara} href={`mailto:${kg.emailPenyelenggara}`} />
          )}
          {kg.deskripsi && <InfoRow label="Deskripsi" value={kg.deskripsi} multiline />}
        </SectionCard>

        {isActionable && (
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-brand-dark">Keputusan</h3>
            {!actionType ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={handleSetuju} disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60">
                  <CheckCircle2 className="h-4 w-4" />{loading ? 'Memproses...' : 'Setujui'}
                </button>
                <button type="button" onClick={() => { setActionType('revisi'); setAlasan('') }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-400 bg-orange-50 px-5 py-2.5 text-sm font-bold text-orange-600 transition hover:bg-orange-500 hover:text-white">
                  <RotateCcw className="h-4 w-4" /> Revisi
                </button>
                <button type="button" onClick={() => { setActionType('tolak'); setAlasan('') }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-600 hover:text-white">
                  <XCircle className="h-4 w-4" /> Tolak
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-[#333]">
                  Alasan {actionType === 'revisi' ? 'Revisi' : 'Penolakan'}<span className="text-red-500">*</span>
                </p>
                <textarea rows={4} value={alasan} onChange={(e) => setAlasan(e.target.value)}
                  placeholder={actionType === 'revisi' ? 'Tuliskan catatan revisi...' : 'Tuliskan alasan penolakan...'}
                  maxLength={500}
                  className="w-full rounded-xl border border-[#e9ebf8] p-3 text-sm text-[#333] outline-none focus:border-brand-dark focus:ring-1 focus:ring-brand-dark" />
                <p className="text-right text-xs text-[#888]">{alasan.length}/500</p>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button type="button" onClick={handleKirimAlasan} disabled={loading}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60 ${actionType === 'revisi' ? 'bg-orange-500' : 'bg-red-600'}`}>
                    {loading ? 'Mengirim...' : 'Kirim'}
                  </button>
                  <button type="button" onClick={() => { setActionType(null); setAlasan('') }}
                    className="rounded-xl border border-[#d9dce7] px-5 py-2.5 text-sm font-semibold text-[#333] transition hover:bg-[#f5f6f8]">
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default DetailPersetujuanDosen
