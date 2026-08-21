import { useEffect, useState } from 'react'
import { Eye } from 'lucide-react'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatCard from '../../components/dashboard/StatCard'
import ActionMenu from '../../components/ui/ActionMenu'
import { VerticalBarChart } from '../../components/charts'
import PanduanCard from '../../components/dashboard/PanduanCard'
import { getCurrentUser } from '../../services/authService'
import { getDashboardDosen } from '../../services/dashboardService'

// ─── helpers ─────────────────────────────────────────────────────────────────
function CapaianBar({ pct, status }) {
  const clamped = Math.min(100, Math.max(0, pct))
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-28 rounded-full bg-[#e9ebf8]">
        <div
          className={`h-2 rounded-full ${status === 'baik' ? 'bg-emerald-600' : 'bg-red-600'}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-xs text-[#616161]">{clamped}%</span>
    </div>
  )
}

function StatusPill({ status }) {
  const isBaik = status === 'baik'
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
        isBaik ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}
    >
      {isBaik ? 'Baik' : 'Perlu Perhatian'}
    </span>
  )
}

function formatTanggal(val) {
  if (!val) return '-'
  try {
    const d = new Date(val)
    if (Number.isNaN(d.getTime())) return String(val)
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
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
      link: true,
      action: '/dosen/mahasiswa-bimbingan',
    },
    {
      label: 'RATA RATA IPK',
      value: String(data?.rataRataIpk ?? '-'),
      link: false,
    },
    {
      label: 'PENDING APPROVAL',
      value: String(data?.pendingApproval ?? 0),
      link: false,
      action: '/dosen/permintaan-persetujuan',
    },
    {
      label: 'PERLU PERHATIAN',
      value: String(data?.perluPerhatian ?? 0),
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
            <span className="text-brand-dark">
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
            <PanduanCard
              title="Manual Book User Dosen PA"
              description="Panduan Penggunaan Website SAPS untuk Dosen PA"
            />

            {/* Permintaan Persetujuan */}
            <div className="flex-1 rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[#222]">Permintaan Persetujuan</h3>
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
                  className="rounded-lg border border-brand-dark bg-white px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-[#f5f7f5]"
                >
                  Lihat selengkapnya →
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
              labels={['Organisasi', 'Seminar', 'Prestasi']}
              values={chartValues}
              colors={['#3b82f6', '#15803d', '#eab308']}
              height={280}
            />
          </div>
        </div>

        {/* Progres Capaian Tahunan */}
        <TableCard
          title="Progres Capaian Tahunan"
          headerRight={
            <button
              type="button"
              onClick={() => navigate('/dosen/mahasiswa-bimbingan')}
              className="rounded-lg border border-brand-dark bg-white px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-[#f5f7f5]"
            >
              Lihat selengkapnya →
            </button>
          }
        >
          <TableFrame>
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
                  </div>
                ),
              },
              { key: 'nim', label: 'NIM' },
              { key: 'ipk', label: 'IPK' },
              { key: 'capaian', label: 'Capaian', render: (row) => <CapaianBar pct={row.pct} status={row.status} /> },
              { key: 'status', label: 'Status', render: (row) => <StatusPill status={row.status} /> },
              {
                key: 'aksi',
                label: 'Aksi',
                stopPropagation: true,
                render: (row) => (
                  <ActionMenu
                    items={[
                      {
                        label: 'Detail',
                        icon: <Eye className="h-4 w-4" />,
                        color: 'text-blue-600',
                        onClick: () => navigate(`/dosen/lihat-detail/${row.nim}`, { state: { mahasiswa: row } }),
                      },
                    ]}
                  />
                ),
              },
            ]}
            data={progresTahunan.map((r, i) => ({ ...r, _no: i + 1 }))}
            loading={loading}
            emptyText="Belum ada data mahasiswa bimbingan."
          />
          </TableFrame>
        </TableCard>

      </div>
    </DashboardLayout>
  )
}

export default DosenPADashboard
