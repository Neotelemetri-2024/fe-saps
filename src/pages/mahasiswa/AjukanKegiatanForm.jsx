import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { ArrowLeft, Save } from 'lucide-react'
import DatePickerInput from '../../components/ui/DatePickerInput'
import ConfirmModal from '../../components/ui/ConfirmModal'
import InfoTooltip from '../../components/ui/InfoTooltip'
import {
  ajukanKegiatan,
  simpanDraftKegiatanEksternal,
  editDraftKegiatanEksternal,
  ajukanDraftKegiatanEksternal,
} from '../../services/pengajuanService'
import { getKategoriKegiatan, getSkalaKegiatan } from '../../services/matriksService'
import { getCurrentUser } from '../../services/authService'

const EMPTY_FORM = {
  kategoriId: '',
  namaKegiatan: '',
  penyelenggara: '',
  skalaId: '',
  tanggalPelaksanaan: null,
  deskripsiKegiatan: '',
  linkWebsite: '',
  emailPenyelenggara: '',
}

function toISODate(d) {
  if (!d) return null
  if (typeof d === 'string') return d
  return d.toISOString().split('T')[0]
}

function AjukanKegiatanForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getCurrentUser()

  // Jika dinavigasi dari tabel draft → mode edit
  // isRevisi: dinavigasi dari tabel revisi → edit + ajukan ulang
  const draftItem = location.state?.draft || null
  const isRevisi = !!(location.state?.isRevisi && draftItem)
  const isEditDraft = !!draftItem && !isRevisi

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [draftId, setDraftId] = useState(draftItem?.id || null)
  const [showKirimConfirm, setShowKirimConfirm] = useState(false)
  const [kategoriList, setKategoriList] = useState([])
  const [skalaList, setSkalaList] = useState([])

  // Populate form dari draft yang diedit
  useEffect(() => {
    getKategoriKegiatan()
      .then((list) => setKategoriList(Array.isArray(list) ? list : []))
      .catch(() => setKategoriList([]))

    if (draftItem) {
      setFormData({
        kategoriId: String(draftItem.kategoriId || ''),
        namaKegiatan: draftItem.namaKegiatan || '',
        penyelenggara: draftItem.penyelenggara || '',
      skalaId: String(draftItem.skalaId || ''),
        tanggalPelaksanaan: draftItem.tanggalPelaksanaan ? new Date(draftItem.tanggalPelaksanaan) : null,
        deskripsiKegiatan: draftItem.deskripsi || '',
        linkWebsite: draftItem.linkWebsite || '',
        emailPenyelenggara: draftItem.emailPenyelenggara || '',
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!formData.kategoriId) {
      setSkalaList([])
      return
    }
    getSkalaKegiatan(formData.kategoriId)
      .then((list) => setSkalaList(Array.isArray(list) ? list : []))
      .catch(() => setSkalaList([]))
  }, [formData.kategoriId])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'kategoriId') {
      setFormData((prev) => ({ ...prev, kategoriId: value, skalaId: '' }))
      return
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, tanggalPelaksanaan: date }))
  }

  function buildPayload() {
    return {
      kategoriId: formData.kategoriId ? Number(formData.kategoriId) : undefined,
      namaKegiatan: formData.namaKegiatan,
      penyelenggara: formData.penyelenggara,
      skalaId: formData.skalaId ? Number(formData.skalaId) : undefined,
      tanggalPelaksanaan: toISODate(formData.tanggalPelaksanaan),
      deskripsi: formData.deskripsiKegiatan,
      linkWebsite: formData.linkWebsite,
      emailPenyelenggara: formData.emailPenyelenggara,
    }
  }

  /** Simpan / update draft ke BE */
  const handleSimpanDraft = async () => {
    setLoading(true)
    try {
      if (draftId) {
        await editDraftKegiatanEksternal(draftId, buildPayload())
        toast.success('Draft diperbarui!')
      } else {
        await simpanDraftKegiatanEksternal(buildPayload())
        toast.success('Draft tersimpan!', {
          description: 'Terlihat di tabel dengan status Draft. Bisa diedit kapan saja.',
        })
      }
      navigate('/mahasiswa/kegiatan-eksternal')
    } catch (err) {
      toast.error('Gagal menyimpan draft', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  /** Kirim pengajuan */
  const handleSubmit = async () => {
    setShowKirimConfirm(false)
    if (!formData.kategoriId || !formData.skalaId) {
      toast.error('Pilih jenis dan skala kegiatan')
      return
    }
    if (!formData.namaKegiatan.trim()) {
      toast.error('Nama kegiatan tidak boleh kosong')
      return
    }
    if (!formData.penyelenggara.trim()) {
      toast.error('Penyelenggara tidak boleh kosong')
      return
    }
    setLoading(true)
    try {
      if (draftId) {
        // Simpan perubahan terbaru dulu lalu ajukan draft
        await editDraftKegiatanEksternal(draftId, buildPayload())
        await ajukanDraftKegiatanEksternal(draftId)
      } else {
        // Langsung buat dan ajukan
        await ajukanKegiatan(buildPayload())
      }
      toast.success('Berhasil!', {
        description: 'Pengajuan kegiatan dikirim dan akan ditinjau Admin Ditmawa.',
      })
      navigate('/mahasiswa/kegiatan-eksternal')
    } catch (err) {
      toast.error('Gagal', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  const isDirty = !!(formData.namaKegiatan || formData.penyelenggara || formData.kategoriId)

  return (
    <DashboardLayout role="mahasiswa" userName={user?.nama || 'Mahasiswa'} userRole="Mahasiswa">
      <ConfirmModal
        isOpen={showKirimConfirm}
        message="Kirim pengajuan kegiatan ini ke Admin Ditmawa untuk ditinjau?"
        confirmText="Ya, kirim"
        cancelText="Batal"
        onConfirm={handleSubmit}
        onCancel={() => setShowKirimConfirm(false)}
      />

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/mahasiswa/kegiatan-eksternal')}
            className="flex items-center gap-1 text-sm text-brand-dark hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </button>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xl font-bold text-[#222] sm:text-2xl">
                {isRevisi ? 'Perbaiki & Ajukan Ulang' : isEditDraft ? 'Edit Draft Kegiatan' : 'Pengajuan Kegiatan'}
              </h2>
              <InfoTooltip message={<>Kegiatan berstatus <strong>draft</strong> dapat diedit atau dihapus. Setelah <strong>Kirim</strong>, kegiatan tidak dapat diedit.</>} />
            </div>
            <p className="mt-1 text-sm text-[#616161]">
              {isRevisi
                ? 'Perbaiki data sesuai catatan revisi, lalu ajukan ulang.'
                : isEditDraft
                ? 'Perbarui data draft, simpan, atau langsung ajukan.'
                : 'Isi data kegiatan eksternal yang ingin diajukan ke Admin Ditmawa.'}
            </p>
          </div>
          {isRevisi ? (
            <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700 shrink-0">
              Revisi
            </span>
          ) : draftId ? (
            <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700 shrink-0">
              <Save className="h-3.5 w-3.5" />
              Draft
            </span>
          ) : null}
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-3 sm:p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-bold text-[#222]">Detail Kegiatan</h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-black">
                Jenis Kegiatan<span className="text-red-500">*</span>
              </label>
              <select
                name="kategoriId"
                value={formData.kategoriId}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark"
              >
                <option value="">Pilih jenis kegiatan</option>
                {kategoriList.map((k) => (
                  <option key={k.id} value={k.id}>{k.nama || k.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-black">
                  Nama Kegiatan<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="namaKegiatan"
                  value={formData.namaKegiatan}
                  onChange={handleChange}
                  placeholder="Masukkan nama kegiatan"
                  className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black">
                  Penyelenggara<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="penyelenggara"
                  value={formData.penyelenggara}
                  onChange={handleChange}
                  placeholder="Masukkan penyelenggara..."
                  className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black">
                Skala Kegiatan<span className="text-red-500">*</span>
              </label>
              <select
                name="skalaId"
                value={formData.skalaId}
                onChange={handleChange}
                disabled={!formData.kategoriId}
                className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark disabled:bg-[#f5f5f5]"
              >
                <option value="">
                  {formData.kategoriId ? 'Pilih skala kegiatan' : 'Pilih jenis kegiatan terlebih dahulu'}
                </option>
                {skalaList.map((s) => (
                  <option key={s.id} value={s.id}>{s.nama || s.name}</option>
                ))}
              </select>
            </div>

            <DatePickerInput
              label="Tanggal Pelaksanaan"
              value={formData.tanggalPelaksanaan}
              onChange={handleDateChange}
              placeholder="Pilih tanggal"
            />

            <div>
              <label className="block text-sm font-medium text-black">Deskripsi Kegiatan</label>
              <textarea
                name="deskripsiKegiatan"
                value={formData.deskripsiKegiatan}
                onChange={handleChange}
                rows={3}
                placeholder="Jelaskan peran dan manfaat kegiatan..."
                className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-black">Link Website Penyelenggara</label>
                <input
                  type="url"
                  name="linkWebsite"
                  value={formData.linkWebsite}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black">Email Penyelenggara</label>
                <input
                  type="email"
                  name="emailPenyelenggara"
                  value={formData.emailPenyelenggara}
                  onChange={handleChange}
                  placeholder="unand@gmail.com"
                  className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 border-t border-[#f0f0f0] pt-4 sm:flex-row sm:justify-end">
              {/* Simpan draft — hanya tampil jika bukan mode revisi */}
              {!isRevisi && (
                <button
                  type="button"
                  disabled={loading || !isDirty}
                  onClick={handleSimpanDraft}
                  className="flex items-center justify-center gap-2 rounded-lg border border-brand-dark px-6 py-2.5 text-sm font-semibold text-brand-dark shadow-sm transition hover:bg-brand-dark hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >{draftId ? 'Perbarui Draft' : 'Simpan Draft'}
                </button>
              )}

              {/* Ajukan */}
              <button
                type="button"
                disabled={loading || !isDirty}
                onClick={() => setShowKirimConfirm(true)}
                className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >{loading ? 'Mengirim…' : isRevisi ? 'Ajukan Ulang' : 'Ajukan Sekarang'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/mahasiswa/kegiatan-eksternal')}
                className="rounded-lg border border-[#d1d5db] bg-white px-6 py-2.5 text-sm font-semibold text-[#444] shadow-sm transition hover:bg-[#f5f5f5]"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AjukanKegiatanForm
