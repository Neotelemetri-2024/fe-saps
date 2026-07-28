import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { getKegiatanById, approvalKegiatan } from '../../services/kegiatanService'
import { getCurrentUser } from '../../services/authService'

function normalizeKegiatanDetail(k) {
  if (!k) return null
  const pembuat = k.pembuat || {}
  const mhs = pembuat.mahasiswa || {}
  const approval = Array.isArray(k.kegiatanApproval) ? k.kegiatanApproval : []
  const latestApproval = approval[0]
  return {
    id: k.id,
    namaMahasiswa: pembuat.nama || '-',
    nim: mhs.nim || '-',
    tanggalPengajuan: k.createdAt
      ? new Date(k.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      : '-',
    prodi: mhs.prodi?.nama || '-',
    fakultas: mhs.prodi?.fakultas?.nama || '-',
    kegiatan: k.nama || '-',
    kategori: k.kategori?.nama || '-',
    jenis: k.kategori?.nama || '-',
    skala: k.skala?.nama?.toLowerCase() || k.skala || '',
    tanggal: k.tanggalMulai
      ? new Date(k.tanggalMulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      : '-',
    penyelenggara: k.penyelenggaraExt || '-',
    emailPenyelenggara: k.emailPenyelenggara || '-',
    linkWebsite: k.linkPenyelenggara || k.linkWebsite || '-',
    deskripsi: k.deskripsi || '',
    status: k.status,
    alasan: latestApproval?.alasan || '',
    capaian: (() => {
      const seen = new Set()
      return (k.kegiatanCapaian || []).reduce((acc, kc) => {
        const nama = kc.subCapaian?.capaian?.nama
        if (nama && !seen.has(nama)) { seen.add(nama); acc.push({ label: nama }) }
        return acc
      }, [])
    })(),
    subCapaian: (k.kegiatanCapaian || []).map((kc) => ({
      label: kc.subCapaian?.nama || '-',
      persen: kc.alokasiPersen ?? null,
    })),
  }
}

const JENIS_LABEL = {
  prestasi: 'Kompetisi',
  organisasi: 'Organisasi',
  pelatihan: 'Pelatihan',
}

const SKALA_LABEL = {
  internasional: 'Internasional',
  nasional: 'Nasional',
  regional: 'Regional',
  lokal: 'Internal (UNAND)',
}

const DEFAULT_DETAIL = {
  deskripsi: 'Deskripsi kegiatan belum diisi oleh mahasiswa.',
  capaian: [],
  subCapaian: [],
}

function DetailRow({ label, value, multiline = false, href }) {
  return (
    <div className={`grid grid-cols-1 gap-1 sm:grid-cols-[220px_1fr] sm:gap-6 ${multiline ? 'items-start' : 'items-baseline'}`}>
      <p className="text-sm font-medium text-[#333]">{label}</p>
      {href && value && value !== '-' ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-dark underline hover:opacity-75 break-all">
          {value}
        </a>
      ) : (
        <p className={`text-sm text-[#111] ${multiline ? 'leading-relaxed' : ''}`}>{value || '-'}</p>
      )}
    </div>
  )
}

function DetailVerifikasiPengajuanEksternal() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showConfirmSetujui, setShowConfirmSetujui] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState(null)
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
      const keputusan = actionType === 'revisi' ? 'revisi' : 'tolak'
      await approvalKegiatan(id, { keputusan, alasan: alasan.trim() })
      toast.success(actionType === 'revisi' ? 'Revisi dikirim ke mahasiswa!' : 'Pengajuan ditolak!')
      setShowActionModal(false)
      backToList()
    } catch (err) {
      toast.error('Gagal', { description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="pimpinan_ditmawa" userName={userName} userRole="Pimpinan Ditmawa">
        <p className="py-20 text-center text-sm text-[#616161]">Memuat detail...</p>
      </DashboardLayout>
    )
  }

  if (!item) {
    return (
      <DashboardLayout role="pimpinan_ditmawa" userName={userName} userRole="Pimpinan Ditmawa">
        <div className="flex flex-col items-center gap-4 py-20">
          <p className="text-lg font-semibold text-[#616161]">Data tidak ditemukan.</p>
          <button type="button" onClick={backToList}
            className="rounded-lg bg-brand-dark px-6 py-2 text-sm font-semibold text-white transition hover:opacity-90">
            Kembali
          </button>
        </div>
      </DashboardLayout>
    )
  }

  const canAct = item.status === 'terverifikasi'

  const d = {
    ...DEFAULT_DETAIL,
    ...item,
    jenisLabel: JENIS_LABEL[item.jenis] || item.jenis || '-',
    skalaLabel: SKALA_LABEL[item.skala] || item.skala || '-',
    capaian: item.capaian?.length ? item.capaian : DEFAULT_DETAIL.capaian,
    subCapaian: item.subCapaian?.length ? item.subCapaian : DEFAULT_DETAIL.subCapaian,
    email: item.emailPenyelenggara || item.email || '-',
    linkWebsite: item.linkWebsite || '-',
  }

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

      <Modal
        isOpen={showActionModal}
        onClose={() => setShowActionModal(false)}
        title={actionType === 'revisi' ? 'Revisi Pengajuan' : 'Tolak Pengajuan'}
      >
        <p className="mb-2 text-sm font-medium text-black">
          Alasan {actionType === 'revisi' ? 'Revisi' : 'Tolak'}
          <span className="text-red-500">*</span>
        </p>
        <textarea
          className="w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark"
          rows="4"
          placeholder={actionType === 'revisi' ? 'Tuliskan catatan revisi...' : 'Tuliskan alasan penolakan...'}
          value={alasan}
          onChange={(e) => setAlasan(e.target.value)}
        />
        <div className="mt-6 flex justify-end gap-4">
          <button type="button" disabled={submitting} onClick={handleKirimAction}
            className={`rounded-lg px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60 ${actionType === 'revisi' ? 'bg-orange-500' : 'bg-red-600'}`}>
            {submitting ? 'Mengirim...' : actionType === 'revisi' ? 'Kirim Revisi' : 'Tolak Pengajuan'}
          </button>
          <button type="button" onClick={() => setShowActionModal(false)}
            className="rounded-lg border border-gray-400 px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100">
            Batal
          </button>
        </div>
      </Modal>

      <div className="space-y-5">
        <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Detail</h2>

        <button type="button" onClick={backToList}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-dark hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-8">
            <section className="space-y-3">
              <h3 className="text-base font-bold text-[#111]">Informasi Mahasiswa</h3>
              <div className="space-y-2.5">
                <DetailRow label="Nama Mahasiswa" value={d.namaMahasiswa} />
                <DetailRow label="NIM" value={d.nim} />
                <DetailRow label="Program Studi" value={d.prodi} />
                <DetailRow label="Fakultas" value={d.fakultas} />
                <DetailRow label="Tanggal Pengajuan" value={d.tanggalPengajuan} />
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold text-[#111]">Kegiatan</h3>
              <div className="space-y-2.5">
                <DetailRow label="Nama Kegiatan" value={d.kegiatan} />
                <DetailRow label="Jenis Kegiatan" value={d.jenisLabel} />
                <DetailRow label="Skala" value={d.skalaLabel} />
                <DetailRow label="Tanggal" value={d.tanggal} />
                <DetailRow label="Penyelenggara" value={d.penyelenggara} />
                <DetailRow label="Email" value={d.email} href={d.email !== '-' ? `mailto:${d.email}` : undefined} />
                <DetailRow label="Link Website Penyelenggara" value={d.linkWebsite} href={d.linkWebsite !== '-' ? d.linkWebsite : undefined} />
                <DetailRow label="Deskripsi Kegiatan" value={d.deskripsi} multiline />
              </div>
            </section>

            {d.capaian.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-base font-bold text-[#111]">Capaian</h3>
                <div className="space-y-1.5">
                  {d.capaian.map((c, i) => (
                    <p key={i} className="text-sm text-[#111]">{c.label}</p>
                  ))}
                </div>
              </section>
            )}

            {d.subCapaian.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-base font-bold text-[#111]">Sub Capaian</h3>
                <div className="space-y-2.5">
                  {d.subCapaian.map((sc, i) => (
                    <DetailRow
                      key={i}
                      label={sc.label}
                      value={sc.persen != null ? `${sc.persen}%` : sc.poin != null ? `${sc.poin}%` : '-'}
                    />
                  ))}
                </div>
              </section>
            )}

          </div>
        </div>

        {!canAct && (
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-[#9aa0a6]">Status</p>
            {item.status === 'disetujui' && (
              <p className="text-2xl font-extrabold text-brand-dark">DISETUJUI</p>
            )}
            {item.status === 'revisi' && (
              <p className="text-2xl font-extrabold text-orange-500">REVISI</p>
            )}
            {item.status === 'ditolak' && (
              <p className="text-2xl font-extrabold text-red-600">DITOLAK</p>
            )}
            {item.alasan && (
              <p className="mt-1 text-sm text-[#616161]">
                <span className="font-medium">Alasan:</span> {item.alasan}
              </p>
            )}
          </div>
        )}

        {canAct && (
          <div className="grid gap-3 sm:grid-cols-3">
            <button type="button" onClick={() => setShowConfirmSetujui(true)}
              className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition hover:opacity-90">
              Setuju
            </button>
            <button type="button" onClick={() => { setActionType('revisi'); setAlasan(''); setShowActionModal(true) }}
              className="rounded-lg bg-orange-500 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-orange-600">
              Revisi
            </button>
            <button type="button" onClick={() => { setActionType('tolak'); setAlasan(''); setShowActionModal(true) }}
              className="rounded-lg bg-red-700 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-red-800">
              Tolak
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default DetailVerifikasiPengajuanEksternal
