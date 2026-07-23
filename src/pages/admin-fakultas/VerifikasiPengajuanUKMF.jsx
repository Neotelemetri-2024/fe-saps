import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'

const DUMMY_PENGAJUAN = [
  { id: 1, kegiatan: 'Lomba Hackathon', subKegiatan: 'Teknik Sipil, UNAND, 2024', namaUKMF: 'Hima FT UNAND', jenis: 'Kompetisi', skala: 'Nasional', tanggal: '12 Feb – 14 Feb 2026', status: 'Pending' },
  { id: 2, kegiatan: 'Lomba AI & Teknologi', subKegiatan: 'Teknik Sipil, UNAND, 2024', namaUKMF: 'Hima FT UNAND', jenis: 'Kompetisi', skala: 'Nasional', tanggal: '12 Feb – 14 Feb 2026', status: 'Pending' },
  { id: 3, kegiatan: 'Lomba AI & Teknologi', subKegiatan: 'Teknik Sipil, UNAND, 2024', namaUKMF: 'Hima FT UNAND', jenis: 'Kompetisi', skala: 'Nasional', tanggal: '12 Feb – 14 Feb 2026', status: 'Pending' },
  { id: 4, kegiatan: 'Festival Seni Mahasiswa', subKegiatan: 'UKM Seni, UNAND, 2024', namaUKMF: 'UKM Seni', jenis: 'Seni', skala: 'Universitas', tanggal: '5 Sep – 7 Sep 2026', status: 'Disetujui' },
  { id: 5, kegiatan: 'Kemah Nasional Pramuka', subKegiatan: 'Pramuka UKMF, 2024', namaUKMF: 'Pramuka UKMF', jenis: 'Kepramukaan', skala: 'Nasional', tanggal: '15 Agu – 17 Agu 2026', status: 'Ditolak' },
]

const statusStyle = {
  Pending: 'bg-yellow-100 text-yellow-600 border border-yellow-300',
  Disetujui: 'bg-green-100 text-green-700 border border-green-300',
  Ditolak: 'bg-red-100 text-red-600 border border-red-300',
  Revisi: 'bg-orange-100 text-orange-600 border border-orange-300',
}

const TABS = ['Semua', 'Pending', 'Disetujui', 'Ditolak']

function VerifikasiPengajuanUKMF() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('Semua')

  const filtered = DUMMY_PENGAJUAN.filter((p) => {
    const matchSearch =
      p.kegiatan.toLowerCase().includes(search.toLowerCase()) ||
      p.namaUKMF.toLowerCase().includes(search.toLowerCase())
    const matchTab = activeTab === 'Semua' || p.status === activeTab
    return matchSearch && matchTab
  })

  return (
    <DashboardLayout role="admin-fakultas" userName="Nouval Rafiif Irwan" userRole="Operator UKM">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Verifikasi Pengajuan UKMF</h2>
          <p className="mt-1 text-sm text-[#616161]">Verifikasi pengajuan kegiatan dari UKMF ke Pimpinan Fakultas.</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map((tab) => (
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

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0a6]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kegiatan atau UKMF..."
            className="w-full rounded-lg border border-[#d1d5db] py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-dark"
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-white">
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">NO</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">KEGIATAN</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">NAMA UKMF</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">JENIS</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">SKALA</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">TANGGAL</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">STATUS</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {filtered.map((p, i) => (
                  <tr key={p.id} className="hover:bg-[#f9fafb]">
                    <td className="px-4 py-3.5 text-[#616161]">{i + 1}.</td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-[#222]">{p.kegiatan}</p>
                      {p.subKegiatan && <p className="text-xs text-[#9aa0a6]">{p.subKegiatan}</p>}
                    </td>
                    <td className="px-4 py-3.5 text-[#616161]">{p.namaUKMF}</td>
                    <td className="px-4 py-3.5 text-[#616161]">{p.jenis}</td>
                    <td className="px-4 py-3.5 text-[#616161]">{p.skala}</td>
                    <td className="px-4 py-3.5 text-[#616161] whitespace-nowrap">{p.tanggal}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[p.status]}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin-fakultas/verifikasi-pengajuan-ukmf/${p.id}`)}
                          className="rounded border border-brand-dark px-2.5 py-1 text-xs font-semibold text-brand-dark hover:bg-brand-dark hover:text-white"
                        >
                          Detail
                        </button>
                        {p.status === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => navigate(`/admin-fakultas/verifikasi-pengajuan-ukmf/${p.id}`)}
                            className="rounded border border-[#2563eb] px-2.5 py-1 text-xs font-semibold text-[#2563eb] hover:bg-[#2563eb] hover:text-white"
                          >
                            verifikasi
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-[#9aa0a6]">Tidak ada pengajuan ditemukan.</div>
          )}
          <div className="flex items-center justify-between border-t border-[#f0f0f0] px-6 py-3 text-xs text-[#888]">
            <span>Showing 1 – 10 from Total 20</span>
            <div className="flex items-center gap-1">
              <span>Page 1 of 2</span>
              <div className="ml-3 flex gap-1">
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

export default VerifikasiPengajuanUKMF
