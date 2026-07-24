import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, Pencil, Trash2 } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { toast } from 'sonner'

const DUMMY_EVENTS = [
  { id: 1, kegiatan: 'TAC (Training Andalasian Character)', submitted: 'Selasa, 4 Feb 2025, 15:37', kategori: 'Lomba Hackathon', skala: 'Universitas', tanggal: '12 Feb – 15 Feb 2026', peserta: 1000, poin: 50, status: 'Disetujui Pimpinan' },
  { id: 2, kegiatan: 'TAC (Training Andalasian Character)', submitted: 'Selasa, 4 Feb 2025, 15:37', kategori: 'Lomba Hackathon', skala: 'Universitas', tanggal: '12 Feb – 15 Feb 2026', peserta: 1000, poin: null, status: 'Pending' },
  { id: 3, kegiatan: 'TAC (Training Andalasian Character)', submitted: 'Selasa, 4 Feb 2025, 15:37', kategori: 'Lomba Hackathon', skala: 'Universitas', tanggal: '12 Feb – 15 Feb 2026', peserta: 1000, poin: null, status: 'Pending' },
]

const statusStyle = {
  'Disetujui Pimpinan': 'bg-green-100 text-green-700 border border-green-300',
  Pending: 'bg-yellow-100 text-yellow-600 border border-yellow-300',
  Ditolak: 'bg-red-100 text-red-600 border border-red-300',
  Revisi: 'bg-orange-100 text-orange-600 border border-orange-300',
}

function ManajemenEvent() {
  const navigate = useNavigate()
  const [data, setData] = useState(DUMMY_EVENTS)
  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSkala, setFilterSkala] = useState('')
  const [deleteId, setDeleteId] = useState(null)

  const filtered = data.filter((e) => {
    const q = search.trim().toLowerCase()
    if (q && !e.kegiatan.toLowerCase().includes(q)) return false
    if (filterKategori && e.kategori !== filterKategori) return false
    if (filterStatus && e.status !== filterStatus) return false
    if (filterSkala && e.skala !== filterSkala) return false
    return true
  })

  const resetFilter = () => {
    setSearch('')
    setFilterKategori('')
    setFilterStatus('')
    setFilterSkala('')
  }

  const handleDelete = () => {
    setData((prev) => prev.filter((e) => e.id !== deleteId))
    setDeleteId(null)
    toast.success('Event berhasil dihapus.')
  }

  return (
    <DashboardLayout role="admin-fakultas" userName="Dr. Efa Yonnedi, SE. MPPM, Akt, CA, CRGP" userRole="Dosen Pembimbing">
      <ConfirmModal
        isOpen={deleteId !== null}
        message="Apakah kamu yakin ingin menghapus event ini?"
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-extrabold text-brand-dark sm:text-2xl lg:text-3xl">
            Manejemen Event Fakultas
          </h2>
          <button
            type="button"
            onClick={() => navigate('/admin-fakultas/buat-event')}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 sm:w-auto"
          >
            <Plus className="h-4 w-4" /> Buat event
          </button>
        </div>

        <p className="text-sm text-[#616161]">Event yang telah di buat</p>

        {/* Search + Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0a6]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari mahasiswa atau kegiatan..."
              className="w-full rounded-lg border border-[#d1d5db] py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-dark"
            />
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            <Filter className="h-4 w-4" /> Filter
          </button>
          <select
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            className="rounded-lg border border-[#d9dce7] bg-white px-3 py-2 text-sm text-[#444] outline-none"
          >
            <option value="">Kategori</option>
            {[...new Set(data.map((d) => d.kategori))].map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-[#d9dce7] bg-white px-3 py-2 text-sm text-[#444] outline-none"
          >
            <option value="">Status</option>
            <option value="Pending">Pending</option>
            <option value="Disetujui Pimpinan">Disetujui Pimpinan</option>
            <option value="Ditolak">Ditolak</option>
          </select>
          <select
            value={filterSkala}
            onChange={(e) => setFilterSkala(e.target.value)}
            className="rounded-lg border border-[#d9dce7] bg-white px-3 py-2 text-sm text-[#444] outline-none"
          >
            <option value="">Skala</option>
            {[...new Set(data.map((d) => d.skala))].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select className="rounded-lg border border-[#d9dce7] bg-white px-3 py-2 text-sm text-[#444] outline-none">
            <option>Tahun</option>
            <option>2026</option>
            <option>2025</option>
          </select>
          <button
            onClick={resetFilter}
            className="rounded-lg border border-[#d9dce7] bg-white px-3 py-2 text-sm text-[#616161] hover:bg-[#f5f5f5]"
          >
            Reset filter
          </button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-white">
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">NO</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">NAMA KEGIATAN</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">KATEGORI</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">SKALA</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">TANGGAL</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">PESERTA</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">POIN</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">STATUS</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {filtered.map((event, i) => (
                  <tr key={event.id} className="hover:bg-[#f9fafb]">
                    <td className="px-4 py-3.5 text-[#616161]">{i + 1}.</td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-[#222]">{event.kegiatan}</p>
                      <p className="mt-0.5 text-xs text-[#9aa0a6]">⏱ {event.submitted}</p>
                    </td>
                    <td className="px-4 py-3.5 text-[#616161]">{event.kategori}</td>
                    <td className="px-4 py-3.5 text-[#616161]">{event.skala}</td>
                    <td className="px-4 py-3.5 text-[#616161] whitespace-nowrap">{event.tanggal}</td>
                    <td className="px-4 py-3.5 text-[#616161]">{event.peserta}</td>
                    <td className="px-4 py-3.5 text-[#616161]">{event.poin ?? '–'}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[event.status] ?? ''}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {event.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin-fakultas/buat-event?edit=${event.id}`)}
                          className="rounded-lg border border-brand-dark p-1.5 text-brand-dark transition hover:bg-brand-dark hover:text-white"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(event.id)}
                          className="rounded-lg border border-red-400 p-1.5 text-red-500 transition hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-[#9aa0a6]">Tidak ada event ditemukan.</div>
          )}
          <div className="flex flex-col gap-3 border-t border-[#f0f0f0] px-6 py-3 text-xs text-[#888] sm:flex-row sm:items-center sm:justify-between">
            <span>Showing 1 – 10 From Total {data.length}</span>
            <div className="flex flex-wrap items-center gap-1">
              <span>Page 1 of {Math.ceil(data.length / 10) || 1}</span>
              <div className="ml-3 flex flex-wrap gap-1">
                {['Previous', '1', '2', '...', '4', '5', 'Next'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`rounded px-2 py-1 text-xs ${p === '1' ? 'bg-brand-dark text-white' : 'border border-[#d1d5db] text-[#555] hover:bg-[#f5f5f5]'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ManajemenEvent
