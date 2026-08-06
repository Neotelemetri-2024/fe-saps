import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { getKegiatanById, approvalKegiatan } from '../../services/kegiatanService'
import { getCurrentUser } from '../../services/authService'
import { InfoRow, SectionCard } from '../../components/ui/DetailComponents'

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
    jenis: k.kategori?.nama || '-',
    skala: k.skala?.nama || '-',
    tanggal: formatDate(k.tanggalMulai),
    penyelenggara: k.penyelenggaraExt || '-',
    email: k.emailPenyelenggara || k.emailExt || '-',
    linkWebsite: k.linkPenyelenggara || k.linkWebsite || '-',
    deskripsi: k.deskripsi || '',
    status: k.status,
    alasan: latestApproval?.alasan || '',
    capaian: capaianList,
    subCapaian: subCapaianList,
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
  const [userName, setUserName] = useState('Pimpinan Ditmawa')

  useEffect(() => {
    const u = getCurrentUser()
    if (u?.nama) setUserName(u.nama)
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
    } catch (err) { toast.error('Gagal', { description: err.message }) }
    finally { setSubmitting(false) }
  }

  const handleKirimAction = async () => {
    if (!alasan.trim()) { toast.error('Alasan tidak boleh kosong.'); return }
    setSubmitting(true)
    try {
      await approvalKegiatan(id, { keputusan: 'tolak', alasan: alasan.trim() })
      toast.success('Pengajuan ditolak!')
      setShowActionModal(false)
      backToList()
    } catch (err) { toast.error('Gagal', { description: err.message }) }
    finally { setSubmitting(false) }
  }

  if (loading) return (
    <DashboardLayout role="pimpinan_ditmawa" userName={userName} userRole="Pimpinan Ditmawa">
      <div className="py-24 text-center text-sm text-[#9aa0a6]">Memuat detail…</div>
    </DashboardLayout>
  )

  if (!item) return (
    <DashboardLayout role="pimpinan_ditmawa" userName={userName} userRole="Pimpinan Ditmawa">
      <div className="flex flex-col items-center gap-4 py-20">
        <p className="text-base font-semibold text-[#616161]">Data tidak ditemukan.</p>
        <button type="button" onClick={backToList} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-dark px-6 py-2 text-sm font-semibold text-white hover:opacity-90">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>
      </div>
    </DashboardLayout>
  )

  const canAct = item.status === 'terverifikasi'

  return (
    <DashboardLayout role="pimpinan_ditmawa" userName={userName} userRole="Pimpinan Ditmawa">
      <ConfirmModal
        isOpen={showConfirmSetujui}
        message="Pengajuan ini akan disetujui dan poin akan diberikan kepada mahasiswa."
        confirmText={submitting ? 'Memproses...' : 'SETUJUI'}
        cancelText="BATAL"
        onConfirm={handleSetujui}
        onCancel={() => setShowConfirmSetujui(false)}
      />
      <Modal isOpen={showActionModal} onClose={() => !submitting && setShowActionModal(false)} size="md">
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#111]">Tolak Pengajuan</h3>
            <p className="mt-0.5 text-sm text-[#616161]">Tuliskan alasan penolakan.</p>
          </div>
          <textarea className="w-full rounded-xl border border-[#e9ebf8] p-3 text-sm text-[#333] outline-none focus:border-brand-dark focus:ring-1 focus:ring-brand-dark" rows={4}
            placeholder="Contoh: Kegiatan tidak sesuai kriteria..."
            value={alasan} onChange={(e) => setAlasan(e.target.value)} />
          <div className="flex gap-3 pt-1">
            <button type="button" disabled={submitting} onClick={handleKirimAction}
              className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60">
              {submitting ? 'Mengirim…' : 'Tolak Pengajuan'}
            </button>
            <button type="button" disabled={submitting} onClick={() => setShowActionModal(false)}
              className="flex-1 rounded-xl border border-[#d9dce7] py-2.5 text-sm font-semibold text-[#333] hover:bg-[#f5f6f8]">Batal</button>
          </div>
        </div>
      </Modal>

      <div className="space-y-5">
        <button type="button" onClick={backToList}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-dark hover:underline">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[#222] sm:text-2xl">Detail Pengajuan Eksternal</h2>
            <p className="mt-1 text-sm text-[#616161]">Tinjau informasi kegiatan sebelum memberikan keputusan.</p>
          </div>
          <div className="shrink-0"><StatusBadge status={item.status} /></div>
        </div>

        {!canAct && item.alasan && (
          <div className={`rounded-xl border p-4 ${item.status === 'ditolak' ? 'border-red-200 bg-red-50' : item.status === 'perlu_revisi' ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'}`}>
            <p className={`text-xs font-semibold mb-1 ${item.status === 'ditolak' ? 'text-red-700' : item.status === 'perlu_revisi' ? 'text-yellow-700' : 'text-green-700'}`}>
              {item.status === 'ditolak' ? 'Alasan Penolakan' : 'Catatan Revisi'}
            </p>
            <p className={`text-sm whitespace-pre-wrap ${item.status === 'ditolak' ? 'text-red-800' : item.status === 'perlu_revisi' ? 'text-yellow-800' : 'text-green-800'}`}>{item.alasan}</p>
          </div>
        )}

        {!canAct && !item.alasan && (
          <div className="rounded-xl border border-[#e9ebf8] bg-[#f9fafb] px-5 py-3.5 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#9aa0a6]" />
            <p className="text-sm text-[#616161]">Pengajuan sudah diverifikasi dengan status <StatusBadge status={item.status} /></p>
          </div>
        )}

        <SectionCard title="Informasi Mahasiswa">
          <InfoRow label="Nama Mahasiswa" value={item.namaMahasiswa} />
          <InfoRow label="NIM" value={item.nim} />
          <InfoRow label="Program Studi" value={item.prodi} />
          <InfoRow label="Fakultas" value={item.fakultas} />
          <InfoRow label="Tanggal Pengajuan" value={item.tanggalPengajuan} />
        </SectionCard>

        <SectionCard title="Detail Kegiatan">
          <InfoRow label="Nama Kegiatan" value={item.kegiatan} />
          <InfoRow label="Kategori" value={item.kategori} />
          <InfoRow label="Skala" value={item.skala} />
          <InfoRow label="Tanggal Pelaksanaan" value={item.tanggal} />
          <InfoRow label="Penyelenggara" value={item.penyelenggara} />
          {item.email && item.email !== '-' && <InfoRow label="Email Penyelenggara" value={item.email} href={`mailto:${item.email}`} />}
          {item.linkWebsite && item.linkWebsite !== '-' && <InfoRow label="Link Website" value={item.linkWebsite} href={item.linkWebsite} />}
          {item.deskripsi && <InfoRow label="Deskripsi" value={item.deskripsi} multiline />}
        </SectionCard>

        {item.capaian?.length > 0 && (
          <SectionCard title="Capaian Kurikulum">
            {item.capaian.map((c, i) => <p key={i} className="text-sm font-medium text-[#111]">{c.label}</p>)}
          </SectionCard>
        )}

        {item.subCapaian?.length > 0 && (
          <SectionCard title="Sub Capaian & Bobot">
            {item.subCapaian.map((sc, i) => <InfoRow key={i} label={sc.label} sublabel={sc.capaian} value={sc.persen != null ? `${sc.persen}%` : '-'} />)}
          </SectionCard>
        )}

        {canAct && (
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => { setShowActionModal(true); setAlasan('') }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-600 hover:text-white">Tolak
              </button>
              <button type="button" onClick={() => setShowConfirmSetujui(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90">Setujui
              </button>
            </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default DetailVerifikasiPengajuanEksternal
