import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Download, Upload, Filter, X, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'

const DUMMY_EVENTS = {
  1: { nama: 'Training Andalasian Character', jenis: 'Seminar AI', tanggal: '25 Jun 2026', lokasi: 'Gedung Teknik UNAND' },
  2: { nama: 'Lomba AI & Teknologi', jenis: 'Kompetisi', tanggal: '12 Feb 2026', lokasi: 'ITB, Bandung' },
  default: { nama: 'Training Andalasian Character', jenis: 'Seminar AI', tanggal: '25 Jun 2026', lokasi: 'Gedung Teknik UNAND' },
}

const PERAN_OPTIONS = ['Peserta', 'Panitia', 'Pemateri', 'Ketua Tim', 'Anggota']

const DUMMY_PESERTA = [
  { id: 1, nim: '2311121065', nama: 'Ainun hasnah', fakultas: 'Teknologi Informasi', prodi: 'Sistem Informasi', hadir: false, peran: '' },
  { id: 2, nim: '2311121065', nama: 'Ainun hasnah', fakultas: 'Teknologi Informasi', prodi: 'Sistem Informasi', hadir: false, peran: '' },
  { id: 3, nim: '2311121065', nama: 'Aura Mulya', fakultas: 'Teknologi Informasi', prodi: 'Sistem Informasi', hadir: false, peran: '' },
  { id: 4, nim: '2311121065', nama: 'Ainun hasnah', fakultas: 'Teknologi Informasi', prodi: 'Sistem Informasi', hadir: false, peran: '' },
  { id: 5, nim: '2311121065', nama: 'Ainun hasnah', fakultas: 'Teknologi Informasi', prodi: 'Sistem Informasi', hadir: false, peran: '' },
  { id: 6, nim: '2311121085', nama: 'Ainun hasnah', fakultas: 'Teknologi Informasi', prodi: 'Sistem Informasi', hadir: false, peran: '' },
  { id: 7, nim: '2311121085', nama: 'Ainun hasnah', fakultas: 'Teknologi Informasi', prodi: 'Sistem Informasi', hadir: false, peran: '' },
]

function SubmitModal({ isOpen, onConfirm, onClose }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl text-center">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 text-[#999] hover:text-[#333]"><X className="h-4 w-4" /></button>
        <h4 className="mb-2 text-lg font-bold text-[#222]">Submit Kegiatan Peserta</h4>
        <p className="mb-6 text-sm text-[#666]">Submit data untuk mengklaim poin peserta secara otomatik.</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-gradient-to-r from-brand-dark to-brand-light py-3 text-sm font-bold text-white hover:opacity-90"
          >
            SUBMIT
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border-2 border-[#d1d5db] py-3 text-sm font-bold text-[#444] hover:bg-[#f5f5f5]"
          >
            BA<span className="text-brand-dark">TAL</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function ManajemenPesertaEvent() {
  const { id } = useParams()
  const navigate = useNavigate()
  const event = DUMMY_EVENTS[id] ?? DUMMY_EVENTS.default

  const [pesertaList, setPesertaList] = useState(DUMMY_PESERTA)
  const [search, setSearch] = useState('')
  const [filterKehadiran, setFilterKehadiran] = useState('semua')
  const [isEditing, setIsEditing] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const filtered = pesertaList.filter((p) => {
    const matchSearch =
      p.nama.toLowerCase().includes(search.toLowerCase()) ||
      p.nim.includes(search) ||
      p.prodi.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filterKehadiran === 'semua' ||
      (filterKehadiran === 'hadir' && p.hadir) ||
      (filterKehadiran === 'tidak hadir' && !p.hadir)
    return matchSearch && matchFilter
  })

  function toggleHadir(pid) {
    if (!isEditing) return
    setPesertaList((prev) => prev.map((p) => p.id === pid ? { ...p, hadir: !p.hadir } : p))
  }

  function setPilihPeran(pid, peran) {
    if (!isEditing) return
    setPesertaList((prev) => prev.map((p) => p.id === pid ? { ...p, peran } : p))
  }

  function handleSubmitConfirm() {
    setShowSubmitModal(false)
    setIsEditing(false)
    setSubmitted(true)
    toast.success('Data peserta berhasil disubmit! Poin akan diklaim otomatis.')
  }

  function handleResetFilter() {
    setSearch('')
    setFilterKehadiran('semua')
  }

  return (
    <DashboardLayout role="admin-fakultas" userName="Nouval Rafiif Irwan" userRole="Operator UKM">
      <SubmitModal
        isOpen={showSubmitModal}
        onConfirm={handleSubmitConfirm}
        onClose={() => setShowSubmitModal(false)}
      />

      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate('/admin-fakultas/manajemen-event')}
          className="flex items-center gap-1.5 text-sm font-medium text-brand-dark hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Manajemen Event
        </button>

        <div>
          <h2 className="text-xl font-extrabold text-brand-dark sm:text-2xl lg:text-3xl">{event.nama}</h2>
          <p className="mt-1 text-sm text-[#616161]">
            {event.jenis} · {event.tanggal} · {event.lokasi}
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0a6]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari mahasiswa atau kegiatan..."
              className="w-full rounded-lg border border-[#d1d5db] py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-dark"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" className="flex items-center gap-1.5 rounded-lg border border-[#d1d5db] bg-white px-3 py-2 text-xs font-semibold text-[#444] hover:bg-[#f5f5f5]">
              <Filter className="h-3.5 w-3.5" /> Filter
            </button>
          </div>
        </div>

        {/* Filter kehadiran + tombol aksi */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 flex-wrap">
            {['semua', 'hadir', 'tidak hadir'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilterKehadiran(f)}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold capitalize transition ${
                  filterKehadiran === f
                    ? 'bg-gradient-to-r from-brand-dark to-brand-light text-white'
                    : 'border border-[#d1d5db] bg-white text-[#444] hover:bg-[#f5f5f5]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-[#d1d5db] bg-white px-3 py-2 text-xs font-semibold text-[#444] hover:bg-[#f5f5f5]"
            >
              <Download className="h-3.5 w-3.5" /> unduh template
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
            >
              <Upload className="h-3.5 w-3.5" /> Import file
            </button>
            <button
              type="button"
              onClick={handleResetFilter}
              className="flex items-center gap-1.5 rounded-lg border border-[#d1d5db] bg-white px-3 py-2 text-xs font-semibold text-[#444] hover:bg-[#f5f5f5]"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset filter
            </button>
          </div>
        </div>

        {/* Tabel */}
        <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-white">
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">NO</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">NIM</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">NAMA MAHASISWA</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">FAKULTAS</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">PROGRAM STUDI</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">KEHADIRAN</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">PERAN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {filtered.map((p, i) => (
                  <tr key={p.id} className="hover:bg-[#f9fafb]">
                    <td className="px-4 py-3.5 text-[#616161]">{i + 1}</td>
                    <td className="px-4 py-3.5 text-[#616161]">{p.nim}</td>
                    <td className="px-4 py-3.5 font-medium text-[#222]">{p.nama}</td>
                    <td className="px-4 py-3.5 text-[#616161]">{p.fakultas}</td>
                    <td className="px-4 py-3.5 text-[#616161]">{p.prodi}</td>
                    <td className="px-4 py-3.5">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={p.hadir}
                          onChange={() => toggleHadir(p.id)}
                          disabled={!isEditing}
                          className="h-4 w-4 cursor-pointer accent-brand-dark disabled:cursor-default"
                        />
                        <span className="text-xs text-[#616161]">hadir</span>
                      </label>
                    </td>
                    <td className="px-4 py-3.5">
                      <select
                        value={p.peran}
                        onChange={(e) => setPilihPeran(p.id, e.target.value)}
                        disabled={!isEditing}
                        className="rounded border border-[#d1d5db] px-2 py-1 text-xs text-[#444] outline-none focus:border-brand-dark disabled:cursor-default disabled:bg-[#f9fafb] disabled:text-[#999]"
                      >
                        <option value="">Pilih Peran</option>
                        {PERAN_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-[#9aa0a6]">Tidak ada peserta ditemukan.</div>
          )}

          {/* Footer tabel */}
          <div className="flex items-center justify-between border-t border-[#f0f0f0] px-6 py-3">
            <span className="text-xs text-[#888]">
              Showing 1 – 10 from Total {pesertaList.length}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#888]">Page 1 of 2</span>
              {!submitted && !isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
                >
                  Edit
                </button>
              )}
              {!submitted && isEditing && (
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(true)}
                  className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
                >
                  submit untuk Klaim Poin Peserta
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status badge */}
        {submitted && (
          <div className="pt-2">
            <p className="text-sm font-semibold text-[#444]">Status</p>
            <p className="mt-1 text-2xl font-extrabold">
              <span className="text-[#222]">Telah </span>
              <span className="text-brand-dark">Tercatat</span>
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default ManajemenPesertaEvent
