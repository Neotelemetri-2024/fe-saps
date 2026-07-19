import Swal from 'sweetalert2'
import { Filter, Search } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'

const klaimData = [
  { no: 1, mahasiswa: 'AURA NEVIA', nim: '2311121053', prodi: 'Teknik komputer', kegiatan: 'Lomba hackathon', kategori: 'Kompetisi Nasional', peran: 'Juara 1', tanggal: '8 Feb - 15 Feb 2026', info: 'Hima Teknologi Informasi Universitas Andalas', status: 'pending' },
  { no: 2, mahasiswa: 'AURA NEVIA', nim: '2311121053', prodi: 'Teknik komputer', kegiatan: 'Lomba hackathon', kategori: 'Kompetisi Nasional', peran: 'Juara 1', tanggal: '8 Feb - 15 Feb 2026', info: 'Hima Teknologi Informasi Universitas Andalas', status: 'pending' },
  { no: 3, mahasiswa: 'AURA NEVIA', nim: '2311121053', prodi: 'Teknik komputer', kegiatan: 'Lomba hackathon', kategori: 'Kompetisi Nasional', peran: 'Juara 1', tanggal: '8 Feb - 15 Feb 2026', info: 'Hima Teknologi Informasi Universitas Andalas', status: 'pending' },
]

function VerifikasiKlaimPoin() {
  const handleDetail = (item) => {
    Swal.fire({
      title: 'Detail dan Verifikasi',
      html: `<b>${item.mahasiswa}</b><br/>${item.kegiatan}<br/>${item.kategori}`,
      icon: 'info',
      confirmButtonText: 'Tutup',
      confirmButtonColor: '#1C4122',
    })
  }

  return (
    <DashboardLayout role="admin-ditmawa" userName="Dr. Efa Yonnedi, SE. MPPM, Akt, CA, CRGP" userRole="Dosen Pembimbing">
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Verifikasi Klaim Poin Kegiatan Eksternal</h2>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#cfd6df] bg-white px-4 py-2.5 shadow-sm">
              <Search className="h-4 w-4 shrink-0 text-[#9aa0a6]" />
              <input type="text" placeholder="Cari mahasiswa atau kegiatan..." className="w-full text-sm outline-none" />
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-light px-10 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark">
              <Filter className="h-4 w-4" /> Filter
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {['Kategori', 'Peran', 'Status', 'Skala', 'Tahun'].map((label) => (
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

        <div className="overflow-hidden rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-xs font-semibold uppercase tracking-wide text-white">
                  <th className="px-4 py-3">No</th>
                  <th className="px-4 py-3">Mahasiswa</th>
                  <th className="px-4 py-3">Kegiatan</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Peran</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Info Penyelenggara</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {klaimData.map((item) => (
                  <tr key={item.no} className="border-b border-[#e9ebf8] last:border-0 hover:bg-[#f9fafb]">
                    <td className="px-4 py-3 text-[#616161]">{item.no}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-brand-dark">{item.mahasiswa}</p>
                      <p className="text-[11px] text-[#9aa0a6]">{item.nim}</p>
                      <p className="text-[11px] text-[#9aa0a6]">{item.prodi}</p>
                    </td>
                    <td className="px-4 py-3 text-[#616161]">{item.kegiatan}</td>
                    <td className="px-4 py-3 text-brand-light">{item.kategori}</td>
                    <td className="px-4 py-3 text-[#616161]">{item.peran}</td>
                    <td className="px-4 py-3 text-[#616161]">{item.tanggal}</td>
                    <td className="px-4 py-3 text-xs text-[#616161]">{item.info}</td>
                    <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDetail(item)} className="whitespace-nowrap rounded-full border border-brand-dark px-3 py-1.5 text-xs font-semibold text-brand-dark transition hover:bg-brand-dark hover:text-white">
                        Detail dan verifikasi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-[#e9ebf8] px-4 py-3 text-xs text-[#616161] sm:flex-row sm:items-center sm:justify-between">
            <span>Showing 1 - 10 From Total 592</span>
            <span>Page 1 of 54</span>
            <div className="flex items-center gap-1">
              <button className="rounded px-2 py-1 hover:bg-[#f0f4f0]">Previous</button>
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
    </DashboardLayout>
  )
}

export default VerifikasiKlaimPoin
