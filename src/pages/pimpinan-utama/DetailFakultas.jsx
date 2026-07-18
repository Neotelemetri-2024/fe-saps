import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Eye } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'

const daftarFakultas = ['Teknik', 'MIPA', 'Kedokteran', 'Hukum', 'Ekonomi dan Bisnis', 'Pertanian', 'Peternakan', 'Kedokteran Hewan', 'Keperawatan', 'Farmasi', 'Ilmu Budaya']

const rankingFakultas = [
  { rank: 1, fakultas: 'Teknik', organisasi: 200, seminar: 150, prestasi: 100, total: 450 },
  { rank: 2, fakultas: 'MIPA', organisasi: 180, seminar: 170, prestasi: 120, total: 470 },
  { rank: 3, fakultas: 'Kedokteran', organisasi: 220, seminar: 130, prestasi: 80, total: 430 },
  { rank: 4, fakultas: 'Hukum', organisasi: 190, seminar: 160, prestasi: 110, total: 460 },
  { rank: 5, fakultas: 'Ekonomi', organisasi: 210, seminar: 140, prestasi: 95, total: 445 },
  { rank: 6, fakultas: 'Pertanian', organisasi: 170, seminar: 180, prestasi: 105, total: 455 },
  { rank: 7, fakultas: 'Peternakan', organisasi: 200, seminar: 150, prestasi: 100, total: 450 },
  { rank: 8, fakultas: 'Kedokteran Hewan', organisasi: 180, seminar: 170, prestasi: 120, total: 470 },
  { rank: 9, fakultas: 'Keperawatan', organisasi: 220, seminar: 130, prestasi: 80, total: 430 },
  { rank: 10, fakultas: 'Farmasi', organisasi: 190, seminar: 160, prestasi: 110, total: 460 },
  { rank: 11, fakultas: 'Ilmu Budaya', organisasi: 210, seminar: 140, prestasi: 95, total: 445 },
]

function DetailFakultas() {
  const [selectedFakultas, setSelectedFakultas] = useState('Semua Fakultas')
  const navigate = useNavigate()

  return (
    <DashboardLayout role="pimpinan-utama" userName="Dr. Efa Yonnedi, SE. MPPM, Akt, CA, CRGP" userRole="Pimpinan Utama (Rektor)">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="bg-gradient-to-r from-brand-dark to-brand-light bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl">Detail Fakultas</h2>
          <p className="mt-1 text-sm text-[#616161]">Lihat peringkat dan rincian poin setiap fakultas.</p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-brand-dark">Pilih Fakultas</label>
          <div className="relative">
            <select value={selectedFakultas} onChange={e => setSelectedFakultas(e.target.value)}
              className="appearance-none rounded-lg border border-[#e9ebf8] bg-white py-2.5 pl-4 pr-10 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark">
              <option>Semua Fakultas</option>
              {daftarFakultas.map(f => <option key={f}>{f}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#616161]" />
          </div>
        </div>

        {/* Tabel Ranking Fakultas */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-brand-dark">Ranking Fakultas</h3>
          <p className="text-sm text-[#616161] mb-4">Daftar peringkat fakultas berdasarkan total poin</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-left text-xs font-semibold uppercase tracking-wide text-white">
                  <th className="whitespace-nowrap px-4 py-3">Peringkat</th>
                  <th className="whitespace-nowrap px-4 py-3">Fakultas</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">Organisasi</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">Seminar</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">Prestasi</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">Total Poin</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rankingFakultas.map(item => (
                  <tr key={item.rank} className="border-b border-[#e9ebf8] last:border-0 hover:bg-gray-50">
                    <td className="py-3 pr-4">
                      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${
                        item.rank === 1 ? 'bg-yellow-500' :
                        item.rank === 2 ? 'bg-gray-400' :
                        item.rank === 3 ? 'bg-amber-700' : 'bg-[#e9ebf8] text-[#616161]'
                      }`}>
                        {item.rank}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-medium text-brand-dark">{item.fakultas}</td>
                    <td className="py-3 pr-4 text-right text-[#333]">{item.organisasi}</td>
                    <td className="py-3 pr-4 text-right text-[#333]">{item.seminar}</td>
                    <td className="py-3 pr-4 text-right text-[#333]">{item.prestasi}</td>
                    <td className="py-3 pr-4 text-right font-semibold text-brand-dark">{item.total}</td>
                    <td className="py-3 text-right">
                      <button onClick={() => navigate(`/pimpinan-utama/detail-fakultas/${encodeURIComponent(item.fakultas)}`)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-dark px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-light">
                        <Eye className="h-3.5 w-3.5" /> Detail
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

export default DetailFakultas