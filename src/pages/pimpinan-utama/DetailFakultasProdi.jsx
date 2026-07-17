import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'

const dataFakultas = {
  Teknik: [
    { rank: 1, prodi: 'S1 Teknik Sipil', poin: 820, organisasi: 200, seminar: 150, prestasi: 100 },
    { rank: 2, prodi: 'S1 Teknik Mesin', poin: 780, organisasi: 180, seminar: 170, prestasi: 120 },
    { rank: 3, prodi: 'S1 Teknik Elektro', poin: 750, organisasi: 220, seminar: 130, prestasi: 80 },
    { rank: 4, prodi: 'S1 Arsitektur', poin: 720, organisasi: 190, seminar: 160, prestasi: 110 },
    { rank: 5, prodi: 'S1 Perencanaan Wilayah & Kota', poin: 690, organisasi: 210, seminar: 140, prestasi: 95 },
  ],
  MIPA: [
    { rank: 1, prodi: 'S1 Matematika', poin: 800, organisasi: 180, seminar: 170, prestasi: 120 },
    { rank: 2, prodi: 'S1 Fisika', poin: 760, organisasi: 170, seminar: 180, prestasi: 105 },
    { rank: 3, prodi: 'S1 Kimia', poin: 730, organisasi: 200, seminar: 150, prestasi: 100 },
    { rank: 4, prodi: 'S1 Biologi', poin: 700, organisasi: 190, seminar: 160, prestasi: 110 },
  ],
  Kedokteran: [
    { rank: 1, prodi: 'S1 Kedokteran', poin: 850, organisasi: 220, seminar: 130, prestasi: 80 },
    { rank: 2, prodi: 'S1 Psikologi', poin: 720, organisasi: 180, seminar: 170, prestasi: 120 },
  ],
  Hukum: [
    { rank: 1, prodi: 'S1 Hukum', poin: 790, organisasi: 190, seminar: 160, prestasi: 110 },
  ],
  'Ekonomi dan Bisnis': [
    { rank: 1, prodi: 'S1 Ekonomi', poin: 750, organisasi: 210, seminar: 140, prestasi: 95 },
    { rank: 2, prodi: 'S1 Manajemen', poin: 730, organisasi: 170, seminar: 180, prestasi: 105 },
  ],
  Pertanian: [
    { rank: 1, prodi: 'S1 Agroteknologi', poin: 710, organisasi: 170, seminar: 180, prestasi: 105 },
  ],
  Peternakan: [
    { rank: 1, prodi: 'S1 Peternakan', poin: 680, organisasi: 200, seminar: 150, prestasi: 100 },
  ],
  'Kedokteran Hewan': [
    { rank: 1, prodi: 'S1 Kedokteran Hewan', poin: 720, organisasi: 180, seminar: 170, prestasi: 120 },
  ],
  Keperawatan: [
    { rank: 1, prodi: 'S1 Keperawatan', poin: 700, organisasi: 220, seminar: 130, prestasi: 80 },
  ],
  Farmasi: [
    { rank: 1, prodi: 'S1 Farmasi', poin: 650, organisasi: 190, seminar: 160, prestasi: 110 },
  ],
  'Ilmu Budaya': [
    { rank: 1, prodi: 'S1 Sastra Inggris', poin: 690, organisasi: 210, seminar: 140, prestasi: 95 },
    { rank: 2, prodi: 'S1 Sejarah', poin: 660, organisasi: 170, seminar: 180, prestasi: 105 },
  ],
}

const daftarProdiFakultas = {
  Teknik: ['Semua Prodi', 'S1 Teknik Sipil', 'S1 Teknik Mesin', 'S1 Teknik Elektro', 'S1 Arsitektur'],
  MIPA: ['Semua Prodi', 'S1 Matematika', 'S1 Fisika', 'S1 Kimia', 'S1 Biologi'],
  Kedokteran: ['Semua Prodi', 'S1 Kedokteran', 'S1 Psikologi'],
  Hukum: ['Semua Prodi', 'S1 Hukum'],
  'Ekonomi dan Bisnis': ['Semua Prodi', 'S1 Ekonomi', 'S1 Manajemen'],
  Pertanian: ['Semua Prodi', 'S1 Agroteknologi'],
  Peternakan: ['Semua Prodi', 'S1 Peternakan'],
  'Kedokteran Hewan': ['Semua Prodi', 'S1 Kedokteran Hewan'],
  Keperawatan: ['Semua Prodi', 'S1 Keperawatan'],
  Farmasi: ['Semua Prodi', 'S1 Farmasi'],
  'Ilmu Budaya': ['Semua Prodi', 'S1 Sastra Inggris', 'S1 Sejarah'],
}

function HorizontalStackedBar({ data }) {
  const maxVal = Math.max(...data.map(d => d.poin))
  const bands = [
    { key: 'organisasi', color: '#3b82f6', label: 'organisasi' },
    { key: 'prestasi', color: '#eab308', label: 'prestasi' },
    { key: 'seminar', color: '#15803d', label: 'seminar' },
  ]

  return (
    <div>
      <div className="space-y-3">
        {data.map(d => {
          const pctPoin = (d.poin / maxVal) * 100
          const pctOrg = (d.organisasi / d.poin) * pctPoin
          const pctPre = (d.prestasi / d.poin) * pctPoin
          const pctSem = (d.seminar / d.poin) * pctPoin
          return (
            <div key={d.prodi} className="flex items-center gap-3">
              <span className="w-[170px] text-xs font-medium text-brand-dark text-right shrink-0 truncate" title={d.prodi}>{d.prodi}</span>
              <div className="flex-1 h-6 rounded overflow-hidden bg-gray-100 flex">
                <div style={{ width: `${pctOrg}%`, backgroundColor: '#3b82f6', minWidth: pctOrg > 0 ? '4px' : 0 }} title={`Organisasi: ${d.organisasi}`} />
                <div style={{ width: `${pctPre}%`, backgroundColor: '#eab308', minWidth: pctPre > 0 ? '4px' : 0 }} title={`Prestasi: ${d.prestasi}`} />
                <div style={{ width: `${pctSem}%`, backgroundColor: '#15803d', minWidth: pctSem > 0 ? '4px' : 0 }} title={`Seminar: ${d.seminar}`} />
              </div>
              <span className="w-12 text-xs font-semibold text-brand-dark text-right shrink-0">{d.poin}</span>
            </div>
          )
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-[#616161]">
        {bands.map(b => (
          <span key={b.key} className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: b.color }} />
            {b.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function DetailFakultasProdi() {
  const { fakultas } = useParams()
  const decodedFakultas = decodeURIComponent(fakultas)
  const [selectedProdi, setSelectedProdi] = useState('Semua Prodi')

  const prodiList = dataFakultas[decodedFakultas] || []
  const chartData = selectedProdi === 'Semua Prodi' ? prodiList : prodiList.filter(p => p.prodi === selectedProdi)
  const totalPoin = prodiList.reduce((sum, p) => sum + p.poin, 0)
  const rataRata = prodiList.length ? Math.round(totalPoin / prodiList.length) : 0
  const poinTertinggi = prodiList.length ? Math.max(...prodiList.map(p => p.poin)) : 0

  const filteredProdi = selectedProdi === 'Semua Prodi'
    ? prodiList
    : prodiList.filter(p => p.prodi === selectedProdi)

  return (
    <DashboardLayout role="pimpinan-utama" userName="Dr. Efa Yonnedi, SE. MPPM, Akt, CA, CRGP" userRole="Pimpinan Utama (Rektor)">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="bg-gradient-to-r from-brand-dark to-brand-light bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl">Fakultas {decodedFakultas}</h2>
          <p className="mt-1 text-sm text-[#616161]">Detail program studi dan poin capaian mahasiswa.</p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-brand-dark">Pilih Program Studi</label>
          <div className="relative">
            <select value={selectedProdi} onChange={e => setSelectedProdi(e.target.value)}
              className="appearance-none rounded-lg border border-[#e9ebf8] bg-white py-2.5 pl-4 pr-10 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark">
              {(daftarProdiFakultas[decodedFakultas] || ['Semua Prodi']).map(p => <option key={p}>{p}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#616161]" />
          </div>
        </div>

        {/* Grafik */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-brand-dark">Grafik Poin per Program Studi</h3>
          <HorizontalStackedBar data={chartData} />
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-300 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold tracking-wide text-emerald-700">TOTAL PROGRAM STUDI</p>
            <p className="mt-2 text-3xl font-extrabold text-brand-dark">{prodiList.length}</p>
          </div>
          <div className="rounded-xl border border-emerald-300 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold tracking-wide text-emerald-700">RATA-RATA POIN</p>
            <p className="mt-2 text-3xl font-extrabold text-brand-dark">{rataRata}</p>
          </div>
          <div className="rounded-xl border border-emerald-300 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold tracking-wide text-emerald-700">POIN TERTINGGI</p>
            <p className="mt-2 text-3xl font-extrabold text-brand-dark">{poinTertinggi}</p>
          </div>
        </div>

        {/* Tabel Ranking Prodi */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-brand-dark">Ranking Program Studi</h3>
          <p className="text-sm text-[#616161] mb-4">Daftar peringkat program studi di Fakultas {decodedFakultas}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#e9ebf8] text-xs font-semibold uppercase tracking-wide text-[#616161]">
                  <th className="py-3 pr-4">Peringkat</th>
                  <th className="py-3 pr-4">Program Studi</th>
                  <th className="py-3 text-right">Total Poin</th>
                </tr>
              </thead>
              <tbody>
                {filteredProdi.map(item => (
                  <tr key={item.rank} className="border-b border-[#e9ebf8] last:border-0">
                    <td className="py-3 pr-4">
                      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${
                        item.rank === 1 ? 'bg-yellow-500' :
                        item.rank === 2 ? 'bg-gray-400' :
                        item.rank === 3 ? 'bg-amber-700' : 'bg-[#e9ebf8] text-[#616161]'
                      }`}>
                        {item.rank}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-medium text-brand-dark">{item.prodi}</td>
                    <td className="py-3 text-right font-semibold text-brand-dark">{item.poin}</td>
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

export default DetailFakultasProdi