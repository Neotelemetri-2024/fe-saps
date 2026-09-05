import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, MapPin, Users, X } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DatePickerInput from '../../components/ui/DatePickerInput'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { getCurrentUser } from '../../services/authService'
import { createKegiatan, updateKegiatan, ajukanKegiatan, getKegiatanById } from '../../services/kegiatanService'
import { getKurikulumAktif } from '../../services/kurikulumService'
import { getKategoriKegiatan, getSkalaKegiatan } from '../../services/matriksService'
import PemetaanCapaianKurikulumSection from '../../components/PemetaanCapaianKurikulumSection'

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

function BuatKegiatan() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getCurrentUser()
  const editItem = location.state?.edit || null
  const isEdit = !!editItem

  const [loading, setLoading] = useState(false)
  const [showAjukanConfirm, setShowAjukanConfirm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const [kurikulumList, setKurikulumList] = useState([])
  const [loadingKur, setLoadingKur] = useState(true)
  const [kategoriList, setKategoriList] = useState([])
  const [skalaList, setSkalaList] = useState([])
  const [loadingSkala, setLoadingSkala] = useState(false)

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
      .catch(() => {
        if (cancelled) return
        setSkalaList([])
      })
      .finally(() => {
        if (!cancelled) setLoadingSkala(false)
      })
    return () => { cancelled = true }
  }, [form.kategoriId])

  // Isi form saat mode edit (dari state daftar atau fetch detail)
  useEffect(() => {
    if (!editItem) return
    let cancelled = false

    const fillForm = (data) => {
      if (cancelled) return
      const alokasi = (data.alokasi || data.kegiatanCapaian || []).map((a) => ({
        subCapaianId: a.subCapaianId ?? a.id,
        alokasiPersen: Number(a.alokasiPersen ?? 100),
      }))
      const selectedCapaianIds = [...new Set(
        (data.kegiatanCapaian || [])
          .map((kc) => kc.subCapaian?.capaianId ?? kc.capaianId)
          .filter((v) => v != null)
      )]
      const existingKurikulumIds = [
        ...new Set(
          (data.kegiatanCapaian || data.alokasi || [])
            .map((a) => a.subCapaian?.capaian?.kurikulumId)
            .filter(Boolean)
        ),
      ]
      const fallbackKurId = data.kurikulumId ? [data.kurikulumId] : []
      const kurikulumIds = existingKurikulumIds.length > 0 ? existingKurikulumIds : fallbackKurId

      setForm({
        nama: data.nama || data.judul || '',
        kategoriId: data.kategoriId ?? data.kategori?.id ?? '',
        skalaId: data.skalaId ?? data.skala?.id ?? '',
        deskripsi: data.deskripsi || '',
        tanggalMulai: data.tanggalMulai ? new Date(data.tanggalMulai) : null,
        tanggalSelesai: data.tanggalSelesai ? new Date(data.tanggalSelesai) : null,
        lokasi: data.lokasi || '',
        kuota: data.kuota || data.kuotaPeserta || '',
        selectedKurikulumIds: kurikulumIds.length > 0 ? kurikulumIds : kurikulumList.map((k) => k.id),
        selectedCapaianIds,
        alokasi,
      })
    }

    // Item dari daftar belum punya detail alokasi → ambil dari GET /api/kegiatan/:id
    const hasDetail = (editItem.kegiatanCapaian || []).length > 0
    if (hasDetail) {
      fillForm(editItem)
    } else {
      getKegiatanById(editItem.id)
        .then((detail) => {
          if (cancelled) return
          fillForm(detail || editItem)
        })
        .catch(() => {
          if (!cancelled) fillForm(editItem)
        })
    }
    return () => { cancelled = true }
  }, [editItem])

  const toISODate = (d) => {
    if (!d) return null
    if (typeof d === 'string') return d
    return d.toISOString().split('T')[0]
  }

  const validateForm = () => {
    if (!form.kategoriId) { toast.error('Pilih jenis kegiatan'); return false }
    if (!form.skalaId) { toast.error('Pilih skala kegiatan'); return false }
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
    asal: 'kurikuler_ukmf',
    deskripsi: form.deskripsi || undefined,
    lokasi: form.lokasi || undefined,
    kuota: Number(form.kuota) || undefined,
    tanggalMulai: toISODate(form.tanggalMulai),
    tanggalSelesai: toISODate(form.tanggalSelesai),
    alokasi: form.alokasi,
  })

  const handleSimpanDraft = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    try {
      const payload = buildPayload()
      if (isEdit) {
        await updateKegiatan(editItem.id, payload)
        toast.success('Draft kegiatan berhasil diperbarui!')
      } else {
        await createKegiatan(payload)
        toast.success('Draft tersimpan!', {
          description: 'Kirim kegiatan dari daftar setelah siap. Setelah dikirim tidak dapat diedit.',
        })
      }
      navigate('/operator_ukmf/daftar-kegiatan')
    } catch (err) {
      toast.error('Gagal', { description: err.message })
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
      let id = editItem?.id
      if (isEdit) {
        await updateKegiatan(editItem.id, payload)
      } else {
        const created = await createKegiatan(payload)
        id = created?.id
      }
      await ajukanKegiatan(id)
      toast.success('Kegiatan berhasil diajukan!', {
        description: 'Kegiatan telah dikirim dan menunggu verifikasi. Setelah dikirim tidak dapat diedit.',
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
      <ConfirmModal
        isOpen={showAjukanConfirm}
        message="Setelah diajukan, kegiatan tidak dapat diedit. Lanjutkan?"
        confirmText="Ya, Ajukan"
        cancelText="Batal"
        onConfirm={handleAjukanSekarang}
        onCancel={() => setShowAjukanConfirm(false)}
      />
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>

        <div>
          <h2 className="text-2xl font-extrabold text-base-content sm:text-3xl">
            {isEdit ? 'Edit Kegiatan' : 'Buat Kegiatan'}
          </h2>
          <p className="mt-1 text-sm text-base-content/60">
            {isEdit
              ? 'Perbarui draft kegiatan. Setelah siap, kirim dari daftar kegiatan.'
              : 'Isi detail kegiatan dan petakan ke Capaian &amp; Sub Capaian sesuai kurikulum. Kegiatan Simpan sebagai draft. Setelah siap, kirim dari daftar kegiatan.'}
          </p>
        </div>

        <form onSubmit={handleSimpanDraft} className="space-y-5">
          <div className="card bg-base-100 p-6">
            <h3 className="text-base font-bold text-base-content">1. Informasi Kegiatan</h3>
            <p className="mt-0.5 mb-5 text-sm text-base-content/60">Lengkapi informasi kegiatan terlebih dahulu</p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-base-content">
                  Jenis Kegiatan<span className="text-red-500">*</span>
                </label>
                <select
                  value={form.kategoriId}
                  onChange={(e) => setForm((p) => ({ ...p, kategoriId: e.target.value, skalaId: '' }))}
                  className="mt-1 block w-full rounded-md border border-base-300 p-2.5 text-sm text-base-content shadow-sm outline-none focus:border-brand-dark"
                  required
                >
                  <option value="">--Pilih jenis kegiatan--</option>
                  {kategoriList.map((k) => (
                    <option key={k.id} value={k.id}>{k.nama || k.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-base-content">
                  Nama Kegiatan<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm((p) => ({ ...p, nama: e.target.value }))}
                  placeholder="Masukkan nama kegiatan"
                  className="mt-1 block w-full rounded-md border border-base-300 p-2.5 text-sm text-base-content shadow-sm outline-none focus:border-brand-dark"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-base-content">
                  Skala Kegiatan<span className="text-red-500">*</span>
                </label>
                <select
                  value={form.skalaId}
                  onChange={(e) => setForm((p) => ({ ...p, skalaId: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-base-300 p-2.5 text-sm text-base-content shadow-sm outline-none focus:border-brand-dark"
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
                <label className="block text-sm font-medium text-base-content">
                  Deskripsi Kegiatan<span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.deskripsi}
                  onChange={(e) => setForm((p) => ({ ...p, deskripsi: e.target.value }))}
                  rows={4}
                  placeholder="Tujuan, agenda, dan manfaat kegiatan"
                  className="mt-1 block w-full rounded-md border border-base-300 p-2.5 text-sm text-base-content shadow-sm outline-none focus:border-brand-dark"
                  maxLength={500}
                  required
                />
                <p className="mt-1 text-right text-xs text-base-content/60">
                  {form.deskripsi.length}/500
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DatePickerInput
                  label="Tanggal Mulai"
                  value={form.tanggalMulai}
                  onChange={(d) => setForm((p) => ({ ...p, tanggalMulai: d }))}
                  required
                />
                <DatePickerInput
                  label="Tanggal Selesai"
                  value={form.tanggalSelesai}
                  onChange={(d) => setForm((p) => ({ ...p, tanggalSelesai: d }))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-base-content">
                    Lokasi<span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      value={form.lokasi}
                      onChange={(e) => setForm((p) => ({ ...p, lokasi: e.target.value }))}
                      placeholder="Gedung / tempat kegiatan"
                      className="block w-full rounded-md border border-base-300 p-2.5 pl-9 text-sm text-base-content shadow-sm outline-none focus:border-brand-dark"
                      required
                    />
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/50" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-base-content">
                    Kuota Peserta<span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      min={1}
                      value={form.kuota}
                      onChange={(e) => setForm((p) => ({ ...p, kuota: e.target.value }))}
                      placeholder="Masukkan jumlah peserta"
                      className="block w-full rounded-md border border-base-300 p-2.5 pl-9 text-sm text-base-content shadow-sm outline-none focus:border-brand-dark"
                      required
                    />
                    <Users className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/50" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 p-6">
            <h3 className="text-base font-bold text-base-content">2. Pemetaan Capaian Kurikulum</h3>
            <p className="mt-0.5 mb-5 text-sm text-base-content/60">
              Tentukan capaian kurikulum yang dicapai melalui kegiatan ini
            </p>            {loadingKur ? (
              <p className="text-sm text-base-content/50">Memuat kurikulum…</p>
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

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg border border-brand-dark px-6 py-2.5 text-sm font-semibold text-brand-dark transition hover:bg-brand-dark hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >{loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Draft'}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => { if (validateForm()) setShowAjukanConfirm(true) }}
              className="btn btn-primary px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >{loading ? 'Mengirim...' : 'Ajukan Sekarang'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/operator_ukmf/daftar-kegiatan')}
              className="rounded-lg border border-base-300 bg-base-100 px-6 py-2.5 text-sm font-semibold text-base-content/80 shadow-sm transition hover:bg-base-200"
            >
              Batal
            </button>
          </div>

         
        </form>
      </div>
    </DashboardLayout>
  )
}

export default BuatKegiatan
