import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ChevronDown, MapPin, Users, Calendar, Info } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { createKegiatan } from '../../services/kegiatanService'
import { getKurikulumAktif } from '../../services/kurikulumService'
import { getKategoriKegiatan, getSkalaKegiatan } from '../../services/matriksService'

function BuatEvent() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const [nama, setNama] = useState('')
  const [kategoriId, setKategoriId] = useState('')
  const [skalaId, setSkalaId] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [tanggalMulai, setTanggalMulai] = useState('')
  const [tanggalSelesai, setTanggalSelesai] = useState('')
  const [lokasi, setLokasi] = useState('')
  const [kuota, setKuota] = useState('')

  const [selectedCapaianIds, setSelectedCapaianIds] = useState([])
  const [capaianOpen, setCapaianOpen] = useState(false)
  const capaianRef = useRef(null)
  const [alokasi, setAlokasi] = useState([])

  const [kurikulum, setKurikulum] = useState(null)
  const [loadingKur, setLoadingKur] = useState(true)
  const [kategoriList, setKategoriList] = useState([])
  const [skalaList, setSkalaList] = useState([])

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
    Promise.all([getKurikulumAktif(), getKategoriKegiatan()])
      .then(([kur, kat]) => {
        setKurikulum(kur)
        setKategoriList(Array.isArray(kat) ? kat : [])
      })
      .catch(() => {})
      .finally(() => setLoadingKur(false))
  }, [])

  useEffect(() => {
    if (!kategoriId) {
      setSkalaList([])
      return
    }
    getSkalaKegiatan(kategoriId)
      .then((ska) => setSkalaList(Array.isArray(ska) ? ska : []))
      .catch(() => setSkalaList([]))
  }, [kategoriId])

  const allCapaian = kurikulum?.capaian || []

  const visibleSubCapaian = allCapaian
    .filter((c) => selectedCapaianIds.includes(c.id))
    .flatMap((c) => (c.subCapaian || []).map((sc) => ({ ...sc, namaCapaian: c.nama })))

  function toggleCapaian(id) {
    setSelectedCapaianIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      const validSubIds = allCapaian
        .filter((c) => next.includes(c.id))
        .flatMap((c) => (c.subCapaian || []).map((sc) => sc.id))
      setAlokasi((a) => a.filter((x) => validSubIds.includes(x.subCapaianId)))
      return next
    })
  }

  function toggleSub(id) {
    setAlokasi((prev) => {
      const exists = prev.find((a) => a.subCapaianId === id)
      if (exists) return prev.filter((a) => a.subCapaianId !== id)
      return [...prev, { subCapaianId: id, alokasiPersen: 100 }]
    })
  }

  function setAlokasiPersen(id, persen) {
    setAlokasi((prev) =>
      prev.map((a) => (a.subCapaianId === id ? { ...a, alokasiPersen: Number(persen) } : a))
    )
  }

  const totalBobot = alokasi.reduce((s, a) => s + (a.alokasiPersen || 0), 0)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nama || !kategoriId || !skalaId || !tanggalMulai || !lokasi) {
      toast.error('Lengkapi semua field wajib pada Informasi Kegiatan.')
      return
    }
    if (alokasi.length === 0) {
      toast.error('Pilih minimal satu sub-capaian')
      return
    }
    if (Math.abs(totalBobot - 100) > 0.01) {
      toast.error(`Total bobot harus tepat 100%. Saat ini: ${totalBobot}%`)
      return
    }

    setLoading(true)
    try {
      await createKegiatan({
        nama,
        kategoriId: Number(kategoriId),
        skalaId: Number(skalaId),
        asal: 'kurikuler_ukmf',
        deskripsi: deskripsi || undefined,
        lokasi: lokasi || undefined,
        kuota: Number(kuota) || undefined,
        tanggalMulai,
        tanggalSelesai: tanggalSelesai || tanggalMulai,
        alokasi,
      })
      toast.success('Draft tersimpan!', {
        description: 'Kirim event dari Manajemen Event setelah siap.',
      })
      navigate('/admin_fakultas/manajemen-event')
    } catch (err) {
      toast.error('Gagal', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full rounded-lg border border-[#d1d5db] px-3 py-2.5 text-sm outline-none focus:border-brand-dark focus:ring-1 focus:ring-brand-dark'
  const labelCls = 'mb-1.5 block text-sm font-semibold text-[#333]'

  return (
    <DashboardLayout role="admin_fakultas" userName="Dr. Efa Yonnedi, SE. MPPM, Akt, CA, CRGP" userRole="Dosen Pembimbing">
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-extrabold text-[#222] sm:text-2xl lg:text-3xl">Buat Event Fakultas</h2>
          <p className="mt-1 text-sm text-[#616161]">Isi detail kegiatan dan simpan sebagai draft. Kirim dari daftar setelah siap.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
            <h3 className="mb-1 text-base font-bold text-[#222]">1. Informasi Kegiatan</h3>
            <p className="mb-5 text-xs text-[#888]">Lengkapi informasi kegiatan terlebih dahulu</p>

            <div className="space-y-5">
              <div>
                <label className={labelCls}>Nama Kegiatan <span className="text-red-500">*</span></label>
                <input
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Masukkan nama kegiatan..."
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Jenis Kegiatan <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {kategoriList.map((j) => {
                    const active = String(kategoriId) === String(j.id)
                    return (
                      <button
                        key={j.id}
                        type="button"
                        onClick={() => {
                          setKategoriId(String(j.id))
                          setSkalaId('')
                        }}
                        className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                          active
                            ? 'border-brand-dark bg-brand-dark text-white'
                            : 'border-[#d1d5db] bg-white text-[#444] hover:border-brand-dark hover:text-brand-dark'
                        }`}
                      >
                        {j.nama || j.name}
                        {active && <X className="h-3 w-3" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className={labelCls}>Skala Kegiatan <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    value={skalaId}
                    onChange={(e) => setSkalaId(e.target.value)}
                    className={`${inputCls} appearance-none pr-8`}
                    disabled={!kategoriId}
                  >
                    <option value="">Pilih skala kegiatan</option>
                    {skalaList.map((s) => (
                      <option key={s.id} value={s.id}>{s.nama || s.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0a6]" />
                </div>
              </div>

              <div>
                <label className={labelCls}>Deskripsi Kegiatan <span className="text-red-500">*</span></label>
                <div className="relative">
                  <textarea
                    value={deskripsi}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) setDeskripsi(e.target.value)
                    }}
                    placeholder="Tujuan, agenda, dan manfaat kegiatan."
                    rows={5}
                    className={`${inputCls} resize-none`}
                  />
                  <span className="absolute bottom-2 right-3 text-xs text-[#aaa]">{deskripsi.length}/500</span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Tanggal Mulai <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="date"
                      value={tanggalMulai}
                      onChange={(e) => setTanggalMulai(e.target.value)}
                      className={`${inputCls} pr-9`}
                    />
                    <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0a6]" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Tanggal selesai <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="date"
                      value={tanggalSelesai}
                      onChange={(e) => setTanggalSelesai(e.target.value)}
                      className={`${inputCls} pr-9`}
                    />
                    <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0a6]" />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Lokasi <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      value={lokasi}
                      onChange={(e) => setLokasi(e.target.value)}
                      placeholder="Gedung/ tempat kegiatan"
                      className={`${inputCls} pr-9`}
                    />
                    <MapPin className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0a6]" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Kuota Peserta <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="number"
                      value={kuota}
                      onChange={(e) => setKuota(e.target.value)}
                      placeholder="Masukkan jumlah peserta"
                      min="0"
                      className={`${inputCls} pr-9`}
                    />
                    <Users className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0a6]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
            <h3 className="mb-1 text-base font-bold text-[#222]">2. Pemetaan Capaian Kurikulum</h3>
            <p className="mb-5 text-xs text-[#888]">Tentukan capaian kurikulum yang dicapai melalui kegiatan ini</p>

            {loadingKur ? (
              <p className="text-sm text-[#9aa0a6]">Memuat kurikulum…</p>
            ) : !kurikulum ? (
              <p className="text-sm text-red-500">Kurikulum aktif tidak ditemukan. Hubungi Admin.</p>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className={labelCls}>
                    Capaian <span className="text-red-500">*</span>{' '}
                    <span className="text-xs font-normal text-brand-dark">(pilih satu atau lebih)</span>
                  </label>
                  <div className="relative" ref={capaianRef}>
                    <button
                      type="button"
                      onClick={() => setCapaianOpen((v) => !v)}
                      className="flex w-full items-center justify-between rounded-lg border border-[#d1d5db] px-3 py-2.5 text-sm text-[#aaa] outline-none focus:border-brand-dark"
                    >
                      <span className={selectedCapaianIds.length > 0 ? 'text-[#333]' : ''}>
                        {selectedCapaianIds.length > 0 ? `${selectedCapaianIds.length} capaian dipilih` : 'Pilih capaian'}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-[#9aa0a6] transition ${capaianOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {capaianOpen && (
                      <div className="absolute z-10 mt-1 w-full rounded-lg border border-[#d1d5db] bg-white shadow-lg">
                        {allCapaian.map((c) => (
                          <label key={c.id} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-[#f9fafb]">
                            <input
                              type="checkbox"
                              checked={selectedCapaianIds.includes(c.id)}
                              onChange={() => toggleCapaian(c.id)}
                              className="h-4 w-4 accent-brand-dark"
                            />
                            <span className="text-sm text-[#333]">{c.nama}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedCapaianIds.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {allCapaian
                        .filter((c) => selectedCapaianIds.includes(c.id))
                        .map((c) => (
                          <span key={c.id} className="inline-flex items-center gap-1.5 rounded-lg border border-brand-dark px-3 py-1 text-xs font-semibold text-brand-dark">
                            {c.nama}
                            <button type="button" onClick={() => toggleCapaian(c.id)} className="hover:text-red-500">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                {visibleSubCapaian.length > 0 && (
                  <div>
                    <label className={labelCls}>
                      Sub Capaian <span className="text-red-500">*</span>{' '}
                      <span className="text-xs font-normal text-brand-dark">(pilih satu atau lebih)</span>
                    </label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {visibleSubCapaian.map((sub) => {
                        const checked = !!alokasi.find((a) => a.subCapaianId === sub.id)
                        return (
                          <label
                            key={sub.id}
                            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition ${
                              checked
                                ? 'border-brand-dark bg-[#f0faf1]'
                                : 'border-[#d1d5db] bg-white hover:border-brand-dark'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSub(sub.id)}
                              className="h-4 w-4 accent-brand-dark"
                            />
                            <span className={`text-sm font-medium ${checked ? 'text-brand-dark' : 'text-[#444]'}`}>
                              {sub.nama}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}

                {alokasi.length > 0 && (
                  <div>
                    <label className={labelCls}>Bobot Persentase Sub Capaian <span className="text-red-500">*</span></label>
                    <div className="space-y-2">
                      {alokasi.map((alok) => {
                        const sub = visibleSubCapaian.find((s) => s.id === alok.subCapaianId)
                        if (!sub) return null
                        return (
                          <div key={alok.subCapaianId} className="flex items-center gap-4">
                            <span className="w-44 text-sm text-[#555]">{sub.nama}</span>
                            <div className="relative w-32">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={alok.alokasiPersen}
                                onChange={(e) => setAlokasiPersen(alok.subCapaianId, e.target.value)}
                                placeholder="0"
                                className="w-full rounded-lg border border-[#d1d5db] py-2 pl-3 pr-8 text-sm outline-none focus:border-brand-dark"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#888]">%</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <p className={`mt-2 text-xs font-medium ${totalBobot === 100 ? 'text-emerald-600' : 'text-[#888]'}`}>
                      Total bobot: {totalBobot}/100
                      {totalBobot === 100 && ' ✓'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-brand-dark to-brand-light py-3.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
            >
              {loading ? 'Menyimpan...' : 'Simpan Draft'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin_fakultas/manajemen-event')}
              className="w-full rounded-xl border border-[#d1d5db] bg-white py-3.5 text-sm font-semibold text-[#444] hover:bg-[#f5f5f5]"
            >
              Batal
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-[#d1fae5] bg-[#f0fdf4] px-4 py-3">
            <Info className="h-4 w-4 shrink-0 text-brand-dark" />
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}

export default BuatEvent
