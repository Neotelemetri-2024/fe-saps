import React, { useState } from 'react'
import Swal from 'sweetalert2'
import DatePickerInput from '../ui/DatePickerInput'

function AjukanPersetujuanDosenModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    jenisKegiatan: '',
    namaKegiatan: '',
    penyelenggara: '',
    peranPencapaian: '',
    tanggalPelaksanaan: null,
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, tanggalPelaksanaan: date }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Logic for sending the form to the backend
    Swal.fire({
      icon: 'success',
      title: 'Berhasil!',
      text: 'Permohonan persetujuan dosen berhasil dikirim.',
      confirmButtonColor: '#1C4122',
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg">
        <h3 className="mb-6 text-lg font-bold text-brand-dark">Permohonan Persetujuan Dosen PA</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Jenis Kegiatan */}
          <div>
            <label htmlFor="modalJenisKegiatan" className="block text-sm font-medium text-black">
              Jenis Kegiatan<span className="text-red-500">*</span>
            </label>
            <select
              id="modalJenisKegiatan"
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

          {/* Nama Kegiatan */}
          <div>
            <label htmlFor="modalNamaKegiatan" className="block text-sm font-medium text-black">
              Nama Kegiatan<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="modalNamaKegiatan"
              name="namaKegiatan"
              value={formData.namaKegiatan}
              onChange={handleChange}
              placeholder="masukkan nama kegiatan"
              className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
              required
            />
          </div>

          {/* Penyelenggara */}
          <div>
            <label htmlFor="modalPenyelenggara" className="block text-sm font-medium text-black">
              Penyelenggara<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="modalPenyelenggara"
              name="penyelenggara"
              value={formData.penyelenggara}
              onChange={handleChange}
              placeholder="masukkan penyelenggara"
              className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
              required
            />
          </div>

          {/* Peran atau Pencapaian & Tanggal Pelaksanaan */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="modalPeranPencapaian" className="block text-sm font-medium text-black">
                Peran atau Pencapaian<span className="text-red-500">*</span>
              </label>
              <select
                id="modalPeranPencapaian"
                name="peranPencapaian"
                value={formData.peranPencapaian}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
                required
              >
                <option value="">masukkan peran</option>
                <option value="ketua">Ketua</option>
                <option value="anggota">Anggota</option>
                <option value="peserta">Peserta</option>
                <option value="juara1">Juara 1</option>
                <option value="juara2">Juara 2</option>
                <option value="juara3">Juara 3</option>
              </select>
            </div>
            <div>
              <DatePickerInput
                label="Tanggal Pelaksanaan"
                value={formData.tanggalPelaksanaan}
                onChange={handleDateChange}
                required
                placeholder="Pilih tanggal"
              />
            </div>
          </div>

          {/* Form Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-brand-dark px-6 py-3 text-white font-semibold shadow-md transition hover:opacity-90"
            >
              Minta Persetujuan Dosen PA
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

export default AjukanPersetujuanDosenModal