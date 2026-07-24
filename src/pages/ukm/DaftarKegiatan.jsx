import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Filter, Plus, Search, Users } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import { getKegiatan } from '../../services/kegiatanService'

const stats = [
  { label: 'PENDING', value: 4 },
  { label: 'DISETUJUI', value: 4 },
  { label: 'STATUS', value: 3 },
  { label: 'EVENT AKTIF', value: 6 },
]

function DaftarKegiatan() {
  const navigate = useNavigate()
  const [data, setData] = useState([])

  useEffect(() => {
    getKegiatan().then((res) => setData(res))
  }, [])

  return (
    <DashboardLayout role="ukm" userName="Naufal Rafiif Irwan" userRole="Operator UKM">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Daftar Kegiatan</h2>
            <p className="mt-1 text-sm text-[#616161]">Kelola seluruh kegiatan yang diikuti oleh organisasi Anda.</p>
          </div>
          <button
            onClick={() => navigate('/ukm/buat-kegiatan')}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Ajukan Kegiatan
          </button>
        </div>

        <div className="flex items-start gap-3 rounded-lg bg-[#fff6ad] px-5 py-4 text-sm text-brand-dark shadow-sm">
          <Bell className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
          <p>Silahkan verifikasi untuk klaim poin kegiatan peserta</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border-2 border-brand-dark bg-white p-5 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#616161]">{stat.label}</p>
              <p className="mt-2 text-3xl font-extrabold text-brand-dark">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-bold text-brand-dark">Kegiatan Saya</h3>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#cfd6df] bg-white px-4 py-2.5 shadow-sm">
              <Search className="h-4 w-4 shrink-0 text-[#616161]" />
              <input
                type="text"
                placeholder="Cari mahasiswa atau kegiatan..."
                className="w-full text-sm outline-none"
              />
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90">
              <Filter className="h-4 w-4" />
              Filter
            </button>
            <select className="rounded-lg border border-[#d9dce7] bg-white px-8 py-2.5 text-sm text-[#616161] outline-none">
              <option>Skala</option>
            </select>
            <select className="rounded-lg border border-[#d9dce7] bg-white px-8 py-2.5 text-sm text-[#616161] outline-none">
              <option>Jenis</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-xs font-semibold uppercase tracking-wide text-white">
                    <th className="px-4 py-4">Nama Kegiatan</th>
                    <th className="px-4 py-4">Jenis</th>
                    <th className="px-4 py-4">Skala</th>
                    <th className="px-4 py-4">Tanggal</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Peserta</th>
                    <th className="px-4 py-4">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => (
                    <tr key={item.id} className="border-b border-[#e9ebf8] last:border-0 hover:bg-[#f9fafb]">
                      <td className="px-4 py-4 font-medium text-[#333]">{item.nama}</td>
                      <td className="px-4 py-4 text-[#616161]">{item.jenis}</td>
                      <td className="px-4 py-4 text-[#616161]">{item.skala}</td>
                      <td className="px-4 py-4 text-[#616161]">{item.tgl || item.tanggal}</td>
                      <td className="px-4 py-4"><StatusBadge status={item.status} /></td>
                      <td className="px-4 py-4 text-[#333]">
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-brand-dark" />
                          {item.peserta}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => navigate(`/ukm/daftar-kegiatan/${item.id}/manajemen-peserta`)}
                          className="rounded-full bg-yellow-400 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-yellow-500"
                        >
                          Manajemen Peserta
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-[#e9ebf8] px-4 py-4 text-xs text-[#616161] sm:flex-row sm:items-center sm:justify-between">
              <span>Showing 1 - 10 From Total 20</span>
              <span>Page 1 of 2</span>
              <div className="flex items-center gap-1">
                <button className="rounded px-2 py-1 text-[#616161] hover:bg-[#f0f4f0]">Previous</button>
                <button className="rounded bg-brand-dark px-2 py-1 text-white">1</button>
                <button className="rounded px-2 py-1 hover:bg-[#f0f4f0]">2</button>
                <span className="px-1">...</span>
                <button className="rounded px-2 py-1 hover:bg-[#f0f4f0]">3</button>
                <button className="rounded px-2 py-1 hover:bg-[#f0f4f0]">4</button>
                <button className="rounded px-2 py-1 hover:bg-[#f0f4f0]">Next</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default DaftarKegiatan
