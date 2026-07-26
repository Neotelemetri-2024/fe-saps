import { useState, useEffect } from 'react'
import { Search, Filter, UploadCloud, FileText } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import StatusBadge from '../../components/dashboard/StatusBadge'
import { getCurrentUser } from '../../services/authService'
import { klaimPoin, getKlaim, getKegiatanTersediaKlaim } from '../../services/poinService'
import { getPeranKegiatan } from '../../services/matriksService'

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
      row.status === 'ditolak' || row.status === 'Ditolak' ? (
        <button
          type="button"
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
  partisipasiId: '',
  kategoriId: '',
  peranUsulanId: '',
  buktiDokumen: null,
}

function mapRiwayat(item, i) {
  return {
    no: i + 1,
    id: item.id,
    kegiatan: item.namaKegiatan || item.kegiatan || '-',
    jenis: item.jenisKegiatan || item.jenis || '-',
    peran: item.peran || '-',
    penyelenggara: item.penyelenggara || '-',
    tanggal: item.tanggalPelaksanaan
      ? new Date(item.tanggalPelaksanaan).toLocaleDateString('id-ID')
      : item.tanggal || '-',
    skala: item.skala || '-',
    status: String(item.status || 'pending').toLowerCase(),
    alasan: item.alasan || null,
  }
}

function KlaimPoinCapaian() {
  const user = getCurrentUser()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [formData, setFormData] = useState(emptyForm)
  const [tersedia, setTersedia] = useState([])
  const [peranList, setPeranList] = useState([])

  const selectedKegiatan = tersedia.find((t) => String(t.partisipasiId) === String(formData.partisipasiId))

  const loadRiwayat = () => {
    getKlaim()
      .then((res) => setData((Array.isArray(res) ? res : []).map(mapRiwayat)))
      .catch(() => setData([]))
  }

  useEffect(() => {
    loadRiwayat()
  }, [])

  useEffect(() => {
    if (!showForm) return
    getKegiatanTersediaKlaim()
      .then((list) => setTersedia(Array.isArray(list) ? list : []))
      .catch(() => setTersedia([]))
  }, [showForm])

  useEffect(() => {
    const kategoriId = selectedKegiatan?.kategoriId || formData.kategoriId
    if (!kategoriId) {
      setPeranList([])
      return
    }
    getPeranKegiatan(kategoriId)
      .then((peran) => setPeranList(Array.isArray(peran) ? peran : []))
      .catch(() => setPeranList([]))
  }, [selectedKegiatan?.kategoriId, formData.kategoriId])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'partisipasiId') {
      const found = tersedia.find((t) => String(t.partisipasiId) === String(value))
      setFormData((prev) => ({
        ...prev,
        partisipasiId: value,
        kategoriId: found?.kategoriId || '',
        peranUsulanId: '',
      }))
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.partisipasiId || !formData.peranUsulanId || !formData.buktiDokumen) {
      toast.error('Lengkapi kegiatan, peran, dan bukti PDF')
      return
    }
    setLoading(true)
    try {
      await klaimPoin({
        partisipasiId: formData.partisipasiId,
        peranUsulanId: formData.peranUsulanId,
        bukti: formData.buktiDokumen,
      })
      toast.success('Berhasil!', { description: 'Klaim poin berhasil diajukan dan akan diverifikasi.' })
      setFormData(emptyForm)
      setShowForm(false)
      loadRiwayat()
    } catch (err) {
      toast.error('Gagal', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => setFormData(emptyForm)
  const handleBatal = () => {
    setFormData(emptyForm)
    setShowForm(false)
  }

  const inputCls =
    'mt-1 block w-full rounded-lg border border-[#d1d5db] p-3 text-sm text-[#333] outline-none focus:border-brand-dark'
  const selectCls = `${inputCls} disabled:cursor-not-allowed disabled:bg-[#f5f5f5] disabled:text-[#aaa]`

  return (
    <DashboardLayout
      role="mahasiswa"
      userName={user?.nama || user?.name || 'Mahasiswa'}
      userRole="Mahasiswa"
    >
      <div className="space-y-6">
        {showForm ? (
          <div>
            <h2 className="text-xl font-extrabold text-brand-dark sm:text-2xl">
              Klaim Poin Capaian Kegiatan Eksternal (Luar Unand)
            </h2>
            <p className="mt-1 text-sm text-[#616161]">
              Pilih kegiatan eksternal yang sudah disetujui dan diizinkan PA
            </p>

            <form onSubmit={handleSubmit} className="mt-5">
              <div className="space-y-5 rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
                <div>
                  <label className="block text-sm font-medium text-[#222]">
                    Kegiatan siap diklaim<span className="text-red-500">*</span>
                  </label>
                  <select
                    name="partisipasiId"
                    value={formData.partisipasiId}
                    onChange={handleChange}
                    className={selectCls}
                    required
                  >
                    <option value="">-- pilih kegiatan --</option>
                    {tersedia.map((k) => (
                      <option key={k.partisipasiId} value={k.partisipasiId}>
                        {k.namaKegiatan} ({k.jenisKegiatan || '-'})
                      </option>
                    ))}
                  </select>
                  {tersedia.length === 0 && (
                    <p className="mt-1 text-xs text-[#9aa0a6]">
                      Belum ada kegiatan yang bisa diklaim. Pastikan pengajuan eksternal & izin PA sudah
                      disetujui.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#222]">
                    Peran dalam Kegiatan<span className="text-red-500">*</span>
                  </label>
                  <select
                    name="peranUsulanId"
                    value={formData.peranUsulanId}
                    onChange={handleChange}
                    disabled={!formData.partisipasiId}
                    className={selectCls}
                    required
                  >
                    <option value="">
                      {formData.partisipasiId ? '--pilih peran--' : 'Pilih kegiatan terlebih dahulu'}
                    </option>
                    {peranList.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.nama || opt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#222]">
                    Unggah Sertifikat / Bukti Dokumen <span className="text-red-500">*</span>
                    <span className="ml-1 text-xs font-normal text-[#888]">(PDF · maks 10 MB)</span>
                  </label>
                  <div
                    className="mt-1 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#d1d5db] bg-[#fafafa] px-6 py-10 transition hover:border-brand-dark hover:bg-green-50"
                    onClick={() => document.getElementById('klaim-file-upload')?.click()}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e9ebf8]">
                      {formData.buktiDokumen ? (
                        <FileText className="h-6 w-6 text-brand-dark" />
                      ) : (
                        <UploadCloud className="h-6 w-6 text-[#9aa0a6]" />
                      )}
                    </div>
                    {formData.buktiDokumen ? (
                      <p className="text-sm font-semibold text-brand-dark">{formData.buktiDokumen.name}</p>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-[#333]">
                          Klik untuk unggah atau seret berkas ke sini
                        </p>
                        <p className="text-xs text-[#888]">Mendukung format PDF (Maks. 10MB)</p>
                      </>
                    )}
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
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-extrabold text-brand-dark sm:text-2xl">Klaim Poin Capaian</h2>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="w-full rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 sm:w-auto"
              >
                + Tambah Klaim Poin
              </button>
            </div>

            <div className="rounded-xl border border-[#e9ebf8] bg-white p-3 shadow-sm sm:p-6">
              <h3 className="text-base font-bold text-brand-dark">Klaim Poin Anda</h3>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-lg border border-[#e9ebf8] px-3 py-2">
                  <Search className="h-4 w-4 shrink-0 text-[#9aa0a6]" />
                  <input type="text" placeholder="Cari kegiatan..." className="flex-1 text-sm outline-none" />
                </div>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <Filter className="h-4 w-4" /> Filter
                </button>
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
