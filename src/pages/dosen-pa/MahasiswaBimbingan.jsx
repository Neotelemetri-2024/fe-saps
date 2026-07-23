import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import ProgressBar from '../../components/dashboard/ProgressBar'

const mahasiswaList = [
  { nama: 'Shafa Salsabilla', nim: '2311121063', prodi: 'Teknik Mesin', angkatan: '2023', ipk: '3.80', poin: 470, status: 'Aktif' },
  { nama: 'Ahmad Fauzi', nim: '2311121064', prodi: 'Teknik Mesin', angkatan: '2023', ipk: '2.75', poin: 180, status: 'Aktif' },
  { nama: 'Siti Nurhaliza', nim: '2311121065', prodi: 'Teknik Industri', angkatan: '2023', ipk: '3.60', poin: 320, status: 'Aktif' },
  { nama: 'Budi Santoso', nim: '2311121066', prodi: 'Teknik Sipil', angkatan: '2023', ipk: '3.20', poin: 250, status: 'Aktif' },
  { nama: 'Dewi Lestari', nim: '2311121067', prodi: 'Informatika', angkatan: '2023', ipk: '3.90', poin: 490, status: 'Aktif' },
  { nama: 'Rizky Pratama', nim: '2311121068', prodi: 'Teknik Mesin', angkatan: '2023', ipk: '2.50', poin: 150, status: 'Aktif' },
  { nama: 'Anisa Putri', nim: '2311121069', prodi: 'Teknik Industri', angkatan: '2023', ipk: '3.45', poin: 290, status: 'Aktif' },
]

function MahasiswaBimbingan() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filterProdi, setFilterProdi] = useState('')

  const filtered = mahasiswaList.filter((m) => {
    const q = search.toLowerCase()
    const matchSearch = m.nama.toLowerCase().includes(q) || m.nim.includes(q)
    const matchProdi = !filterProdi || m.prodi === filterProdi
    return matchSearch && matchProdi
  })

  return (
    <DashboardLayout role="dosen-pa" userName="Dr. Efa Yonnedi, SE, MPPM, Akt, CA, CRGP" userRole="Dosen Pembimbing">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#e9ebf8] bg-white p-4 shadow-sm">
          <div className="flex flex-1 min-w-[180px] items-center gap-3 rounded-lg border border-[#e9ebf8] px-4 py-2">
            <Search className="h-4 w-4 text-[#9aa0a6]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari mahasiswa..."
              className="flex-1 text-sm outline-none"
            />
          </div>
          <select
            value={filterProdi}
            onChange={(e) => setFilterProdi(e.target.value)}
            className="rounded-lg border border-[#e9ebf8] px-4 py-2 text-sm text-[#333] outline-none"
          >
            <option value="">Semua Prodi</option>
            <option>Teknik Mesin</option>
            <option>Teknik Industri</option>
            <option>Teknik Sipil</option>
            <option>Informatika</option>
          </select>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-left text-xs font-semibold uppercase tracking-wide text-white">
                <th className="whitespace-nowrap px-4 py-3 text-left">Nama</th>
                <th className="whitespace-nowrap px-4 py-3 text-left">NIM</th>
                <th className="whitespace-nowrap px-4 py-3 text-left">Prodi</th>
                <th className="whitespace-nowrap px-4 py-3 text-left">Angkatan</th>
                <th className="whitespace-nowrap px-4 py-3 text-left">IPK</th>
                <th className="whitespace-nowrap px-4 py-3 text-left">Poin</th>
                <th className="whitespace-nowrap px-4 py-3 text-left">Status</th>
                <th className="whitespace-nowrap px-4 py-3 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.nim} className="border-b border-[#e9ebf8] last:border-0 hover:bg-[#f9fafb]">
                  <td className="px-4 py-3 font-medium text-[#333]">{m.nama}</td>
                  <td className="px-4 py-3 text-[#616161]">{m.nim}</td>
                  <td className="px-4 py-3 text-[#616161]">{m.prodi}</td>
                  <td className="px-4 py-3 text-[#616161]">{m.angkatan}</td>
                  <td className="px-4 py-3">{m.ipk}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16">
                        <ProgressBar value={m.poin} max={550} height={5} />
                      </div>
                      <span className="text-xs text-[#616161]">{m.poin}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">{m.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/dosen-pa/lihat-detail/${m.nim}`, { state: { mahasiswa: m } })}
                      className="text-xs font-semibold text-brand-light hover:underline"
                    >
                      Lihat Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default MahasiswaBimbingan
