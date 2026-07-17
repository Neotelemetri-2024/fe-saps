import React, { useState } from 'react'
import Swal from 'sweetalert2'
import { UploadCloud } from 'lucide-react'
import DatePickerInput from '../../components/ui/DatePickerInput'

function KlaimPoinFormModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    jenisKegiatan: '',
    namaKegiatan: '',
    peranKegiatan: '',
    skalaKegiatan: '',
    tanggalPelaksanaan: null,
    buktiDokumen: null, // For file upload
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  const handleFileChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      buktiDokumen: e.target.files[0],
    }))
  }

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, tanggalPelaksanaan: date }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Logic for sending the form to the backend, including file upload
    console.log('Form Submitted:', formData)
    Swal.fire({
      icon: 'success',
      title: 'Berhasil!',
      text: 'Klaim poin berhasil diajukan dan akan diverifikasi.',
      confirmButtonColor: '#1C4122',
    })
    onClose()
  }

  const handleReset = () => {
    setFormData({
      jenisKegiatan: '',
      namaKegiatan: '',
      peranKegiatan: '',
      skalaKegiatan: '',
      tanggalPelaksanaan: null,
      buktiDokumen: null,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-3xl rounded-xl bg-white p-6 shadow-lg">
        <h3 className="mb-6 text-lg font-bold text-brand-dark">Klaim Poin Capaian</h3>
        <p className="mb-6 text-sm text-[#616161]">Pilih kegiatan yang akan diajukan untuk klaim poin</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Jenis Kegiatan & Nama Kegiatan */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="modalKlaimJenisKegiatan" className="block text-sm font-medium text-black">
                Jenis Kegiatan<span className="text-red-500">*</span>
              </label>
              <select
                id="modalKlaimJenisKegiatan"
                name="jenisKegiatan"
                value={formData.jenisKegiatan}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
                required
              >
                <option value="">masukkan jenis kegiatan</option>
                <option value="prestasi">Prestasi</option>
                <option value="kompetisi">Kompetisi</option>
                <option value="organisasi">Organisasi</option>
                <option value="volunteer">Volunteer</option>
                <option value="pelatihan">Pelatihan</option>
                <option value="seminar">Seminar</option>
              </select>
            </div>
            <div>
              <label htmlFor="modalKlaimNamaKegiatan" className="block text-sm font-medium text-black">
                Nama Kegiatan<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="modalKlaimNamaKegiatan"
                name="namaKegiatan"
                value={formData.namaKegiatan}
                onChange={handleChange}
                placeholder="masukkan nama kegiatan"
                className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
                required
              />
            </div>
          </div>

          {/* Peran dalam Kegiatan & Skala */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="modalKlaimPeran" className="block text-sm font-medium text-black">
                Peran dalam Kegiatan<span className="text-red-500">*</span>
              </label>
              <select
                id="modalKlaimPeran"
                name="peranKegiatan"
                value={formData.peranKegiatan}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
                required
              >
                <option value="">--pilih peran--</option>
                <option value="ketua">Ketua</option>
                <option value="anggota">Anggota</option>
                <option value="peserta">Peserta</option>
                <option value="juara1">Juara 1</option>
                <option value="juara2">Juara 2</option>
                <option value="juara3">Juara 3</option>
              </select>
            </div>
            <div>
              <label htmlFor="modalKlaimSkala" className="block text-sm font-medium text-black">
                Skala<span className="text-red-500">*</span>
              </label>
              <select
                id="modalKlaimSkala"
                name="skalaKegiatan"
                value={formData.skalaKegiatan}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
                required
              >
                <option value="">--pilih skala--</option>
                <option value="lokal">Lokal</option>
                <option value="regional">Regional</option>
                <option value="nasional">Nasional</option>
                <option value="internasional">Internasional</option>
              </select>
            </div>
          </div>

          {/* Tanggal Pelaksanaan */}
          <DatePickerInput
            label="Tanggal Pelaksanaan"
            value={formData.tanggalPelaksanaan}
            onChange={handleDateChange}
            required
            placeholder="--pilih tanggal kegiatan--"
          />

          {/* Unggah Sertifikat / Bukti Dokumen */}
          <div>
            <label className="block text-sm font-medium text-black">
              Unggah Sertifikat / Bukti Dokumen <span className="text-red-500">*</span> (PDF - maks 10 MB)
            </label>
            <div
              className="mt-1 flex justify-center rounded-md border-2 border-dashed border-[#e9ebf8] px-6 pt-5 pb-6 cursor-pointer hover:border-brand-dark transition"
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-brand-dark', 'bg-green-50') }}
              onDragLeave={(e) => { e.currentTarget.classList.remove('border-brand-dark', 'bg-green-50') }}
              onDrop={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove('border-brand-dark', 'bg-green-50')
                const file = e.dataTransfer.files[0]
                if (file && file.type === 'application/pdf' && file.size <= 10 * 1024 * 1024) {
                  setFormData((prev) => ({ ...prev, buktiDokumen: file }))
                } else {
                  Swal.fire({ icon: 'error', title: 'Gagal', text: 'File harus PDF maksimal 10 MB.', confirmButtonColor: '#1C4122' })
                }
              }}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <div className="space-y-1 text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-[#969696]" />
                <div className="flex justify-center text-sm text-[#616161]">
                  <span>Klik untuk unggah atau seret berkas ke sini</span>
                </div>
                <p className="text-xs text-[#969696]">Mendukung format PDF (Maks. 10MB)</p>
                {formData.buktiDokumen && (
                  <p className="text-sm font-medium text-brand-dark">{formData.buktiDokumen.name}</p>
                )}
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files[0]
                    if (file) {
                      if (file.type !== 'application/pdf') {
                        Swal.fire({ icon: 'error', title: 'Gagal', text: 'Hanya file PDF yang diizinkan.', confirmButtonColor: '#1C4122' })
                        return
                      }
                      if (file.size > 10 * 1024 * 1024) {
                        Swal.fire({ icon: 'error', title: 'Gagal', text: 'Ukuran file maksimal 10 MB.', confirmButtonColor: '#1C4122' })
                        return
                      }
                      setFormData((prev) => ({ ...prev, buktiDokumen: file }))
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Form Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-brand-dark px-6 py-3 text-white font-semibold shadow-md transition hover:opacity-90"
            >
              Klaim Poin
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 rounded-xl bg-gray-600 px-6 py-3 text-white font-semibold shadow-md transition hover:opacity-90"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-brand-dark px-6 py-3 text-brand-dark font-semibold shadow-md transition hover:bg-brand-light hover:text-white"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default KlaimPoinFormModal