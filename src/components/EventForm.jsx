import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, X, ChevronDown } from 'lucide-react'
import DatePickerInput from './ui/DatePickerInput'
import ConfirmModal from './ui/ConfirmModal'
import { createKegiatan, updateKegiatan, getKegiatanById, ajukanKegiatan } from '../services/kegiatanService'
import { getKurikulumAktif } from '../services/kurikulumService'
import { getKategoriKegiatan, getSkalaKegiatan } from '../services/matriksService'
import PemetaanCapaianKurikulumSection from './PemetaanCapaianKurikulumSection'

const EMPTY_FORM = {
  nama: '',
  kategoriId: '',
  skalaId: '',
  deskripsi: '',
  tanggalMulai: null,
  tanggalSelesai: null,
  lokasi: '',
  kuota: '',
  selectedKurikulumIds: [],
  selectedCapaianIds: [],
  alokasi: [],
}

function EventForm({ editItem, onCancel, onSaved, asal = 'universitas' }) {
  const isEdit = !!editItem
  const [loading, setLoading] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [showAjukanConfirm, setShowAjukanConfirm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const [kurikulumList, setKurikulumList] = useState([])
  const [loadingKur, setLoadingKur] = useState(true)
  const [kategoriList, setKategoriList] = useState([])
  const [skalaList, setSkalaList] = useState([])

  // Muat data master saat komponen dipasang
  useEffect(() => {
    Promise.all([getKurikulumAktif(), getKategoriKegiatan()])
      .then(([kur, kat]) => {
        const list = Array.isArray(kur) ? kur : (kur ? [kur] : [])
        setKurikulumList(list)
        setKategoriList(Array.isArray(kat) ? kat : [])
        if (!isEdit) {
          setForm((prev) => ({
            ...prev,
            selectedKurikulumIds: list.map((k) => k.id),
          }))
        }
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
        const existingKurikulumIds = [
          ...new Set(
            (detail.kegiatanCapaian || [])
              .map((a) => a.subCapaian?.capaian?.kurikulumId)
              .filter(Boolean)
          ),
        ]
        const fallbackKurikulumId = detail.kurikulumId ? [detail.kurikulumId] : []
        const kurikulumIds = existingKurikulumIds.length > 0 ? existingKurikulumIds : fallbackKurikulumId

        setForm({
          nama: detail.nama || '',
          kategoriId: detail.kategoriId ?? detail.kategori?.id ?? '',
          skalaId: detail.skalaId ?? detail.skala?.id ?? '',
          deskripsi: detail.deskripsi || '',
          tanggalMulai: detail.tanggalMulai ? new Date(detail.tanggalMulai) : null,
          tanggalSelesai: detail.tanggalSelesai ? new Date(detail.tanggalSelesai) : null,
          lokasi: detail.lokasi || '',
          kuota: detail.kuota ?? '',
          selectedKurikulumIds: kurikulumIds.length > 0 ? kurikulumIds : (kurikulumList.map((k) => k.id)),
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

  const toISODate = (d) => {
    if (!d) return null
    if (typeof d === 'string') return d
    return d.toISOString().split('T')[0]
  }

  const validateForm = () => {
    if (!form.nama || !form.kategoriId || !form.skalaId || !form.deskripsi || !form.tanggalMulai || !form.lokasi || !form.kuota) {
      toast.error('Lengkapi semua field yang wajib diisi.')
      return false
    }
    if (kurikulumList.length === 0) {
      toast.error('Tidak ada kurikulum aktif.')
      return false
    }
    for (const kur of kurikulumList) {
      const kurSubIds = (kur.capaian || []).flatMap((c) => (c.subCapaian || []).map((sc) => sc.id))
      const kurAlokasi = form.alokasi.filter((a) => kurSubIds.includes(a.subCapaianId))
      if (kurAlokasi.length === 0) {
        toast.error(`Pilih minimal satu sub-capaian untuk ${kur.nama}`)
        return false
      }
      const sum = kurAlokasi.reduce((s, a) => s + (a.alokasiPersen || 0), 0)
      if (Math.abs(sum - 100) > 0.01) {
        toast.error(`Total bobot untuk ${kur.nama} harus tepat 100%. Saat ini: ${sum}%`)
        return false
      }
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
          ) : kurikulumList.length === 0 ? (
            <p className="text-sm text-red-500">Kurikulum aktif tidak ditemukan. Hubungi Admin.</p>
          ) : (
            <PemetaanCapaianKurikulumSection
              kurikulumList={kurikulumList}
              selectedKurikulumIds={form.selectedKurikulumIds}
              setSelectedKurikulumIds={(ids) =>
                setForm((p) => ({
                  ...p,
                  selectedKurikulumIds: typeof ids === 'function' ? ids(p.selectedKurikulumIds) : ids,
                }))
              }
              selectedCapaianIds={form.selectedCapaianIds}
              setSelectedCapaianIds={(cids) =>
                setForm((p) => ({
                  ...p,
                  selectedCapaianIds: typeof cids === 'function' ? cids(p.selectedCapaianIds) : cids,
                }))
              }
              alokasi={form.alokasi}
              setAlokasi={(aloks) =>
                setForm((p) => ({
                  ...p,
                  alokasi: typeof aloks === 'function' ? aloks(p.alokasi) : aloks,
                }))
              }
            />
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
