import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, X, ChevronDown } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DatePickerInput from '../../components/ui/DatePickerInput'
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

function BuatEvent() {
  const navigate = useNavigate()
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
    if (!form.nama || !form.kategoriId || !form.skalaId || !form.deskripsi || !form.tanggalMulai || !form.lokasi || !form.kuota) {
      toast.error('Lengkapi semua field yang wajib diisi.')
      return
    }
    if (form.alokasi.length === 0) {
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
        nama: form.nama,
        kategoriId: Number(form.kategoriId),
        skalaId: Number(form.skalaId),
        asal: 'universitas',
        deskripsi: form.deskripsi || undefined,
        lokasi: form.lokasi || undefined,
        kuota: Number(form.kuota) || undefined,
        tanggalMulai: toISODate(form.tanggalMulai),
        tanggalSelesai: toISODate(form.tanggalSelesai),
        alokasi: form.alokasi,
      })
      toast.success('Draft tersimpan!', {
        description: 'Kirim event dari Manajemen Event setelah siap. Setelah dikirim tidak dapat diedit.',
      })
      navigate('/admin_ditmawa/manajemen-event')
    } catch (err) {
      toast.error('Gagal membuat event', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout role="admin_ditmawa" userName="Dr. Efa Yonnedi, SE. MPPM, Akt, CA, CRGP" userRole="Dosen Pembimbing">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-dark hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-brand-dark">Buat Event</h2>
          <p className="mt-1 text-sm text-[#616161]">Isi detail kegiatan dan simpan sebagai draft. Kirim dari daftar setelah siap.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
            <p className="text-sm text-[#616161]">Lengkapi informasi kegiatan terlebih dahulu</p>

            <ol className="mt-3 list-decimal pl-5 text-base font-semibold text-black">
              <li>Informasi Kegiatan</li>
            </ol>

            <div className="mt-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-black">
                  Nama Kegiatan <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm((p) => ({ ...p, nama: e.target.value }))}
                  placeholder="Masukkan nama kegiatan..."
                  className="mt-1 w-full rounded-lg border border-[#c4c6cf] bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-brand-dark"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black">
                  Jenis Kegiatan <span className="text-red-600">*</span>
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {kategoriList.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setForm((prev) => ({
                        ...prev,
                        kategoriId: String(opt.id),
                        skalaId: '',
                      }))}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                        String(form.kategoriId) === String(opt.id)
                          ? 'border-brand-dark bg-gradient-to-r from-brand-dark to-brand-light text-white'
                          : 'border-[#8e98a8] text-[#8e98a8] hover:border-brand-dark'
                      }`}
                    >
                      {opt.nama || opt.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black">
                  Skala Kegiatan <span className="text-red-600">*</span>
                </label>
                <select
                  value={form.skalaId}
                  onChange={(e) => setForm((p) => ({ ...p, skalaId: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-[#c4c6cf] bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-brand-dark"
                  required
                  disabled={!form.kategoriId}
                >
                  <option value="">Pilih skala kegiatan</option>
                  {skalaList.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.nama || opt.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black">
                  Deskripsi Kegiatan <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={form.deskripsi}
                  onChange={(e) => setForm((p) => ({ ...p, deskripsi: e.target.value }))}
                  placeholder="Tujuan, agenda, dan manfaat kegiatan..."
                  rows={4}
                  maxLength={500}
                  className="mt-1 w-full rounded-lg border border-[#c4c6cf] bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-brand-dark"
                />
                <p className="mt-1 text-right text-xs text-[#8e98a8]">{form.deskripsi.length}/500</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DatePickerInput
                  label="Tanggal Mulai"
                  value={form.tanggalMulai}
                  onChange={(date) => setForm((prev) => ({ ...prev, tanggalMulai: date }))}
                  required
                  placeholder="Pilih tanggal"
                />
                <DatePickerInput
                  label="Tanggal Selesai"
                  value={form.tanggalSelesai}
                  onChange={(date) => setForm((prev) => ({ ...prev, tanggalSelesai: date }))}
                  placeholder="Pilih tanggal"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-black">
                    Lokasi <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.lokasi}
                    onChange={(e) => setForm((p) => ({ ...p, lokasi: e.target.value }))}
                    placeholder="Gedung / tempat kegiatan..."
                    className="mt-1 w-full rounded-lg border border-[#c4c6cf] bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-brand-dark"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">
                    Kuota Peserta <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.kuota}
                    onChange={(e) => setForm((p) => ({ ...p, kuota: e.target.value }))}
                    placeholder="Masukkan jumlah peserta"
                    min={1}
                    className="mt-1 w-full rounded-lg border border-[#c4c6cf] bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-brand-dark"
                    required
                  />
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
                    Capaian <span className="text-red-600">*</span>{' '}
                    <span className="font-normal text-[#616161]">(pilih satu atau lebih)</span>
                  </label>
                  <div className="relative mt-1" ref={capaianRef}>
                    <button
                      type="button"
                      onClick={() => setCapaianOpen((o) => !o)}
                      className="flex w-full items-center justify-between rounded-lg border border-[#c4c6cf] bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-brand-dark"
                    >
                      <span className={form.selectedCapaianIds.length === 0 ? 'text-[#8e98a8]' : ''}>
                        {form.selectedCapaianIds.length === 0
                          ? 'Pilih capaian'
                          : `${form.selectedCapaianIds.length} capaian dipilih`}
                      </span>
                      <ChevronDown className="h-4 w-4 text-[#8e98a8] shrink-0" />
                    </button>
                    {capaianOpen && (
                      <div className="absolute z-10 mt-1 w-full rounded-lg border border-[#c4c6cf] bg-white shadow-md">
                        {allCapaian.map((c) => (
                          <label
                            key={c.id}
                            className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[#f5f5f5]"
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
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                {visibleSubCapaian.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-black">
                      Sub Capaian <span className="text-red-600">*</span>{' '}
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
                      Bobot Persentase Sub Capaian <span className="text-red-600">*</span>
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
                              className="w-24 rounded-lg border border-[#c4c6cf] p-2 text-center text-sm outline-none focus:border-brand-dark"
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

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-8 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? 'Menyimpan...' : 'Simpan Draft'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-lg border border-brand-dark px-8 py-2.5 text-sm font-semibold text-brand-dark transition hover:bg-green-50"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}

export default BuatEvent
