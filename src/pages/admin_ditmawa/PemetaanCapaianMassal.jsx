import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, AlertTriangle, CheckCircle2, ChevronDown, X, ClipboardList } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { getCurrentUser } from '../../services/authService'
import { getKegiatanById, verifikasiBulk } from '../../services/kegiatanService'
import { getKurikulumAktif } from '../../services/kurikulumService'

function formatTanggal(tanggal) {
  if (!tanggal) return '-'
  try {
    return new Date(tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return '-'
  }
}

function normalizeKegiatan(k) {
  const pembuat = k.pembuat || {}
  const mhs = pembuat.mahasiswa || {}
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
    existingCapaianIds: [...new Set(
      (k.kegiatanCapaian || [])
        .map((kc) => kc.subCapaian?.capaian?.id)
        .filter(Boolean)
    )],
  }
}

function buildForm(kegiatan) {
  return {
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
  const [kurikulum, setKurikulum] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingKur, setLoadingKur] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [capaianOpen, setCapaianOpen] = useState(false)
  const capaianRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (capaianRef.current && !capaianRef.current.contains(e.target)) setCapaianOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (kegiatanIds.length === 0) {
      toast.error('Tidak ada kegiatan yang dipilih.')
      navigate('/admin_ditmawa/verifikasi-pengajuan-eksternal', { replace: true })
      return
    }
    setLoading(true)
    Promise.all(kegiatanIds.map((id) => getKegiatanById(id).catch(() => null)))
      .then((results) => {
        const valid = results.filter(Boolean).map((k) => {
          const normalized = normalizeKegiatan(k)
          return { ...normalized, ...buildForm(normalized) }
        })
        if (valid.length === 0) {
          toast.error('Data kegiatan tidak ditemukan.')
          navigate('/admin_ditmawa/verifikasi-pengajuan-eksternal', { replace: true })
          return
        }
        setKegiatans(valid)
        setActiveIndex(0)
      })
      .catch(() => toast.error('Gagal memuat data kegiatan'))
      .finally(() => setLoading(false))
  }, [kegiatanIds])

  useEffect(() => {
    setLoadingKur(true)
    getKurikulumAktif()
      .then((kur) => setKurikulum(kur))
      .catch(() => toast.error('Gagal memuat kurikulum'))
      .finally(() => setLoadingKur(false))
  }, [])

  const backToList = () => navigate('/admin_ditmawa/verifikasi-pengajuan-eksternal')

  const active = kegiatans[activeIndex] || null
  const allCapaian = kurikulum?.capaian || []
  const visibleSubCapaian = allCapaian
    .filter((c) => active?.capaianIds.includes(c.id))
    .flatMap((c) => (c.subCapaian || []).map((sc) => ({ ...sc, namaCapaian: c.nama })))

  const totalBobot = (kegiatan) => (kegiatan?.alokasi || []).reduce((s, a) => s + (a.alokasiPersen || 0), 0)
  const getBobotStatus = (kegiatan) => {
    const tb = totalBobot(kegiatan)
    if (kegiatan?.alokasi?.length === 0 || tb === 0) return 'kosong'
    if (Math.abs(tb - 100) < 0.01) return 'pas'
    if (tb < 100) return 'kurang'
    return 'lebih'
  }
  const isLengkap = (kegiatan) => getBobotStatus(kegiatan) === 'pas'
  const allLengkap = kegiatans.length > 0 && kegiatans.every(isLengkap)
  const jumlahLengkap = kegiatans.filter(isLengkap).length

  const updateActive = (fn) => {
    setKegiatans((prev) =>
      prev.map((k, i) => (i === activeIndex ? fn(k) : k))
    )
  }

  const toggleCapaian = (cid) => {
    const nextIds = active.capaianIds.includes(cid)
      ? active.capaianIds.filter((x) => x !== cid)
      : [...active.capaianIds, cid]
    const validSubIds = allCapaian
      .filter((c) => nextIds.includes(c.id))
      .flatMap((c) => (c.subCapaian || []).map((sc) => sc.id))
    updateActive((k) => ({
      ...k,
      capaianIds: nextIds,
      alokasi: (k.alokasi || []).filter((a) => validSubIds.includes(a.subCapaianId)),
    }))
  }

  const toggleSub = (scId) => {
    updateActive((k) => {
      const exists = (k.alokasi || []).find((a) => a.subCapaianId === scId)
      if (exists) return { ...k, alokasi: k.alokasi.filter((a) => a.subCapaianId !== scId) }
      return { ...k, alokasi: [...k.alokasi, { subCapaianId: scId, alokasiPersen: 100 }] }
    })
  }

  const setAlokasiPersen = (scId, persen) => {
    updateActive((k) => ({
      ...k,
      alokasi: (k.alokasi || []).map((a) =>
        a.subCapaianId === scId ? { ...a, alokasiPersen: Number(persen) } : a
      ),
    }))
  }

  const handleSubmit = async () => {
    const belumLengkap = kegiatans.filter((k) => !isLengkap(k))
    if (belumLengkap.length > 0) {
      const detail = belumLengkap.map((k) => {
        const tb = totalBobot(k)
        return tb < 100 ? `"${k.nama}" kurang ${(100 - tb).toFixed(0)}%` : `"${k.nama}" lebih ${(tb - 100).toFixed(0)}%`
      })
      toast.error(`Total bobot harus tepat 100% untuk semua kegiatan. ${detail.join('; ')}`)
      return
    }
    setSubmitting(true)
    try {
      const alokasiBulk = kegiatans.map((k) => ({
        kegiatanId: k.id,
        alokasi: (k.alokasi || []).map((a) => ({
          subCapaianId: a.subCapaianId,
          alokasiPersen: a.alokasiPersen,
        })),
      }))
      await verifikasiBulk(kegiatans.map((k) => k.id), 'setuju', undefined, alokasiBulk)
      toast.success(`${kegiatans.length} pengajuan diteruskan ke Pimpinan Ditmawa.`)
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

  return (
    <DashboardLayout role="admin_ditmawa" userName={user?.nama || 'Admin Ditmawa'} userRole="Admin Ditmawa">
      <div className="space-y-5">
        <button type="button" onClick={backToList}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-dark hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Daftar
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

        {!kurikulum ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
            Kurikulum aktif tidak ditemukan. Hubungi Super Admin untuk mengaktifkan kurikulum terlebih dahulu.
          </div>
        ) : loadingKur ? (
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 text-sm text-[#9aa0a6] shadow-sm">Memuat kurikulum…</div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
            {/* Daftar kegiatan */}
            <div className="rounded-xl border border-[#e9ebf8] bg-white shadow-sm overflow-hidden self-start">
              <div className="border-b border-[#e9ebf8] bg-[#f9fafb] px-4 py-3">
                <h3 className="text-sm font-bold text-[#222]">Daftar Kegiatan</h3>
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
                      className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition ${
                        isActive ? 'bg-brand-dark/5' : 'hover:bg-[#f9fafb]'
                      }`}
                    >
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                        lengkap
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-[#d9dce7] text-[#9aa0a6]'
                      }`}>
                        {lengkap ? <CheckCircle2 className="h-3 w-3" /> : idx + 1}
                      </span>
                      <span className="min-w-0">
                        <span className={`block truncate text-sm font-semibold ${isActive ? 'text-brand-dark' : 'text-[#333]'}`}>
                          {k.nama}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-[#9aa0a6]">
                          {k.mahasiswa} · {k.prodi}
                        </span>
                        {k.skala && k.skala !== '-' && (
                          <span className="mt-0.5 block text-xs text-brand-light">{k.skala}</span>
                        )}
                        {k.deskripsi && (
                          <span className="mt-0.5 line-clamp-2 block text-[11px] text-[#9aa0a6]">{k.deskripsi}</span>
                        )}
                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          lengkap ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {lengkap ? 'Lengkap' : 'Belum lengkap'}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Form pemetaan */}
            <div className="rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm sm:p-6 space-y-5">
              <div>
                <h3 className="text-base font-bold text-[#222]">Pemetaan Capaian — Kegiatan {activeIndex + 1} dari {kegiatans.length}</h3>
                <p className="mt-0.5 text-sm text-[#616161]">{active?.nama}</p>
              </div>

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
                    <span className={active.capaianIds.length === 0 ? 'text-[#9aa0a6]' : ''}>
                      {active.capaianIds.length === 0 ? 'Pilih capaian' : `${active.capaianIds.length} capaian dipilih`}
                    </span>
                    <ChevronDown className="h-4 w-4 text-[#9aa0a6] shrink-0" />
                  </button>
                  {capaianOpen && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border border-[#e9ebf8] bg-white shadow-md">
                      {allCapaian.map((c) => (
                        <label key={c.id} className="flex cursor-pointer items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-[#f5f5f5]">
                          <input
                            type="checkbox"
                            className="accent-brand-dark"
                            checked={active.capaianIds.includes(c.id)}
                            onChange={() => toggleCapaian(c.id)}
                          />
                          {c.nama}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {active.capaianIds.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {allCapaian
                      .filter((c) => active.capaianIds.includes(c.id))
                      .map((c) => (
                        <span key={c.id} className="inline-flex items-center gap-1 rounded-full border border-brand-dark/30 bg-brand-dark/5 px-3 py-1 text-xs font-medium text-brand-dark">
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
                      const checked = !!(active.alokasi || []).find((a) => a.subCapaianId === sc.id)
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

              {/* Bobot */}
              {(active.alokasi || []).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-black">
                    Bobot Persentase Sub Capaian<span className="text-red-500">*</span>
                  </label>
                  <div className="mt-2 space-y-2">
                    {(active.alokasi || []).map((alok) => {
                      const sc = visibleSubCapaian.find((s) => s.id === alok.subCapaianId)
                      if (!sc) return null
                      return (
                        <div key={alok.subCapaianId} className="flex items-center gap-3">
                          <span className="flex-1 text-sm text-[#444]">{sc.nama}</span>
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
                  {/* Indikator total bobot */}
                  <div className={`mt-3 flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-sm ${
                    getBobotStatus(active) === 'pas'
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : 'border-red-200 bg-red-50 text-red-600'
                  }`}>
                    {getBobotStatus(active) === 'pas' ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    )}
                    <span>
                      <span className="font-semibold">Total bobot: {totalBobot(active)}%</span>{' '}
                      {getBobotStatus(active) === 'pas'
                        ? '— Bobot sudah tepat 100%.'
                        : getBobotStatus(active) === 'kurang'
                          ? `— Masih kurang ${(100 - totalBobot(active)).toFixed(0)}%. Tambahkan atau naikkan bobot sub capaian.`
                          : `— Melebihi 100% sebesar ${(totalBobot(active) - 100).toFixed(0)}%. Kurangi bobot sub capaian.`}
                    </span>
                  </div>
                </div>
              )}

              {visibleSubCapaian.length === 0 && active.capaianIds.length > 0 && (
                <p className="text-sm text-[#9aa0a6]">Capaian terpilih belum memiliki sub capaian.</p>
              )}
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
                  if (kurang > 0 && lebih > 0) return `${kurang} kegiatan bobot kurang & ${lebih} kegiatan bobot lebih. Total bobot harus tepat 100%.`
                  if (kurang > 0) return `${kurang} kegiatan bobot kurang dari 100%.`
                  if (lebih > 0) return `${lebih} kegiatan bobot lebih dari 100%.`
                  return `${kegiatans.length - jumlahLengkap} kegiatan belum lengkap (total bobot harus 100%).`
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
            >
              <CheckCircle2 className="h-4 w-4" />
              {submitting ? 'Memproses…' : `Teruskan ke Pimpinan (${kegiatans.length})`}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PemetaanCapaianMassal
