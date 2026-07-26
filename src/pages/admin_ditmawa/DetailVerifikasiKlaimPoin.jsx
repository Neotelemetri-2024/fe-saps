import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, ImageIcon } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { getCurrentUser } from '../../services/authService'
import { getKlaimById, verifikasiKlaim } from '../../services/poinService'
import { getApiBase } from '../../services/apiClient'

function DetailRow({ label, value, multiline = false }) {
  return (
    <div
      className={`grid grid-cols-1 gap-1 sm:grid-cols-[220px_1fr] sm:gap-6 ${
        multiline ? 'items-start' : 'items-baseline'
      }`}
    >
      <p className="text-sm font-medium text-[#333]">{label}</p>
      <p className={`text-sm text-[#111] ${multiline ? 'leading-relaxed' : ''}`}>{value || '-'}</p>
    </div>
  )
}

function mapStatus(status) {
  const s = String(status || '').toLowerCase()
  if (['menunggu_validasi', 'pending'].includes(s)) return 'pending'
  if (['menunggu_pimpinan'].includes(s)) return 'diteruskan'
  if (['perlu_revisi', 'revisi'].includes(s)) return 'revisi'
  if (['disetujui'].includes(s)) return 'disetujui'
  if (['ditolak'].includes(s)) return 'ditolak'
  return s || 'pending'
}

function formatTanggal(start, end) {
  if (!start) return '-'
  try {
    const a = new Date(start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    if (!end) return a
    const b = new Date(end).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    return `${a} - ${b}`
  } catch {
    return String(start)
  }
}

function normalizeDetail(raw) {
  if (!raw) return null
  const part = raw.partisipasi || {}
  const kegiatan = part.kegiatan || {}
  const mahasiswa = part.mahasiswa || {}
  const capaian = (kegiatan.kegiatanCapaian || [])
    .map((kc) => kc.subCapaian?.capaian?.nama)
    .filter(Boolean)
  const buktiUrl = raw.bukti?.[0]?.url || raw.buktiUrl || null
  const apiBase = getApiBase()
  return {
    id: String(raw.id),
    mahasiswa: mahasiswa.user?.nama || raw.mahasiswa || '-',
    nim: mahasiswa.nim || '-',
    prodi: mahasiswa.prodi?.nama || '-',
    kegiatan: kegiatan.nama || raw.kegiatan || '-',
    kategori: kegiatan.kategori?.nama || '-',
    peran: raw.peranUsulan?.nama || part.peranVerif?.nama || '-',
    tanggal: formatTanggal(kegiatan.tanggalMulai, kegiatan.tanggalSelesai),
    penyelenggara: kegiatan.penyelenggaraExt || kegiatan.organisasi?.nama || '-',
    email: kegiatan.emailExt || mahasiswa.user?.email || '-',
    linkWebsite: kegiatan.linkWebsiteExt || '-',
    deskripsi: kegiatan.deskripsi || '-',
    bukti: buktiUrl ? (buktiUrl.startsWith('http') ? buktiUrl : `${apiBase}${buktiUrl}`) : null,
    capaian: [...new Set(capaian)],
    subCapaian: (kegiatan.kegiatanCapaian || []).map((kc) => ({
      label: kc.subCapaian?.nama || '-',
      persen: kc.persentase != null ? `${kc.persentase}%` : '-',
    })),
    status: mapStatus(raw.status),
    statusRaw: raw.status,
    alasan: raw.alasan || null,
  }
}

function DetailVerifikasiKlaimPoin() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const user = getCurrentUser()

  const [item, setItem] = useState(location.state?.item ? normalizeDetail({
    ...location.state.item,
    status: location.state.item.statusRaw || location.state.item.status,
  }) : null)
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
      .catch((err) => {
        if (!location.state?.item) {
          toast.error('Gagal memuat detail', { description: err.message })
          setItem(null)
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  const backToList = () => navigate('/admin_ditmawa/verifikasi-klaim')

  const handleSetujui = async () => {
    setSubmitting(true)
    try {
      await verifikasiKlaim(id, { keputusan: 'disetujui' })
      toast.success('Klaim poin disetujui!', {
        description: `Klaim "${item?.kegiatan}" diteruskan ke Pimpinan Ditmawa.`,
      })
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
      const keputusan = actionType === 'revisi' ? 'perlu_revisi' : 'ditolak'
      await verifikasiKlaim(id, { keputusan, alasan: alasan.trim() })
      toast.success(actionType === 'revisi' ? 'Revisi dikirim!' : 'Ditolak!', {
        description:
          actionType === 'revisi'
            ? 'Catatan revisi dikirim ke mahasiswa.'
            : `Klaim "${item?.kegiatan}" ditolak.`,
      })
      setShowActionModal(false)
      backToList()
    } catch (err) {
      toast.error('Gagal', { description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const canAct = item?.status === 'pending'

  return (
    <DashboardLayout
      role="admin_ditmawa"
      userName={user?.nama || user?.name || 'Admin Ditmawa'}
      userRole={user?.jabatan || user?.role || 'Admin Ditmawa'}
    >
      <ConfirmModal
        isOpen={showConfirmSetujui}
        message={`Klaim poin "${item?.kegiatan}" oleh ${item?.mahasiswa} akan disetujui.`}
        confirmText={submitting ? 'Memproses...' : 'YA, SETUJUI'}
        cancelText="BATAL"
        onConfirm={handleSetujui}
        onCancel={() => setShowConfirmSetujui(false)}
      />

      <Modal isOpen={showActionModal} onClose={() => setShowActionModal(false)}>
        <p className="mb-2 text-sm font-medium text-black">
          Alasan {actionType === 'revisi' ? 'Revisi' : 'Tolak'}
          <span className="text-red-500">*</span>
        </p>
        <textarea
          className="w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark"
          rows="4"
          placeholder={
            actionType === 'revisi' ? 'Tuliskan catatan revisi...' : 'Tuliskan alasan penolakan...'
          }
          value={alasan}
          onChange={(e) => setAlasan(e.target.value)}
        />
        <div className="mt-6 flex justify-end gap-4">
          <button
            type="button"
            disabled={submitting}
            onClick={handleKirimAction}
            className={`rounded-lg px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60 ${
              actionType === 'revisi' ? 'bg-orange-500' : 'bg-red-600'
            }`}
          >
            {submitting ? 'Mengirim...' : actionType === 'revisi' ? 'Kirim Revisi' : 'Tolak Klaim'}
          </button>
          <button
            type="button"
            onClick={() => setShowActionModal(false)}
            className="rounded-lg border border-gray-400 px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            Batal
          </button>
        </div>
      </Modal>

      <div className="space-y-5">
        <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Detail</h2>

        <button
          type="button"
          onClick={backToList}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-dark hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>

        {loading && !item ? (
          <p className="text-sm text-[#616161]">Memuat detail...</p>
        ) : !item ? (
          <p className="text-sm text-[#616161]">Data klaim tidak ditemukan.</p>
        ) : (
          <>
            <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm sm:p-8">
              <div className="space-y-8">
                <section className="space-y-3">
                  <h3 className="text-base font-bold text-[#111]">Mahasiswa</h3>
                  <div className="space-y-2.5">
                    <DetailRow label="Nama Mahasiswa" value={item.mahasiswa} />
                    <DetailRow label="NIM" value={item.nim} />
                    <DetailRow label="Program Studi" value={item.prodi} />
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-base font-bold text-[#111]">Kegiatan</h3>
                  <div className="space-y-2.5">
                    <DetailRow label="Nama Kegiatan" value={item.kegiatan} />
                    <DetailRow label="Kategori" value={item.kategori} />
                    <DetailRow label="Peran" value={item.peran} />
                    <DetailRow label="Tanggal" value={item.tanggal} />
                    <DetailRow label="Penyelenggara" value={item.penyelenggara} />
                    <DetailRow label="Email" value={item.email} />
                    <DetailRow label="Link Website Penyelenggara" value={item.linkWebsite} />
                    <DetailRow label="Deskripsi Kegiatan" value={item.deskripsi} multiline />
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-base font-bold text-[#111]">Bukti</h3>
                  {item.bukti ? (
                    <a
                      href={item.bukti}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-brand-dark underline"
                    >
                      Lihat bukti dokumen
                    </a>
                  ) : (
                    <div className="flex h-32 w-48 items-center justify-center rounded-lg border-2 border-dashed border-[#d9dce7] bg-[#f9fafb]">
                      <div className="flex flex-col items-center gap-1 text-[#9aa0a6]">
                        <ImageIcon className="h-8 w-8" />
                        <p className="text-xs">Tidak ada bukti</p>
                      </div>
                    </div>
                  )}
                </section>

                <section className="space-y-3">
                  <h3 className="text-base font-bold text-[#111]">Capaian</h3>
                  <div className="space-y-1.5 text-sm text-[#111]">
                    {(item.capaian || []).length === 0 ? (
                      <p>-</p>
                    ) : (
                      item.capaian.map((c) => <p key={c}>{c}</p>)
                    )}
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-base font-bold text-[#111]">Sub Capaian</h3>
                  <div className="space-y-2.5">
                    {(item.subCapaian || []).length === 0 ? (
                      <p className="text-sm text-[#616161]">-</p>
                    ) : (
                      item.subCapaian.map((sc) => (
                        <DetailRow key={sc.label} label={sc.label} value={sc.persen} />
                      ))
                    )}
                  </div>
                </section>
              </div>
            </div>

            {!canAct && (
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-[#9aa0a6]">Status</p>
                {item.status === 'disetujui' && (
                  <p className="text-2xl font-extrabold text-brand-dark">DISETUJUI</p>
                )}
                {item.status === 'diteruskan' && (
                  <p className="text-2xl font-extrabold text-brand-dark">DITERUSKAN</p>
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
                <button
                  type="button"
                  onClick={() => setShowConfirmSetujui(true)}
                  className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition hover:opacity-90"
                >
                  Setuju
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActionType('revisi')
                    setAlasan('')
                    setShowActionModal(true)
                  }}
                  className="rounded-lg bg-orange-500 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-orange-600"
                >
                  Revisi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActionType('tolak')
                    setAlasan('')
                    setShowActionModal(true)
                  }}
                  className="rounded-lg bg-red-700 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-red-800"
                >
                  Tolak
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default DetailVerifikasiKlaimPoin
