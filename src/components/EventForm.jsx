import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, X, ChevronDown } from 'lucide-react'
import DatePickerInput from './ui/DatePickerInput'
import ConfirmModal from './ui/ConfirmModal'
import { createKegiatan, updateKegiatan, getKegiatanById, ajukanKegiatan } from '../services/kegiatanService'
import { getKurikulumAktif } from '../services/kurikulumService'
import { getKategoriKegiatan, getSkalaKegiatan } from '../services/matriksService'

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

function EventForm({ editItem, onCancel, onSaved, asal = 'universitas' }) {
  const isEdit = !!editItem
  const [loading, setLoading] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [showAjukanConfirm, setShowAjukanConfirm] = useState(false)
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

  // Muat data master saat komponen dipasang
  useEffect(() => {
    Promise.all([getKurikulumAktif(), getKategoriKegiatan()])
      .then(([kur, kat]) => {
        setKurikulum(kur)
        setKategoriList(Array.isArray(kat) ? kat : [])
      })
      .catch(() => {})
      .finally(() => setLoadingKur(false))
  }, [])

  // Saat mode edit, ambil detail lengkap kegiatan (termasuk alokasi capaian)
  useEffect(() => {
    if (!editItem) return
    setLoadingEdit(true)
    getKegiatanById(editItem.id)
      .then((detail) => {
        if (!detail) return
        const alokasi = (detail.kegiatanCapaian || detail.alokasi || []).map((a) => ({
          subCapaianId: Number(a.subCapaianId ?? a.id),
          alokasiPersen: Number(a.alokasiPersen ?? a.alokasiPoin ?? 100),
        }))
        const capaianIds = [
          ...new Set(
            (detail.kegiatanCapaian || [])
              .map((a) => a.subCapaian?.capaian?.id ?? a.capaianId)
              .filter(Boolean)
          ),
        ]
        setForm({
          nama: detail.nama || '',
          kategoriId: detail.kategoriId ?? detail.kategori?.id ?? '',
          skalaId: detail.skalaId ?? detail.skala?.id ?? '',
          deskripsi: detail.deskripsi || '',
          tanggalMulai: detail.tanggalMulai ? new Date(detail.tanggalMulai) : null,
          tanggalSelesai: detail.tanggalSelesai ? new Date(detail.tanggalSelesai) : null,
          lokasi: detail.lokasi || '',
          kuota: detail.kuota ?? '',
          selectedCapaianIds: capaianIds,
          alokasi,
        })
      })
      .catch((err) => {
        toast.error('Gagal memuat data kegiatan', { description: err.message })
      })
      .finally(() => setLoadingEdit(false))
  }, [editItem])

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

  const validateForm = () => {
    if (!form.nama || !form.kategoriId || !form.skalaId || !form.deskripsi || !form.tanggalMulai || !form.lokasi || !form.kuota) {
      toast.error('Lengkapi semua field yang wajib diisi.')
      return false
    }
    if (form.alokasi.length === 0) {
      toast.error('Pilih minimal satu sub-capaian')
      return false
    }
    if (Math.abs(totalBobot - 100) > 0.01) {
      toast.error(`Total bobot harus tepat 100%. Saat ini: ${totalBobot}%`)
      return false
    }
    return true
  }

  const buildPayload = () => ({
    nama: form.nama,
    kategoriId: Number(form.kategoriId),
    skalaId: Number(form.skalaId),
    asal,
    deskripsi: form.deskripsi || undefined,
    lokasi: form.lokasi || undefined,
    kuota: Number(form.kuota) || undefined,
    tanggalMulai: toISODate(form.tanggalMulai),
    tanggalSelesai: toISODate(form.tanggalSelesai),
    alokasi: form.alokasi,
  })

  const handleSimpanDraft = async () => {
    if (!validateForm()) return
    setLoading(true)
    try {
      const payload = buildPayload()
      if (isEdit) {
        await updateKegiatan(editItem.id, payload)
        toast.success('Draft event berhasil diperbarui!')
      } else {
        await createKegiatan(payload)
        toast.success('Draft tersimpan!', {
          description: 'Kirim event dari Event Global setelah siap. Setelah dikirim tidak dapat diedit.',
        })
      }
      onSaved?.()
    } catch (err) {
      toast.error('Gagal menyimpan event', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleAjukanSekarang = async () => {
    setShowAjukanConfirm(false)
    if (!validateForm()) return
    setLoading(true)
    try {
      const payload = buildPayload()
      const id = isEdit ? editItem.id : (await createKegiatan(payload))?.id
      if (isEdit) {
        await updateKegiatan(editItem.id, payload)
      }
      await ajukanKegiatan(id)
      toast.success('Event berhasil diajukan!', {
        description: 'Event telah dikirim dan menunggu persetujuan. Setelah dikirim tidak dapat diedit.',
      })
      onSaved?.()
    } catch (err) {
      toast.error('Gagal mengajukan event', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <ConfirmModal
        isOpen={showAjukanConfirm}
        message="Setelah diajukan, event tidak dapat diedit. Lanjutkan?"
        confirmText="Ya, Ajukan"
        cancelText="Batal"
        onConfirm={handleAjukanSekarang}
        onCancel={() => setShowAjukanConfirm(false)}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-dark hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Daftar
        </button>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-brand-dark">{isEdit ? 'Edit Event' : 'Buat Event'}</h2>
        <p className="mt-1 text-sm text-[#616161]">Isi detail kegiatan dan simpan sebagai draft. Kirim dari daftar setelah siap.</p>
      </div>

      {loadingEdit && (
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-4 text-sm text-[#616161] shadow-sm">
          Memuat data event…
        </div>
      )}

      <form onSubmit={(e) => e.preventDefault()} className="space-y-5">
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <p className="text-sm text-[#616161]">Lengkapi informasi kegiatan terlebih dahulu</p>

          <ol className="mt-3 list-decimal pl-5 text-base font-semibold text-black">
            <li>Informasi Kegiatan</li>
          </ol>

          <div className="mt-5 space-y-5">
            <div>
              <label className="block text-sm font-medium text-black">
                Jenis Kegiatan <span className="text-red-600">*</span>
              </label>
              <select
                value={form.kategoriId}
                onChange={(e) => setForm((p) => ({ ...p, kategoriId: e.target.value, skalaId: '' }))}
                className="mt-1 w-full rounded-lg border border-[#c4c6cf] bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-brand-dark"
                required
              >
                <option value="">-- Pilih jenis kegiatan --</option>
                {kategoriList.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.nama || opt.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-black">
                Nama Kegiatan <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={form.nama}
                onChange={(e) => setForm((p) => ({ ...p, nama: e.target.value }))}
                placeholder="Masukkan nama kegiatan"
                className="mt-1 w-full rounded-lg border border-[#c4c6cf] bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-brand-dark"
                required
              />
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
                placeholder="Tujuan, agenda, dan manfaat kegiatan"
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
                    <ChevronDown className="h-4 w-4 shrink-0 text-[#8e98a8]" />
                  </button>
                  {capaianOpen && (
                    <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-[#c4c6cf] bg-white shadow-md">
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
                          <span className="w-40 shrink-0 text-sm text-[#444]">
                            <span className="block truncate">{sc.nama}</span>
                            <span className="block truncate text-[11px] font-normal text-[#9aa0a6]">{sc.namaCapaian}</span>
                          </span>
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

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={loading || loadingEdit}
            onClick={handleSimpanDraft}
            className="flex items-center justify-center gap-2 rounded-lg border border-brand-dark px-6 py-2.5 text-sm font-semibold text-brand-dark transition hover:bg-brand-dark hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Draft'}
          </button>
          <button
            type="button"
            disabled={loading || loadingEdit}
            onClick={() => { if (validateForm()) setShowAjukanConfirm(true) }}
            className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Mengirim...' : 'Ajukan Sekarang'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[#d1d5db] bg-white px-6 py-2.5 text-sm font-semibold text-[#444] transition hover:bg-[#f5f5f5]"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  )
}

export default EventForm
