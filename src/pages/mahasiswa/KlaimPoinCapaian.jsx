import { useState, useEffect } from 'react'
import { Search, Filter, UploadCloud, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import StatusBadge from '../../components/dashboard/StatusBadge'
import DatePickerInput from '../../components/ui/DatePickerInput'
import { klaimPoin, getKlaim } from '../../services/poinService'

const peranOptions = {
  prestasi: [
    { value: 'juara1', label: 'Juara 1 / Emas' },
    { value: 'juara2', label: 'Juara 2 / Perak' },
    { value: 'juara3', label: 'Juara 3 / Perunggu' },
    { value: 'finalis', label: 'Penghargaan / Finalis / Peserta' },
  ],
  kompetisi: [
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
  volunteer: [
    { value: 'ketua_umum', label: 'Ketua Umum / Koordinator' },
    { value: 'pengurus_inti', label: 'Pengurus Inti / Divisi' },
    { value: 'anggota_aktif', label: 'Anggota Aktif / Relawan' },
    { value: 'ketua_panitia', label: 'Ketua Panitia / Pelaksana Event' },
  ],
  pelatihan: [
    { value: 'pembicara', label: 'Pembicara / Narasumber / Fasilitator' },
    { value: 'moderator', label: 'Moderator / Panitia Eksekutif' },
    { value: 'peserta_terstruktur', label: 'Peserta Pelatihan Terstruktur' },
    { value: 'peserta_umum', label: 'Peserta Pelatihan Umum / Kuliah Umum / Webinar' },
  ],
  seminar: [
    { value: 'pembicara', label: 'Pembicara / Narasumber / Fasilitator' },
    { value: 'moderator', label: 'Moderator / Panitia Eksekutif' },
    { value: 'peserta_terstruktur', label: 'Peserta Seminar Terstruktur' },
    { value: 'peserta_umum', label: 'Peserta Seminar / Kuliah Umum / Webinar' },
  ],
}

const columns = [
  { key: 'no', label: 'NO' },
  { key: 'kegiatan', label: 'KEGIATAN' },
  { key: 'jenis', label: 'JENIS' },
  { key: 'peran', label: 'PERAN' },
  { key: 'penyelenggara', label: 'PENYELENGGARA' },
  { key: 'tanggal', label: 'TANGGAL' },
  { key: 'skala', label: 'SKALA' },
  { key: 'status', label: 'STATUS', render: (row) => <StatusBadge status={row.status} /> },
  {
    key: 'aksi',
    label: 'AKSI',
    render: (row) =>
      row.status === 'ditolak' ? (
        <button
          onClick={() => toast.info('Alasan Penolakan', { description: row.alasan })}
          className="text-sm font-medium text-red-600 underline hover:text-red-800"
        >
          Lihat Alasan
        </button>
      ) : (
        <span className="text-gray-400">-</span>
      ),
  },
]

const emptyForm = {
  jenisKegiatan: '',
  namaKegiatan: '',
  peranKegiatan: '',
  tanggalPelaksanaan: null,
  buktiDokumen: null,
}

function KlaimPoinCapaian() {
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [formData, setFormData] = useState(emptyForm)

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'jenisKegiatan') {
      setFormData((prev) => ({ ...prev, jenisKegiatan: value, peranKegiatan: '' }))
      return
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      toast.error('Gagal', { description: 'Hanya file PDF yang diizinkan.' })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Gagal', { description: 'Ukuran file maksimal 10 MB.' })
      return
    }
    setFormData((prev) => ({ ...prev, buktiDokumen: file }))
  }

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, tanggalPelaksanaan: date }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await klaimPoin({
        kegiatan: formData.namaKegiatan,
        jenis: formData.jenisKegiatan,
        peran: formData.peranKegiatan,
        tanggal: formData.tanggalPelaksanaan,
      })
      toast.success('Berhasil!', { description: 'Klaim poin berhasil diajukan dan akan diverifikasi.' })
      setFormData(emptyForm)
      setShowForm(false)
      const res = await getKlaim('mahasiswa')
      setData(res.map((item, i) => ({ no: i + 1, ...item })))
    } catch (err) {
      toast.error('Gagal', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => setFormData(emptyForm)
  const handleBatal = () => { setFormData(emptyForm); setShowForm(false) }

  useEffect(() => {
    getKlaim('mahasiswa')
      .then((res) => setData(res.map((item, i) => ({ no: i + 1, ...item }))))
      .catch(() => {})
  }, [])

  const inputCls = 'mt-1 block w-full rounded-lg border border-[#d1d5db] p-3 text-sm text-[#333] outline-none focus:border-brand-dark'
  const selectCls = `${inputCls} disabled:cursor-not-allowed disabled:bg-[#f5f5f5] disabled:text-[#aaa]`

  return (
    <DashboardLayout role="mahasiswa" userName="Amara Marshinta" userRole="Mahasiswa">
      <div className="space-y-6">
        {/* Form klaim — tampil jika showForm true */}
        {showForm ? (
          <div>
            <h2 className="text-xl font-extrabold text-brand-dark sm:text-2xl">
              Klaim Poin Capaian Kegiatan Eksternal (Luar Unand)
            </h2>
            <p className="mt-1 text-sm text-[#616161]">Pilih kegiatan yang akan diajukan untuk klaim poin</p>

            <form onSubmit={handleSubmit} className="mt-5">
              <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm space-y-5">
                {/* Jenis Kegiatan */}
                <div>
                  <label className="block text-sm font-medium text-[#222]">
                    Jenis Kegiatan<span className="text-red-500">*</span>
                  </label>
                  <select
                    name="jenisKegiatan"
                    value={formData.jenisKegiatan}
                    onChange={handleChange}
                    className={selectCls}
                    required
                  >
                    <option value="">masukkan jenis kegiatan</option>
                    <option value="prestasi">Prestasi/Kompetisi</option>
                    <option value="organisasi">Organisasi/Volunteer</option>
                    <option value="pelatihan">Pelatihan/Seminar</option>                    <option value="seminar">Seminar</option>
                  </select>
                </div>

                {/* Nama Kegiatan */}
                <div>
                  <label className="block text-sm font-medium text-[#222]">
                    nama Kegiatan<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="namaKegiatan"
                    value={formData.namaKegiatan}
                    onChange={handleChange}
                    placeholder="masukkan nama kegiatan"
                    className={inputCls}
                    required
                  />
                </div>

                {/* Peran dalam Kegiatan */}
                <div>
                  <label className="block text-sm font-medium text-[#222]">
                    Peran dalam Kegiatan<span className="text-red-500">*</span>
                  </label>
                  <select
                    name="peranKegiatan"
                    value={formData.peranKegiatan}
                    onChange={handleChange}
                    disabled={!formData.jenisKegiatan}
                    className={selectCls}
                    required
                  >
                    <option value="">
                      {formData.jenisKegiatan ? '--pilih peran--' : 'Pilih jenis kegiatan terlebih dahulu'}
                    </option>
                    {(peranOptions[formData.jenisKegiatan] ?? []).map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {!formData.jenisKegiatan && (
                    <p className="mt-1 text-xs text-[#9aa0a6]">Pilih jenis kegiatan dulu untuk melihat pilihan peran.</p>
                  )}
                </div>

                {/* Tanggal Pelaksanaan */}
                <DatePickerInput
                  label="Tanggal Pelaksanaan"
                  value={formData.tanggalPelaksanaan}
                  onChange={handleDateChange}
                  required
                  placeholder="--pilih tanggal kegiatan--"
                />

                {/* Upload Dokumen */}
                <div>
                  <label className="block text-sm font-medium text-[#222]">
                    Unggah Sertifikat / Bukti Dokumen <span className="text-red-500">*</span>
                    <span className="ml-1 text-xs font-normal text-[#888]">(PDF · maks 10 MB · )</span>
                  </label>
                  <div
                    className="mt-1 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#d1d5db] bg-[#fafafa] px-6 py-10 cursor-pointer transition hover:border-brand-dark hover:bg-green-50"
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-brand-dark', 'bg-green-50') }}
                    onDragLeave={(e) => { e.currentTarget.classList.remove('border-brand-dark', 'bg-green-50') }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.remove('border-brand-dark', 'bg-green-50')
                      const file = e.dataTransfer.files[0]
                      if (file && file.type === 'application/pdf' && file.size <= 10 * 1024 * 1024) {
                        setFormData((prev) => ({ ...prev, buktiDokumen: file }))
                      } else {
                        toast.error('Gagal', { description: 'File harus PDF maksimal 10 MB.' })
                      }
                    }}
                    onClick={() => document.getElementById('klaim-file-upload')?.click()}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e9ebf8]">
                      {formData.buktiDokumen
                        ? <FileText className="h-6 w-6 text-brand-dark" />
                        : <UploadCloud className="h-6 w-6 text-[#9aa0a6]" />}
                    </div>
                    {formData.buktiDokumen ? (
                      <p className="text-sm font-semibold text-brand-dark">{formData.buktiDokumen.name}</p>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-[#333]">Klik untuk unggah atau seret berkas ke sini</p>
                        <p className="text-xs text-[#888]">Mendukung format PDF (Maks. 10MB)</p>
                      </>
                    )}
                    <label
                      htmlFor="klaim-file-upload"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 cursor-pointer rounded-lg border border-[#d1d5db] bg-white px-5 py-1.5 text-sm font-medium text-[#333] hover:bg-[#f5f5f5]"
                    >
                      Choose File
                    </label>
                    <input
                      id="klaim-file-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
              </div>

              {/* Tombol aksi di luar card */}
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60 sm:flex-none sm:px-10"
                >
                  {loading ? 'Mengirim...' : 'Klaim Poin'}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 rounded-lg bg-[#555] py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90 sm:flex-none sm:px-10"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleBatal}
                  className="flex-1 rounded-lg border border-brand-dark py-3 text-sm font-bold text-brand-dark shadow-sm transition hover:bg-brand-dark hover:text-white sm:flex-none sm:px-10"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Halaman daftar klaim */
          <>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-extrabold text-brand-dark sm:text-2xl">Klaim Poin Capaian</h2>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                + Tambah Klaim Poin
              </button>
            </div>

            <div className="rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm sm:p-6">
              <h3 className="text-base font-bold text-brand-dark">Klaim Poin Anda</h3>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="flex flex-1 min-w-[180px] items-center gap-2 rounded-lg border border-[#e9ebf8] px-3 py-2">
                  <Search className="h-4 w-4 shrink-0 text-[#9aa0a6]" />
                  <input type="text" placeholder="Cari kegiatan..." className="flex-1 text-sm outline-none" />
                </div>
                <button className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
                  <Filter className="h-4 w-4" /> Filter
                </button>
                <select className="rounded-lg border border-[#e9ebf8] px-3 py-2 text-sm text-[#333] outline-none">
                  <option>Kategori</option>
                </select>
                <select className="rounded-lg border border-[#e9ebf8] px-3 py-2 text-sm text-[#333] outline-none">
                  <option>Peran</option>
                </select>
                <select className="rounded-lg border border-[#e9ebf8] px-3 py-2 text-sm text-[#333] outline-none">
                  <option>Status</option>
                </select>
                <select className="rounded-lg border border-[#e9ebf8] px-3 py-2 text-sm text-[#333] outline-none">
                  <option>Tahun</option>
                </select>
                <button className="text-sm font-medium text-[#616161] hover:underline">Reset Filter</button>
              </div>

              <div className="mt-6">
                <DataTable columns={columns} data={data} />
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default KlaimPoinCapaian
