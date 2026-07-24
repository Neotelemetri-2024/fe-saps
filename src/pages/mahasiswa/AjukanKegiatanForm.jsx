import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { CheckCircle } from 'lucide-react'
import DatePickerInput from '../../components/ui/DatePickerInput'
import { ajukanKegiatan } from '../../services/pengajuanService'

const peranOptions = {
  prestasi: [
    { value: 'juara1', label: 'Juara 1 / Emas' },
    { value: 'juara2', label: 'Juara 2 / Perak' },
    { value: 'juara3', label: 'Juara 3 / Perunggu' },
    { value: 'finalis', label: 'Penghargaan / Finalis / Peserta' },
  ],
  organisasi: [
    { value: 'ketua_umum', label: 'Ketua Umum / Presiden Mahasiswa' },
    { value: 'pengurus_inti', label: 'Pengurus Inti (Sekretaris, Bendahara, Kabid)' },
    { value: 'anggota_aktif', label: 'Anggota Aktif / Staff' },
    { value: 'ketua_panitia', label: 'Ketua Panitia / Pelaksana Event' },
  ],
  pelatihan: [
    { value: 'pembicara', label: 'Pembicara / Narasumber / Fasilitator' },
    { value: 'moderator', label: 'Moderator / Panitia Eksekutif' },
    { value: 'peserta_terstruktur', label: 'Peserta Pelatihan Terstruktur' },
    { value: 'peserta_umum', label: 'Peserta Pelatihan Umum / Kuliah Umum / Webinar' },
  ],
}

function AjukanKegiatanForm() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    jenisKegiatan: '',
    namaKegiatan: '',
    penyelenggara: '',
    peranPencapaian: '',
    skalaKegiatan: '',
    tanggalPelaksanaan: null,
    deskripsiKegiatan: '',
    linkWebsite: '',
    emailPenyelenggara: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'jenisKegiatan') {
      setFormData((prev) => ({ ...prev, jenisKegiatan: value, peranPencapaian: '' }))
      return
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, tanggalPelaksanaan: date }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const tanggal =
        formData.tanggalPelaksanaan instanceof Date
          ? formData.tanggalPelaksanaan.toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : formData.tanggalPelaksanaan || '-'

      await ajukanKegiatan({
        kegiatan: formData.namaKegiatan,
        jenis: formData.jenisKegiatan,
        peran: formData.peranPencapaian,
        skala: formData.skalaKegiatan,
        penyelenggara: formData.penyelenggara,
        deskripsi: formData.deskripsiKegiatan,
        linkWebsite: formData.linkWebsite,
        emailPenyelenggara: formData.emailPenyelenggara,
        tanggal,
      })
      toast.success('Berhasil!', {
        description: 'Pengajuan kegiatan berhasil dikirim dan akan ditinjau oleh Admin.',
      })
      navigate('/mahasiswa/kegiatan-eksternal')
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
      penyelenggara: '',
      peranPencapaian: '',
      skalaKegiatan: '',
      tanggalPelaksanaan: '',
      deskripsiKegiatan: '',
      linkWebsite: '',
      emailPenyelenggara: '',
    })
  }

  return (
    <DashboardLayout role="mahasiswa" userName="Amara Marshinta" userRole="Mahasiswa">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-brand-dark">Pengajuan Kegiatan</h2>
        <p className="text-sm text-[#616161]">
          Ajukan kegiatan terbaru yang diikuti mahasiswa
        </p>

        {/* Info Box */}
        <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4 text-green-700">
          <CheckCircle className="h-5 w-5" />
          <p className="text-sm">
            Kegiatan yang belum ada di sistem akan ditinjau oleh Admin. Jika disetujui, kegiatan didaftarkan dan poin ditambahkan otomatis.
          </p>
        </div>

        {/* Detail Kegiatan Baru Form */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-lg font-bold text-brand-dark">Detail Kegiatan Baru</h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Jenis Kegiatan */}
            <div>
              <label htmlFor="jenisKegiatan" className="block text-sm font-medium text-black">
                Jenis Kegiatan<span className="text-red-500">*</span>
              </label>
              <select
                id="jenisKegiatan"
                name="jenisKegiatan"
                value={formData.jenisKegiatan}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
                required
              >
                <option value="">Pilih jenis kegiatan</option>
                <option value="prestasi">Prestasi/Kompetisi</option>
                <option value="organisasi">Organisasi/Volunteer</option>
                <option value="pelatihan">Pelatihan/Seminar</option>
              </select>
            </div>

            {/* Nama Kegiatan & Penyelenggara */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="namaKegiatan" className="block text-sm font-medium text-black">
                  Nama Kegiatan<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="namaKegiatan"
                  name="namaKegiatan"
                  value={formData.namaKegiatan}
                  onChange={handleChange}
                  placeholder="Masukkan nama kegiatan"
                  className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
                  required
                />
              </div>
              <div>
                <label htmlFor="penyelenggara" className="block text-sm font-medium text-black">
                  Penyelenggara<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="penyelenggara"
                  name="penyelenggara"
                  value={formData.penyelenggara}
                  onChange={handleChange}
                  placeholder="Masukkan penyelenggara..."
                  className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
                  required
                />
              </div>
            </div>

            {/* Peran atau Pencapaian & Skala Kegiatan */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="peranPencapaian" className="block text-sm font-medium text-black">
                  Peran atau Pencapaian<span className="text-red-500">*</span>
                </label>
                <select
                  id="peranPencapaian"
                  name="peranPencapaian"
                  value={formData.peranPencapaian}
                  onChange={handleChange}
                  disabled={!formData.jenisKegiatan}
                  className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark disabled:cursor-not-allowed disabled:bg-[#f5f5f5] disabled:text-[#aaa]"
                  required
                >
                  <option value="">
                    {formData.jenisKegiatan ? 'Pilih peran / pencapaian' : 'Pilih jenis kegiatan terlebih dahulu'}
                  </option>
                  {(peranOptions[formData.jenisKegiatan] ?? []).map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {!formData.jenisKegiatan && (
                  <p className="mt-1 text-xs text-[#9aa0a6]">Pilih jenis kegiatan dulu untuk melihat pilihan peran.</p>
                )}
              </div>
              {/* asdasda */}
              <div>
                <label htmlFor="skalaKegiatan" className="block text-sm font-medium text-black">
                  Skala Kegiatan<span className="text-red-500">*</span>
                </label>
                <select
                  id="skalaKegiatan"
                  name="skalaKegiatan"
                  value={formData.skalaKegiatan}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
                  required
                >
                  <option value="">Pilih skala kegiatan</option>
                  <option value="internasional">Internasional</option>
                  <option value="nasional">Nasional</option>
                  <option value="regional">Regional</option>
                  <option value="lokal">Internal (UNAND)</option>
                  
                  
                  
                </select>
              </div>
            </div>

            {/* Tanggal Pelaksanaan */}
            <DatePickerInput
              label="Tanggal Pelaksanaan"
              value={formData.tanggalPelaksanaan}
              onChange={handleDateChange}
              required
              placeholder="Pilih tanggal"
            />
            <p className="mt-1 text-xs text-[#969696]">
              Tanggal harus dalam masa studi aktif anda
            </p>

            {/* Deskripsi Kegiatan */}
            <div>
              <label htmlFor="deskripsiKegiatan" className="block text-sm font-medium text-black">
                Deskripsi Kegiatan
              </label>
              <textarea
                id="deskripsiKegiatan"
                name="deskripsiKegiatan"
                value={formData.deskripsiKegiatan}
                onChange={handleChange}
                rows="3"
                placeholder="Jelaskan peran dan manfaat kegiatan..."
                className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
              ></textarea>
            </div>

            {/* Link Website & Email Penyelenggara */}
            <div>
              <label htmlFor="linkWebsite" className="block text-sm font-medium text-black">
                Link website penyelenggara
              </label>
              <input
                type="url"
                id="linkWebsite"
                name="linkWebsite"
                value={formData.linkWebsite}
                onChange={handleChange}
                placeholder="https://..."
                className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
              />
            </div>
            <div>
              <label htmlFor="emailPenyelenggara" className="block text-sm font-medium text-black">
                Email penyelenggara
              </label>
              <input
                type="email"
                id="emailPenyelenggara"
                name="emailPenyelenggara"
                value={formData.emailPenyelenggara}
                onChange={handleChange}
                placeholder="unand@gmail.com"
                className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
              />
            </div>

            {/* Form Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-brand-dark to-brand-light px-6 py-3 text-white font-semibold shadow-md transition hover:opacity-90"
              >
                Ajukan Sekarang
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl bg-gray-600 px-6 py-3 text-white font-semibold shadow-md transition hover:opacity-90"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => navigate('/mahasiswa/kegiatan-eksternal')}
                className="rounded-xl border border-brand-dark px-6 py-3 text-brand-dark font-semibold shadow-md transition hover:bg-brand-light hover:text-white"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AjukanKegiatanForm