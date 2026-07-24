import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, MapPin, Users, X } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DatePickerInput from '../../components/ui/DatePickerInput'
import { createKegiatan } from '../../services/kegiatanService'

const JENIS_OPTIONS = ['Workshop', 'Seminar', 'Pelatihan', 'Lomba', 'Bakti Sosial', 'Kompetisi']
const SKALA_OPTIONS = ['Fakultas', 'Universitas', 'Nasional', 'Internasional']

const CAPAIAN_LIST = ['Fondasi', 'Penguatan', 'Kemahasiswaan', 'Kepemimpinan']
const SUB_CAPAIAN_LIST = ['Public Speaking', 'Leadership', 'Presentasi', 'Negosiasi & Diplomasi', 'Kerja Tim', 'Inovasi']

const EMPTY_FORM = {
  jenisKegiatan: [],
  namaKegiatan: '',
  skalaKegiatan: '',
  deskripsiKegiatan: '',
  tanggalMulai: null,
  tanggalSelesai: null,
  lokasi: '',
  kuotaPeserta: '',
  capaian: [],
  subCapaian: [],
  bobot: {},
}

function BuatKegiatan() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const totalBobot = Object.values(form.bobot).reduce((s, v) => s + (Number(v) || 0), 0)

  const toggleJenis = (val) => {
    setForm((prev) => ({
      ...prev,
      jenisKegiatan: prev.jenisKegiatan.includes(val)
        ? prev.jenisKegiatan.filter((j) => j !== val)
        : [...prev.jenisKegiatan, val],
    }))
  }

  const toggleCapaian = (val) => {
    setForm((prev) => ({
      ...prev,
      capaian: prev.capaian.includes(val)
        ? prev.capaian.filter((c) => c !== val)
        : [...prev.capaian, val],
    }))
  }

  const toggleSubCapaian = (val) => {
    setForm((prev) => {
      const next = prev.subCapaian.includes(val)
        ? prev.subCapaian.filter((s) => s !== val)
        : [...prev.subCapaian, val]
      const nextBobot = { ...prev.bobot }
      if (!next.includes(val)) delete nextBobot[val]
      return { ...prev, subCapaian: next, bobot: nextBobot }
    })
  }

  const handleBobot = (key, val) => {
    setForm((prev) => ({ ...prev, bobot: { ...prev.bobot, [key]: val } }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.jenisKegiatan.length === 0) {
      toast.error('Pilih minimal satu jenis kegiatan')
      return
    }
    if (form.capaian.length === 0) {
      toast.error('Pilih minimal satu capaian')
      return
    }
    if (form.subCapaian.length === 0) {
      toast.error('Pilih minimal satu sub capaian')
      return
    }
    setLoading(true)
    try {
      await createKegiatan({
        nama: form.namaKegiatan,
        jenis: form.jenisKegiatan.join(', '),
        skala: form.skalaKegiatan,
        deskripsi: form.deskripsiKegiatan,
        tanggal: form.tanggalMulai,
        tgl: form.tanggalMulai,
        lokasi: form.lokasi,
        kuota: form.kuotaPeserta,
      })
      toast.success('Kegiatan berhasil diajukan ke Admin Ditmawa!')
      navigate('/ukm/daftar-kegiatan')
    } catch (err) {
      toast.error('Gagal', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout role="ukm" userName="Nouval Rafiif Irwan" userRole="Operator UKM">
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>

        <div>
          <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Buat Kegiatan</h2>
          <p className="mt-1 text-sm text-[#616161]">
            Isi detail kegiatan dan petakan ke Capaian &amp; Sub Capaian sesuai kurikulum. Kegiatan
            akan diajukan ke Admin Ditmawa sebelum dipublikasikan.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ── Seksi 1: Informasi Kegiatan ── */}
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-brand-dark">1. Informasi Kegiatan</h3>
            <p className="mt-0.5 mb-5 text-sm text-[#616161]">Lengkapi informasi kegiatan terlebih dahulu</p>

            <div className="space-y-5">
              {/* Jenis Kegiatan — multi chip */}
              <div>
                <label className="block text-sm font-medium text-black">
                  Jenis Kegiatan<span className="text-red-500">*</span>
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {JENIS_OPTIONS.map((j) => (
                    <button
                      key={j}
                      type="button"
                      onClick={() => toggleJenis(j)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        form.jenisKegiatan.includes(j)
                          ? 'border-brand-dark bg-brand-dark text-white'
                          : 'border-[#d1d5db] bg-white text-[#444] hover:border-brand-dark'
                      }`}
                    >
                      {j}
                      {form.jenisKegiatan.includes(j) && (
                        <X className="ml-1 inline h-3 w-3" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nama Kegiatan */}
              <div>
                <label className="block text-sm font-medium text-black">
                  Nama Kegiatan<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.namaKegiatan}
                  onChange={(e) => setForm((p) => ({ ...p, namaKegiatan: e.target.value }))}
                  placeholder="Masukkan nama kegiatan..."
                  className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-2.5 text-sm text-[#333] shadow-sm outline-none focus:border-brand-dark"
                  required
                />
              </div>

              {/* Skala Kegiatan */}
              <div>
                <label className="block text-sm font-medium text-black">
                  Skala Kegiatan<span className="text-red-500">*</span>
                </label>
                <select
                  value={form.skalaKegiatan}
                  onChange={(e) => setForm((p) => ({ ...p, skalaKegiatan: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-2.5 text-sm text-[#333] shadow-sm outline-none focus:border-brand-dark"
                  required
                >
                  <option value="">--Pilih skala kegiatan--</option>
                  {SKALA_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-sm font-medium text-black">
                  Deskripsi Kegiatan<span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.deskripsiKegiatan}
                  onChange={(e) => setForm((p) => ({ ...p, deskripsiKegiatan: e.target.value }))}
                  rows={4}
                  placeholder="Tujuan, agenda, dan manfaat kegiatan..."
                  className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-2.5 text-sm text-[#333] shadow-sm outline-none focus:border-brand-dark"
                  maxLength={500}
                  required
                />
                <p className="mt-1 text-right text-xs text-[#616161]">
                  {form.deskripsiKegiatan.length}/500
                </p>
              </div>

              {/* Tanggal */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DatePickerInput
                  label="Tanggal Mulai"
                  selected={form.tanggalMulai}
                  onChange={(d) => setForm((p) => ({ ...p, tanggalMulai: d }))}
                  required
                />
                <DatePickerInput
                  label="Tanggal Selesai"
                  selected={form.tanggalSelesai}
                  onChange={(d) => setForm((p) => ({ ...p, tanggalSelesai: d }))}
                  required
                />
              </div>

              {/* Lokasi + Kuota */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-black">
                    Lokasi<span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      value={form.lokasi}
                      onChange={(e) => setForm((p) => ({ ...p, lokasi: e.target.value }))}
                      placeholder="Gedung / tempat kegiatan"
                      className="block w-full rounded-md border border-[#e9ebf8] p-2.5 pl-9 text-sm text-[#333] shadow-sm outline-none focus:border-brand-dark"
                      required
                    />
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9aa0a6]" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">
                    Kuota Peserta<span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      min={1}
                      value={form.kuotaPeserta}
                      onChange={(e) => setForm((p) => ({ ...p, kuotaPeserta: e.target.value }))}
                      placeholder="Masukkan jumlah peserta"
                      className="block w-full rounded-md border border-[#e9ebf8] p-2.5 pl-9 text-sm text-[#333] shadow-sm outline-none focus:border-brand-dark"
                      required
                    />
                    <Users className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9aa0a6]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Seksi 2: Pemetaan Capaian Kurikulum ── */}
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-brand-dark">2. Pemetaan Capaian Kurikulum</h3>
            <p className="mt-0.5 mb-5 text-sm text-[#616161]">
              Tentukan capaian kurikulum yang dicapai melalui kegiatan ini
            </p>

            <div className="space-y-5">
              {/* Capaian — dropdown + chips */}
              <div>
                <label className="block text-sm font-medium text-black">
                  Capaian<span className="text-red-500">*</span>{' '}
                  <span className="font-normal text-[#616161]">(pilih satu atau lebih)</span>
                </label>
                <select
                  className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-2.5 text-sm text-[#333] shadow-sm outline-none focus:border-brand-dark"
                  onChange={(e) => { if (e.target.value) toggleCapaian(e.target.value) }}
                  value=""
                >
                  <option value="">Pilih capaian</option>
                  {CAPAIAN_LIST.filter((c) => !form.capaian.includes(c)).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {form.capaian.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {form.capaian.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1.5 rounded-full border border-brand-dark bg-white px-3 py-1 text-xs font-medium text-brand-dark"
                      >
                        {c}
                        <button type="button" onClick={() => toggleCapaian(c)}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Sub Capaian — checkbox grid */}
              <div>
                <label className="block text-sm font-medium text-black">
                  Sub Capaian<span className="text-red-500">*</span>{' '}
                  <span className="font-normal text-[#616161]">(pilih satu atau lebih)</span>
                </label>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {SUB_CAPAIAN_LIST.map((s) => {
                    const checked = form.subCapaian.includes(s)
                    return (
                      <label
                        key={s}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition ${
                          checked
                            ? 'border-brand-dark bg-brand-dark/5 font-medium text-brand-dark'
                            : 'border-[#e9ebf8] text-[#444] hover:border-brand-dark/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="accent-brand-dark"
                          checked={checked}
                          onChange={() => toggleSubCapaian(s)}
                        />
                        {s}
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Bobot per sub capaian */}
              {form.subCapaian.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-black">
                    Bobot Persentase Sub Capaian<span className="text-red-500">*</span>
                  </label>
                  <div className="mt-2 space-y-2">
                    {form.subCapaian.map((s) => (
                      <div key={s} className="flex items-center gap-3">
                        <span className="w-40 shrink-0 text-sm text-[#444]">{s}</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={form.bobot[s] ?? ''}
                          onChange={(e) => handleBobot(s, e.target.value)}
                          className="w-24 rounded-md border border-[#e9ebf8] p-2 text-center text-sm text-[#333] shadow-sm outline-none focus:border-brand-dark"
                          placeholder="0"
                        />
                        <span className="text-sm text-[#616161]">%</span>
                      </div>
                    ))}
                  </div>
                  <p className={`mt-2 text-xs font-medium ${totalBobot === 100 ? 'text-emerald-600' : 'text-[#616161]'}`}>
                    Total bobot: {totalBobot}/100 poin
                    {totalBobot === 100 && ' ✓ Sudah mencukupi'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Action buttons ── */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-8 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? 'Mengirim...' : 'Kirim ke Admin Ditmawa'}
            </button>
            <button
              type="button"
              onClick={() => setForm(EMPTY_FORM)}
              className="rounded-lg bg-gray-500 px-8 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-gray-600"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => navigate('/ukm/daftar-kegiatan')}
              className="rounded-lg border border-[#d1d5db] bg-white px-8 py-2.5 text-sm font-bold text-[#444] shadow-sm transition hover:bg-[#f5f5f5]"
            >
              Batal
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-700">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pastikan informasi sudah benar sebelum dikirim!
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}

export default BuatKegiatan
