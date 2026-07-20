import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'

const initialData = [
  { no: 1, kegiatan: 'Pelatihan Kewirausahaan', jenis: 'Pelatihan', skala: 'Fakultas', tgl: '12 Jul 2026', status: 'disetujui' },
  { no: 2, kegiatan: 'Seminar Karir', jenis: 'Seminar', skala: 'Fakultas', tgl: '10 Jul 2026', status: 'pending' },
  { no: 3, kegiatan: 'Bakti Sosial', jenis: 'Bakti', skala: 'Lokal', tgl: '8 Jul 2026', status: 'ditolak' },
  { no: 4, kegiatan: 'Workshop Digital', jenis: 'Workshop', skala: 'Fakultas', tgl: '5 Jul 2026', status: 'disetujui' },
]

function DaftarKegiatan() {
  const location = useLocation()
  const [data, setData] = useState(initialData)

  useEffect(() => {
    if (location.state?.kegiatanBaru) {
      const kb = location.state.kegiatanBaru
      setData((prev) => [...prev, { no: prev.length + 1, ...kb, status: 'pending' }])
      window.history.replaceState({}, '')
    }
  }, [location.state])

  return (
    <DashboardLayout role="ukmf" userName="Operator UKMF" userRole="Operator UKMF">
      <div className="space-y-5">
        <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Daftar Kegiatan UKMF</h2>

        <div className="overflow-hidden rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-left text-xs font-semibold uppercase tracking-wide text-white">
                  <th className="whitespace-nowrap px-6 py-3">No</th>
                  <th className="whitespace-nowrap px-6 py-3">Kegiatan</th>
                  <th className="whitespace-nowrap px-6 py-3">Jenis</th>
                  <th className="whitespace-nowrap px-6 py-3">Skala</th>
                  <th className="whitespace-nowrap px-6 py-3">Tanggal</th>
                  <th className="whitespace-nowrap px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.no} className="border-b border-[#e9ebf8] last:border-0 hover:bg-[#f9fafb]">
                    <td className="px-6 py-3 text-[#616161]">{r.no}</td>
                    <td className="px-6 py-3 font-medium text-[#333]">{r.kegiatan}</td>
                    <td className="px-6 py-3 text-[#616161]">{r.jenis}</td>
                    <td className="px-6 py-3 text-[#616161]">{r.skala}</td>
                    <td className="px-6 py-3 text-[#616161]">{r.tgl}</td>
                    <td className="px-6 py-3"><StatusBadge status={r.status} /></td>
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

export default DaftarKegiatan