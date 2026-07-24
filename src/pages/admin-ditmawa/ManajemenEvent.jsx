import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Search, Plus, Edit3, Trash2, Filter, Clock } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'

const DUMMY_EVENTS = [
  { id: 1, nama: 'TAC (Training Andalasian Charakter)', jenis: 'Pelatihan', skala: 'Universitas', tanggal: '12 Feb - 15 Feb 2026', peserta: 1000, poin: 50, status: 'aktif', dibuatPada: 'Selasa, 4 Feb 2026, 15:37' },
  { id: 2, nama: 'TAC (Training Andalasian Charakter)', jenis: 'Pelatihan', skala: 'Universitas', tanggal: '12 Feb - 15 Feb 2026', peserta: 1000, poin: 50, status: 'aktif', dibuatPada: 'Selasa, 4 Feb 2026, 15:37' },
  { id: 3, nama: 'TAC (Training Andalasian Charakter)', jenis: 'Pelatihan', skala: 'Universitas', tanggal: '12 Feb - 15 Feb 2026', peserta: 1000, poin: 50, status: 'aktif', dibuatPada: 'Selasa, 4 Feb 2026, 15:37' },
]

function HapusEventModal({ event, onClose, onConfirm }) {
  const [namaInput, setNamaInput] = useState('')
  const [skalaInput, setSkalaInput] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#212121]">Apakah anda yakin menghapus kegiatan ini?</h3>
          <button type="button" onClick={onClose} className="text-[#616161] hover:text-[#333] text-xl leading-none">×</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#212121]">Nama Kegiatan</label>
            <input
              type="text"
              value={namaInput}
              onChange={(e) => setNamaInput(e.target.value)}
              placeholder={event?.nama}
              className="mt-1 w-full rounded-lg border border-[#c4c6cf] px-3 py-2 text-sm outline-none focus:border-brand-dark"
            />
          </div>
          <div>
            <label className="block text-sm text-[#212121]">Skala</label>
            <input
              type="text"
              value={skalaInput}
              onChange={(e) => setSkalaInput(e.target.value)}
              placeholder={event?.skala}
              className="mt-1 w-full rounded-lg border border-[#c4c6cf] px-3 py-2 text-sm outline-none focus:border-brand-dark"
            />
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => onConfirm(event)}
            className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
          >
            HAPUS
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#c4c6cf] px-8 py-2.5 text-sm font-semibold text-[#616161] transition hover:bg-[#f5f5f5]"
          >
            BATAL
          </button>
        </div>
      </div>
    </div>
  )
}

const PAGE_SIZE = 10

function ManajemenEvent() {
  const navigate = useNavigate()
  const [data, setData] = useState(DUMMY_EVENTS)
  const [search, setSearch] = useState('')
  const [filterJenis, setFilterJenis] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSkala, setFilterSkala] = useState('')
  const [filterTahun, setFilterTahun] = useState('')
  const [hapusTarget, setHapusTarget] = useState(null)
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.filter((d) => {
      if (filterJenis && d.jenis !== filterJenis) return false
      if (filterStatus && d.status !== filterStatus) return false
      if (filterSkala && d.skala !== filterSkala) return false
      if (filterTahun && !d.tanggal.includes(filterTahun)) return false
      if (!q) return true
      return d.nama.toLowerCase().includes(q)
    })
  }, [data, search, filterJenis, filterStatus, filterSkala, filterTahun])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageItems = filtered.slice(start, start + PAGE_SIZE)

  const handleConfirmHapus = (event) => {
    setData((prev) => prev.filter((d) => d.id !== event.id))
    toast.success('Event dihapus.', { description: event.nama })
    setHapusTarget(null)
  }

  const resetFilter = () => {
    setSearch('')
    setFilterJenis('')
    setFilterStatus('')
    setFilterSkala('')
    setFilterTahun('')
    setPage(1)
  }

  return (
    <DashboardLayout role="admin-ditmawa" userName="Dr. Efa Yonnedi, SE. MPPM, Akt, CA, CRGP" userRole="Dosen Pembimbing">
      {hapusTarget && (
        <HapusEventModal
          event={hapusTarget}
          onClose={() => setHapusTarget(null)}
          onConfirm={handleConfirmHapus}
        />
      )}

      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-brand-dark sm:text-2xl lg:text-3xl">Buat Event</h2>
          <button
            type="button"
            onClick={() => navigate('/admin-ditmawa/buat-event')}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Tambah Buat Event
          </button>
        </div>

        <section>
          <h3 className="mb-3 text-base font-bold text-brand-dark">Event yang telah dibuat</h3>

          <div className="mb-3 flex flex-col gap-3 lg:flex-row">
            <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#cfd6df] bg-white px-4 py-2.5 shadow-sm">
              <Search className="h-4 w-4 shrink-0 text-[#9aa0a6]" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                placeholder="Cari mahasiswa atau kegiatan..."
                className="w-full text-sm outline-none"
              />
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              <Filter className="h-4 w-4" /> Filter
            </button>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            <select value={filterJenis} onChange={(e) => { setFilterJenis(e.target.value); setPage(1) }}
              className="rounded-lg border border-[#d9dce7] bg-white px-4 py-2 text-sm text-[#616161] outline-none">
              <option value="">Jenis</option>
              <option value="Seminar">Seminar</option>
              <option value="Workshop">Workshop</option>
              <option value="Pelatihan">Pelatihan</option>
              <option value="Kompetisi">Kompetisi</option>
              <option value="Volunteer">Volunteer</option>
              <option value="Organisasi">Organisasi</option>
            </select>
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
              className="rounded-lg border border-[#d9dce7] bg-white px-4 py-2 text-sm text-[#616161] outline-none">
              <option value="">Status</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Non Aktif</option>
            </select>
            <select value={filterSkala} onChange={(e) => { setFilterSkala(e.target.value); setPage(1) }}
              className="rounded-lg border border-[#d9dce7] bg-white px-4 py-2 text-sm text-[#616161] outline-none">
              <option value="">Skala</option>
              <option value="Internasional">Internasional</option>
              <option value="Nasional">Nasional</option>
              <option value="Regional">Regional</option>
              <option value="Universitas">Universitas</option>
            </select>
            <select value={filterTahun} onChange={(e) => { setFilterTahun(e.target.value); setPage(1) }}
              className="rounded-lg border border-[#d9dce7] bg-white px-4 py-2 text-sm text-[#616161] outline-none">
              <option value="">Tahun</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
            <button type="button" onClick={resetFilter}
              className="rounded-lg border border-[#d9dce7] bg-white px-4 py-2 text-sm text-[#616161] transition hover:bg-[#f5f6f8]">
              Reset filter
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-xs font-semibold uppercase tracking-wide text-white">
                    <th className="px-4 py-3">No</th>
                    <th className="px-4 py-3">Nama Kegiatan</th>
                    <th className="px-4 py-3">Jenis</th>
                    <th className="px-4 py-3">Skala</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Peserta</th>
                    <th className="px-4 py-3">Poin</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-[#616161]">Belum ada event.</td>
                    </tr>
                  ) : (
                    pageItems.map((item, idx) => (
                      <tr key={item.id} className="border-b border-[#e9ebf8] last:border-0 hover:bg-[#f9fafb]">
                        <td className="px-4 py-3 text-[#616161]">{start + idx + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#333]">{item.nama}</p>
                          <div className="mt-1 flex items-center gap-1 text-xs text-[#9aa0a6]">
                            <Clock className="h-3 w-3 shrink-0" />
                            <span>{item.dibuatPada}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#616161]">{item.jenis}</td>
                        <td className="px-4 py-3 text-[#616161]">{item.skala}</td>
                        <td className="px-4 py-3 text-[#616161]">{item.tanggal}</td>
                        <td className="px-4 py-3 text-[#616161]">{item.peserta}</td>
                        <td className="px-4 py-3 text-[#616161]">{item.poin}</td>
                        <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => navigate('/admin-ditmawa/buat-event', { state: { edit: item } })}
                              className="rounded p-1 text-brand-dark transition hover:bg-green-50"
                             
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setHapusTarget(item)}
                              className="rounded p-1 text-red-600 transition hover:bg-red-50"
                             
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-[#e9ebf8] px-4 py-3 text-xs text-[#616161] sm:flex-row sm:items-center sm:justify-between">
              <span>Showing {filtered.length === 0 ? 0 : start + 1} - {Math.min(start + PAGE_SIZE, filtered.length)} From Total {data.length}</span>
              <span>Page {currentPage} of {totalPages}</span>
              <div className="flex items-center gap-1">
                <button type="button" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded px-2 py-1 hover:bg-[#f0f4f0] disabled:opacity-40">Previous</button>
                {Array.from({ length: Math.min(totalPages, 4) }, (_, i) => i + 1).map((n) => (
                  <button key={n} type="button" onClick={() => setPage(n)}
                    className={`rounded px-2 py-1 ${n === currentPage ? 'bg-brand-dark text-white' : 'hover:bg-[#f0f4f0]'}`}>
                    {n}
                  </button>
                ))}
                <button type="button" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded px-2 py-1 hover:bg-[#f0f4f0] disabled:opacity-40">Next</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}

export default ManajemenEvent
