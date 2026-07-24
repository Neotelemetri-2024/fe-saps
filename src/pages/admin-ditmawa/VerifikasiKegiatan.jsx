import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Clock } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'

const STATUS_PENDAFTARAN = {
  belum: { label: 'belum terdaftar', bg: 'bg-[#f5f5f5]', text: 'text-[#616161]' },
  sudah: { label: 'sudah terdaftar', bg: 'bg-green-100', text: 'text-green-700' },
}

const DUMMY_KEGIATAN = [
  { id: 1, nama: 'TAC (Training Andalasian Charakter)', jenis: 'Pelatihan', skala: 'Universitas', tanggal: '12 Feb - 15 Feb 2026', peserta: 1000, poin: 50, statusPendaftaran: 'belum', dibuatPada: 'Selasa, 4 Feb 2026, 15:37' },
  { id: 2, nama: 'TAC (Training Andalasian Charakter)', jenis: 'Pelatihan', skala: 'Universitas', tanggal: '12 Feb - 15 Feb 2026', peserta: 1000, poin: 50, statusPendaftaran: 'sudah', dibuatPada: 'Selasa, 4 Feb 2026, 15:37' },
  { id: 3, nama: 'TAC (Training Andalasian Charakter)', jenis: 'Pelatihan', skala: 'Universitas', tanggal: '12 Feb - 15 Feb 2026', peserta: 1000, poin: 50, statusPendaftaran: 'belum', dibuatPada: 'Selasa, 4 Feb 2026, 15:37' },
]

const PAGE_SIZE = 10

function VerifikasiKegiatan() {
  const navigate = useNavigate()
  const [data] = useState(DUMMY_KEGIATAN)
  const [search, setSearch] = useState('')
  const [filterJenis, setFilterJenis] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSkala, setFilterSkala] = useState('')
  const [filterTahun, setFilterTahun] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.filter((d) => {
      if (filterJenis && d.jenis !== filterJenis) return false
      if (filterStatus && d.statusPendaftaran !== filterStatus) return false
      if (filterSkala && d.skala !== filterSkala) return false
      if (!q) return true
      return d.nama.toLowerCase().includes(q)
    })
  }, [data, search, filterJenis, filterStatus, filterSkala, filterTahun])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageItems = filtered.slice(start, start + PAGE_SIZE)

  const handleManajemenPeserta = (item) => {
    navigate(`/admin-ditmawa/manajemen-peserta-event/${item.id}`, { state: { event: item } })
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
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-brand-dark">Verifikasi Kegiatan</h2>
          <p className="mt-1 text-sm text-[#616161]">lakukan verifikasi kegiatan terhadap mahasiswa yang mengikuti event yang di buat oleh admin ditmawa</p>
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
            </select>
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
              className="rounded-lg border border-[#d9dce7] bg-white px-4 py-2 text-sm text-[#616161] outline-none">
              <option value="">Status</option>
              <option value="belum">Belum Terdaftar</option>
              <option value="sudah">Sudah Terdaftar</option>
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
                      <td colSpan={9} className="px-4 py-10 text-center text-[#616161]">Belum ada data kegiatan.</td>
                    </tr>
                  ) : (
                    pageItems.map((item, idx) => {
                      const pendaftaran = STATUS_PENDAFTARAN[item.statusPendaftaran] || STATUS_PENDAFTARAN.belum
                      const btnColor = item.statusPendaftaran === 'sudah'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-yellow-500 hover:bg-yellow-600'
                      return (
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
                          <td className="px-4 py-3">
                            <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${pendaftaran.bg} ${pendaftaran.text}`}>
                              {pendaftaran.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => handleManajemenPeserta(item)}
                              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold text-white transition ${btnColor}`}
                            >
                              Manajemen Peserta
                            </button>
                          </td>
                        </tr>
                      )
                    })
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

export default VerifikasiKegiatan
