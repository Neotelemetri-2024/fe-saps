import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import Modal from '../../components/ui/Modal'
import { DetailSkeleton } from '../../components/dashboard/Skeleton'
import { getKegiatanById, verifikasiKegiatan } from '../../services/kegiatanService'
import { getKurikulumAktif } from '../../services/kurikulumService'
import PemetaanCapaianKurikulumSection from '../../components/PemetaanCapaianKurikulumSection'
import { getCurrentUser } from '../../services/authService'
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
import { batalBtnClass } from '../../components/ui/buttonStyles'

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
    email: k.emailPenyelenggara || '-',
    linkWebsite: k.linkPenyelenggara || k.linkWebsite || '-',
    deskripsi: k.deskripsi || '',
    status: k.status,
    alasan: latestApproval?.alasan || '',
    kurikulumNama: mhs.kurikulum?.nama || k.kurikulumNama || k.kurikulum?.nama || null,
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
      capaian: kc.subCapaian?.capaian?.nama || '',
      persen: kc.alokasiPersen ?? null,
    })),
  }
}

function DetailVerifikasiPengajuanEksternal() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState(null)
  const [alasan, setAlasan] = useState('')
  const [userName, setUserName] = useState('Admin Ditmawa')

  // Form pemetaan capaian
  const [showCapaianForm, setShowCapaianForm] = useState(false)
  const [selectedKurikulumIds, setSelectedKurikulumIds] = useState([])
  const [kurikulumList, setKurikulumList] = useState([])
  const [loadingKur, setLoadingKur] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [alokasi, setAlokasi] = useState([])
  const [selectedCapaianIds, setSelectedCapaianIds] = useState([])

  // Load kegiatan
  useEffect(() => {
    const u = getCurrentUser()
    if (u?.nama) setUserName(u.nama)
    setLoading(true)
    getKegiatanById(id)
      .then((k) => setItem(normalizeKegiatanDetail(k)))
      .catch(() => setItem(null))
      .finally(() => setLoading(false))
  }, [id])

  // Load kurikulum saat form pemetaan muncul
  useEffect(() => {
    if (!showCapaianForm || kurikulumList.length > 0) return
    setLoadingKur(true)
    getKurikulumAktif()
      .then((kur) => {
        const list = Array.isArray(kur) ? kur : (kur ? [kur] : [])
        setKurikulumList(list)
        setSelectedKurikulumIds(list.map((k) => k.id))
      })
      .catch(() => toast.error('Gagal memuat kurikulum'))
      .finally(() => setLoadingKur(false))
  }, [showCapaianForm, kurikulumList.length])

  const backToList = () => navigate('/admin_ditmawa/verifikasi-pengajuan-eksternal')

  const handleSubmitSetuju = async () => {
    if (kurikulumList.length === 0) {
      toast.error('Tidak ada kurikulum aktif.')
      return
    }
    for (const kur of kurikulumList) {
      const kurSubIds = (kur.capaian || []).flatMap((c) => (c.subCapaian || []).map((sc) => sc.id))
      const kurAlokasi = alokasi.filter((a) => kurSubIds.includes(a.subCapaianId))
      if (kurAlokasi.length === 0) {
        toast.error(`Pilih minimal satu sub-capaian untuk ${kur.nama}`)
        return
      }
      const sum = kurAlokasi.reduce((s, a) => s + (a.alokasiPersen || 0), 0)
      if (Math.abs(sum - 100) > 0.01) {
        toast.error(`Total bobot untuk ${kur.nama} harus tepat 100%. Saat ini: ${sum}%`)
        return
      }
    }
    setSubmitting(true)
    try {
      await verifikasiKegiatan(id, { keputusan: 'setuju', alokasi })
      toast.success('Diteruskan ke Pimpinan Ditmawa', {
        description: `Pengajuan "${item?.kegiatan}" telah diteruskan.`,
      })
      backToList()
    } catch (err) {
      toast.error('Gagal', { description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const openAction = (type) => {
    setActionType(type)
    setAlasan('')
    setShowActionModal(true)
  }

  const handleKirimAction = async () => {
    if (!alasan.trim()) {
      toast.error('Gagal!', { description: 'Alasan tidak boleh kosong.' })
      return
    }
    setSubmitting(true)
    try {
      const keputusan = actionType === 'revisi' ? 'revisi' : 'tolak'
      await verifikasiKegiatan(id, { keputusan, alasan: alasan.trim() })
      toast.success(actionType === 'revisi' ? 'Revisi Dikirim!' : 'Ditolak!', {
        description:
          actionType === 'revisi'
            ? 'Catatan revisi telah dikirim ke mahasiswa.'
            : `Pengajuan "${item?.kegiatan}" telah ditolak.`,
      })
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
      <DashboardLayout role="admin_ditmawa" userName={userName} userRole="Admin Ditmawa">
        <DetailSkeleton />
      </DashboardLayout>
    )
  }

  if (!item) {
    return (
      <DashboardLayout role="admin_ditmawa" userName={userName} userRole="Admin Ditmawa">
        <EmptyDetail onBack={backToList} />
      </DashboardLayout>
    )
  }

  const canAct = item.status === 'diajukan'

  return (
    <DashboardLayout role="admin_ditmawa" userName={userName} userRole="Admin Ditmawa">
      {/* Modal Revisi / Tolak */}
      <Modal isOpen={showActionModal} onClose={() => !submitting && setShowActionModal(false)} size="md">
        <RejectForm
          title={actionType === 'revisi' ? 'Minta revisi' : 'Tolak pengajuan'}
          description={actionType === 'revisi' ? 'Tuliskan catatan yang perlu diperbaiki oleh mahasiswa.' : 'Tuliskan alasan penolakan pengajuan ini.'}
          placeholder={actionType === 'revisi' ? 'Contoh: Lampiran sertifikat belum diunggah.' : 'Contoh: Kegiatan tidak sesuai kriteria.'}
          submitLabel={actionType === 'revisi' ? 'Kirim revisi' : 'Tolak'}
          variant={actionType === 'revisi' ? 'warning' : 'error'}
          alasan={alasan}
          onChange={setAlasan}
          onSubmit={handleKirimAction}
          onCancel={() => setShowActionModal(false)}
          submitting={submitting}
        />
      </Modal>

      <div className="space-y-5">
        <DetailBackButton onClick={backToList} />
        <DetailHeader
          title="Detail pengajuan eksternal"
          description="Tinjau informasi kegiatan sebelum memberi keputusan."
          status={item.status}
        />

        {!canAct && item.alasan ? <DecisionNote status={item.status} alasan={item.alasan} /> : null}

        {/* Info Mahasiswa */}
        <SectionCard title="Informasi Mahasiswa">
          <InfoRow label="Nama" value={item.namaMahasiswa} />
          <InfoRow label="NIM" value={item.nim} />
          <InfoRow label="Program Studi" value={item.prodi} />
          <InfoRow label="Fakultas" value={item.fakultas} />
          <InfoRow label="Tanggal Pengajuan" value={item.tanggalPengajuan} />
        </SectionCard>

        {/* Info Kegiatan */}
        <SectionCard title="Detail Kegiatan">
          <InfoRow label="Nama Kegiatan" value={item.kegiatan} />
          <InfoRow label="Kategori" value={item.kategori} />
          <InfoRow label="Skala" value={item.skala} />
          <InfoRow label="Tanggal Pelaksanaan" value={item.tanggal} />
          <InfoRow label="Penyelenggara" value={item.penyelenggara} />
          {item.email && item.email !== '-' && (
            <InfoRow label="Email Penyelenggara" value={item.email} href={`mailto:${item.email}`} />
          )}
          {item.linkWebsite && item.linkWebsite !== '-' && (
            <InfoRow label="Link Website" value={item.linkWebsite} href={item.linkWebsite} />
          )}
          {item.deskripsi && (
            <InfoRow label="Deskripsi" value={item.deskripsi} multiline />
          )}
        </SectionCard>

        {/* Capaian yang sudah diinput (setelah disetujui) */}
        <SectionCard title="Kurikulum Mahasiswa">
          <InfoRow label="Kurikulum" value={item.kurikulumNama || '-'} />
        </SectionCard>

        {item.capaian?.length > 0 && (
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
        )}

        {item.subCapaian?.length > 0 && (
          <SectionCard title="Sub capaian">
            {item.subCapaian.map((sc, i) => (
              <InfoRow
                key={i}
                label={sc.label}
                sublabel={sc.capaian}
                value={sc.persen != null ? `${sc.persen}%` : '—'}
              />
            ))}
          </SectionCard>
        )}

        {/* Tombol aksi awal */}
        {canAct && !showCapaianForm ? (
          <DecisionActions
            onReject={() => openAction('tolak')}
            onRevise={() => openAction('revisi')}
            onApprove={() => setShowCapaianForm(true)}
            approveLabel="Teruskan ke pimpinan"
          />
        ) : null}

        {/* Form pemetaan capaian — muncul setelah klik Teruskan ke Pimpinan */}
        {canAct && showCapaianForm && (
          <div className="card border border-base-300 bg-base-100 p-5 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-base-content">Pemetaan capaian kurikulum</h3>
              <p className="mt-0.5 text-sm text-base-content/60">
                Tentukan capaian kurikulum yang dicapai melalui kegiatan ini sebelum meneruskan ke pimpinan.
              </p>
            </div>

            {loadingKur ? (
              <p className="text-sm text-base-content/50">Memuat kurikulum…</p>
            ) : kurikulumList.length === 0 ? (
              <p className="text-sm text-error">Kurikulum aktif tidak ditemukan. Hubungi Super Admin.</p>
            ) : (
              <PemetaanCapaianKurikulumSection
                kurikulumList={kurikulumList}
                selectedKurikulumIds={selectedKurikulumIds}
                setSelectedKurikulumIds={setSelectedKurikulumIds}
                selectedCapaianIds={selectedCapaianIds}
                setSelectedCapaianIds={setSelectedCapaianIds}
                alokasi={alokasi}
                setAlokasi={setAlokasi}
              />
            )}

            {/* Tombol submit */}
            <div className="flex flex-col-reverse gap-2 border-t border-base-300 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowCapaianForm(false)
                  setSelectedCapaianIds([])
                  setAlokasi([])
                }} className={batalBtnClass}>
                Batal
              </button>
              <button
                type="button"
                disabled={submitting || loadingKur}
                onClick={handleSubmitSetuju}
                className="btn btn-primary btn-sm"
              >
                {submitting ? 'Memproses…' : 'Teruskan ke pimpinan'}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default DetailVerifikasiPengajuanEksternal
