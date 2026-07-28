import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import { getCurrentUser } from '../../services/authService'
import { getDashboardPimpinanFakultas } from '../../services/dashboardService'

const DOUGHNUT_COLORS = ['#92400e', '#dc2626', '#15803d', '#3b82f6', '#eab308', '#7c3aed']

function pickKategoriValue(kategoriPoin = {}, keys) {
  for (const key of keys) {
    const found = Object.entries(kategoriPoin).find(([k]) => k.toLowerCase().includes(key))
    if (found) return Number(found[1]) || 0
  }
  return 0
}

// ── KategoriPoinBar ──
function KategoriPoinBar({ organisasi, prestasi, seminar }) {
  const total = organisasi + seminar + prestasi || 1
  return (
    <div className="flex h-3 w-36 overflow-hidden rounded-sm">
      <div style={{ width: `${(organisasi / total) * 100}%` }} className="bg-[#15803d]" title={`Organisasi: ${organisasi}`} />
      <div style={{ width: `${(seminar / total) * 100}%` }} className="bg-[#3b82f6]" title={`Seminar: ${seminar}`} />
      <div style={{ width: `${(prestasi / total) * 100}%` }} className="bg-[#eab308]" title={`Prestasi: ${prestasi}`} />
    </div>
  )
}

// ── VerticalStackedBar ──
function VerticalStackedBar({ data }) {
  const categories = ['organisasi', 'seminar', 'prestasi']
  const COLORS = { organisasi: '#3b82f6', seminar: '#15803d', prestasi: '#eab308' }
  const LABELS = { organisasi: 'organisasi', seminar: 'seminar', prestasi: 'prestasi' }
  const maxSum = Math.max(...data.map((d) => categories.reduce((s, c) => s + d[c], 0)), 1)
  const BAR_H = 220

  const yTicks = [200, 400, 600, 800].filter((v) => v <= maxSum * 1.2)
  const ticks = yTicks.length ? yTicks : [Math.round(maxSum / 2), maxSum]
  const svgW = Math.max(data.length * 80 + 48, 200)
  const svgH = BAR_H + 60

  if (!data.length) {
    return <p className="py-16 text-center text-sm text-[#9aa0a6]">Belum ada data capaian per prodi.</p>
  }

  return (
    <div>
      <div className="flex items-start">
        <div className="mr-2 flex flex-col-reverse items-end" style={{ height: BAR_H, paddingBottom: 0 }}>
          {ticks.map((v) => (
            <span key={v} className="text-[10px] text-[#9ca3af]" style={{ marginBottom: v === ticks[0] ? 0 : (BAR_H / ticks.length) - 14 }}>
              {v}
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          <svg width="100%" height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} preserveAspectRatio="xMidYMid meet">
            {ticks.map((v) => {
              const y = BAR_H - (v / maxSum) * BAR_H
              return <line key={v} x1={0} y1={y} x2={svgW} y2={y} stroke="#e5e7eb" strokeWidth={1} />
            })}
            {data.map((d, gi) => {
              const total = categories.reduce((s, c) => s + d[c], 0)
              const groupX = gi * 80 + 16
              let yOff = BAR_H
              return (
                <g key={d.prodi}>
                  {categories.map((cat) => {
                    const h = (d[cat] / maxSum) * BAR_H
                    yOff -= h
                    return (
                      <rect key={cat} x={groupX} y={yOff} width={36} height={Math.max(h, 0)} fill={COLORS[cat]} />
                    )
                  })}
                  <text x={groupX + 18} y={BAR_H - (total / maxSum) * BAR_H - 5} textAnchor="middle" fontSize={10} fill="#374151" fontWeight="600">{total}</text>
                  {String(d.prodi).split('\n').map((line, li) => (
                    <text key={li} x={groupX + 18} y={BAR_H + 16 + li * 13} textAnchor="middle" fontSize={10} fill="#374151">{line}</text>
                  ))}
                </g>
              )
            })}
          </svg>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-5 text-xs font-medium text-[#616161]">
        {[['organisasi', COLORS.organisasi], ['seminar', COLORS.seminar], ['prestasi', COLORS.prestasi]].map(([k, c]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c }} />
            {LABELS[k]}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── SvgDoughnut ──
function SvgDoughnut({ sections, centerValue }) {
  const total = sections.reduce((s, sec) => s + sec.value, 0) || 1
  const radius = 15.5
  const circumference = 2 * Math.PI * radius
  let cumulative = 0
  const arcs = sections.map((sec) => {
    const offset = cumulative
    const length = (sec.value / total) * circumference
    cumulative += length
    return { ...sec, offset, length }
  })
  return (
    <div className="relative h-44 w-44 flex items-center justify-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 42 42">
        <circle cx="21" cy="21" r={radius} fill="none" stroke="#e9ebf8" strokeWidth="5" />
        {arcs.map((sec, i) => (
          <circle
            key={i} cx="21" cy="21" r={radius} fill="none"
            stroke={sec.color} strokeWidth="5"
            strokeDasharray={`${sec.length} ${circumference - sec.length}`}
            strokeDashoffset={-sec.offset} strokeLinecap="butt"
          />
        ))}
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-extrabold text-brand-dark">{centerValue}</p>
        <p className="text-[10px] font-medium text-[#616161]">Mahasiswa</p>
      </div>
    </div>
  )
}

// ── MAIN ──
function PimpinanFakultasDashboard() {
  const user = getCurrentUser()
  const [loading, setLoading] = useState(true)
  const [statistik, setStatistik] = useState(null)
  const [peringkatProdi, setPeringkatProdi] = useState([])
  const [distribusiPoin, setDistribusiPoin] = useState([])

  useEffect(() => {
    setLoading(true)
    getDashboardPimpinanFakultas()
      .then((data) => {
        setStatistik(data?.statistik || null)
        setPeringkatProdi(Array.isArray(data?.peringkatProdi) ? data.peringkatProdi : [])
        setDistribusiPoin(Array.isArray(data?.distribusiPoin) ? data.distribusiPoin : [])
      })
      .catch((err) => {
        setStatistik(null)
        setPeringkatProdi([])
        setDistribusiPoin([])
        toast.error('Gagal memuat dashboard', { description: err.message })
      })
      .finally(() => setLoading(false))
  }, [])

  const mappedPeringkat = useMemo(() => {
    return peringkatProdi.map((item) => {
      const kp = item.kategoriPoin || {}
      return {
        prodi: item.programStudi || item.prodi || '-',
        organisasi: pickKategoriValue(kp, ['organisasi', 'ukm']),
        seminar: pickKategoriValue(kp, ['seminar', 'pelatihan', 'workshop']),
        prestasi: pickKategoriValue(kp, ['prestasi', 'lomba', 'kompetisi']),
        total: `${item.rataRataCapaian ?? item.total ?? 0}%`,
      }
    })
  }, [peringkatProdi])

  const capaianPerProdi = useMemo(() => {
    return peringkatProdi.map((item) => {
      const kp = item.kategoriPoin || {}
      const nama = item.programStudi || item.prodi || '-'
      return {
        prodi: String(nama).replace(/\s+/g, '\n'),
        organisasi: pickKategoriValue(kp, ['organisasi', 'ukm']),
        seminar: pickKategoriValue(kp, ['seminar', 'pelatihan', 'workshop']),
        prestasi: pickKategoriValue(kp, ['prestasi', 'lomba', 'kompetisi']),
      }
    })
  }, [peringkatProdi])

  const distribusiData = useMemo(() => {
    return distribusiPoin.map((d, i) => ({
      label: d.programStudi || d.prodi || '-',
      value: d.persentaseDariTotal ?? 0,
      color: DOUGHNUT_COLORS[i % DOUGHNUT_COLORS.length],
      jumlahMahasiswa: d.jumlahMahasiswa ?? 0,
    }))
  }, [distribusiPoin])

  const totalMahasiswa = statistik?.totalMahasiswa ?? 0
  const kurikulumLabel =
    typeof statistik?.kurikulumAktif === 'string'
      ? statistik.kurikulumAktif
      : statistik?.kurikulumAktif
        ? `KURIKULUM AKTIF (${statistik.kurikulumAktif})`
        : '—'

  return (
    <DashboardLayout
      role="pimpinan_fakultas"
      userName={user?.nama || 'Pimpinan Fakultas'}
      userRole="Pimpinan"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold sm:text-3xl">
            <span className="text-brand-dark">Dasboard Pimpinan/</span>{' '}
            <span className="text-[#222]">Direktorat</span>
          </h2>
          <p className="mt-1 text-sm text-[#616161]">Kelola persetujuan kegiatan, kurikulum berjenjang, dan pantau analitik universitas.</p>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#616161]">TOTAL MAHASISWA AKTIF</p>
            <p className="mt-2 text-3xl font-extrabold text-brand-dark">
              {loading ? '…' : Number(totalMahasiswa).toLocaleString('id-ID')}
            </p>
          </div>
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#616161]">RATA RATA CAPAIAN</p>
            <p className="mt-2 text-3xl font-extrabold text-brand-dark">
              {loading ? '…' : `${statistik?.rataRataCapaian ?? 0}%`}
            </p>
          </div>
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#616161]">KEGIATAN PERLU PERSETUJUAN</p>
            <p className="mt-2 text-3xl font-extrabold text-brand-dark">
              {loading ? '…' : String(statistik?.kegiatanPending ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#616161]">KURIKULUM AKTIF</p>
            <p className="text-sm font-extrabold leading-snug text-brand-dark">
              {loading ? '…' : kurikulumLabel}
            </p>
          </div>
        </div>

        {/* Peringkat Prodi */}
        <div className="overflow-hidden rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
          <div className="border-b border-[#e9ebf8] px-5 py-4">
            <h3 className="text-base font-bold text-[#222]">Peringkat Prodi</h3>
            <p className="mt-0.5 text-xs text-[#888]">Kategori Poin</p>
            <div className="mt-2 flex gap-4 text-xs font-medium text-[#555]">
              {[['#15803d', 'Organisasi'], ['#3b82f6', 'Seminar'], ['#eab308', 'Prestasi']].map(([c, l]) => (
                <span key={l} className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c }} />
                  {l}
                </span>
              ))}
            </div>
          </div>
          <DataTable
            loading={loading}
            data={mappedPeringkat}
            emptyText="Belum ada data peringkat prodi."
            columns={[
              {
                key: 'ranking', label: 'Ranking',
                render: (item, _col, i) => (
                  <div className="flex justify-center">
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                      i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-400' : 'bg-amber-700'
                    }`}>
                      {i + 1}.
                    </span>
                  </div>
                ),
              },
              { key: 'prodi', label: 'Program Studi', render: (item) => <span className="text-center block text-[#333]">{item.prodi}</span> },
              { key: 'total', label: 'Total Poin', render: (item) => <span className="text-center block font-semibold text-[#333]">{item.total}</span> },
              {
                key: 'kategori', label: 'Kategori Poin',
                render: (item) => (
                  <div className="flex justify-center">
                    <KategoriPoinBar organisasi={item.organisasi} prestasi={item.prestasi} seminar={item.seminar} />
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm md:col-span-1 lg:col-span-3">
            <h3 className="mb-5 text-center text-sm font-bold text-[#222]">Rata rata Capaian per prodi</h3>
            {loading ? (
              <p className="py-16 text-center text-sm text-[#9aa0a6]">Memuat grafik…</p>
            ) : (
              <VerticalStackedBar data={capaianPerProdi} />
            )}
          </div>

          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm md:col-span-1 lg:col-span-2">
            <h3 className="mb-5 text-center text-sm font-bold text-[#222]">Distribusi poin per prodi</h3>
            <div className="flex flex-col items-center">
              {loading ? (
                <p className="py-16 text-center text-sm text-[#9aa0a6]">Memuat…</p>
              ) : (
                <>
                  <SvgDoughnut
                    sections={distribusiData.length ? distribusiData : [{ label: '-', value: 1, color: '#e9ebf8' }]}
                    centerValue={Number(totalMahasiswa).toLocaleString('id-ID')}
                  />
                  <div className="mt-5 w-full space-y-2.5">
                    {distribusiData.map((d) => (
                      <div key={d.label} className="flex items-center gap-2 text-xs font-medium">
                        <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="flex-1 text-[#333]">{d.label}</span>
                        <span className="text-[#616161]">{d.value} %</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PimpinanFakultasDashboard
