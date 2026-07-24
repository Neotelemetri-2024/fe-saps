import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'

const DUMMY = [
  { id: 1, kegiatan: 'TAC (Training Andalasian Character)', submitted: 'Selasa, 4 Feb 2025, 15:37', kategori: 'Lomba Hackathon', skala: 'Universitas', tanggal: '12 Feb – 15 Feb 2026', peserta: 1000, poin: 50, status: 'sudah tercatat' },
  { id: 2, kegiatan: 'TAC (Training Andalasian Character)', submitted: 'Selasa, 4 Feb 2025, 15:37', kategori: 'Lomba Hackathon', skala: 'Universitas', tanggal: '12 Feb – 15 Feb 2026', peserta: 1000, poin: 50, status: 'belum tercatat' },
  { id: 3, kegiatan: 'TAC (Training Andalasian Character)', submitted: 'Selasa, 4 Feb 2025, 15:37', kategori: 'Lomba Hackathon', skala: 'Universitas', tanggal: '12 Feb – 15 Feb 2026', peserta: 1000, poin: 50, status: 'belum tercatat' },
]

const statusStyle = {
  'sudah tercatat': 'bg-green-100 text-green-700 border border-green-300',
  'belum tercatat': 'bg-yellow-100 text-yellow-600 border border-yellow-300',
}

function VerifikasiKegiatan() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState('')
  const [filterSkala, setFilterSkala] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const filtered = DUMMY.filter((e) => {
    const q = search.trim().toLowerCase()
    if (q && !e.kegiatan.toLowerCase().includes(q)) return false
    if (filterKategori && e.kategori !== filterKategori) return false
    if (filterSkala && e.skala !== filterSkala) return false
    if (filterStatus && e.status !== filterStatus) return false
    return true
  })

  const resetFilter = () => {
    setSearch('')
    setFilterKategori('')
    setFilterSkala('')
    setFilterStatus('')
  }

  return (
    <DashboardLayout role="admin-fakultas" userName="Dr. Efa Yonnedi, SE. MPPM, Akt, CA, CRGP" userRole="Dosen Pembimbing">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-[#222] sm:text-2xl lg:text-3xl">Verifikasi Kegiatan</h2>
          <p className="mt-1 text-sm text-[#616161]">
            lakukan verifikasi kegiatan terhadap mahasiswa yang mengikuti event yang di buat oleh admin Fakultas
          </p>
        </div>

        <p className="text-sm font-medium text-[#333]">Event yang telah dibuat</p>

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
            {[...new Set(DUMMY.map((d) => d.kategori))].map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <select
            value={filterSkala}
            onChange={(e) => setFilterSkala(e.target.value)}
            className="rounded-lg border border-[#d9dce7] bg-white px-3 py-2 text-sm text-[#444] outline-none"
          >
            <option value="">Skala</option>
            {[...new Set(DUMMY.map((d) => d.skala))].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-[#d9dce7] bg-white px-3 py-2 text-sm text-[#444] outline-none"
          >
            <option value="">Status</option>
            <option value="sudah tercatat">Sudah Tercatat</option>
            <option value="belum tercatat">Belum Tercatat</option>
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
                {filtered.map((e, i) => (
                  <tr key={e.id} className="hover:bg-[#f9fafb]">
                    <td className="px-4 py-3.5 text-[#616161]">{i + 1}.</td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-[#222]">{e.kegiatan}</p>
                      <p className="mt-0.5 text-xs text-[#9aa0a6]">⏱ {e.submitted}</p>
                    </td>
                    <td className="px-4 py-3.5 text-[#616161]">{e.kategori}</td>
                    <td className="px-4 py-3.5 text-[#616161]">{e.skala}</td>
                    <td className="px-4 py-3.5 text-[#616161] whitespace-nowrap">{e.tanggal}</td>
                    <td className="px-4 py-3.5 text-[#616161]">{e.peserta}</td>
                    <td className="px-4 py-3.5 text-[#616161]">{e.poin}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[e.status] ?? ''}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin-fakultas/verifikasi-kegiatan/${e.id}/peserta`)}
                        className="rounded-lg bg-yellow-400 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-yellow-500"
                      >
                        Manajemen Peserta
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-[#9aa0a6]">Tidak ada data ditemukan.</div>
          )}
          <div className="flex flex-col gap-3 border-t border-[#f0f0f0] px-6 py-3 text-xs text-[#888] sm:flex-row sm:items-center sm:justify-between">
            <span>Showing 1 – 10 From Total {DUMMY.length}</span>
            <div className="flex flex-wrap items-center gap-1">
              <span>Page 1 of {Math.ceil(DUMMY.length / 10) || 1}</span>
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

export default VerifikasiKegiatan
