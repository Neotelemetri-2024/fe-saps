import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, MapPin } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DatePickerInput from '../../components/ui/DatePickerInput'
import { createKegiatan } from '../../services/kegiatanService'

function FormBuatKegiatan() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    jenisKegiatan: '',
    namaKegiatan: '',
    skalaKegiatan: '',
    deskripsiKegiatan: '',
    tanggalMulai: null,
    tanggalSelesai: null,
    lokasi: '',
    kuotaPeserta: '',
    capaian: [],
    subCapaian: [],
    bobotPublicSpeaking: '',
    bobotLeadership: '',
    bobotPresentasi: '',
    bobotNegosiasi: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateChange = (date, name) => {
    setFormData((prev) => ({ ...prev, [name]: date }))
  }

  const handleCapaianChange = (e) => {
    const { value, checked } = e.target
    if (checked) {
      setFormData((prev) => ({ ...prev, capaian: [...prev.capaian, value] }))
    } else {
      setFormData((prev) => ({ ...prev, capaian: prev.capaian.filter((c) => c !== value) }))
    }
  }

  const handleSubCapaianChange = (e) => {
    const { value, checked } = e.target
    if (checked) {
      setFormData((prev) => ({ ...prev, subCapaian: [...prev.subCapaian, value] }))
    } else {
      setFormData((prev) => ({ ...prev, subCapaian: prev.subCapaian.filter((sc) => sc !== value) }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createKegiatan({
        nama: formData.namaKegiatan,
        jenis: formData.jenisKegiatan,
        skala: formData.skalaKegiatan,
        deskripsi: formData.deskripsiKegiatan,
        tanggal: formData.tanggalMulai,
        tgl: formData.tanggalMulai,
        lokasi: formData.lokasi,
        kuota: formData.kuotaPeserta,
      })
      toast.success('Kegiatan berhasil diajukan!')
      navigate('/ukmf/daftar-kegiatan')
    } catch (err) {
      toast.error('Gagal', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      jenisKegiatan: '',
      namaKegiatan: '',
      skalaKegiatan: '',
      deskripsiKegiatan: '',
      tanggalMulai: null,
      tanggalSelesai: null,
      lokasi: '',
      kuotaPeserta: '',
      capaian: [],
      subCapaian: [],
      bobotPublicSpeaking: '',
      bobotLeadership: '',
      bobotPresentasi: '',
      bobotNegosiasi: '',
    })
  }

  return (
    <DashboardLayout role="ukmf" userName="Operator UKMF" userRole="Operator UKMF">
      <div className="space-y-5">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>

        <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Buat Kegiatan</h2>
        <p className="mt-1 text-sm text-[#616161]">Isi detail kegiatan dan petakan ke Capaian & Sub Capaian sesuai kurikulum. Kegiatan akan diajukan ke Admin Ditmawa sebelum dipublikasikan.</p>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-brand-dark">1. Informasi Kegiatan</h3>
          <p className="mb-6 text-sm text-[#616161]">Lengkapi informasi kegiatan terlebih dahulu</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="jenisKegiatan" className="block text-sm font-medium text-black">Jenis Kegiatan<span className="text-red-500">*</span></label>
              <select
                id="jenisKegiatan"
                name="jenisKegiatan"
                value={formData.jenisKegiatan}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-2 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
                required
              >
                <option value="">--Pilih jenis kegiatan--</option>
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
                <option value="Pelatihan">Pelatihan</option>
                <option value="Lomba">Lomba</option>
                <option value="Bakti Sosial">Bakti Sosial</option>
              </select>
            </div>

            <div>
              <label htmlFor="namaKegiatan" className="block text-sm font-medium text-black">Nama Kegiatan<span className="text-red-500">*</span></label>
              <input
                type="text"
                id="namaKegiatan"
                name="namaKegiatan"
                value={formData.namaKegiatan}
                onChange={handleChange}
                placeholder="Masukkan nama kegiatan..."
                className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-2 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
                required
              />
            </div>

            <div>
              <label htmlFor="skalaKegiatan" className="block text-sm font-medium text-black">Skala Kegiatan<span className="text-red-500">*</span></label>
              <select
                id="skalaKegiatan"
                name="skalaKegiatan"
                value={formData.skalaKegiatan}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-2 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
                required
              >
                <option value="">--Pilih skala kegiatan--</option>
                <option value="Fakultas">Fakultas</option>
                <option value="Universitas">Universitas</option>
                <option value="Nasional">Nasional</option>
                <option value="Internasional">Internasional</option>
              </select>
            </div>

            <div>
              <label htmlFor="deskripsiKegiatan" className="block text-sm font-medium text-black">Deskripsi Kegiatan<span className="text-red-500">*</span></label>
              <textarea
                id="deskripsiKegiatan"
                name="deskripsiKegiatan"
                value={formData.deskripsiKegiatan}
                onChange={handleChange}
                rows="4"
                placeholder="Tujuan, agenda, dan manfaat kegiatan..."
                className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-2 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
                maxLength={500}
                required
              ></textarea>
              <p className="text-right text-xs text-[#616161] mt-1">{formData.deskripsiKegiatan.length}/500</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DatePickerInput
                label="Tanggal Mulai"
                selected={formData.tanggalMulai}
                onChange={(date) => handleDateChange(date, 'tanggalMulai')}
                required
              />
              <DatePickerInput
                label="Tanggal Selesai"
                selected={formData.tanggalSelesai}
                onChange={(date) => handleDateChange(date, 'tanggalSelesai')}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="lokasi" className="block text-sm font-medium text-black">Lokasi<span className="text-red-500">*</span></label>
                <div className="relative mt-1">
                  <input
                    type="text"
                    id="lokasi"
                    name="lokasi"
                    value={formData.lokasi}
                    onChange={handleChange}
                    placeholder="Gedung / tempat kegiatan"
                    className="block w-full rounded-md border border-[#e9ebf8] p-2 pl-10 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
                    required
                  />
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#616161]" />
                </div>
              </div>

              <div>
                <label htmlFor="kuotaPeserta" className="block text-sm font-medium text-black">Kuota Peserta<span className="text-red-500">*</span></label>
                <input
                  type="number"
                  id="kuotaPeserta"
                  name="kuotaPeserta"
                  value={formData.kuotaPeserta}
                  onChange={handleChange}
                  placeholder="Masukkan jumlah peserta"
                  className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-2 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
                  required
                />
              </div>
            </div>
          </form>
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-brand-dark">2. Pemetaan Capaian Kurikulum</h3>
          <p className="mb-6 text-sm text-[#616161]">Tentukan capaian kurikulum yang dicapai melalui kegiatan ini</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black">Capaian<span className="text-red-500">*</span> (pilih satu atau lebih)</label>
              <div className="mt-1">
                <select
                  multiple
                  id="capaian"
                  name="capaian"
                  value={formData.capaian}
                  onChange={handleCapaianChange}
                  className="block w-full rounded-md border border-[#e9ebf8] p-2 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
                  required
                >
                  <option value="Fondasi">Fondasi</option>
                  <option value="Penguatan">Penguatan</option>
                  <option value="Kemahasiswaan">Kemahasiswaan</option>
                </select>
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.capaian.map((c) => (
                    <span key={c} className="inline-flex items-center gap-1.5 rounded-full bg-[#e9ebf8] px-3 py-1 text-xs font-medium text-[#333]">
                      {c}
                      <button type="button" onClick={() => handleCapaianChange({ target: { value: c, checked: false } })} className="text-[#616161] hover:text-[#333]">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black">Sub Capaian<span className="text-red-500">*</span> (pilih satu atau lebih)</label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <label className="inline-flex items-center">
                  <input type="checkbox" name="subCapaian" value="Public Speaking" checked={formData.subCapaian.includes('Public Speaking')} onChange={handleSubCapaianChange} className="form-checkbox" />
                  <span className="ml-2 text-sm text-[#333]">Public Speaking</span>
                </label>
                <label className="inline-flex items-center">
                  <input type="checkbox" name="subCapaian" value="Leadership" checked={formData.capaian.includes('Leadership')} onChange={handleSubCapaianChange} className="form-checkbox" />
                  <span className="ml-2 text-sm text-[#333]">Leadership</span>
                </label>
                <label className="inline-flex items-center">
                  <input type="checkbox" name="subCapaian" value="Presentasi" checked={formData.capaian.includes('Presentasi')} onChange={handleSubCapaianChange} className="form-checkbox" />
                  <span className="ml-2 text-sm text-[#333]">Presentasi</span>
                </label>
                <label className="inline-flex items-center">
                  <input type="checkbox" name="subCapaian" value="Negosiasi & Diplomasi" checked={formData.capaian.includes('Negosiasi & Diplomasi')} onChange={handleSubCapaianChange} className="form-checkbox" />
                  <span className="ml-2 text-sm text-[#333]">Negosiasi & Diplomasi</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black">Bobot Persentase Sub Capaian<span className="text-red-500">*</span></label>
              <div className="mt-1 space-y-2">
                {formData.subCapaian.includes('Public Speaking') && (
                  <div>
                    <label htmlFor="bobotPublicSpeaking" className="block text-xs text-[#616161]">Public Speaking</label>
                    <input
                      type="number"
                      id="bobotPublicSpeaking"
                      name="bobotPublicSpeaking"
                      value={formData.bobotPublicSpeaking}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-2 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
                    />
                  </div>
                )}
                {formData.subCapaian.includes('Leadership') && (
                  <div>
                    <label htmlFor="bobotLeadership" className="block text-xs text-[#616161]">Leadership</label>
                    <input
                      type="number"
                      id="bobotLeadership"
                      name="bobotLeadership"
                      value={formData.bobotLeadership}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-2 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
                    />
                  </div>
                )}
                 {formData.subCapaian.includes('Presentasi') && (
                  <div>
                    <label htmlFor="bobotPresentasi" className="block text-xs text-[#616161]">Presentasi</label>
                    <input
                      type="number"
                      id="bobotPresentasi"
                      name="bobotPresentasi"
                      value={formData.bobotPresentasi}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-2 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
                    />
                  </div>
                )}
                 {formData.subCapaian.includes('Negosiasi & Diplomasi') && (
                  <div>
                    <label htmlFor="bobotNegosiasi" className="block text-xs text-[#616161]">Negosiasi & Diplomasi</label>
                    <input
                      type="number"
                      id="bobotNegosiasi"
                      name="bobotNegosiasi"
                      value={formData.bobotNegosiasi}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-2 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
                    />
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-[#616161]">Total bobot sudah mencukup 100 poin</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            onClick={handleSubmit}
            className="rounded-lg bg-green-600 px-8 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-700"
          >
            Kirim ke Admin Ditmawa
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg bg-gray-500 px-8 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-gray-600"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => navigate('/ukmf/daftar-kegiatan')}
            className="rounded-lg bg-red-600 px-8 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700"
          >
            Batal
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-700">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Pastikan informasi sudah benar sebelum dikirim !
        </div>
      </div>
    </DashboardLayout>
  )
}

export default FormBuatKegiatan