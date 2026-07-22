import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Search, Check, Filter } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import ConfirmModal from '../../components/ui/ConfirmModal'

const STATUS_PESERTA = {
  belum: { label: 'Belum Diverifikasi', bg: 'bg-yellow-100', text: 'text-yellow-700' },
  terverifikasi: { label: 'Terverifikasi', bg: 'bg-green-100', text: 'text-green-700' },
  ditolak: { label: 'Ditolak', bg: 'bg-red-100', text: 'text-red-600' },
}

const DUMMY_PESERTA = [
  { id: 1, nama: 'AUFA ALATA', nim: '2310512011', prodi: 'Teknik Komputer, S1', status: 'belum', terdaftar: '12 Feb 2026' },
  { id: 2, nama: 'BUDI SANTOSO', nim: '2310512012', prodi: 'Teknik Komputer, S1', status: 'terverifikasi', terdaftar: '12 Feb 2026' },
  { id: 3, nama: 'CITRA DEWI', nim: '2310512013', prodi: 'Sistem Informasi, S1', status: 'belum', terdaftar: '13 Feb 2026' },
]

const PAGE_SIZE = 10

function ManajemenPesertaEvent() {
  const [peserta, setPeserta] = useState(DUMMY_PESERTA)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)
  const [pilihanMode, setPilihanMode] = useState(false)
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return peserta.filter((p) => {
      if (filterStatus && p.status !== filterStatus) return false
      if (!q) return true
      return p.nama.toLowerCase().includes(q) || p.nim.toLowerCase().includes(q)
    })
  }, [peserta, search, filterStatus])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageItems = filtered.slice(start, start + PAGE_SIZE)

  const allPageSelected = pageItems.length > 0 && pageItems.every((i) => selected.has(i.id))

  const centangSemua = () => {
    if (allPageSelected) setSelected(new Set())
    else setSelected(new Set(pageItems.map((i) => i.id)))
  }

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBulkVerifikasi = () => {
    setPeserta((prev) =>
      prev.map((p) => selected.has(p.id) ? { ...p, status: 'terverifikasi' } : p)
    )
    toast.success(`${selected.size} peserta berhasil diverifikasi.`)
    setSelected(new Set())
    setPilihanMode(false)
    setShowBulkConfirm(false)
  }

  const handleVerifikasiSingle = (id) => {
    setPeserta((prev) => prev.map((p) => p.id === id ? { ...p, status: 'terverifikasi' } : p))
    toast.success('Peserta diverifikasi.')
  }

  return (
    <DashboardLayout role="admin-ditmawa" userName="Dr. Efa Yonnedi, SE. MPPM, Akt, CA, CRGP" userRole="Dosen Pembimbing">
      <ConfirmModal
        isOpen={showBulkConfirm}
        title="Verifikasi semua peserta yang dipilih?"
        message={`${selected.size} peserta akan diverifikasi.`}
        confirmText="Ya, Verifikasi"
        cancelText="Batal"
        onConfirm={handleBulkVerifikasi}
        onCancel={() => setShowBulkConfirm(false)}
      />

      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-brand-dark">Manajemen Peserta Event</h2>
          <p className="mt-1 text-sm text-[#616161]">Kelola dan verifikasi peserta yang mendaftar pada event global.</p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#cfd6df] bg-white px-4 py-2.5 shadow-sm">
            <Search className="h-4 w-4 shrink-0 text-[#9aa0a6]" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Cari nama atau NIM..."
              className="w-full text-sm outline-none" />
          </div>
          <button type="button"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-light px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark">
            <Filter className="h-4 w-4" /> Filter
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
            className="rounded-lg border border-[#d9dce7] bg-white px-4 py-2 text-sm text-[#616161] outline-none">
            <option value="">Semua Status</option>
            <option value="belum">Belum Diverifikasi</option>
            <option value="terverifikasi">Terverifikasi</option>
            <option value="ditolak">Ditolak</option>
          </select>
          <button type="button" onClick={() => { setPilihanMode((v) => !v); setSelected(new Set()) }}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${pilihanMode ? 'border-brand-dark bg-brand-dark text-white' : 'border-[#d9dce7] bg-white text-[#616161] hover:bg-[#f5f5f5]'}`}>
            Pilih Beberapa
          </button>
        </div>

        {pilihanMode && (
          <div className="flex items-center gap-3 rounded-lg border border-[#e9ebf8] bg-[#f9fafb] px-4 py-3">
            <span className="text-sm text-[#616161]">{selected.size} dipilih</span>
            <div className="ml-auto flex gap-2">
              <button type="button" onClick={() => { setPilihanMode(false); setSelected(new Set()) }}
                className="rounded-lg border border-[#d9dce7] px-4 py-2 text-sm font-semibold text-[#616161]">
                Batal Pilih
              </button>
              <button type="button"
                onClick={() => { if (selected.size === 0) { toast.error('Pilih minimal satu peserta.'); return }; setShowBulkConfirm(true) }}
                className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-6 py-2 text-sm font-bold text-white">
                Verifikasi Terpilih
              </button>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-xs font-semibold uppercase tracking-wide text-white">
                  {pilihanMode && (
                    <th className="px-4 py-3">
                      <button type="button" onClick={centangSemua}
                        className={`flex h-5 w-5 items-center justify-center rounded border-2 transition ${allPageSelected ? 'border-white bg-white' : 'border-white/70 hover:bg-white/20'}`}>
                        {allPageSelected && <Check className="h-3 w-3 text-brand-dark" />}
                      </button>
                    </th>
                  )}
                  <th className="px-4 py-3">No</th>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">NIM</th>
                  <th className="px-4 py-3">Program Studi</th>
                  <th className="px-4 py-3">Tgl Daftar</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={pilihanMode ? 8 : 7} className="px-4 py-10 text-center text-[#616161]">
                      Belum ada peserta terdaftar.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((p, idx) => {
                    const st = STATUS_PESERTA[p.status] || STATUS_PESERTA.belum
                    return (
                      <tr key={p.id} className={`border-b border-[#e9ebf8] last:border-0 ${selected.has(p.id) ? 'bg-green-50' : 'hover:bg-[#f9fafb]'}`}>
                        {pilihanMode && (
                          <td className="px-4 py-3">
                            <button type="button" onClick={() => toggleSelect(p.id)}
                              className={`flex h-5 w-5 items-center justify-center rounded border-2 transition ${selected.has(p.id) ? 'border-brand-dark bg-brand-dark' : 'border-[#c4c6cf] bg-white hover:border-brand-dark'}`}>
                              {selected.has(p.id) && <Check className="h-3 w-3 text-white" />}
                            </button>
                          </td>
                        )}
                        <td className="px-4 py-3 text-[#616161]">{start + idx + 1}</td>
                        <td className="px-4 py-3 font-bold uppercase text-[#333]">{p.nama}</td>
                        <td className="px-4 py-3 font-medium text-orange-500">{p.nim}</td>
                        <td className="px-4 py-3 text-sky-500">{p.prodi}</td>
                        <td className="px-4 py-3 text-[#616161]">{p.terdaftar}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${st.bg} ${st.text}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {p.status === 'belum' ? (
                            <button type="button" onClick={() => handleVerifikasiSingle(p.id)}
                              className="whitespace-nowrap rounded-full bg-brand-dark px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90">
                              Verifikasi
                            </button>
                          ) : (
                            <span className="text-xs text-[#9aa0a6]">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-[#e9ebf8] px-4 py-3 text-xs text-[#616161] sm:flex-row sm:items-center sm:justify-between">
            <span>Showing {filtered.length === 0 ? 0 : start + 1} - {Math.min(start + PAGE_SIZE, filtered.length)} From Total {peserta.length}</span>
            <span>Page {currentPage} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <button type="button" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded px-2 py-1 hover:bg-[#f0f4f0] disabled:opacity-40">Previous</button>
              {Array.from({ length: Math.min(totalPages, 4) }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" onClick={() => setPage(n)}
                  className={`rounded px-2 py-1 ${n === currentPage ? 'bg-brand-dark text-white' : 'hover:bg-[#f0f4f0]'}`}>{n}</button>
              ))}
              <button type="button" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded px-2 py-1 hover:bg-[#f0f4f0] disabled:opacity-40">Next</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ManajemenPesertaEvent
