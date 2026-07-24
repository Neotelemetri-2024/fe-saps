import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import { getKegiatan } from '../../services/kegiatanService'

const STATUS_TABS = ['Semua', 'Pending', 'Disetujui', 'Ditolak', 'Revisi']

function VerifikasiPengajuanUKMF() {
  const navigate = useNavigate()
  const location = useLocation()
  const [ukmfData, setUkmfData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('Semua')
  const [filterSkala, setFilterSkala] = useState('')
  const [filterJenis, setFilterJenis] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getKegiatan()
      setUkmfData(res.map((item, i) => ({
        id: item.id,
        no: i + 1,
        kegiatan: item.nama || item.kegiatan,
        namaUkmf: item.namaUkmf || 'UKMF',
        jenis: item.jenis,
        skala: item.skala,
        tanggal: item.tgl || item.tanggal || '',
        status: item.status || 'pending',
        penyelenggara: item.penyelenggara,
      })))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (location.state?.updatedId) {
      loadData()
      window.history.replaceState({}, '')
    }
  }, [location.state])

  const filtered = ukmfData.filter((item) => {
    const matchSearch =
      item.kegiatan?.toLowerCase().includes(search.toLowerCase()) ||
      item.namaUkmf?.toLowerCase().includes(search.toLowerCase())
    const matchTab =
      activeTab === 'Semua' ||
      item.status?.toLowerCase() === activeTab.toLowerCase()
    const matchSkala = !filterSkala || item.skala === filterSkala
    const matchJenis = !filterJenis || item.jenis === filterJenis
    return matchSearch && matchTab && matchSkala && matchJenis
  })

  const uniqueSkala = [...new Set(ukmfData.map((d) => d.skala).filter(Boolean))]
  const uniqueJenis = [...new Set(ukmfData.map((d) => d.jenis).filter(Boolean))]

  const statusStyle = {
    pending: 'bg-yellow-100 text-yellow-600 border border-yellow-300',
    disetujui: 'bg-green-100 text-green-700 border border-green-300',
    ditolak: 'bg-red-100 text-red-600 border border-red-300',
    revisi: 'bg-orange-100 text-orange-600 border border-orange-300',
  }

  return (
    <DashboardLayout role="pimpinan-fakultas" userName="Dr. Eng. Ir. Dendi Adi Saputra M, S.T, M.T" userRole="Pimpinan">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Verifikasi Pengajuan UKMF</h2>
          <p className="mt-1 text-sm text-[#616161]">Verifikasi dan kelola pengajuan kegiatan dari UKMF.</p>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-brand-dark to-brand-light text-white'
                  : 'border border-[#d1d5db] bg-white text-[#444] hover:bg-[#f5f5f5]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search + filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0a6]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kegiatan atau UKMF..."
              className="w-full rounded-lg border border-[#d1d5db] py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-dark"
            />
          </div>
          <select
            value={filterSkala}
            onChange={(e) => setFilterSkala(e.target.value)}
            className="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm text-[#444] outline-none focus:border-brand-dark"
          >
            <option value="">Semua Skala</option>
            {uniqueSkala.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value)}
            className="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm text-[#444] outline-none focus:border-brand-dark"
          >
            <option value="">Semua Jenis</option>
            {uniqueJenis.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
          {(filterSkala || filterJenis || search) && (
            <button
              type="button"
              onClick={() => { setFilterSkala(''); setFilterJenis(''); setSearch('') }}
              className="text-sm text-brand-dark underline hover:opacity-80"
            >
              Reset filter
            </button>
          )}
        </div>

        {/* Tabel */}
        <div className="overflow-hidden rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-white">
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">No</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">Kegiatan</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">Nama UKMF</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">Jenis</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">Skala</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">Tanggal</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm text-[#9aa0a6]">Memuat data...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm text-[#9aa0a6]">Tidak ada data ditemukan.</td>
                  </tr>
                ) : filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-[#f9fafb]">
                    <td className="px-4 py-3.5 text-[#616161]">{item.no}</td>
                    <td className="px-4 py-3.5 font-semibold text-brand-dark">{item.kegiatan}</td>
                    <td className="px-4 py-3.5 text-[#616161]">{item.namaUkmf}</td>
                    <td className="px-4 py-3.5 text-brand-light">{item.jenis}</td>
                    <td className="px-4 py-3.5 text-[#616161]">{item.skala}</td>
                    <td className="px-4 py-3.5 text-[#616161] whitespace-nowrap">{item.tanggal}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[item.status?.toLowerCase()] ?? 'bg-gray-100 text-gray-500'}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => navigate(`/pimpinan-fakultas/verifikasi-pengajuan-ukmf/${item.id}`, { state: { item } })}
                        className="whitespace-nowrap rounded-lg border border-brand-dark px-3 py-1.5 text-xs font-semibold text-brand-dark transition hover:bg-brand-dark hover:text-white"
                      >
                        {item.status?.toLowerCase() === 'pending' ? 'Detail dan verifikasi' : 'Detail'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-[#e9ebf8] px-5 py-3 text-xs text-[#888] sm:flex-row sm:items-center sm:justify-between">
            <span>Showing 1 - {filtered.length} dari Total {ukmfData.length}</span>
            <span>Page 1 of {Math.max(1, Math.ceil(ukmfData.length / 10))}</span>
            <div className="flex items-center gap-1">
              {['Previous', '1', '2', '...', '3', '4', 'Next'].map((p) => (
                <button key={p} type="button" className={`rounded px-2 py-1 text-xs ${p === '1' ? 'bg-brand-dark text-white' : 'border border-[#d1d5db] text-[#555] hover:bg-[#f5f5f5]'}`}>{p}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default VerifikasiPengajuanUKMF
