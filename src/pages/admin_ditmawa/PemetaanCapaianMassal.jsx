import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, ClipboardList } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { getCurrentUser } from '../../services/authService'
import { getKegiatanById, verifikasiBulk } from '../../services/kegiatanService'
import { getKurikulumAktif } from '../../services/kurikulumService'
import PemetaanCapaianKurikulumSection from '../../components/PemetaanCapaianKurikulumSection'

function formatTanggal(tanggal) {
  if (!tanggal) return '-'
  try {
    const d = new Date(tanggal)
    if (Number.isNaN(d.getTime())) return '-'
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return '-'
  }
}

function normalizeKegiatan(k) {
  const pembuat = k.pembuat || {}
  const mhs = pembuat.mahasiswa || {}
  const existingCapaianIds = [
    ...new Set(
      (k.kegiatanCapaian || [])
        .map((kc) => kc.subCapaian?.capaianId || kc.subCapaian?.capaian?.id)
        .filter(Boolean)
    ),
  ]
  const existingKurIds = [
    ...new Set(
      (k.kegiatanCapaian || [])
        .map((kc) => kc.subCapaian?.capaian?.kurikulumId)
        .filter(Boolean)
    ),
  ]
  return {
    id: k.id,
    nama: k.nama || '-',
    mahasiswa: pembuat.nama || '-',
    nim: mhs.nim || '-',
    prodi: mhs.prodi?.nama || '-',
    kategori: k.kategori?.nama || '-',
    skala: k.skala?.nama || '-',
    deskripsi: k.deskripsi || '',
    tanggal: formatTanggal(k.tanggalMulai),
    existing: (k.kegiatanCapaian || []).map((kc) => ({
      subCapaianId: kc.subCapaianId,
      alokasiPersen: Number(kc.alokasiPersen ?? 0),
    })),
    existingCapaianIds,
    existingKurIds,
  }
}

function buildForm(kegiatan, kurList = []) {
  const kurIds =
    kegiatan.existingKurIds && kegiatan.existingKurIds.length > 0
      ? kegiatan.existingKurIds
      : kurList.map((k) => k.id)
  return {
    kurikulumIds: kurIds,
    capaianIds: kegiatan.existingCapaianIds || [],
    alokasi: (kegiatan.existing || []).map((e) => ({
      subCapaianId: e.subCapaianId,
      alokasiPersen: e.alokasiPersen || 100,
    })),
  }
}

function PemetaanCapaianMassal() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getCurrentUser()

  const kegiatanIds = useMemo(() => {
    const ids = location.state?.kegiatanIds || []
    return Array.isArray(ids) ? ids.map(Number).filter(Boolean) : []
  }, [location.state])

  const [kegiatans, setKegiatans] = useState([])
  const [kurikulumList, setKurikulumList] = useState([])
  const [loading, setLoading] = useState(kegiatanIds.length > 0)
  const [loadingKur, setLoadingKur] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getKurikulumAktif()
      .then((kur) => {
        const list = Array.isArray(kur) ? kur : (kur ? [kur] : [])
        setKurikulumList(list)
      })
      .catch(() => toast.error('Gagal memuat kurikulum'))
      .finally(() => setLoadingKur(false))
  }, [])

  useEffect(() => {
    if (kegiatanIds.length === 0) return
    let isMounted = true
    Promise.all(kegiatanIds.map((id) => getKegiatanById(id).catch(() => null)))
      .then((results) => {
        if (!isMounted) return
        const valid = results.filter(Boolean).map((k) => {
          const normalized = normalizeKegiatan(k)
          return { ...normalized, ...buildForm(normalized, kurikulumList) }
        })
        if (valid.length === 0) {
          toast.error('Data kegiatan tidak ditemukan.')
          navigate('/admin_ditmawa/verifikasi-pengajuan-eksternal', { replace: true })
          return
        }
        setKegiatans(valid)
        setActiveIndex(0)
      })
      .catch(() => {
        if (isMounted) toast.error('Gagal memuat data kegiatan')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [kegiatanIds, kurikulumList, navigate])

  const backToList = () => navigate('/admin_ditmawa/verifikasi-pengajuan-eksternal')

  const active = kegiatans[activeIndex] || null

  const isLengkap = (kegiatan) => {
    if (!kegiatan || kurikulumList.length === 0) return false
    for (const kur of kurikulumList) {
      const kurSubIds = (kur.capaian || []).flatMap((c) => (c.subCapaian || []).map((sc) => sc.id))
      const kurAlokasi = (kegiatan.alokasi || []).filter((a) => kurSubIds.includes(a.subCapaianId))
      if (kurAlokasi.length === 0) return false
      const sum = kurAlokasi.reduce((s, a) => s + (a.alokasiPersen || 0), 0)
      if (Math.abs(sum - 100) > 0.01) return false
    }
    return true
  }

  const getBobotStatus = (kegiatan) => {
    if (!kegiatan || kurikulumList.length === 0) return 'kosong'
    let hasKurang = false
    let hasLebih = false
    let hasKosong = false
    for (const kur of kurikulumList) {
      const kurSubIds = (kur.capaian || []).flatMap((c) => (c.subCapaian || []).map((sc) => sc.id))
      const kurAlokasi = (kegiatan.alokasi || []).filter((a) => kurSubIds.includes(a.subCapaianId))
      if (kurAlokasi.length === 0) {
        hasKosong = true
        continue
      }
      const sum = kurAlokasi.reduce((s, a) => s + (a.alokasiPersen || 0), 0)
      if (Math.abs(sum - 100) < 0.01) continue
      if (sum < 100) hasKurang = true
      else hasLebih = true
    }
    if (!hasKurang && !hasLebih && !hasKosong) return 'pas'
    if (hasKurang) return 'kurang'
    if (hasLebih) return 'lebih'
    return 'kosong'
  }

  const allLengkap = kegiatans.length > 0 && kegiatans.every(isLengkap)
  const jumlahLengkap = kegiatans.filter(isLengkap).length

  const updateActive = (fn) => {
    setKegiatans((prev) =>
      prev.map((k, i) => (i === activeIndex ? fn(k) : k))
    )
  }

  const handleSubmit = async () => {
    if (kurikulumList.length === 0) {
      toast.error('Tidak ada kurikulum aktif.')
      return
    }
    const belumLengkap = kegiatans.filter((k) => !isLengkap(k))
    if (belumLengkap.length > 0) {
      const detail = belumLengkap.map((k) => {
        for (const kur of kurikulumList) {
          const kurSubIds = (kur.capaian || []).flatMap((c) => (c.subCapaian || []).map((sc) => sc.id))
          const kurAlokasi = (k.alokasi || []).filter((a) => kurSubIds.includes(a.subCapaianId))
          const sum = kurAlokasi.reduce((s, a) => s + (a.alokasiPersen || 0), 0)
          if (kurAlokasi.length === 0) return `"${k.nama}" belum ada alokasi sub-capaian untuk ${kur.nama}`
          if (Math.abs(sum - 100) > 0.01) {
            return sum < 100
              ? `"${k.nama}" bobot ${kur.nama} kurang ${(100 - sum).toFixed(0)}%`
              : `"${k.nama}" bobot ${kur.nama} lebih ${(sum - 100).toFixed(0)}%`
          }
        }
        return `"${k.nama}" belum lengkap`
      })
      toast.error(`Total bobot harus tepat 100% untuk semua kurikulum aktif. ${detail.join('; ')}`)
      return
    }
    setSubmitting(true)
    try {
      const alokasiBulk = kegiatans.map((k) => ({
        kegiatanId: Number(k.id),
        alokasi: (k.alokasi || []).map((a) => ({
          subCapaianId: Number(a.subCapaianId),
          alokasiPersen: Number(a.alokasiPersen),
        })),
      }))
      await verifikasiBulk(kegiatans.map((k) => k.id), 'setuju', undefined, alokasiBulk)
      toast.success(`${kegiatans.length} pengajuan berhasil diteruskan ke Pimpinan Ditmawa.`)
      backToList()
    } catch (err) {
      toast.error('Gagal meneruskan', { description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="admin_ditmawa" userName={user?.nama || 'Admin Ditmawa'} userRole="Admin Ditmawa">
        <div className="py-24 text-center text-sm text-[#9aa0a6]">Memuat data kegiatan…</div>
      </DashboardLayout>
    )
  }

  if (!loading && kegiatans.length === 0) {
    return (
      <DashboardLayout role="admin_ditmawa" userName={user?.nama || 'Admin Ditmawa'} userRole="Admin Ditmawa">
        <div className="space-y-5">
          <button
            type="button"
            onClick={backToList}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-dark hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar
          </button>
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-8 text-center shadow-sm">
            <p className="text-base font-semibold text-[#222]">Tidak Ada Kegiatan yang Dipilih</p>
            <p className="mt-1 text-sm text-[#616161]">
              Pilih satu atau beberapa kegiatan di halaman Verifikasi Pengajuan Eksternal terlebih dahulu untuk melakukan pemetaan capaian secara massal.
            </p>
            <button
              type="button"
              onClick={backToList}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              Menuju ke Verifikasi Pengajuan Eksternal
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="admin_ditmawa" userName={user?.nama || 'Admin Ditmawa'} userRole="Admin Ditmawa">
      <div className="space-y-5">
        <button type="button" onClick={backToList}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-dark hover:underline">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar
        </button>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[#222] sm:text-2xl">Pemetaan Capaian Massal</h2>
            <p className="mt-1 text-sm text-[#616161]">
              Isi pemetaan capaian kurikulum untuk {kegiatans.length} kegiatan sebelum diteruskan ke Pimpinan.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-[#e9ebf8] bg-white px-4 py-2.5 shadow-sm">
            <ClipboardList className="h-4 w-4 text-brand-dark" />
            <span className="text-sm text-[#616161]">
              <span className="font-bold text-brand-dark">{jumlahLengkap}</span> / {kegiatans.length} lengkap
            </span>
          </div>
        </div>

        {loadingKur ? (
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 text-sm text-[#9aa0a6] shadow-sm">Memuat kurikulum…</div>
        ) : kurikulumList.length === 0 ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
            Kurikulum aktif tidak ditemukan. Hubungi Super Admin untuk mengaktifkan kurikulum terlebih dahulu.
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
            {/* Daftar kegiatan */}
            <div className="rounded-xl border border-[#e9ebf8] bg-white shadow-sm overflow-hidden self-start">
              <div className="flex items-center justify-between border-b border-[#e9ebf8] bg-[#f9fafb] px-4 py-3">
                <h3 className="text-sm font-bold text-[#222]">Daftar Kegiatan</h3>
                <span className="text-xs font-medium text-[#616161]">
                  {jumlahLengkap}/{kegiatans.length} Lengkap
                </span>
              </div>
              <div className="divide-y divide-[#e9ebf8]">
                {kegiatans.map((k, idx) => {
                  const lengkap = isLengkap(k)
                  const isActive = idx === activeIndex
                  return (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      className={`group flex w-full flex-col gap-1.5 p-4 text-left transition border-l-4 ${
                        isActive
                          ? 'border-brand-dark bg-[#f8faf8]'
                          : 'border-transparent hover:bg-[#fafafa]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-sm font-semibold line-clamp-1 ${
                          isActive ? 'text-brand-dark font-bold' : 'text-[#222]'
                        }`}>
                          {idx + 1}. {k.nama}
                        </span>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-normal ${
                          lengkap
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-amber-200 bg-amber-50 text-amber-700'
                        }`}>
                          {lengkap ? 'Lengkap' : 'Belum Lengkap'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-[#616161]">
                        <span className="truncate max-w-[140px]">{k.mahasiswa}</span>
                        <span>•</span>
                        <span className="truncate max-w-[120px]">{k.prodi}</span>
                        {k.skala && k.skala !== '-' && (
                          <>
                            <span>•</span>
                            <span className="text-[#888]">{k.skala}</span>
                          </>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Form pemetaan */}
            <div className="rounded-xl border border-[#e9ebf8] bg-white shadow-sm overflow-hidden">
              <div className="border-b border-[#e9ebf8] bg-[#f9fafb] px-5 py-4 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-[#222]">
                      {active?.nama}
                    </h3>
                    <p className="mt-0.5 text-xs text-[#616161]">
                      Diajukan oleh: <span className="font-medium text-[#333]">{active?.mahasiswa}</span> {active?.nim && active?.nim !== '-' ? `(${active?.nim})` : ''} · {active?.prodi}
                      {active?.kategori && active?.kategori !== '-' ? ` · ${active?.kategori}` : ''}
                      {active?.skala && active?.skala !== '-' ? ` · Skala ${active?.skala}` : ''}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-normal ${
                      isLengkap(active)
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700'
                    }`}>
                      {isLengkap(active) ? 'Bobot 100% (Lengkap)' : 'Belum Lengkap'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                {active && (
                  <PemetaanCapaianKurikulumSection
                    kurikulumList={kurikulumList}
                    selectedKurikulumIds={active.kurikulumIds || []}
                    setSelectedKurikulumIds={(ids) =>
                      updateActive((k) => ({
                        ...k,
                        kurikulumIds: typeof ids === 'function' ? ids(k.kurikulumIds || []) : ids,
                      }))
                    }
                    selectedCapaianIds={active.capaianIds || []}
                    setSelectedCapaianIds={(cids) =>
                      updateActive((k) => ({
                        ...k,
                        capaianIds: typeof cids === 'function' ? cids(k.capaianIds || []) : cids,
                      }))
                    }
                    alokasi={active.alokasi || []}
                    setAlokasi={(aloks) =>
                      updateActive((k) => ({
                        ...k,
                        alokasi: typeof aloks === 'function' ? aloks(k.alokasi || []) : aloks,
                      }))
                    }
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer aksi */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm">
          <p className="text-sm text-[#616161]">
            {allLengkap
              ? 'Semua kegiatan sudah lengkap. Siap diteruskan ke Pimpinan.'
              : (() => {
                  const kurang = kegiatans.filter((k) => getBobotStatus(k) === 'kurang').length
                  const lebih = kegiatans.filter((k) => getBobotStatus(k) === 'lebih').length
                  if (kurang > 0 && lebih > 0) return `${kurang} kegiatan bobot kurang & ${lebih} kegiatan bobot lebih. Total bobot tiap kurikulum harus tepat 100%.`
                  if (kurang > 0) return `${kurang} kegiatan bobot kurang dari 100%.`
                  if (lebih > 0) return `${lebih} kegiatan bobot lebih dari 100%.`
                  return `${kegiatans.length - jumlahLengkap} kegiatan belum lengkap (total bobot tiap kurikulum harus 100%).`
                })()}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={backToList}
              className="rounded-xl border border-[#d1d5db] bg-white px-5 py-2.5 text-sm font-semibold text-[#444] transition hover:bg-[#f5f5f5]"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={submitting || !allLengkap}
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >{submitting ? 'Memproses…' : `Teruskan ke Pimpinan (${kegiatans.length})`}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PemetaanCapaianMassal
