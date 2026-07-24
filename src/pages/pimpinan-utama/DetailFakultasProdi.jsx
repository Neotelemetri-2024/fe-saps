import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'

// ── KONSTANTA KATEGORI ──
// Satu sumber kebenaran untuk urutan + warna, dipakai bar dan legenda.
const KATEGORI = [
  { key: 'organisasi', color: '#3b82f6', label: 'Organisasi' },
  { key: 'seminar', color: '#15803d', label: 'Seminar' },
  { key: 'prestasi', color: '#eab308', label: 'Prestasi' },
]

// ── DATA ──
// organisasi + seminar + prestasi SELALU = poin.
const dataFakultas = {
  Teknik: [
    { rank: 1, prodi: 'S1 Teknik Sipil', poin: 820, organisasi: 360, seminar: 280, prestasi: 180, mahasiswa: 420 },
    { rank: 2, prodi: 'S1 Teknik Mesin', poin: 780, organisasi: 300, seminar: 280, prestasi: 200, mahasiswa: 380 },
    { rank: 3, prodi: 'S1 Teknik Elektro', poin: 750, organisasi: 380, seminar: 230, prestasi: 140, mahasiswa: 350 },
    { rank: 4, prodi: 'S1 Arsitektur', poin: 720, organisasi: 300, seminar: 250, prestasi: 170, mahasiswa: 260 },
    { rank: 5, prodi: 'S1 Perencanaan Wilayah & Kota', poin: 690, organisasi: 330, seminar: 220, prestasi: 140, mahasiswa: 210 },
  ],
  MIPA: [
    { rank: 1, prodi: 'S1 Matematika', poin: 800, organisasi: 320, seminar: 300, prestasi: 180, mahasiswa: 240 },
    { rank: 2, prodi: 'S1 Fisika', poin: 760, organisasi: 300, seminar: 310, prestasi: 150, mahasiswa: 200 },
    { rank: 3, prodi: 'S1 Kimia', poin: 730, organisasi: 330, seminar: 250, prestasi: 150, mahasiswa: 220 },
    { rank: 4, prodi: 'S1 Biologi', poin: 700, organisasi: 300, seminar: 250, prestasi: 150, mahasiswa: 230 },
  ],
  Kedokteran: [
    { rank: 1, prodi: 'S1 Kedokteran', poin: 850, organisasi: 400, seminar: 250, prestasi: 200, mahasiswa: 480 },
    { rank: 2, prodi: 'S1 Psikologi', poin: 720, organisasi: 290, seminar: 270, prestasi: 160, mahasiswa: 300 },
  ],
  Hukum: [
    { rank: 1, prodi: 'S1 Hukum', poin: 790, organisasi: 320, seminar: 280, prestasi: 190, mahasiswa: 620 },
  ],
  'Ekonomi dan Bisnis': [
    { rank: 1, prodi: 'S1 Ekonomi', poin: 750, organisasi: 330, seminar: 250, prestasi: 170, mahasiswa: 340 },
    { rank: 2, prodi: 'S1 Manajemen', poin: 730, organisasi: 290, seminar: 290, prestasi: 150, mahasiswa: 460 },
  ],
  Pertanian: [
    { rank: 1, prodi: 'S1 Agroteknologi', poin: 710, organisasi: 280, seminar: 290, prestasi: 140, mahasiswa: 280 },
  ],
  Peternakan: [
    { rank: 1, prodi: 'S1 Peternakan', poin: 680, organisasi: 300, seminar: 240, prestasi: 140, mahasiswa: 260 },
  ],
  'Kedokteran Hewan': [
    { rank: 1, prodi: 'S1 Kedokteran Hewan', poin: 720, organisasi: 290, seminar: 270, prestasi: 160, mahasiswa: 190 },
  ],
  Keperawatan: [
    { rank: 1, prodi: 'S1 Keperawatan', poin: 700, organisasi: 340, seminar: 220, prestasi: 140, mahasiswa: 240 },
  ],
  Farmasi: [
    { rank: 1, prodi: 'S1 Farmasi', poin: 650, organisasi: 280, seminar: 240, prestasi: 130, mahasiswa: 210 },
  ],
  'Ilmu Budaya': [
    { rank: 1, prodi: 'S1 Sastra Inggris', poin: 690, organisasi: 320, seminar: 230, prestasi: 140, mahasiswa: 180 },
    { rank: 2, prodi: 'S1 Sejarah', poin: 660, organisasi: 270, seminar: 260, prestasi: 130, mahasiswa: 150 },
  ],
}

// Daftar prodi untuk dropdown diturunkan dari dataFakultas
// supaya tidak pernah lagi keluar dari sinkron.
const daftarProdiFakultas = Object.fromEntries(
  Object.entries(dataFakultas).map(([fakultas, list]) => [
    fakultas,
    ['Semua Prodi', ...list.map(p => p.prodi)],
  ])
)

// ── KategoriPoinBar (mini stacked bar di tabel) ──
function KategoriPoinBar({ item }) {
  const total = item.poin || KATEGORI.reduce((s, k) => s + (item[k.key] || 0), 0) || 1

  return (
    <div className="flex h-2.5 w-32 overflow-hidden rounded-full bg-[#e9ebf8]">
      {KATEGORI.map(k => (
        <div
          key={k.key}
          style={{ width: `${((item[k.key] || 0) / total) * 100}%`, backgroundColor: k.color }}
          title={`${k.label}: ${item[k.key] || 0}`}
        />
      ))}
    </div>
  )
}

// ── HorizontalStackedBar ──
// maxVal di-pass dari luar supaya skala tetap sama saat data difilter.
function HorizontalStackedBar({ data, maxVal }) {
  const skala = maxVal || 1

  return (
    <div>
      <div className="space-y-4">
        {data.map(d => {
          const totalKategori = KATEGORI.reduce((s, k) => s + (d[k.key] || 0), 0) || 1
          const lebarBar = (d.poin / skala) * 100

          return (
            <div key={d.prodi} className="flex items-center gap-3">
              <span className="w-[140px] shrink-0 truncate text-right text-xs font-semibold text-brand-dark">
                {d.prodi}
              </span>
              <div className="h-7 flex-1 rounded-md border border-[#e9ebf8] bg-[#f9fafb]">
                <div className="flex h-full overflow-hidden rounded-md" style={{ width: `${lebarBar}%` }}>
                  {KATEGORI.map(k => (
                    <div
                      key={k.key}
                      style={{
                        width: `${((d[k.key] || 0) / totalKategori) * 100}%`,
                        backgroundColor: k.color,
                      }}
                      title={`${k.label}: ${d[k.key] || 0}`}
                    />
                  ))}
                </div>
              </div>
              <span className="w-12 shrink-0 text-left text-xs font-bold text-brand-dark">{d.poin}</span>
            </div>
          )
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-xs font-medium text-[#616161]">
        {KATEGORI.map(k => (
          <span key={k.key} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded" style={{ backgroundColor: k.color }} />
            {k.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── SvgDoughnut ──
function SvgDoughnut({ centerTitle = 'Total', centerValue, centerLabel, sections, size = 'h-44 w-44' }) {
  let offsetBerjalan = 0

  return (
    <div className={`relative ${size} flex items-center justify-center`}>
      <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 42 42">
        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#eef0f7" strokeWidth="4.5" />
        {sections.map((cur, i) => {
          const dashOffset = 100 - offsetBerjalan
          offsetBerjalan += cur.percentage
          return (
            <circle
              key={i}
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke={cur.color}
              strokeWidth="4.5"
              strokeDasharray={`${cur.percentage} ${100 - cur.percentage}`}
              strokeDashoffset={dashOffset}
            />
          )
        })}
      </svg>
      <div className="absolute text-center">
        <p className="text-[10px] font-semibold uppercase leading-none tracking-wider text-[#9aa0a6]">{centerTitle}</p>
        <p className="my-0.5 text-2xl font-extrabold text-brand-dark">{centerValue}</p>
        <p className="text-[10px] font-medium leading-none text-[#616161]">{centerLabel}</p>
      </div>
    </div>
  )
}

// ── MAIN ──
function DetailFakultasProdi() {
  const { fakultas } = useParams()
  const decodedFakultas = decodeURIComponent(fakultas || '')
  const [selectedProdi, setSelectedProdi] = useState('Semua Prodi')

  const prodiList = dataFakultas[decodedFakultas] || []
  const filteredProdi =
    selectedProdi === 'Semua Prodi' ? prodiList : prodiList.filter(p => p.prodi === selectedProdi)

  const totalMahasiswa = prodiList.reduce((s, p) => s + p.mahasiswa, 0)
  const totalPoin = prodiList.reduce((s, p) => s + p.poin, 0)
  const maxPoin = Math.max(...prodiList.map(p => p.poin), 1)

  const mhsColors = ['#B34F00', '#DE350B', '#42B883', '#0052CC', '#FFAB00']
  const mhsSections = prodiList.map((p, idx) => ({
    percentage: (p.mahasiswa / (totalMahasiswa || 1)) * 100,
    color: mhsColors[idx % mhsColors.length],
    label: p.prodi,
  }))

  const skalaKegiatan = [
    { label: 'Internasional', percentage: 10, color: '#9B5DE5' },
    { label: 'Nasional', percentage: 20, color: '#1D3557' },
    { label: 'Regional', percentage: 50, color: '#FF9F1C' },
    { label: 'Universitas', percentage: 20, color: '#1A3A2B' },
  ]

  // ── Fakultas tidak ditemukan ──
  if (prodiList.length === 0) {
    return (
      <DashboardLayout
        role="pimpinan-utama"
        userName="Dr. Efa Yonnedi, SE. MPPM, Akt, CA, CRGP"
        userRole="Pimpinan Utama (Rektor)"
      >
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-bold text-brand-dark">Fakultas tidak ditemukan</h2>
          <p className="mt-2 text-sm text-[#616161]">
            Tidak ada data untuk &ldquo;{decodedFakultas || '-'}&rdquo;. Pilih fakultas lain dari halaman ringkasan.
          </p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      role="pimpinan-utama"
      userName="Dr. Efa Yonnedi, SE. MPPM, Akt, CA, CRGP"
      userRole="Pimpinan Utama (Rektor)"
    >
      <div className="space-y-6">
        {/* ── HEADER ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="bg-gradient-to-r from-brand-dark to-brand-light bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl">
              Fakultas {decodedFakultas}
            </h2>
            <p className="mt-1 text-sm text-[#616161]">Detail program studi dan poin capaian mahasiswa.</p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-center">
            <label htmlFor="filter-prodi" className="whitespace-nowrap text-sm font-semibold text-[#333]">
              Filter Prodi
            </label>
            <div className="relative">
              <select
                id="filter-prodi"
                value={selectedProdi}
                onChange={e => setSelectedProdi(e.target.value)}
                className="cursor-pointer appearance-none rounded-lg border border-[#e9ebf8] bg-white py-2 pl-4 pr-10 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
              >
                {(daftarProdiFakultas[decodedFakultas] || ['Semua Prodi']).map(p => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#616161]" />
            </div>
          </div>
        </div>

        {/* ── KURIKULUM AKTIF ── */}
        <div className="flex items-center justify-between rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <div>
            <h3 className="text-sm font-bold text-brand-dark">Kurikulum Aktif</h3>
            <p className="mt-1 text-sm font-semibold text-[#333]">Kurikulum soft skill berjenjang 2024</p>
            <p className="mt-0.5 text-xs text-[#616161]">
              2024/2025 &nbsp;•&nbsp; {totalMahasiswa.toLocaleString('id-ID')} Mahasiswa Terdaftar
            </p>
          </div>
          <span className="rounded-full bg-gradient-to-r from-brand-dark to-brand-light px-4 py-1 text-xs font-bold text-white shadow-sm">
            Aktif
          </span>
        </div>

        {/* ── PERINGKAT PRODI ── */}
        <div className="overflow-hidden rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
          <div className="border-b border-[#e9ebf8] px-5 py-4">
            <h3 className="text-lg font-bold text-brand-dark">Peringkat Prodi</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-xs font-semibold uppercase tracking-wide text-white">
                  <th className="w-20 px-4 py-3 text-center">Ranking</th>
                  <th className="px-4 py-3 text-left">Program Studi</th>
                  <th className="w-32 px-4 py-3 text-left">Total Poin</th>
                  <th className="w-40 px-4 py-3 text-left">Kategori Poin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef0f7]">
                {filteredProdi.map(item => (
                  <tr key={item.prodi} className="transition duration-150 hover:bg-[#f9fafb]">
                    <td className="px-4 py-4 text-center font-semibold text-[#616161]">{item.rank}.</td>
                    <td className="px-4 py-4 font-semibold text-brand-dark">{item.prodi}</td>
                    <td className="px-4 py-4 font-bold text-[#333]">{item.poin}</td>
                    <td className="px-4 py-4">
                      <KategoriPoinBar item={item} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-[#e9ebf8] px-6 py-3 text-xs text-[#616161]">
            Menampilkan {filteredProdi.length} dari {prodiList.length} program studi
          </div>
        </div>

        {/* ── ROW: RATA-RATA + TOTAL MAHASISWA ── */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm md:col-span-3">
            <h3 className="mb-6 text-center text-lg font-bold text-brand-dark">Rata-rata capaian per prodi</h3>
            <HorizontalStackedBar data={filteredProdi} maxVal={maxPoin} />
          </div>

          <div className="flex flex-col items-center rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm md:col-span-2">
            <h3 className="mb-4 text-center text-lg font-bold text-brand-dark">Total mahasiswa</h3>
            <SvgDoughnut
              centerValue={totalMahasiswa.toLocaleString('id-ID')}
              centerLabel="Mahasiswa"
              sections={mhsSections}
            />
            <div className="mt-6 w-full space-y-2 text-xs font-semibold">
              {prodiList.map((p, idx) => (
                <div key={p.prodi} className="flex items-center justify-between text-[#616161]">
                  <div className="flex max-w-[75%] items-center gap-2.5 truncate">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: mhsColors[idx % mhsColors.length] }}
                    />
                    <span className="truncate">{p.prodi}</span>
                  </div>
                  <span className="font-bold text-[#9aa0a6]">
                    {Math.round((p.mahasiswa / (totalMahasiswa || 1)) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── POIN BERDASARKAN SKALA KEGIATAN ── */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-center text-lg font-bold text-brand-dark">Poin berdasarkan skala kegiatan</h3>
          <div className="flex flex-col items-center justify-around gap-8 sm:flex-row">
            <SvgDoughnut
              centerValue={totalPoin.toLocaleString('id-ID')}
              centerLabel="Poin"
              sections={skalaKegiatan}
            />
            <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-xs font-semibold">
              {skalaKegiatan.map(s => (
                <div key={s.label} className="flex items-center gap-3 text-[#616161]">
                  <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: s.color }} />
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default DetailFakultasProdi
