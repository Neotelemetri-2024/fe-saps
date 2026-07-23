import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, MoreVertical } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'

const daftarEvent = [
  { id: 1, nama: 'Lomba Musik Nasional 2026', ukmf: 'UKM Musik', kategori: 'Lomba', tanggal: '15 Feb 2026', tempat: 'Aula FT', peserta: 200, status: 'Pendaftaran Dibuka' },
  { id: 2, nama: 'Turnamen Futsal Antar Prodi', ukmf: 'UKM Olahraga', kategori: 'Olahraga', tanggal: '20 Feb 2026', tempat: 'Gedung Olahraga', peserta: 150, status: 'Akan Datang' },
  { id: 3, nama: 'Pameran Seni Rupa', ukmf: 'UKM Seni Rupa', kategori: 'Seni', tanggal: '25 Feb 2026', tempat: 'Galeri Seni', peserta: 80, status: 'Selesai' },
  { id: 4, nama: 'Seminar Kewirausahaan', ukmf: 'UKM Kewirausahaan', kategori: 'Seminar', tanggal: '5 Mar 2026', tempat: 'Auditorium', peserta: 300, status: 'Pendaftaran Dibuka' },
  { id: 5, nama: 'Debat Bahasa Inggris', ukmf: 'UKM Bahasa', kategori: 'Lomba', tanggal: '10 Mar 2026', tempat: 'Ruang Seminar', peserta: 60, status: 'Akan Datang' },
]

function ManajemenEventUKMF() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('Semua')

  const filtered = daftarEvent.filter((e) => {
    const matchSearch = e.nama.toLowerCase().includes(search.toLowerCase()) || e.ukmf.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'Semua' || e.status === filter
    return matchSearch && matchFilter
  })

  return (
    <DashboardLayout role="admin-fakultas" userName="Nouval Rafiif Irwan" userRole="Admin Fakultas">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Manajemen Event UKMF</h2>
          <p className="mt-1 text-sm text-[#616161]">Kelola event yang diselenggarakan oleh UKM Fakultas.</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#999]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari event..."
                className="w-64 rounded-lg border border-[#d1d5db] py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-dark focus:ring-1 focus:ring-brand-dark"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-[#d1d5db] px-3 py-2 text-sm outline-none focus:border-brand-dark focus:ring-1 focus:ring-brand-dark"
            >
              <option value="Semua">Semua Status</option>
              <option value="Pendaftaran Dibuka">Pendaftaran Dibuka</option>
              <option value="Akan Datang">Akan Datang</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>
          <button
            onClick={() => navigate('/admin-fakultas/buat-event')}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Buat Event
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-white">
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide">Nama Event</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide">UKMF</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide">Kategori</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide">Tanggal</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide">Tempat</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide">Peserta</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-[#f9fafb]">
                    <td className="px-5 py-4 font-medium text-[#333]">{e.nama}</td>
                    <td className="px-5 py-4 text-[#616161]">{e.ukmf}</td>
                    <td className="px-5 py-4 text-[#616161]">{e.kategori}</td>
                    <td className="px-5 py-4 text-[#616161]">{e.tanggal}</td>
                    <td className="px-5 py-4 text-[#616161]">{e.tempat}</td>
                    <td className="px-5 py-4 text-[#616161]">{e.peserta} orang</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        e.status === 'Pendaftaran Dibuka'
                          ? 'bg-blue-100 text-blue-700'
                          : e.status === 'Akan Datang'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button className="text-[#616161] hover:text-[#333]">
                        <MoreVertical className="h-4 w-4" />
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

export default ManajemenEventUKMF
