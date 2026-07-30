import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, MapPin, Users, X, ChevronDown } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DatePickerInput from '../../components/ui/DatePickerInput'
import { getCurrentUser } from '../../services/authService'
import { createKegiatan } from '../../services/kegiatanService'
import { getKurikulumAktif } from '../../services/kurikulumService'
import { getKategoriKegiatan, getSkalaKegiatan } from '../../services/matriksService'

const EMPTY_FORM = {
  nama: '',
  kategoriId: '',
  skalaId: '',
  deskripsi: '',
  tanggalMulai: null,
  tanggalSelesai: null,
  lokasi: '',
  kuota: '',
  selectedCapaianIds: [],
  alokasi: [],
}

function BuatKegiatan() {
  const navigate = useNavigate()
  const user = getCurrentUser()

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [capaianOpen, setCapaianOpen] = useState(false)
  const capaianRef = useRef(null)

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
    if (!form.kategoriId) {
      setSkalaList([])
      return
    }
    getSkalaKegiatan(form.kategoriId)
      .then((ska) => setSkalaList(Array.isArray(ska) ? ska : []))
      .catch(() => setSkalaList([]))
  }, [form.kategoriId])

  const allCapaian = kurikulum?.capaian || []

  const visibleSubCapaian = allCapaian
    .filter((c) => form.selectedCapaianIds.includes(c.id))
    .flatMap((c) => (c.subCapaian || []).map((sc) => ({ ...sc, namaCapaian: c.nama })))

  const toISODate = (d) => {
    if (!d) return null
    if (typeof d === 'string') return d
    return d.toISOString().split('T')[0]
  }

  const toggleCapaian = (id) => {
    setForm((prev) => {
      const next = prev.selectedCapaianIds.includes(id)
        ? prev.selectedCapaianIds.filter((x) => x !== id)
        : [...prev.selectedCapaianIds, id]
      const validSubIds = allCapaian
        .filter((c) => next.includes(c.id))
        .flatMap((c) => (c.subCapaian || []).map((sc) => sc.id))
      return {
        ...prev,
        selectedCapaianIds: next,
        alokasi: prev.alokasi.filter((a) => validSubIds.includes(a.subCapaianId)),
      }
    })
  }

  const toggleSub = (id) => {
    setForm((prev) => {
      const exists = prev.alokasi.find((a) => a.subCapaianId === id)
      if (exists) return { ...prev, alokasi: prev.alokasi.filter((a) => a.subCapaianId !== id) }
      return { ...prev, alokasi: [...prev.alokasi, { subCapaianId: id, alokasiPersen: 100 }] }
    })
  }

  const setAlokasiPersen = (id, persen) => {
    setForm((prev) => ({
      ...prev,
      alokasi: prev.alokasi.map((a) =>
        a.subCapaianId === id ? { ...a, alokasiPersen: Number(persen) } : a
      ),
    }))
  }

  const totalBobot = form.alokasi.reduce((s, a) => s + (a.alokasiPersen || 0), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.kategoriId) { toast.error('Pilih jenis kegiatan'); return }
    if (!form.skalaId) { toast.error('Pilih skala kegiatan'); return }
    if (form.alokasi.length === 0) { toast.error('Pilih minimal satu sub-capaian'); return }
    if (Math.abs(totalBobot - 100) > 0.01) {
      toast.error(`Total bobot harus tepat 100%. Saat ini: ${totalBobot}%`)
      return
    }

    const payload = {
      nama: form.nama,
      kategoriId: Number(form.kategoriId),
      skalaId: Number(form.skalaId),
      asal: 'kurikuler_ukmf',
      deskripsi: form.deskripsi || undefined,
      lokasi: form.lokasi || undefined,
      kuota: Number(form.kuota) || undefined,
      tanggalMulai: toISODate(form.tanggalMulai),
      tanggalSelesai: toISODate(form.tanggalSelesai),
      alokasi: form.alokasi,
    }

    setLoading(true)
    try {
      await createKegiatan(payload)
      toast.success('Draft tersimpan!', {
        description: 'Kirim kegiatan dari daftar setelah siap. Setelah dikirim tidak dapat diedit.',
      })
      navigate('/operator_ukmf/daftar-kegiatan')
    } catch (err) {
      toast.error('Gagal', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout role="operator_ukmf" userName={user?.nama || 'Operator UKMF'} userRole="Operator UKMF">
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>

        <div>
          <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Buat Kegiatan</h2>
          <p className="mt-1 text-sm text-[#616161]">
            Isi detail kegiatan dan petakan ke Capaian &amp; Sub Capaian sesuai kurikulum. Kegiatan
            Simpan sebagai draft. Setelah siap, kirim dari daftar kegiatan.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-brand-dark">1. Informasi Kegiatan</h3>
            <p className="mt-0.5 mb-5 text-sm text-[#616161]">Lengkapi informasi kegiatan terlebih dahulu</p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-black">
                  Jenis Kegiatan<span className="text-red-500">*</span>
                </label>
                <select
                  value={form.kategoriId}
                  onChange={(e) => setForm((p) => ({ ...p, kategoriId: e.target.value, skalaId: '' }))}
                  className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-2.5 text-sm text-[#333] shadow-sm outline-none focus:border-brand-dark"
                  required
                >
                  <option value="">--Pilih jenis kegiatan--</option>
                  {kategoriList.map((k) => (
                    <option key={k.id} value={k.id}>{k.nama || k.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black">
                  Nama Kegiatan<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm((p) => ({ ...p, nama: e.target.value }))}
                  placeholder="Masukkan nama kegiatan..."
                  className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-2.5 text-sm text-[#333] shadow-sm outline-none focus:border-brand-dark"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black">
                  Skala Kegiatan<span className="text-red-500">*</span>
                </label>
                <select
                  value={form.skalaId}
                  onChange={(e) => setForm((p) => ({ ...p, skalaId: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-2.5 text-sm text-[#333] shadow-sm outline-none focus:border-brand-dark"
                  required
                  disabled={!form.kategoriId}
                >
                  <option value="">--Pilih skala kegiatan--</option>
                  {skalaList.map((s) => (
                    <option key={s.id} value={s.id}>{s.nama || s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black">
                  Deskripsi Kegiatan<span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.deskripsi}
                  onChange={(e) => setForm((p) => ({ ...p, deskripsi: e.target.value }))}
                  rows={4}
                  placeholder="Tujuan, agenda, dan manfaat kegiatan..."
                  className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-2.5 text-sm text-[#333] shadow-sm outline-none focus:border-brand-dark"
                  maxLength={500}
                  required
                />
                <p className="mt-1 text-right text-xs text-[#616161]">
                  {form.deskripsi.length}/500
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DatePickerInput
                  label="Tanggal Mulai"
                  selected={form.tanggalMulai}
                  onChange={(d) => setForm((p) => ({ ...p, tanggalMulai: d }))}
                  required
                />
                <DatePickerInput
                  label="Tanggal Selesai"
                  selected={form.tanggalSelesai}
                  onChange={(d) => setForm((p) => ({ ...p, tanggalSelesai: d }))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-black">
                    Lokasi<span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      value={form.lokasi}
                      onChange={(e) => setForm((p) => ({ ...p, lokasi: e.target.value }))}
                      placeholder="Gedung / tempat kegiatan"
                      className="block w-full rounded-md border border-[#e9ebf8] p-2.5 pl-9 text-sm text-[#333] shadow-sm outline-none focus:border-brand-dark"
                      required
                    />
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9aa0a6]" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">
                    Kuota Peserta<span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      min={1}
                      value={form.kuota}
                      onChange={(e) => setForm((p) => ({ ...p, kuota: e.target.value }))}
                      placeholder="Masukkan jumlah peserta"
                      className="block w-full rounded-md border border-[#e9ebf8] p-2.5 pl-9 text-sm text-[#333] shadow-sm outline-none focus:border-brand-dark"
                      required
                    />
                    <Users className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9aa0a6]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-brand-dark">2. Pemetaan Capaian Kurikulum</h3>
            <p className="mt-0.5 mb-5 text-sm text-[#616161]">
              Tentukan capaian kurikulum yang dicapai melalui kegiatan ini
            </p>

            {loadingKur ? (
              <p className="text-sm text-[#9aa0a6]">Memuat kurikulum…</p>
            ) : !kurikulum ? (
              <p className="text-sm text-red-500">Kurikulum aktif tidak ditemukan. Hubungi Admin.</p>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-black">
                    Capaian<span className="text-red-500">*</span>{' '}
                    <span className="font-normal text-[#616161]">(pilih satu atau lebih)</span>
                  </label>
                  <div className="relative mt-1" ref={capaianRef}>
                    <button
                      type="button"
                      onClick={() => setCapaianOpen((o) => !o)}
                      className="flex w-full items-center justify-between rounded-md border border-[#e9ebf8] p-2.5 text-sm text-[#333] shadow-sm outline-none focus:border-brand-dark bg-white"
                    >
                      <span className={form.selectedCapaianIds.length === 0 ? 'text-[#9aa0a6]' : ''}>
                        {form.selectedCapaianIds.length === 0
                          ? 'Pilih capaian'
                          : `${form.selectedCapaianIds.length} capaian dipilih`}
                      </span>
                      <ChevronDown className="h-4 w-4 text-[#9aa0a6] shrink-0" />
                    </button>
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
                              checked={form.selectedCapaianIds.includes(c.id)}
                              onChange={() => toggleCapaian(c.id)}
                            />
                            {c.nama}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {form.selectedCapaianIds.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {allCapaian
                        .filter((c) => form.selectedCapaianIds.includes(c.id))
                        .map((c) => (
                          <span
                            key={c.id}
                            className="inline-flex items-center gap-1.5 rounded-full border border-brand-dark bg-white px-3 py-1 text-xs font-medium text-brand-dark"
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

                {visibleSubCapaian.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-black">
                      Sub Capaian<span className="text-red-500">*</span>{' '}
                      <span className="font-normal text-[#616161]">(pilih satu atau lebih)</span>
                    </label>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {visibleSubCapaian.map((sc) => {
                        const checked = !!form.alokasi.find((a) => a.subCapaianId === sc.id)
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
                              className="accent-brand-dark"
                              checked={checked}
                              onChange={() => toggleSub(sc.id)}
                            />
                            {sc.nama}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}

                {form.alokasi.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-black">
                      Bobot Persentase Sub Capaian<span className="text-red-500">*</span>
                    </label>
                    <div className="mt-2 space-y-2">
                      {form.alokasi.map((alok) => {
                        const sc = visibleSubCapaian.find((s) => s.id === alok.subCapaianId)
                        if (!sc) return null
                        return (
                          <div key={alok.subCapaianId} className="flex items-center gap-3">
                            <span className="w-40 shrink-0 text-sm text-[#444]">{sc.nama}</span>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={alok.alokasiPersen}
                              onChange={(e) => setAlokasiPersen(alok.subCapaianId, e.target.value)}
                              className="w-24 rounded-md border border-[#e9ebf8] p-2 text-center text-sm text-[#333] shadow-sm outline-none focus:border-brand-dark"
                              placeholder="0"
                            />
                            <span className="text-sm text-[#616161]">%</span>
                          </div>
                        )
                      })}
                    </div>
                    <p className={`mt-2 text-xs font-medium ${totalBobot === 100 ? 'text-emerald-600' : 'text-[#616161]'}`}>
                      Total bobot: {totalBobot}/100 poin
                      {totalBobot === 100 && ' ✓ Sudah mencukupi'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-8 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? 'Menyimpan...' : 'Simpan Draft'}
            </button>
            <button
              type="button"
              onClick={() => setForm(EMPTY_FORM)}
              className="rounded-lg bg-gray-500 px-8 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-gray-600"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => navigate('/operator_ukmf/daftar-kegiatan')}
              className="rounded-lg border border-[#d1d5db] bg-white px-8 py-2.5 text-sm font-bold text-[#444] shadow-sm transition hover:bg-[#f5f5f5]"
            >
              Batal
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-700">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pastikan informasi sudah benar sebelum dikirim!
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}

export default BuatKegiatan
