import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DatePickerInput from '../../components/ui/DatePickerInput'

const JENIS_OPTIONS = [
  { value: 'seminar', label: 'Seminar' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'organisasi', label: 'Organisasi' },
  { value: 'pelatihan', label: 'Pelatihan' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'kompetisi', label: 'Kompetisi' },
  { value: 'lainnya', label: 'Lainnya' },
]

const SKALA_OPTIONS = [
  { value: 'internasional', label: 'Internasional' },
  { value: 'nasional', label: 'Nasional' },
  { value: 'regional', label: 'Regional' },
  { value: 'lokal', label: 'Internal (UNAND)' },
]

function BuatEvent() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    namaKegiatan: '',
    jenis: '',
    skala: '',
    deskripsi: '',
    tanggalMulai: null,
    tanggalSelesai: null,
    lokasi: '',
    kuota: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.namaKegiatan || !form.jenis || !form.skala || !form.deskripsi || !form.tanggalMulai || !form.lokasi || !form.kuota) {
      toast.error('Lengkapi semua field yang wajib diisi.')
      return
    }
    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 500))
      toast.success('Event berhasil dibuat!', {
        description: `Event "${form.namaKegiatan}" telah dipublikasikan.`,
      })
      navigate('/admin-ditmawa/dashboard')
    } catch (err) {
      toast.error('Gagal membuat event', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout role="admin-ditmawa" userName="Dr. Efa Yonnedi, SE. MPPM, Akt, CA, CRGP" userRole="Dosen Pembimbing">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-dark hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-brand-dark">Buat Event</h2>
          <p className="mt-1 text-sm text-[#616161]">Isi detail kegiatan dan publikasikan untuk mahasiswa.</p>
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <p className="text-sm text-[#616161]">Lengkapi informasi kegiatan terlebih dahulu</p>

            <ol className="list-decimal pl-5 text-base font-semibold text-black">
              <li>Informasi Kegiatan</li>
            </ol>

            {/* Nama Kegiatan */}
            <div>
              <label className="block text-sm font-medium text-black">
                Nama Kegiatan <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="namaKegiatan"
                value={form.namaKegiatan}
                onChange={handleChange}
                placeholder="masukkan nama kegiatan..."
                className="mt-1 w-full rounded-lg border border-[#c4c6cf] bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-brand-dark"
                required
              />
            </div>

            {/* Jenis Kegiatan */}
            <div>
              <label className="block text-sm font-medium text-black">
                Jenis Kegiatan <span className="text-red-600">*</span>
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {JENIS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, jenis: opt.value }))}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                      form.jenis === opt.value
                        ? 'border-brand-dark bg-gradient-to-r from-brand-dark to-brand-light text-white'
                        : 'border-[#8e98a8] text-[#8e98a8] hover:border-brand-dark'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Skala Kegiatan */}
            <div>
              <label className="block text-sm font-medium text-black">
                Skala Kegiatan <span className="text-red-600">*</span>
              </label>
              <select
                name="skala"
                value={form.skala}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-[#c4c6cf] bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-brand-dark"
                required
              >
                <option value="">Pilih skala kegiatan</option>
                {SKALA_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Deskripsi */}
            <div>
              <label className="block text-sm font-medium text-black">
                Deskripsi Kegiatan <span className="text-red-600">*</span>
              </label>
              <textarea
                name="deskripsi"
                value={form.deskripsi}
                onChange={handleChange}
                placeholder="tujuan, agenda, dan manfaat kegiatan..."
                rows={4}
                maxLength={500}
                className="mt-1 w-full rounded-lg border border-[#c4c6cf] bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-brand-dark"
              />
              <p className="mt-1 text-right text-xs text-[#8e98a8]">{form.deskripsi.length}/500</p>
            </div>

            {/* Tanggal Mulai & Selesai */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DatePickerInput
                label="Tanggal Mulai"
                value={form.tanggalMulai}
                onChange={(date) => setForm((prev) => ({ ...prev, tanggalMulai: date }))}
                required
                placeholder="Pilih tanggal"
              />
              <DatePickerInput
                label="Tanggal Selesai"
                value={form.tanggalSelesai}
                onChange={(date) => setForm((prev) => ({ ...prev, tanggalSelesai: date }))}
                placeholder="Pilih tanggal"
              />
            </div>

            {/* Lokasi & Kuota */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-black">
                  Lokasi <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="lokasi"
                  value={form.lokasi}
                  onChange={handleChange}
                  placeholder="Gedung / tempat kegiatan..."
                  className="mt-1 w-full rounded-lg border border-[#c4c6cf] bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-brand-dark"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black">
                  Kuota Peserta <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  name="kuota"
                  value={form.kuota}
                  onChange={handleChange}
                  placeholder="Masukkan jumlah peserta"
                  min={1}
                  className="mt-1 w-full rounded-lg border border-[#c4c6cf] bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-brand-dark"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-8 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
              >
                {loading ? 'Menyimpan...' : 'Publikasikan Event'}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-lg border border-brand-dark px-8 py-2.5 text-sm font-semibold text-brand-dark transition hover:bg-green-50"
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

export default BuatEvent
