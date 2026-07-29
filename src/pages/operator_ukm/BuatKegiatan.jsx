import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, MapPin, Users, X, ChevronDown } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DatePickerInput from '../../components/ui/DatePickerInput'
import { getCurrentUser } from '../../services/authService'
import { createKegiatan, updateKegiatan } from '../../services/kegiatanService'
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
  // capaian yang dipilih via dropdown (array of capaian.id)
  selectedCapaianIds: [],
  // alokasi: [{ subCapaianId, alokasiPersen }]
  alokasi: [],
}

function BuatKegiatan() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getCurrentUser()
  const editItem = location.state?.edit || null
  const isEdit = !!editItem

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [capaianOpen, setCapaianOpen] = useState(false)
  const capaianRef = useRef(null)

  const [kurikulum, setKurikulum] = useState(null)
  const [loadingKur, setLoadingKur] = useState(true)
  const [kategoriList, setKategoriList] = useState([])
  const [skalaList, setSkalaList] = useState([])
  const [loadingSkala, setLoadingSkala] = useState(false)

  // Tutup dropdown capaian saat klik di luar
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
    getKurikulumAktif()
      .then((kur) => setKurikulum(kur))
      .catch(() => {})
      .finally(() => setLoadingKur(false))

    getKategoriKegiatan()
      .then((kat) => setKategoriList(Array.isArray(kat) ? kat : []))
      .catch(() => {})
  }, [])

  // Reload skala saat kategori berubah
  useEffect(() => {
    if (!form.kategoriId) {
      setSkalaList([])
      setLoadingSkala(false)
      return
    }
    let cancelled = false
    setLoadingSkala(true)
    getSkalaKegiatan(form.kategoriId)
      .then((ska) => {
        if (cancelled) return
        const list = Array.isArray(ska) ? ska : []
        setSkalaList(list)
        if (list.length === 0) {
          toast.warning('Tidak ada skala untuk jenis kegiatan ini')
        }
      })
      .catch((err) => {
        if (cancelled) return
        setSkalaList([])
        toast.error('Gagal memuat skala', { description: err.message })
      })
      .finally(() => {
        if (!cancelled) setLoadingSkala(false)
      })
    return () => { cancelled = true }
  }, [form.kategoriId])

  useEffect(() => {
    if (!editItem) return
    const alokasi = (editItem.alokasi || editItem.subCapaian || []).map((a) => ({
      subCapaianId: a.subCapaianId ?? a.id,
      alokasiPersen: a.alokasiPersen ?? 100,
    }))
    setForm({
      nama: editItem.nama || editItem.judul || '',
      kategoriId: editItem.kategoriId ?? editItem.kategori?.id ?? '',
      skalaId: editItem.skalaId ?? editItem.skala?.id ?? '',
      deskripsi: editItem.deskripsi || '',
      tanggalMulai: editItem.tanggalMulai ? new Date(editItem.tanggalMulai) : null,
      tanggalSelesai: editItem.tanggalSelesai ? new Date(editItem.tanggalSelesai) : null,
      lokasi: editItem.lokasi || '',
      kuota: editItem.kuota || editItem.kuotaPeserta || '',
      selectedCapaianIds: [],
      alokasi,
    })
  }, [editItem])

  const allCapaian = kurikulum?.capaian || []

  // Sub-capaian dari capaian yang dipilih di dropdown
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
      // Hapus alokasi sub-capaian dari capaian yang dihapus
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
      asal: 'kurikuler_ukm',
      deskripsi: form.deskripsi || undefined,
      lokasi: form.lokasi || undefined,
      kuota: Number(form.kuota) || undefined,
      tanggalMulai: toISODate(form.tanggalMulai),
      tanggalSelesai: toISODate(form.tanggalSelesai),
      alokasi: form.alokasi,
    }

    setLoading(true)
    try {
      if (isEdit) {
        await updateKegiatan(editItem.id, payload)
        toast.success('Draft kegiatan berhasil diperbarui!')
      } else {
        await createKegiatan(payload)
        toast.success('Draft tersimpan!', {
          description: 'Kirim kegiatan dari daftar setelah siap. Setelah dikirim tidak dapat diedit.',
        })
      }
      navigate('/operator_ukm/daftar-kegiatan')
    } catch (err) {
      toast.error('Gagal', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout role="operator_ukm" userName={user?.nama || 'Operator UKM'} userRole="Operator UKM">
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>

        <div>
          <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">
            {isEdit ? 'Edit Kegiatan' : 'Buat Kegiatan'}
          </h2>
          <p className="mt-1 text-sm text-[#616161]">
            {isEdit
              ? 'Perbarui draft kegiatan. Setelah siap, kirim dari daftar kegiatan.'
              : 'Isi detail kegiatan dan petakan ke Capaian & Sub Capaian. Simpan sebagai draft; kirim dari daftar kegiatan setelah siap.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ── 1. Informasi Kegiatan ── */}
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-brand-dark">1. Informasi Kegiatan</h3>
            <p className="mt-0.5 mb-4 text-sm text-[#616161]">Lengkapi informasi kegiatan terlebih dahulu</p>
            <div className="space-y-4">

              {/* Jenis Kegiatan */}
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
                  <option value="">-- Pilih jenis kegiatan --</option>
                  {kategoriList.map((k) => (
                    <option key={k.id} value={k.id}>{k.nama || k.name}</option>
                  ))}
                </select>
              </div>

              {/* Nama Kegiatan */}
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

              {/* Skala Kegiatan */}
              <div>
                <label className="block text-sm font-medium text-black">
                  Skala Kegiatan<span className="text-red-500">*</span>
                </label>
                <select
                  value={form.skalaId}
                  onChange={(e) => setForm((p) => ({ ...p, skalaId: e.target.value }))}
                  disabled={!form.kategoriId || loadingSkala}
                  className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-2.5 text-sm text-[#333] shadow-sm outline-none focus:border-brand-dark disabled:cursor-not-allowed disabled:bg-[#f5f5f5]"
                  required
                >
                  <option value="">
                    {!form.kategoriId
                      ? '-- Pilih jenis kegiatan dulu --'
                      : loadingSkala
                        ? 'Memuat skala…'
                        : '-- Pilih skala kegiatan --'}
                  </option>
                  {skalaList.map((s) => (
                    <option key={s.id} value={s.id}>{s.nama || s.name}</option>
                  ))}
                </select>
                {!form.kategoriId && (
                  <p className="mt-1 text-xs text-[#9aa0a6]">Skala muncul setelah jenis kegiatan dipilih.</p>
                )}
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-sm font-medium text-black">
                  Deskripsi Kegiatan<span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.deskripsi}
                  onChange={(e) => setForm((p) => ({ ...p, deskripsi: e.target.value }))}
                  rows={4}
                  placeholder="Tujuan, agenda, dan manfaat kegiatan."
                  className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-2.5 text-sm text-[#333] shadow-sm outline-none focus:border-brand-dark resize-none"
                  maxLength={500}
                />
                <p className="mt-1 text-right text-xs text-[#9aa0a6]">{form.deskripsi.length}/500</p>
              </div>

              {/* Tanggal */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DatePickerInput
                  label="Tanggal Mulai"
                  value={form.tanggalMulai}
                  onChange={(d) => setForm((p) => ({ ...p, tanggalMulai: d }))}
                  required
                />
                <DatePickerInput
                  label="Tanggal selesai"
                  value={form.tanggalSelesai}
                  onChange={(d) => setForm((p) => ({ ...p, tanggalSelesai: d }))}
                />
              </div>

              {/* Lokasi + Kuota */}
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
                      className="block w-full rounded-md border border-[#e9ebf8] p-2.5 pr-9 text-sm text-[#333] shadow-sm outline-none focus:border-brand-dark"
                    />
                    <MapPin className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9aa0a6]" />
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
                      className="block w-full rounded-md border border-[#e9ebf8] p-2.5 pr-9 text-sm text-[#333] shadow-sm outline-none focus:border-brand-dark"
                    />
                    <Users className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9aa0a6]" />
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ── 2. Pemetaan Capaian Kurikulum ── */}
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-brand-dark">2. Pemetaan Capaian Kurikulum</h3>
            <p className="mt-0.5 mb-4 text-sm text-[#616161]">Tentukan capaian kurikulum yang dicapai melalui kegiatan ini</p>

            {loadingKur ? (
              <p className="text-sm text-[#9aa0a6]">Memuat kurikulum…</p>
            ) : !kurikulum ? (
              <p className="text-sm text-red-500">Kurikulum aktif tidak ditemukan. Hubungi Admin.</p>
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
                      <span className={form.selectedCapaianIds.length === 0 ? 'text-[#9aa0a6]' : ''}>
                        {form.selectedCapaianIds.length === 0 ? 'Pilih capaian' : `${form.selectedCapaianIds.length} capaian dipilih`}
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

                  {/* Tag capaian terpilih */}
                  {form.selectedCapaianIds.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {allCapaian
                        .filter((c) => form.selectedCapaianIds.includes(c.id))
                        .map((c) => (
                          <span
                            key={c.id}
                            className="inline-flex items-center gap-1 rounded-full border border-brand-dark/30 bg-brand-dark/5 px-3 py-1 text-xs font-medium text-brand-dark"
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

                {/* Sub Capaian */}
                {visibleSubCapaian.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-black">
                      Sub Capaian<span className="text-red-500">*</span>{' '}
                      <span className="font-normal text-[#9aa0a6]">(pilih satu atau lebih)</span>
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
                              className="accent-brand-dark shrink-0"
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

                {/* Bobot Persentase */}
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
                            <span className="flex-1 text-sm text-[#444]">{sc.nama}</span>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={alok.alokasiPersen}
                              onChange={(e) => setAlokasiPersen(alok.subCapaianId, e.target.value)}
                              className="w-20 rounded-md border border-[#e9ebf8] p-2 text-center text-sm outline-none focus:border-brand-dark"
                            />
                          </div>
                        )
                      })}
                    </div>
                    <p className={`mt-2 text-xs font-medium ${totalBobot >= 100 ? 'text-green-600' : 'text-[#9aa0a6]'}`}>
                      Total bobot sudah {totalBobot >= 100 ? 'mencukupi' : `${totalBobot}% (belum 100%)`} 100 poin
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Tombol ── */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-8 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Simpan Draft'}
            </button>
            <button
              type="button"
              onClick={() => setForm(EMPTY_FORM)}
              className="rounded-lg bg-[#616161] px-8 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#444]"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => navigate('/operator_ukm/daftar-kegiatan')}
              className="rounded-lg border border-[#d1d5db] bg-white px-8 py-2.5 text-sm font-bold text-[#444] shadow-sm transition hover:bg-[#f5f5f5]"
            >
              Batal
            </button>
          </div>

          <p className="text-center text-xs text-[#9aa0a6]">
            ℹ Pastikan informasi sudah benar sebelum dikirim !
          </p>
        </form>
      </div>
    </DashboardLayout>
  )
}

export default BuatKegiatan
