import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Clock, Filter, Search, Check } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import ConfirmModal from '../../components/ui/ConfirmModal'

const PAGE_SIZE = 10

const DUMMY_UKM = [
  { id: 'ukm-1', namaMahasiswa: 'AUFA ALATA', nim: '2310512011', prodi: 'Teknik Komputer, S1', kegiatan: 'Lomba hackathon', kategori: 'Kompetisi', peran: 'Juara 1', tanggal: '01 Feb - 15 Nov 2026', status: 'pending', diajukanPada: 'Selasa, 4 Feb 2026, 15:37' },
  { id: 'ukm-2', namaMahasiswa: 'BUDI SANTOSO', nim: '2310512012', prodi: 'Sistem Informasi, S1', kegiatan: 'Seminar Kepemimpinan', kategori: 'Seminar', peran: 'Panitia', tanggal: '10 Mar 2026', status: 'pending', diajukanPada: 'Rabu, 5 Mar 2026, 09:00' },
  { id: 'ukm-3', namaMahasiswa: 'CITRA DEWI', nim: '2310512013', prodi: 'Teknik Elektro, S1', kegiatan: 'Pelatihan Robotik UKM', kategori: 'Pelatihan', peran: 'Peserta', tanggal: '20 Apr 2026', status: 'disetujui', diajukanPada: 'Kamis, 6 Apr 2026, 10:15' },
]

function VerifikasiPengajuanUKM() {
  const navigate = useNavigate()
  const [items, setItems] = useState(DUMMY_UKM)
  const [search, setSearch] = useState('')
  const [kategori, setKategori] = useState('')
  const [tahun, setTahun] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const [pilihanMode, setPilihanMode] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((item) => {
      if (status && item.status !== status) return false
      if (kategori && item.kategori !== kategori) return false
      if (!q) return true
      return (
        (item.namaMahasiswa || '').toLowerCase().includes(q) ||
        (item.nim || '').toLowerCase().includes(q) ||
        (item.kegiatan || '').toLowerCase().includes(q) ||
        (item.kategori || '').toLowerCase().includes(q)
      )
    })
  }, [items, search, kategori, tahun, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageItems = filtered.slice(start, start + PAGE_SIZE)
  const showingFrom = filtered.length === 0 ? 0 : start + 1
  const showingTo = Math.min(start + PAGE_SIZE, filtered.length)

  const resetFilter = () => {
    setSearch(''); setKategori(''); setTahun(''); setStatus(''); setPage(1)
  }

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allPageSelected = pageItems.length > 0 && pageItems.every((i) => selected.has(i.id))

  const centangSemua = () => {
    if (allPageSelected) setSelected(new Set())
    else setSelected(new Set(pageItems.map((i) => i.id)))
  }

  const handleBulkConfirm = () => {
    setItems((prev) =>
      prev.map((item) => selected.has(item.id) ? { ...item, status: 'disetujui' } : item)
    )
    toast.success(`${selected.size} pengajuan UKM disetujui.`)
    setSelected(new Set())
    setPilihanMode(false)
    setShowBulkConfirm(false)
  }

  return (
    <DashboardLayout role="pimpinan-ditmawa" userName="Dr. Dendi Adi Saputra" userRole="Pimpinan Ditmawa">
      <ConfirmModal
        isOpen={showBulkConfirm}
       
        message={`Apakah Anda yakin ingin menyetujui ${selected.size} pengajuan UKM ini?`}
        confirmText="SETUJUI"
        cancelText="BATAL"
        onConfirm={handleBulkConfirm}
        onCancel={() => setShowBulkConfirm(false)}
      />

      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">
            Verifikasi Pengajuan Kegiatan UKM
          </h2>
          <p className="mt-1 text-sm text-[#616161]">
            Pengajuan kegiatan dari UKM yang memerlukan verifikasi pimpinan.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row">
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
            <button type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-10 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90">
              <Filter className="h-4 w-4" /> Filter
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select value={kategori} onChange={(e) => { setKategori(e.target.value); setPage(1) }}
              className="rounded-lg border border-[#d9dce7] bg-white px-4 py-2.5 text-sm text-[#616161] outline-none">
              <option value="">Kategori</option>
              <option value="Kompetisi">Kompetisi</option>
              <option value="Seminar">Seminar</option>
              <option value="Pelatihan">Pelatihan</option>
            </select>
            <select value={tahun} onChange={(e) => { setTahun(e.target.value); setPage(1) }}
              className="rounded-lg border border-[#d9dce7] bg-white px-4 py-2.5 text-sm text-[#616161] outline-none">
              <option value="">Tahun</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}
              className="rounded-lg border border-[#d9dce7] bg-white px-4 py-2.5 text-sm text-[#616161] outline-none">
              <option value="">Status</option>
              <option value="pending">Pending</option>
              <option value="disetujui">Disetujui</option>
              <option value="ditolak">Ditolak</option>
            </select>
            <button type="button"
              onClick={() => { setPilihanMode((v) => !v); setSelected(new Set()) }}
              className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
                pilihanMode ? 'border-brand-dark bg-brand-dark text-white' : 'border-[#d9dce7] bg-white text-[#616161] hover:bg-[#f5f5f5]'
              }`}>
              Pilih Beberapa
            </button>
            <button type="button" onClick={resetFilter}
              className="rounded-lg border border-[#d9dce7] bg-white px-4 py-2 text-sm text-[#616161] outline-none transition hover:bg-[#f5f6f8]">
              Reset filter
            </button>
          </div>

          {pilihanMode && (
            <div className="flex items-center gap-3 rounded-lg border border-[#e9ebf8] bg-[#f9fafb] px-4 py-3">
              <span className="text-sm text-[#616161]">{selected.size} dipilih</span>
              <div className="ml-auto flex gap-2">
                <button type="button" onClick={() => { setPilihanMode(false); setSelected(new Set()) }}
                  className="rounded-lg border border-[#d9dce7] px-4 py-2 text-sm font-semibold text-[#616161] transition hover:bg-white">
                  Batal Pilih
                </button>
                <button type="button"
                  onClick={() => { if (selected.size === 0) { toast.error('Pilih minimal satu.'); return }; setShowBulkConfirm(true) }}
                  className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-6 py-2 text-sm font-bold text-white transition hover:opacity-90">
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
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
                  <th className="px-4 py-3">Mahasiswa</th>
                  <th className="px-4 py-3">Kegiatan</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Peran</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={pilihanMode ? 9 : 8} className="px-4 py-10 text-center text-[#616161]">
                      Belum ada pengajuan UKM.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((item, index) => (
                    <tr key={item.id}
                      className={`border-b border-[#e9ebf8] last:border-0 ${selected.has(item.id) ? 'bg-green-50' : 'hover:bg-[#f9fafb]'}`}>
                      {pilihanMode && (
                        <td className="px-4 py-3">
                          <button type="button" onClick={() => toggleSelect(item.id)}
                            className={`flex h-5 w-5 items-center justify-center rounded border-2 transition ${selected.has(item.id) ? 'border-brand-dark bg-brand-dark' : 'border-[#c4c6cf] bg-white hover:border-brand-dark'}`}>
                            {selected.has(item.id) && <Check className="h-3 w-3 text-white" />}
                          </button>
                        </td>
                      )}
                      <td className="px-4 py-3 text-[#616161]">{start + index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <p className="font-bold uppercase text-[#333]">{item.namaMahasiswa}</p>
                          <p className="text-sm font-medium text-orange-500">{item.nim}</p>
                          <p className="text-sm text-sky-500">{item.prodi}</p>
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            <span>{item.diajukanPada}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#616161]">{item.kegiatan}</td>
                      <td className="px-4 py-3 text-brand-light">{item.kategori}</td>
                      <td className="px-4 py-3 text-[#616161]">{item.peran}</td>
                      <td className="px-4 py-3 text-[#616161]">{item.tanggal}</td>
                      <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                      <td className="px-4 py-3">
                        {pilihanMode ? (
                          <button type="button" onClick={() => toggleSelect(item.id)}
                            className={`flex h-6 w-6 items-center justify-center rounded border-2 transition ${selected.has(item.id) ? 'border-brand-dark bg-brand-dark text-white' : 'border-[#c4c6cf] text-transparent'}`}>
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button type="button"
                            onClick={() => navigate(`/pimpinan-ditmawa/verifikasi-pengajuan-ukm/${item.id}`, { state: { item } })}
                            className="whitespace-nowrap rounded-lg border border-brand-dark px-3 py-1.5 text-xs font-semibold text-brand-dark transition hover:bg-brand-dark hover:text-white">
                            Detail dan verifikasi
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-[#e9ebf8] px-4 py-3 text-xs text-[#616161] sm:flex-row sm:items-center sm:justify-between">
            <span>Showing {showingFrom} - {showingTo} From Total {filtered.length}</span>
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

export default VerifikasiPengajuanUKM
