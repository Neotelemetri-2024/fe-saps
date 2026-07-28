import { useEffect, useState } from 'react'
import { Download, Clock, ChevronRight } from 'lucide-react'
import DataTable from '../../components/dashboard/DataTable'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { VerticalBarChart } from '../../components/charts'
import { getCurrentUser } from '../../services/authService'
import { getDashboardDosen } from '../../services/dashboardService'

// ─── helpers ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, border, numColor, link, sublabel, sublink, action }) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => action && navigate(action)}
      className={`rounded-xl border-2 bg-white p-5 shadow-sm ${border} ${action ? 'cursor-pointer' : ''}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#616161]">{label}</p>
      <p className={`mt-2 text-3xl font-extrabold ${numColor}`}>{value}</p>
      {sublabel && (
        <p className={`mt-0.5 text-sm font-semibold ${numColor}`}>{sublabel}</p>
      )}
      {sublink && (
        <p className="mt-1 flex items-center gap-0.5 text-xs font-medium text-[#444]">
          → {sublink}
        </p>
      )}
      {link && (
        <p className="mt-2 text-xs font-medium text-emerald-600 hover:underline">Lihat Detail</p>
      )}
    </div>
  )
}

function CapaianBar({ pct, status }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-28 rounded-full bg-[#e9ebf8]">
        <div
          className={`h-2 rounded-full ${status === 'baik' ? 'bg-emerald-600' : 'bg-red-600'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-[#616161]">{pct}%</span>
    </div>
  )
}

function StatusDot({ status }) {
  return (
    <span className={`inline-block h-3 w-3 rounded-full ${status === 'baik' ? 'bg-emerald-600' : 'bg-red-600'}`} />
  )
}

function formatTanggal(val) {
  if (!val) return '-'
  try {
    return new Date(val).toLocaleString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(val)
  }
}

function pickChartValue(chartKategori, keys) {
  for (const key of keys) {
    const found = (chartKategori || []).find((c) =>
      String(c.label || '').toLowerCase().includes(key),
    )
    if (found) return Number(found.value) || 0
  }
  return 0
}

function buildStats(data) {
  return [
    {
      label: 'TOTAL MAHASISWA',
      value: String(data?.totalMahasiswa ?? 0),
      border: 'border-emerald-400',
      numColor: 'text-brand-dark',
      link: true,
      action: '/dosen/mahasiswa-bimbingan',
    },
    {
      label: 'RATA RATA IPK',
      value: String(data?.rataRataIpk ?? '-'),
      border: 'border-emerald-400',
      numColor: 'text-brand-dark',
      link: false,
    },
    {
      label: 'PENDING APPROVAL',
      value: String(data?.pendingApproval ?? 0),
      border: 'border-amber-400',
      numColor: 'text-amber-500',
      link: false,
      action: '/dosen/permintaan-persetujuan',
    },
    {
      label: 'PERLU PERHATIAN',
      value: String(data?.perluPerhatian ?? 0),
      border: 'border-red-400',
      numColor: 'text-red-600',
      link: false,
      sublabel: 'Mahasiswa',
      sublink: 'lihat Detail',
      action: '/dosen/mahasiswa-perlu-perhatian',
    },
  ]
}

// ─── main ─────────────────────────────────────────────────────────────────────
function DosenPADashboard() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [stats, setStats] = useState(buildStats(null))
  const [permintaan, setPermintaan] = useState([])
  const [chartValues, setChartValues] = useState([0, 0, 0])
  const [progresTahunan, setProgresTahunan] = useState([])
  const [namaDosen, setNamaDosen] = useState(user?.nama || 'Dosen')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getDashboardDosen()
      .then((data) => {
        setNamaDosen(data?.namaDosen || user?.nama || 'Dosen')
        setStats(buildStats(data))
        setPermintaan(
          (data?.permintaanPersetujuan || []).slice(0, 5).map((item) => ({
            nama: item.namaMahasiswa || 'Mahasiswa',
            desc: item.namaKegiatan || item.kegiatan || '-',
            inisial: (item.namaMahasiswa || 'UA')
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join(''),
          })),
        )
        const chart = data?.chartKategori || []
        setChartValues([
          pickChartValue(chart, ['organisasi', 'ukm']),
          pickChartValue(chart, ['seminar', 'pelatihan', 'workshop']),
          pickChartValue(chart, ['prestasi', 'lomba', 'kompetisi']),
        ])
        setProgresTahunan(
          (data?.progresMahasiswa || []).map((row) => ({
            nama: row.nama || '-',
            prodi: row.prodi || '-',
            tanggalInput: formatTanggal(row.updatedAt || row.tanggal || null),
            nim: row.nim || '-',
            ipk: row.ipk ?? '-',
            pct: row.capaianPersen ?? 0,
            status: row.status === 'perlu_perhatian' || (row.capaianPersen ?? 0) < 50 ? 'perhatian' : 'baik',
            mahasiswaId: row.mahasiswaId,
          })),
        )
      })
      .catch((err) => {
        toast.error('Gagal memuat dashboard', { description: err.message })
      })
      .finally(() => setLoading(false))
  }, [user?.nama])

  return (
    <DashboardLayout role="dosen" userName={namaDosen} userRole="Dosen Pembimbing">
      <div className="space-y-6">

        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-extrabold sm:text-3xl">
            <span className="text-[#333]">Selamat Datang</span>
            <br />
            <span className="bg-gradient-to-r from-brand-dark to-brand-light bg-clip-text text-transparent">
              {namaDosen}
            </span>
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[#616161]">
            Pantau perkembangan akademik mahasiswa bimbingan Anda dan kelola persetujuan kegiatan dengan efisien.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        {/* Middle row: Download + Permintaan | Chart */}
        <div className="grid gap-5 lg:grid-cols-2">

          {/* Left column */}
          <div className="flex flex-col gap-4">
            {/* Download Panduan */}
            <div className="rounded-xl bg-gradient-to-r from-brand-dark to-brand-light p-5 shadow-sm">
              <h3 className="text-sm font-bold text-white">Download Panduan</h3>
              <div className="mt-3 flex items-start gap-3 text-white/90">
                <Download className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-xs leading-snug">
                  Admin Fakultas – Panduan Penggunaan Website MyUnand Student Connect.pdf
                </p>
              </div>
            </div>

            {/* Permintaan Persetujuan */}
            <div className="flex-1 rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-brand-dark">Permintaan Persetujuan</h3>
              <div className="mt-3 divide-y divide-[#f0f2f8]">
                {loading ? (
                  <p className="py-3 text-xs text-[#888]">Memuat…</p>
                ) : permintaan.length === 0 ? (
                  <p className="py-3 text-xs text-[#888]">Belum ada permintaan pending.</p>
                ) : (
                  permintaan.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 py-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-dark text-xs font-bold text-white">
                        {p.inisial}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#222]">{p.nama}</p>
                        <p className="truncate text-xs text-[#616161]">{p.desc}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-3 text-right">
                <button
                  type="button"
                  onClick={() => navigate('/dosen/permintaan-persetujuan')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-dark hover:underline"
                >
                  Lihat Detail <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Chart */}
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-[#222]">
              Rata rata capaian jenis kegiatan mahasiswa bimbingan
            </h3>
            <VerticalBarChart
              labels={['organisasi', 'seminar', 'prestasi']}
              values={chartValues}
              colors={['#3b82f6', '#15803d', '#eab308']}
              height={280}
            />
          </div>
        </div>

        {/* Progres Capaian Tahunan */}
        <div>
          <h3 className="mb-3 text-base font-bold text-[#222]">Progres Capaian Tahunan</h3>
          <DataTable
            columns={[
              { key: '_no', label: 'No' },
              {
                key: 'nama',
                label: 'Mahasiswa',
                render: (row) => (
                  <div>
                    <p className="font-semibold text-[#222]">{row.nama}</p>
                    <p className="text-xs text-sky-600">{row.prodi}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-[#9aa0a6]">
                      <Clock className="h-3 w-3 shrink-0" /> {row.tanggalInput}
                    </p>
                  </div>
                ),
              },
              { key: 'nim', label: 'NIM' },
              { key: 'ipk', label: 'IPK' },
              { key: 'capaian', label: 'Capaian', render: (row) => <CapaianBar pct={row.pct} status={row.status} /> },
              { key: 'status', label: 'Status', render: (row) => <StatusDot status={row.status} /> },
              {
                key: 'aksi',
                label: 'Aksi',
                stopPropagation: true,
                render: (row) => (
                  <button
                    type="button"
                    onClick={() => navigate(`/dosen/lihat-detail/${row.nim}`, { state: { mahasiswa: row } })}
                    className="text-xs font-semibold text-brand-dark hover:underline"
                  >
                    Lihat Detail
                  </button>
                ),
              },
            ]}
            data={progresTahunan.map((r, i) => ({ ...r, _no: i + 1 }))}
            loading={loading}
            emptyText="Belum ada data mahasiswa bimbingan."
          />
        </div>

      </div>
    </DashboardLayout>
  )
}

export default DosenPADashboard
