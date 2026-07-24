import React, { useState, useEffect } from 'react'
import { PlusCircle, Search, Filter } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import StatusBadge from '../../components/dashboard/StatusBadge'
import Modal from '../../components/ui/Modal'
import DatePickerInput from '../../components/ui/DatePickerInput'
import { mintaPersetujuanDosen, getPersetujuanDosen, subscribeDataUpdate } from '../../services/pengajuanService'

function formatTanggal(value) {
  if (!value) return '-'
  if (typeof value === 'string') return value
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }
  return String(value)
}

const labelMap = {
  prestasi: 'Prestasi/Kompetisi',
  organisasi: 'Organisasi/Volunteer',
  pelatihan: 'Pelatihan/Seminar',
  juara1: 'Juara 1 / Emas',
  juara2: 'Juara 2 / Perak',
  juara3: 'Juara 3 / Perunggu',
  finalis: 'Penghargaan / Finalis / Peserta',
  ketua_umum: 'Ketua Umum / Presiden Mahasiswa',
  pengurus_inti: 'Pengurus Inti',
  anggota_aktif: 'Anggota Aktif / Staff',
  ketua_panitia: 'Ketua Panitia / Pelaksana Event',
  pembicara: 'Pembicara / Narasumber / Fasilitator',
  moderator: 'Moderator / Panitia Eksekutif',
  peserta_terstruktur: 'Peserta Pelatihan Terstruktur',
  peserta_umum: 'Peserta Pelatihan Umum / Webinar',
}

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

function formatLabel(value) {
  return labelMap[value] || value || '-'
}

function mapPersetujuanRows(items) {
  return items.map((item, i) => ({
    ...item,
    no: i + 1,
    jenis: formatLabel(item.jenis),
    peran: formatLabel(item.peran),
    tanggal: formatTanggal(item.tanggal),
  }))
}

const columns = [
  { key: 'no', label: 'NO' },
  { key: 'kegiatan', label: 'KEGIATAN' },
  { key: 'jenis', label: 'JENIS' },
  { key: 'peran', label: 'PERAN' },
  { key: 'penyelenggara', label: 'PENYELENGGARA' },
  { key: 'tanggal', label: 'TANGGAL' },
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
      ) : row.status === 'disetujui' ? (
        <span className="text-sm font-medium text-green-600">Disetujui Dosen PA</span>
      ) : (
        <span className="text-gray-400">-</span>
      ),
  },
]

function PersetujuanDosen() {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [formData, setFormData] = useState({
    jenisKegiatan: '',
    namaKegiatan: '',
    penyelenggara: '',
    peranPencapaian: '',
    tanggalPelaksanaan: null,
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
      await mintaPersetujuanDosen({
        kegiatan: formData.namaKegiatan,
        jenis: formData.jenisKegiatan,
        peran: formData.peranPencapaian,
        penyelenggara: formData.penyelenggara,
        tanggal: formatTanggal(formData.tanggalPelaksanaan),
      })
      toast.success('Berhasil!', {
        description: 'Permohonan terkirim ke Dosen PA. Login sebagai dosen untuk melihatnya.',
      })
      setShowModal(false)
      setFormData({ jenisKegiatan: '', namaKegiatan: '', penyelenggara: '', peranPencapaian: '', tanggalPelaksanaan: null })
      const res = await getPersetujuanDosen()
      setData(mapPersetujuanRows(res))
    } catch (err) {
      toast.error('Gagal', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const load = () => {
      getPersetujuanDosen()
        .then((res) => setData(mapPersetujuanRows(res)))
        .catch((err) => toast.error('Gagal memuat data', { description: err.message }))
    }
    load()
    return subscribeDataUpdate(load)
  }, [])

  const handleClose = () => {
    setShowModal(false)
    setFormData({
      jenisKegiatan: '',
      namaKegiatan: '',
      penyelenggara: '',
      peranPencapaian: '',
      tanggalPelaksanaan: null,
    })
  }

  return (
    <DashboardLayout role="mahasiswa" userName="Amara Marshinta" userRole="Mahasiswa">
      <Modal isOpen={showModal} onClose={handleClose} size="3xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="modalJenisKegiatan" className="block text-sm font-medium text-black">
              Jenis Kegiatan<span className="text-red-500">*</span>
            </label>
            <select
              id="modalJenisKegiatan"
              name="jenisKegiatan"
              value={formData.jenisKegiatan}
              onChange={handleChange}
              className="mt-1 block w-full rounded-xl border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
              required
            >
              <option value="">Masukkan jenis kegiatan</option>
              <option value="prestasi">Prestasi/Kompetisi</option>
              <option value="organisasi">Organisasi/Volunteer</option>
              <option value="pelatihan">Pelatihan/Seminar</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                placeholder="Masukkan nama kegiatan"
                className="mt-1 block w-full rounded-xl border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
                required
              />
            </div>
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
                placeholder="Masukkan penyelenggara"
                className="mt-1 block w-full rounded-xl border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
                required
              />
            </div>
          </div>

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
                disabled={!formData.jenisKegiatan}
                className="mt-1 block w-full rounded-xl border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark disabled:cursor-not-allowed disabled:bg-[#f5f5f5] disabled:text-[#aaa]"
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

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-gradient-to-r from-brand-dark to-brand-light px-6 py-3 text-white font-semibold shadow-md transition hover:opacity-90"
            >
              {loading ? 'Mengirim...' : 'Minta Persetujuan Dosen PA'}
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
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-brand-dark">Persetujuan Dosen PA</h2>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-dark to-brand-light px-6 py-3 text-white font-semibold shadow-md transition hover:opacity-90"
          >
            <PlusCircle className="h-5 w-5" /> Minta Persetujuan
          </button>
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-brand-dark">Kegiatan yang telah di ajukan ke Dosen PA</h3>
          
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#e9ebf8] px-4 py-2">
              <Search className="h-4 w-4 text-[#616161]" />
              <input
                type="text"
                placeholder="Cari kegiatan..."
                className="flex-1 text-sm outline-none"
              />
            </div>
            <button className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
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
            <DataTable columns={columns} data={data} />
          </div>
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-2 text-lg font-bold text-brand-dark">Catatan Dosen PA</h3>
          <p className="text-sm text-[#616161]">Dr. Eka Wahyuni, SE, MPPM, Akt, CA, CRGP</p>
          
          <div className="mt-4 space-y-3">
            <div className="rounded-lg bg-[#f9fafb] p-3">
              <p className="text-sm text-[#333]">"Tingkatkan capaian Social Contribution. Segera ikuti KKN dan kegiatan bakti sebelum akhir semester ini. Progress akademik sudah sangat baik, pertahankan IPK anda."</p>
              <p className="mt-1 text-xs text-[#616161]">Selasa, 4 Feb 2025, 15:37</p>
            </div>
            <div className="rounded-lg bg-[#f9fafb] p-3">
              <p className="text-sm text-[#333]">Ikuti good laboratory practices untuk meningkatkan skill SOP dalam labor</p>
              <p className="mt-1 text-xs text-[#616161]">Selasa, 4 Feb 2025, 15:37</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PersetujuanDosen