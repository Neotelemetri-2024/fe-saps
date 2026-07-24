import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ChevronDown, MapPin, Users, Calendar, Info } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'

const JENIS_OPTIONS = ['Seminar', 'Workshop', 'Organisasi', 'Pelatihan', 'Volunteer', 'Kompetisi', 'Lainnya']
const SKALA_OPTIONS = ['Lokal', 'Universitas', 'Nasional', 'Internasional']

const CAPAIAN_LIST = [
  { id: 'fondasi', label: 'Fondasi' },
  { id: 'kepemimpinan', label: 'Kepemimpinan' },
  { id: 'komunikasi', label: 'Komunikasi' },
]

const SUB_CAPAIAN_MAP = {
  fondasi: [
    { id: 'public_speaking', label: 'Public Speaking' },
    { id: 'leadership', label: 'Leadership' },
    { id: 'presentasi', label: 'Presentasi' },
    { id: 'negosiasi', label: 'Negosiasi & Diplomasi' },
  ],
  kepemimpinan: [
    { id: 'manajemen_tim', label: 'Manajemen Tim' },
    { id: 'pengambilan_keputusan', label: 'Pengambilan Keputusan' },
  ],
  komunikasi: [
    { id: 'komunikasi_verbal', label: 'Komunikasi Verbal' },
    { id: 'komunikasi_tulis', label: 'Komunikasi Tulis' },
  ],
}

function BuatEvent() {
  const navigate = useNavigate()

  // Section 1
  const [namaKegiatan, setNamaKegiatan] = useState('')
  const [jenisKegiatan, setJenisKegiatan] = useState([])
  const [skala, setSkala] = useState('')
  const [deskripsi, setDeskripsi] = useState('')
  const [tanggalMulai, setTanggalMulai] = useState('')
  const [tanggalSelesai, setTanggalSelesai] = useState('')
  const [lokasi, setLokasi] = useState('')
  const [kuotaPeserta, setKuotaPeserta] = useState('')

  // Section 2
  const [selectedCapaian, setSelectedCapaian] = useState([])
  const [capaianOpen, setCapaianOpen] = useState(false)
  const [selectedSubCapaian, setSelectedSubCapaian] = useState([])
  const [bobotMap, setBobotMap] = useState({})

  // Semua sub capaian yang tersedia berdasarkan capaian terpilih
  const availableSub = selectedCapaian.flatMap((cId) => SUB_CAPAIAN_MAP[cId] ?? [])

  function toggleJenis(j) {
    setJenisKegiatan((prev) =>
      prev.includes(j) ? prev.filter((x) => x !== j) : [...prev, j]
    )
  }

  function toggleCapaian(cId) {
    setSelectedCapaian((prev) => {
      if (prev.includes(cId)) {
        // hapus sub capaian yang termasuk capaian ini
        const removedSubs = (SUB_CAPAIAN_MAP[cId] ?? []).map((s) => s.id)
        setSelectedSubCapaian((sp) => sp.filter((s) => !removedSubs.includes(s)))
        return prev.filter((x) => x !== cId)
      }
      return [...prev, cId]
    })
  }

  function removeCapaian(cId) {
    toggleCapaian(cId)
  }

  function toggleSubCapaian(sId) {
    setSelectedSubCapaian((prev) =>
      prev.includes(sId) ? prev.filter((x) => x !== sId) : [...prev, sId]
    )
  }

  function handleBobot(sId, val) {
    setBobotMap((prev) => ({ ...prev, [sId]: val }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!namaKegiatan || jenisKegiatan.length === 0 || !skala || !tanggalMulai || !lokasi) {
      toast.error('Lengkapi semua field wajib pada Informasi Kegiatan.')
      return
    }
    toast.success('Event berhasil diteruskan ke Pimpinan!')
    navigate('/admin-fakultas/manajemen-event')
  }

  const inputCls = 'w-full rounded-lg border border-[#d1d5db] px-3 py-2.5 text-sm outline-none focus:border-brand-dark focus:ring-1 focus:ring-brand-dark'
  const labelCls = 'mb-1.5 block text-sm font-semibold text-[#333]'

  return (
    <DashboardLayout role="admin-fakultas" userName="Dr. Efa Yonnedi, SE. MPPM, Akt, CA, CRGP" userRole="Dosen Pembimbing">
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-extrabold text-[#222] sm:text-2xl lg:text-3xl">Buat Event Fakultas</h2>
          <p className="mt-1 text-sm text-[#616161]">Isi detail kegiatan dan publikasikan untuk mahasiswa.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ── Section 1: Informasi Kegiatan ── */}
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
            <h3 className="mb-1 text-base font-bold text-[#222]">1. Informasi Kegiatan</h3>
            <p className="mb-5 text-xs text-[#888]">Lengkapi informasi kegiatan terlebih dahulu</p>

            <div className="space-y-5">
              {/* Nama Kegiatan */}
              <div>
                <label className={labelCls}>Nama Kegiatan <span className="text-red-500">*</span></label>
                <input
                  value={namaKegiatan}
                  onChange={(e) => setNamaKegiatan(e.target.value)}
                  placeholder="masukkan nama kegiatan..."
                  className={inputCls}
                />
              </div>

              {/* Jenis Kegiatan — chip toggle */}
              <div>
                <label className={labelCls}>Jenis Kegiatan <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {JENIS_OPTIONS.map((j) => {
                    const active = jenisKegiatan.includes(j)
                    return (
                      <button
                        key={j}
                        type="button"
                        onClick={() => toggleJenis(j)}
                        className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                          active
                            ? 'border-brand-dark bg-brand-dark text-white'
                            : 'border-[#d1d5db] bg-white text-[#444] hover:border-brand-dark hover:text-brand-dark'
                        }`}
                      >
                        {j}
                        {active && <X className="h-3 w-3" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Skala Kegiatan */}
              <div>
                <label className={labelCls}>Skala Kegiatan <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    value={skala}
                    onChange={(e) => setSkala(e.target.value)}
                    className={`${inputCls} appearance-none pr-8`}
                  >
                    <option value=""></option>
                    {SKALA_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0a6]" />
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className={labelCls}>Deskripsi Kegiatan <span className="text-red-500">*</span></label>
                <div className="relative">
                  <textarea
                    value={deskripsi}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) setDeskripsi(e.target.value)
                    }}
                    placeholder="tujuan, agenda, dan manfaat kegiatan."
                    rows={5}
                    className={`${inputCls} resize-none`}
                  />
                  <span className="absolute bottom-2 right-3 text-xs text-[#aaa]">{deskripsi.length}/500</span>
                </div>
              </div>

              {/* Tanggal Mulai + Selesai */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Tanggal Mulai <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="date"
                      value={tanggalMulai}
                      onChange={(e) => setTanggalMulai(e.target.value)}
                      placeholder="Pilih tanggal"
                      className={`${inputCls} pr-9`}
                    />
                    <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0a6]" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Tanggal selesai <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="date"
                      value={tanggalSelesai}
                      onChange={(e) => setTanggalSelesai(e.target.value)}
                      placeholder="Pilih tanggal"
                      className={`${inputCls} pr-9`}
                    />
                    <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0a6]" />
                  </div>
                </div>
              </div>

              {/* Lokasi + Kuota */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Lokasi <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      value={lokasi}
                      onChange={(e) => setLokasi(e.target.value)}
                      placeholder="Gedung/ tempat kegiatan"
                      className={`${inputCls} pr-9`}
                    />
                    <MapPin className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0a6]" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Kuota Peserta <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="number"
                      value={kuotaPeserta}
                      onChange={(e) => setKuotaPeserta(e.target.value)}
                      placeholder="Masukkan jumlah peserta"
                      min="0"
                      className={`${inputCls} pr-9`}
                    />
                    <Users className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0a6]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 2: Pemetaan Capaian Kurikulum ── */}
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
            <h3 className="mb-1 text-base font-bold text-[#222]">2. Pemetaan Capaian Kurikulum</h3>
            <p className="mb-5 text-xs text-[#888]">Tentukan capaian kurikulum yang dicapai melalui kegiatan ini</p>

            <div className="space-y-5">
              {/* Capaian dropdown multi-select */}
              <div>
                <label className={labelCls}>
                  Capaian <span className="text-red-500">*</span>{' '}
                  <span className="text-xs font-normal text-brand-dark">(pilih satu atau lebih)</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setCapaianOpen((v) => !v)}
                    className="flex w-full items-center justify-between rounded-lg border border-[#d1d5db] px-3 py-2.5 text-sm text-[#aaa] outline-none focus:border-brand-dark"
                  >
                    <span className={selectedCapaian.length > 0 ? 'text-[#333]' : ''}>
                      {selectedCapaian.length > 0 ? `${selectedCapaian.length} capaian dipilih` : 'Pilih capaian'}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-[#9aa0a6] transition ${capaianOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {capaianOpen && (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-[#d1d5db] bg-white shadow-lg">
                      {CAPAIAN_LIST.map((c) => (
                        <label key={c.id} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-[#f9fafb]">
                          <input
                            type="checkbox"
                            checked={selectedCapaian.includes(c.id)}
                            onChange={() => toggleCapaian(c.id)}
                            className="h-4 w-4 accent-brand-dark"
                          />
                          <span className="text-sm text-[#333]">{c.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tag capaian terpilih */}
                {selectedCapaian.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedCapaian.map((cId) => {
                      const c = CAPAIAN_LIST.find((x) => x.id === cId)
                      return (
                        <span key={cId} className="inline-flex items-center gap-1.5 rounded-lg border border-brand-dark px-3 py-1 text-xs font-semibold text-brand-dark">
                          {c?.label}
                          <button type="button" onClick={() => removeCapaian(cId)} className="hover:text-red-500">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Sub Capaian checkbox grid */}
              {availableSub.length > 0 && (
                <div>
                  <label className={labelCls}>
                    Sub Capaian <span className="text-red-500">*</span>{' '}
                    <span className="text-xs font-normal text-brand-dark">(pilih satu atau lebih)</span>
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {availableSub.map((sub) => {
                      const checked = selectedSubCapaian.includes(sub.id)
                      return (
                        <label
                          key={sub.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition ${
                            checked
                              ? 'border-brand-dark bg-[#f0faf1]'
                              : 'border-[#d1d5db] bg-white hover:border-brand-dark'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSubCapaian(sub.id)}
                            className="h-4 w-4 accent-brand-dark"
                          />
                          <span className={`text-sm font-medium ${checked ? 'text-brand-dark' : 'text-[#444]'}`}>
                            {sub.label}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Bobot Persentase */}
              {selectedSubCapaian.length > 0 && (
                <div>
                  <label className={labelCls}>Bobot Persentase Sub Capaian <span className="text-red-500">*</span></label>
                  <div className="space-y-2">
                    {selectedSubCapaian.map((sId) => {
                      const sub = availableSub.find((s) => s.id === sId)
                      return (
                        <div key={sId} className="flex items-center gap-4">
                          <span className="w-44 text-sm text-[#555]">{sub?.label}</span>
                          <div className="relative w-32">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={bobotMap[sId] ?? ''}
                              onChange={(e) => handleBobot(sId, e.target.value)}
                              placeholder="0"
                              className="w-full rounded-lg border border-[#d1d5db] py-2 pl-3 pr-8 text-sm outline-none focus:border-brand-dark"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#888]">%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Tombol Aksi ── */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-brand-dark to-brand-light py-3.5 text-sm font-bold text-white hover:opacity-90"
            >
              Teruskan ke Pimpinan
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin-fakultas/manajemen-event')}
              className="w-full rounded-xl border border-[#d1d5db] bg-white py-3.5 text-sm font-semibold text-[#444] hover:bg-[#f5f5f5]"
            >
              Batal
            </button>
          </div>

          {/* Info note */}
          <div className="flex items-center gap-2 rounded-lg border border-[#d1fae5] bg-[#f0fdf4] px-4 py-3">
            <Info className="h-4 w-4 shrink-0 text-brand-dark" />
            <p className="text-xs text-[#555]">Pastikan informasi sudah benar sebelum dikirim !</p>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}

export default BuatEvent
