import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Plus, Users } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import { getKegiatan } from '../../services/kegiatanService'

function BuatKegiatan() {
  const navigate = useNavigate()
  const [data, setData] = useState([])

  useEffect(() => {
    getKegiatan().then(setData)
  }, [])

  return (
    <DashboardLayout role="ukmf" userName="Operator UKMF" userRole="Operator UKMF">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">List Kegiatan</h2>
            <p className="mt-1 text-sm text-[#616161]">Kegiatan yang telah diajukan</p>
          </div>
          <button
            onClick={() => navigate('/ukmf/buat-kegiatan/form')}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-dark px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Buat Kegiatan
          </button>
        </div>

        {/* Search & Filter */}
        <div className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#cfd6df] bg-white px-4 py-2.5 shadow-sm">
              <Search className="h-4 w-4 shrink-0 text-[#9aa0a6]" />
              <input type="text" placeholder="Cari kegiatan..." className="w-full text-sm outline-none" />
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-light px-10 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark">
              <Filter className="h-4 w-4" /> Filter
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {['Skala', 'Jenis'].map((label) => (
              <select key={label} className="rounded-lg border border-[#d9dce7] bg-white px-4 py-2.5 text-sm text-[#616161] outline-none">
                <option>{label}</option>
              </select>
            ))}
          </div>
          <div className="flex justify-end">
            <select className="rounded-lg border border-[#d9dce7] bg-white px-4 py-2 text-sm text-[#616161] outline-none">
              <option>Reset filter</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-xs font-semibold uppercase tracking-wide text-white">
                  <th className="px-4 py-3">No</th>
                  <th className="px-4 py-3">Kegiatan</th>
                  <th className="px-4 py-3">Jenis</th>
                  <th className="px-4 py-3">Skala</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Peserta</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id} className="border-b border-[#e9ebf8] last:border-0 hover:bg-[#f9fafb]">
                    <td className="px-4 py-3 text-[#616161]">{item.no || item.id}</td>
                    <td className="px-4 py-3 font-medium text-[#333]">{item.nama || item.kegiatan}</td>
                    <td className="px-4 py-3 text-[#616161]">{item.jenis}</td>
                    <td className="px-4 py-3 text-[#616161]">{item.skala}</td>
                    <td className="px-4 py-3 text-[#616161]">{item.tgl || item.tanggal}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-[#616161]" />
                        <span className="text-[#333]">{item.peserta || '-'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                    <td className="px-4 py-3">
                      <button className="rounded-full border border-brand-dark px-3 py-1 text-xs font-semibold text-brand-dark transition hover:bg-brand-dark hover:text-white">
                        Manajemen Peserta
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default BuatKegiatan