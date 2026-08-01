import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, Search } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import KegiatanCell from '../../components/dashboard/KegiatanCell'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import { getKegiatanApproval } from '../../services/kegiatanService'

const STATUS_TABS = ['Semua', 'Pending', 'Disetujui', 'Revisi']

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
      const res = await getKegiatanApproval()
      setUkmfData(res.map((item, i) => ({
        id: item.id,
        no: i + 1,
        kegiatan: item.nama || item.kegiatan,
        diajukanPada: item.createdAt
          ? new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
          : '',
        namaUkmf: item.organisasi?.nama || item.namaUkmf || 'UKMF',
        jenis: typeof item.kategori === 'object' ? item.kategori?.nama : (item.jenis || item.kategori || ''),
        skala: typeof item.skala === 'object' ? item.skala?.nama : (item.skala || ''),
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

  const columns = [
    { key: 'no', label: 'No' },
    { key: 'kegiatan', label: 'Kegiatan', render: (item) => <KegiatanCell nama={item.kegiatan} tanggal={item.diajukanPada} /> },
    { key: 'namaUkmf', label: 'Nama UKMF' },
    { key: 'jenis', label: 'Jenis', render: (item) => <span className="text-[#616161]">{item.jenis}</span> },
    { key: 'skala', label: 'Skala' },
    { key: 'tanggal', label: 'Tanggal', render: (item) => <span className="whitespace-nowrap">{item.tanggal}</span> },
    {
      key: 'status', label: 'Status',
      render: (item) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[item.status?.toLowerCase()] ?? 'bg-gray-100 text-gray-500'}`}>
          {item.status}
        </span>
      ),
    },
    {
      key: 'aksi', label: 'Aksi', stopPropagation: true,
      render: (item) => (
        <button type="button"
          onClick={() => navigate(`/pimpinan_fakultas/verifikasi-pengajuan-ukmf/${item.id}`, { state: { item } })}
          title="Detail & Verifikasi"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-400 bg-blue-50 text-blue-600 transition hover:bg-blue-500 hover:text-white">
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ]

  return (
    <DashboardLayout role="pimpinan_fakultas" userName="Dr. Eng. Ir. Dendi Adi Saputra M, S.T, M.T" userRole="Pimpinan">
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
        <div className="flex flex-wrap gap-3">
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
            className="w-full rounded-lg border border-[#d1d5db] px-3 py-2 text-sm text-[#444] outline-none focus:border-brand-dark sm:w-auto"
          >
            <option value="">Semua Skala</option>
            {uniqueSkala.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value)}
            className="w-full rounded-lg border border-[#d1d5db] px-3 py-2 text-sm text-[#444] outline-none focus:border-brand-dark sm:w-auto"
          >
            <option value="">Semua Jenis</option>
            {uniqueJenis.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
          {(filterSkala || filterJenis || search) && (
            <button
              type="button"
              onClick={() => { setFilterSkala(''); setFilterJenis(''); setSearch('') }}
              className="rounded-lg border border-brand-dark bg-white px-3 py-2 text-sm font-medium text-brand-dark transition hover:bg-[#f5f5f5]"
            >
              Reset filter
            </button>
          )}
        </div>

        <TableCard title="Daftar Pengajuan UKMF">
          <TableFrame>
          <DataTable
            loading={loading}
            data={filtered}
            emptyText="Tidak ada data ditemukan."
            columns={columns}
          />
          </TableFrame>
        </TableCard>
      </div>
    </DashboardLayout>
  )
}

export default VerifikasiPengajuanUKMF
