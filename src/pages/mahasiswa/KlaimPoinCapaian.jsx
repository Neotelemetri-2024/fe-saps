import React, { useState } from 'react'
import { Search, Filter, PlusCircle, UploadCloud } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import StatusBadge from '../../components/dashboard/StatusBadge'
import Modal from '../../components/ui/Modal'
import DatePickerInput from '../../components/ui/DatePickerInput'

const pengajuanData = [
  { no: 1, kegiatan: 'SEMINAR AI & TEKNOLOGI', jenis: 'Kompetisi', peran: 'Peserta', penyelenggara: 'Hima FTI UNAND', tanggal: '12 Feb - 15 Feb 2026', skala: 'Nasional', status: 'pending' },
  { no: 2, kegiatan: 'SEMINAR AI & TEKNOLOGI', jenis: 'Kompetisi', peran: 'Peserta', penyelenggara: 'Hima FTI UNAND', tanggal: '12 Feb - 15 Feb 2026', skala: 'Nasional', status: 'pending' },
  { no: 3, kegiatan: 'SEMINAR AI & TEKNOLOGI', jenis: 'Kompetisi', peran: 'Peserta', penyelenggara: 'Hima FTI UNAND', tanggal: '12 Feb - 15 Feb 2026', skala: 'Nasional', status: 'ditolak', alasan: 'Bukti tidak relevan. Silakan upload bukti yang sesuai.' },
]

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
          onClick={() =>
            toast.info('Alasan Penolakan', {
              description: row.alasan,
            })
          }
          className="text-sm font-medium text-red-600 underline hover:text-red-800"
        >
          Lihat Alasan
        </button>
      ) : (
        <span className="text-gray-400">-</span>
      ),
  },
]

function KlaimPoinCapaian() {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    jenisKegiatan: '',
    namaKegiatan: '',
    peranKegiatan: '',
    skalaKegiatan: '',
    tanggalPelaksanaan: null,
    buktiDokumen: null,
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
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
  }

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, tanggalPelaksanaan: date }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Form Submitted:', formData)
    toast.success('Berhasil!', {
      description: 'Klaim poin berhasil diajukan dan akan diverifikasi.',
    })
    setShowModal(false)
    setFormData({
      jenisKegiatan: '',
      namaKegiatan: '',
      peranKegiatan: '',
      skalaKegiatan: '',
      tanggalPelaksanaan: null,
      buktiDokumen: null,
    })
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

  const handleClose = () => {
    setShowModal(false)
    handleReset()
  }

  return (
    <DashboardLayout role="mahasiswa" userName="Amara Marshinta" userRole="Mahasiswa">
      <Modal isOpen={showModal} onClose={handleClose} title="Klaim Poin Capaian">
        <p className="mb-6 text-sm text-[#616161]">Pilih kegiatan yang akan diajukan untuk klaim poin</p>
        <form onSubmit={handleSubmit} className="space-y-6">
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

          <DatePickerInput
            label="Tanggal Pelaksanaan"
            value={formData.tanggalPelaksanaan}
            onChange={handleDateChange}
            required
            placeholder="--pilih tanggal kegiatan--"
          />

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
                    toast.error('Gagal', { description: 'File harus PDF maksimal 10 MB.' })
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
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>

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
              onClick={handleClose}
              className="flex-1 rounded-xl border border-brand-dark px-6 py-3 text-brand-dark font-semibold shadow-md transition hover:bg-brand-light hover:text-white"
            >
              Batal
            </button>
          </div>
        </form>
      </Modal>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-brand-dark">Klaim Poin Capaian</h2>
        
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-xl bg-brand-dark px-6 py-3 text-white font-semibold shadow-md transition hover:opacity-90">
          <PlusCircle className="h-5 w-5" /> Tambah Klaim Poin
        </button>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-brand-dark">Klaim Poin Anda</h3>
          
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#e9ebf8] px-4 py-2">
              <Search className="h-4 w-4 text-[#616161]" />
              <input
                type="text"
                placeholder="Cari kegiatan..."
                className="flex-1 text-sm outline-none"
              />
            </div>
            <button className="flex items-center gap-2 rounded-lg bg-brand-light px-4 py-2 text-sm font-medium text-white transition hover:opacity-90">
              <Filter className="h-4 w-4" />
              Filter
            </button>
            
            <select className="rounded-lg border border-[#e9ebf8] px-4 py-2 text-sm text-[#333] outline-none">
              <option>Kategori</option>
            </select>
            <select className="rounded-lg border border-[#e9ebf8] px-4 py-2 text-sm text-[#333] outline-none">
              <option>Peran</option>
            </select>
            <select className="rounded-lg border border-[#e9ebf8] px-4 py-2 text-sm text-[#333] outline-none">
              <option>Status</option>
            </select>
            <select className="rounded-lg border border-[#e9ebf8] px-4 py-2 text-sm text-[#333] outline-none">
              <option>Penyelenggara</option>
            </select>
            <select className="rounded-lg border border-[#e9ebf8] px-4 py-2 text-sm text-[#333] outline-none">
              <option>Tahun</option>
            </select>
            <button className="text-sm font-medium text-[#616161] hover:underline">Reset Filter</button>
          </div>

          <div className="mt-6">
            <DataTable columns={columns} data={pengajuanData} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default KlaimPoinCapaian