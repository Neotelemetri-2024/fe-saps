import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle2, X } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import Modal from '../../components/ui/Modal'
import { getKegiatanById, verifikasiKegiatan } from '../../services/kegiatanService'
import { getKurikulumAktif } from '../../services/kurikulumService'
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
  const [submitting, setSubmitting] = useState(false)
  const [userName, setUserName] = useState('Admin Ditmawa')

  // Form pemetaan capaian
  const [showCapaianForm, setShowCapaianForm] = useState(false)
  const [kurikulum, setKurikulum] = useState(null)
  const [loadingKur, setLoadingKur] = useState(false)
  const [selectedCapaianIds, setSelectedCapaianIds] = useState([])
  const [alokasi, setAlokasi] = useState([])
  const [capaianOpen, setCapaianOpen] = useState(false)
  const capaianRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (capaianRef.current && !capaianRef.current.contains(e.target)) {
        setCapaianOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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
    if (!showCapaianForm || kurikulum) return
    setLoadingKur(true)
    getKurikulumAktif()
      .then((kur) => setKurikulum(kur))
      .catch(() => toast.error('Gagal memuat kurikulum'))
      .finally(() => setLoadingKur(false))
  }, [showCapaianForm])

  const backToList = () => navigate('/admin_ditmawa/verifikasi-pengajuan-eksternal')

  const allCapaian = kurikulum?.capaian || []
  const visibleSubCapaian = allCapaian
    .filter((c) => selectedCapaianIds.includes(c.id))
    .flatMap((c) => (c.subCapaian || []).map((sc) => ({ ...sc, namaCapaian: c.nama })))
  const totalBobot = alokasi.reduce((s, a) => s + (a.alokasiPersen || 0), 0)

  const toggleCapaian = (cid) => {
    setSelectedCapaianIds((prev) => {
      const next = prev.includes(cid) ? prev.filter((x) => x !== cid) : [...prev, cid]
      const validSubIds = allCapaian
        .filter((c) => next.includes(c.id))
        .flatMap((c) => (c.subCapaian || []).map((sc) => sc.id))
      setAlokasi((a) => a.filter((x) => validSubIds.includes(x.subCapaianId)))
      return next
    })
  }

  const toggleSub = (scId) => {
    setAlokasi((prev) => {
      const exists = prev.find((a) => a.subCapaianId === scId)
      if (exists) return prev.filter((a) => a.subCapaianId !== scId)
      return [...prev, { subCapaianId: scId, alokasiPersen: 100 }]
    })
  }

  const setAlokasiPersen = (scId, persen) => {
    setAlokasi((prev) =>
      prev.map((a) => (a.subCapaianId === scId ? { ...a, alokasiPersen: Number(persen) } : a))
    )
  }

  const handleSubmitSetuju = async () => {
    if (alokasi.length === 0) {
      toast.error('Pilih minimal satu sub-capaian')
      return
    }
    if (Math.abs(totalBobot - 100) > 0.01) {
      toast.error(`Total bobot harus tepat 100%. Saat ini: ${totalBobot}%`)
      return
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
        <div className="py-24 text-center text-sm text-[#9aa0a6]">Memuat detail…</div>
      </DashboardLayout>
    )
  }

  if (!item) {
    return (
      <DashboardLayout role="admin_ditmawa" userName={userName} userRole="Admin Ditmawa">
        <div className="flex flex-col items-center gap-4 py-20">
          <p className="text-base font-semibold text-[#616161]">Data tidak ditemukan.</p>
          <button type="button" onClick={backToList}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-dark px-6 py-2 text-sm font-semibold text-white hover:opacity-90">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </button>
        </div>
      </DashboardLayout>
    )
  }

  const canAct = item.status === 'diajukan'

  return (
    <DashboardLayout role="admin_ditmawa" userName={userName} userRole="Admin Ditmawa">
      {/* Modal Revisi / Tolak */}
      <Modal isOpen={showActionModal} onClose={() => !submitting && setShowActionModal(false)} size="md">
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#111]">
              {actionType === 'revisi' ? 'Minta Revisi' : 'Tolak Pengajuan'}
            </h3>
            <p className="mt-0.5 text-sm text-[#616161]">
              {actionType === 'revisi'
                ? 'Tuliskan catatan yang perlu diperbaiki oleh mahasiswa.'
                : 'Tuliskan alasan penolakan pengajuan ini.'}
            </p>
          </div>
          <textarea
            className="w-full rounded-xl border border-[#e9ebf8] p-3 text-sm text-[#333] outline-none focus:border-brand-dark focus:ring-1 focus:ring-brand-dark"
            rows={4}
            placeholder={actionType === 'revisi' ? 'Contoh: Lampiran sertifikat belum diunggah...' : 'Contoh: Kegiatan tidak sesuai kriteria...'}
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
          />
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              disabled={submitting}
              onClick={handleKirimAction}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60 ${
                actionType === 'revisi' ? 'bg-orange-500' : 'bg-red-600'
              }`}
            >
              {submitting ? 'Mengirim…' : actionType === 'revisi' ? 'Kirim Revisi' : 'Tolak Pengajuan'}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => setShowActionModal(false)}
              className="flex-1 rounded-xl border border-[#d9dce7] py-2.5 text-sm font-semibold text-[#333] hover:bg-[#f5f6f8]"
            >
              Batal
            </button>
          </div>
        </div>
      </Modal>

      <div className="space-y-5">
        {/* Back */}
        <button type="button" onClick={backToList}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-dark hover:underline">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar
        </button>

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[#222] sm:text-2xl">Detail Pengajuan Eksternal</h2>
            <p className="mt-1 text-sm text-[#616161]">Tinjau informasi kegiatan sebelum memberikan keputusan.</p>
          </div>
          <div className="shrink-0">
            <StatusBadge status={item.status} />
          </div>
        </div>

        {/* Alasan jika sudah diverifikasi */}
        {!canAct && item.alasan && (
          <div className={`rounded-xl border p-4 ${
            item.status === 'ditolak' ? 'border-red-200 bg-red-50' :
            item.status === 'perlu_revisi' ? 'border-yellow-200 bg-yellow-50' :
            'border-green-200 bg-green-50'
          }`}>
            <p className={`text-xs font-semibold mb-1 ${
              item.status === 'ditolak' ? 'text-red-700' :
              item.status === 'perlu_revisi' ? 'text-yellow-700' :
              'text-green-700'
            }`}>
              {item.status === 'ditolak' ? 'Alasan Penolakan' : 'Catatan Revisi'}
            </p>
            <p className={`text-sm whitespace-pre-wrap ${
              item.status === 'ditolak' ? 'text-red-800' :
              item.status === 'perlu_revisi' ? 'text-yellow-800' :
              'text-green-800'
            }`}>{item.alasan}</p>
          </div>
        )}

        {!canAct && !item.alasan && (
          <div className="rounded-xl border border-[#e9ebf8] bg-[#f9fafb] px-5 py-3.5 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <p className="text-sm text-[#616161]">
              Pengajuan ini sudah diverifikasi dengan status <StatusBadge status={item.status} />
            </p>
          </div>
        )}

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
        {item.capaian?.length > 0 && (
          <SectionCard title="Capaian Kurikulum">
            <div className="space-y-1.5">
              {item.capaian.map((c, i) => (
                <p key={i} className="text-sm font-medium text-[#111]">{c.label}</p>
              ))}
            </div>
          </SectionCard>
        )}

        {item.subCapaian?.length > 0 && (
          <SectionCard title="Sub Capaian & Bobot">
            <div className="space-y-2.5">
              {item.subCapaian.map((sc, i) => (
                <InfoRow
                  key={i}
                  label={sc.label}
                  sublabel={sc.capaian}
                  value={sc.persen != null ? `${sc.persen}%` : '-'}
                />
              ))}
            </div>
          </SectionCard>
        )}

        {/* Tombol aksi awal */}
        {canAct && !showCapaianForm && (
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => openAction('tolak')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-600 hover:text-white"
              >Tolak
              </button>
              <button
                type="button"
                onClick={() => openAction('revisi')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-400 bg-orange-50 px-5 py-2.5 text-sm font-bold text-orange-600 transition hover:bg-orange-500 hover:text-white"
              >Minta Revisi
              </button>
              <button
                type="button"
                onClick={() => setShowCapaianForm(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
              >Teruskan ke Pimpinan
              </button>
            </div>
        )}

        {/* Form pemetaan capaian — muncul setelah klik Teruskan ke Pimpinan */}
        {canAct && showCapaianForm && (
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#222]">Pemetaan Capaian Kurikulum</h3>
              <p className="mt-0.5 text-sm text-[#616161]">
                Tentukan capaian kurikulum yang dicapai melalui kegiatan ini sebelum meneruskan ke Pimpinan.
              </p>
            </div>

            {loadingKur ? (
              <p className="text-sm text-[#9aa0a6]">Memuat kurikulum…</p>
            ) : !kurikulum ? (
              <p className="text-sm text-red-500">Kurikulum aktif tidak ditemukan. Hubungi Super Admin.</p>
            ) : (
              <div className="space-y-5">
                {/* Dropdown Capaian */}
                <div>
                  <label className="block text-sm font-medium text-black">
                    Capaian<span className="text-red-500">*</span>{' '}
                    <span className="font-normal text-[#9aa0a6]">(pilih satu atau lebih)</span>
                  </label>
                  <div className="relative mt-1" ref={capaianRef}>
                    <button
                      type="button"
                      onClick={() => setCapaianOpen((o) => !o)}
                      className="flex w-full items-center justify-between rounded-md border border-[#e9ebf8] p-2.5 text-sm text-[#333] shadow-sm outline-none focus:border-brand-dark bg-white"
                    >
                      <span className={selectedCapaianIds.length === 0 ? 'text-[#9aa0a6]' : ''}>
                        {selectedCapaianIds.length === 0 ? 'Pilih capaian' : `${selectedCapaianIds.length} capaian dipilih`}
                      </span></button>
                    {capaianOpen && (
                      <div className="absolute z-10 mt-1 w-full rounded-md border border-[#e9ebf8] bg-white shadow-md">
                        {allCapaian.map((c) => (
                          <label
                            key={c.id}
                            className="flex cursor-pointer items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-[#f5f5f5]"
                          >
                            <input
                              type="checkbox"
                              className="accent-brand-dark"
                              checked={selectedCapaianIds.includes(c.id)}
                              onChange={() => toggleCapaian(c.id)}
                            />
                            {c.nama}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tag capaian terpilih */}
                  {selectedCapaianIds.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {allCapaian
                        .filter((c) => selectedCapaianIds.includes(c.id))
                        .map((c) => (
                          <span
                            key={c.id}
                            className="inline-flex items-center gap-1 rounded-full border border-brand-dark/30 bg-brand-dark/5 px-3 py-1 text-xs font-medium text-brand-dark"
                          >
                            {c.nama}
                            <button type="button" onClick={() => toggleCapaian(c.id)}>
                              <X className="h-3 w-3 text-red-600" />
                            </button>
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                {/* Sub Capaian */}
                {visibleSubCapaian.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-black">
                      Sub Capaian<span className="text-red-500">*</span>{' '}
                      <span className="font-normal text-[#9aa0a6]">(pilih satu atau lebih)</span>
                    </label>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {visibleSubCapaian.map((sc) => {
                        const checked = !!alokasi.find((a) => a.subCapaianId === sc.id)
                        return (
                          <label
                            key={sc.id}
                            className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition ${
                              checked
                                ? 'border-brand-dark bg-brand-dark/5 font-medium text-brand-dark'
                                : 'border-[#e9ebf8] text-[#444] hover:border-brand-dark/40'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="accent-brand-dark shrink-0"
                              checked={checked}
                              onChange={() => toggleSub(sc.id)}
                            />
                            <span className="min-w-0">
                              <span className="block truncate">{sc.nama}</span>
                              <span className="block truncate text-[11px] font-normal text-[#9aa0a6]">{sc.namaCapaian}</span>
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Bobot Persentase */}
                {alokasi.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-black">
                      Bobot Persentase Sub Capaian<span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2 space-y-2">
                      {alokasi.map((alok) => {
                        const sc = visibleSubCapaian.find((s) => s.id === alok.subCapaianId)
                        if (!sc) return null
                        return (
                          <div key={alok.subCapaianId} className="flex items-center gap-3">
                            <span className="flex-1 text-sm text-[#444]">
                              <span className="block truncate">{sc.nama}</span>
                              <span className="block truncate text-[11px] font-normal text-[#9aa0a6]">{sc.namaCapaian}</span>
                            </span>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={alok.alokasiPersen}
                              onChange={(e) => setAlokasiPersen(alok.subCapaianId, e.target.value)}
                              className="w-20 rounded-md border border-[#e9ebf8] p-2 text-center text-sm outline-none focus:border-brand-dark"
                            />
                            <span className="text-sm text-[#9aa0a6]">%</span>
                          </div>
                        )
                      })}
                    </div>
                    <p className={`mt-2 text-xs font-medium ${totalBobot === 100 ? 'text-emerald-600' : 'text-red-500'}`}>
                      Total bobot: {totalBobot}%
                      {totalBobot < 100 && <span className="ml-1">(kurang dari 100%)</span>}
                      {totalBobot > 100 && <span className="ml-1">(lebih dari 100%)</span>}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tombol submit */}
            <div className="flex flex-col gap-3 pt-2 border-t border-[#e9ebf8] sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={submitting || loadingKur}
                onClick={handleSubmitSetuju}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
              >{submitting ? 'Memproses...' : 'Teruskan ke Pimpinan'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCapaianForm(false)
                  setSelectedCapaianIds([])
                  setAlokasi([])
                }}
                className="rounded-xl border border-[#d1d5db] bg-white px-5 py-2.5 text-sm font-semibold text-[#444] transition hover:bg-[#f5f5f5]"
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default DetailVerifikasiPengajuanEksternal
