import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'

// ── DATA ──
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
  Hukum: [{ rank: 1, prodi: 'S1 Hukum', poin: 790, organisasi: 190, seminar: 160, prestasi: 110 }],
  'Ekonomi dan Bisnis': [
    { rank: 1, prodi: 'S1 Ekonomi', poin: 750, organisasi: 210, seminar: 140, prestasi: 95 },
    { rank: 2, prodi: 'S1 Manajemen', poin: 730, organisasi: 170, seminar: 180, prestasi: 105 },
  ],
  Pertanian: [{ rank: 1, prodi: 'S1 Agroteknologi', poin: 710, organisasi: 170, seminar: 180, prestasi: 105 }],
  Peternakan: [{ rank: 1, prodi: 'S1 Peternakan', poin: 680, organisasi: 200, seminar: 150, prestasi: 100 }],
  'Kedokteran Hewan': [{ rank: 1, prodi: 'S1 Kedokteran Hewan', poin: 720, organisasi: 180, seminar: 170, prestasi: 120 }],
  Keperawatan: [{ rank: 1, prodi: 'S1 Keperawatan', poin: 700, organisasi: 220, seminar: 130, prestasi: 80 }],
  Farmasi: [{ rank: 1, prodi: 'S1 Farmasi', poin: 650, organisasi: 190, seminar: 160, prestasi: 110 }],
  'Ilmu Budaya': [
    { rank: 1, prodi: 'S1 Sastra Inggris', poin: 690, organisasi: 210, seminar: 140, prestasi: 95 },
    { rank: 2, prodi: 'S1 Sejarah', poin: 660, organisasi: 170, seminar: 180, prestasi: 105 },
  ],
}

const daftarProdiFakultas = {
  Teknik: ['Semua Prodi', 'S1 Teknik Sipil', 'S1 Teknik Mesin', 'S1 Teknik Elektro', 'S1 Arsitektur', 'S1 Perencanaan Wilayah & Kota'],
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

// ── KategoriPoinBar (mini stacked bar di tabel) ──
function KategoriPoinBar({ organisasi, prestasi, seminar, total }) {
  const pctOrg = (organisasi / total) * 100
  const pctPre = (prestasi / total) * 100
  const pctSem = (seminar / total) * 100
  return (
    <div className="flex h-2.5 w-32 overflow-hidden rounded-full bg-[#e9ebf8]">
      <div style={{ width: `${pctSem}%` }} className="bg-[#15803d]" title={`Seminar: ${seminar}`} />
      <div style={{ width: `${pctOrg}%` }} className="bg-[#3b82f6]" title={`Organisasi: ${organisasi}`} />
      <div style={{ width: `${pctPre}%` }} className="bg-[#eab308]" title={`Prestasi: ${prestasi}`} />
    </div>
  )
}

// ── HorizontalStackedBar ──
function HorizontalStackedBar({ data }) {
  const maxVal = Math.max(...data.map(d => d.poin), 1)
  const bands = [
    { key: 'organisasi', color: '#3b82f6', label: 'organisasi' },
    { key: 'seminar', color: '#15803d', label: 'seminar' },
    { key: 'prestasi', color: '#eab308', label: 'prestasi' },
  ]
  return (
    <div>
      <div className="space-y-4">
        {data.map(d => {
          const pctPoin = (d.poin / maxVal) * 100
          const pctOrg = (d.organisasi / d.poin) * pctPoin
          const pctPre = (d.prestasi / d.poin) * pctPoin
          const pctSem = (d.seminar / d.poin) * pctPoin
          return (
            <div key={d.prodi} className="flex items-center gap-3">
              <span className="w-[140px] text-xs font-semibold text-brand-dark text-right shrink-0 truncate" title={d.prodi}>{d.prodi}</span>
              <div className="flex-1 h-7 rounded-md overflow-hidden bg-[#f9fafb] flex border border-[#e9ebf8]">
                <div style={{ width: `${pctSem}%` }} className="bg-[#15803d]" title={`Seminar: ${d.seminar}`} />
                <div style={{ width: `${pctOrg}%` }} className="bg-[#3b82f6]" title={`Organisasi: ${d.organisasi}`} />
                <div style={{ width: `${pctPre}%` }} className="bg-[#eab308]" title={`Prestasi: ${d.prestasi}`} />
              </div>
              <span className="w-12 text-xs font-bold text-brand-dark text-left shrink-0">{d.poin}</span>
            </div>
          )
        })}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-xs font-medium text-[#616161]">
        {bands.map(b => (
          <span key={b.key} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded" style={{ backgroundColor: b.color }} />
            {b.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── SvgDoughnut ──
function SvgDoughnut({ centerValue, centerLabel, sections, size = 'h-44 w-44' }) {
  return (
    <div className={`relative ${size} flex items-center justify-center`}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 42 42">
        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#eef0f7" strokeWidth="4.5" />
        {sections.reduce((acc, cur, i) => {
          const offset = 100 - acc.totalOffset
          acc.elements.push(
            <circle key={i} cx="21" cy="21" r="15.915" fill="transparent" stroke={cur.color} strokeWidth="4.5"
              strokeDasharray={`${cur.percentage} ${100 - cur.percentage}`} strokeDashoffset={offset} />
          )
          acc.totalOffset += cur.percentage
          return acc
        }, { elements: [], totalOffset: 0 }).elements}
      </svg>
      <div className="absolute text-center">
        <p className="text-[10px] font-semibold text-[#9aa0a6] uppercase tracking-wider leading-none">Total</p>
        <p className="text-2xl font-extrabold text-brand-dark my-0.5">{centerValue}</p>
        <p className="text-[10px] font-medium text-[#616161] leading-none">{centerLabel}</p>
      </div>
    </div>
  )
}

// ── MAIN ──
function DetailFakultasProdi() {
  const { fakultas } = useParams()
  const decodedFakultas = decodeURIComponent(fakultas)
  const [selectedProdi, setSelectedProdi] = useState('Semua Prodi')

  const prodiList = dataFakultas[decodedFakultas] || []
  const chartData = selectedProdi === 'Semua Prodi' ? prodiList : prodiList.filter(p => p.prodi === selectedProdi)
  const filteredProdi = selectedProdi === 'Semua Prodi' ? prodiList : prodiList.filter(p => p.prodi === selectedProdi)
  const totalMahasiswa = prodiList.length * 400

  const mhsColors = ['#B34F00', '#DE350B', '#42B883', '#0052CC', '#FFAB00']
  const mhsSections = prodiList.map((p, idx) => ({
    percentage: 100 / prodiList.length,
    color: mhsColors[idx % mhsColors.length],
    label: p.prodi,
  }))

  return (
    <DashboardLayout role="pimpinan-utama" userName="Dr. Efa Yonnedi, SE. MPPM, Akt, CA, CRGP" userRole="Pimpinan Utama (Rektor)">
      <div className="space-y-6">
        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="bg-gradient-to-r from-brand-dark to-brand-light bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl">
              Fakultas {decodedFakultas}
            </h2>
            <p className="mt-1 text-sm text-[#616161]">Detail program studi dan poin capaian mahasiswa.</p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-center">
            <label className="text-sm font-semibold text-[#333] whitespace-nowrap">Filter Prodi</label>
            <div className="relative">
              <select value={selectedProdi} onChange={e => setSelectedProdi(e.target.value)}
                className="appearance-none rounded-lg border border-[#e9ebf8] bg-white py-2 pl-4 pr-10 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark cursor-pointer">
                {(daftarProdiFakultas[decodedFakultas] || ['Semua Prodi']).map(p => <option key={p}>{p}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#616161]" />
            </div>
          </div>
        </div>

        {/* ── KURIKULUM AKTIF ── */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-brand-dark">Kurikulum Aktif</h3>
            <p className="text-sm font-semibold text-[#333] mt-1">Kurikulum soft skill berjenjang 2024</p>
            <p className="text-xs text-[#616161] mt-0.5">2024/2025  •  {totalMahasiswa.toLocaleString()} Mahasiswa Terdaftar</p>
          </div>
          <span className="rounded-full bg-gradient-to-r from-brand-dark to-brand-light px-4 py-1 text-xs font-bold text-white shadow-sm">
            Aktif
          </span>
        </div>

        {/* ── PERINGKAT PRODI ── */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e9ebf8]">
            <h3 className="text-lg font-bold text-brand-dark">Peringkat Prodi</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-left text-xs font-semibold uppercase tracking-wide text-white">
                  <th className="px-4 py-3 text-center w-20">RANKING</th>
                  <th className="px-4 py-3 text-center">PROGRAM STUDI</th>
                  <th className="px-4 py-3 w-32 text-center">TOTAL POIN</th>
                  <th className="px-4 py-3 w-40 text-center">KATEGORI POIN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef0f7]">
                {filteredProdi.map(item => (
                  <tr key={item.rank} className="hover:bg-[#f9fafb] transition duration-150">
                    <td className="px-4 py-4 text-center text-[#616161] font-semibold">{item.rank}.</td>
                    <td className="px-4 py-4 text-brand-dark font-semibold">{item.prodi}</td>
                    <td className="px-4 py-4 font-bold text-[#333]">{item.poin}</td>
                    <td className="px-4 py-4">
                      <KategoriPoinBar organisasi={item.organisasi} prestasi={item.prestasi} seminar={item.seminar} total={item.poin} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-[#e9ebf8] px-6 py-3 text-xs text-[#616161]">
            Menampilkan 1-{filteredProdi.length} dari {prodiList.length} Program Studi
          </div>
        </div>

        {/* ── ROW: RATA-RATA + TOTAL MAHASISWA ── */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
          <div className="md:col-span-3 rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
            <h3 className="text-center text-lg font-bold text-brand-dark mb-6">Rata rata Capaian per prodi</h3>
            <HorizontalStackedBar data={chartData} />
          </div>
          <div className="md:col-span-2 rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm flex flex-col items-center">
            <h3 className="text-center text-lg font-bold text-brand-dark mb-4">Total mahasiswa</h3>
            <SvgDoughnut centerValue={totalMahasiswa.toLocaleString()} centerLabel="Mahasiswa" sections={mhsSections} />
            <div className="w-full space-y-2 mt-6 text-xs font-semibold">
              {prodiList.map((p, idx) => (
                <div key={p.prodi} className="flex items-center justify-between text-[#616161]">
                  <div className="flex items-center gap-2.5 truncate max-w-[80%]">
                    <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: mhsColors[idx % mhsColors.length] }} />
                    <span className="truncate">{p.prodi}</span>
                  </div>
                  <span className="text-[#9aa0a6] font-bold">{Math.round(100 / prodiList.length)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── POIN BERDASARKAN SKALA KEGIATAN ── */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="text-lg text-center font-bold text-brand-dark mb-6">Poin Berdasarkan Skala Kegiatan</h3>
          <div className="flex flex-col sm:flex-row items-center justify-around gap-8">
            <SvgDoughnut
              centerValue={totalMahasiswa.toLocaleString()}
              centerLabel="Mahasiswa"
              sections={[
                { percentage: 10, color: '#9B5DE5' },
                { percentage: 20, color: '#1D3557' },
                { percentage: 50, color: '#FF9F1C' },
                { percentage: 20, color: '#1A3A2B' },
              ]}
            />
            <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-xs font-semibold">
              <div className="flex items-center gap-3 text-[#616161]">
                <span className="h-3 w-3 rounded-sm bg-[#9B5DE5]" />
                <span>International</span>
              </div>
              <div className="flex items-center gap-3 text-[#616161]">
                <span className="h-3 w-3 rounded-sm bg-[#1D3557]" />
                <span>Nasional</span>
              </div>
              <div className="flex items-center gap-3 text-[#616161]">
                <span className="h-3 w-3 rounded-sm bg-[#FF9F1C]" />
                <span>Regional</span>
              </div>
              <div className="flex items-center gap-3 text-[#616161]">
                <span className="h-3 w-3 rounded-sm bg-[#1A3A2B]" />
                <span>Universitas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default DetailFakultasProdi