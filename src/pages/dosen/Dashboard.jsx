import { useEffect, useState } from 'react'
import { Eye } from 'lucide-react'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatCard from '../../components/dashboard/StatCard'
import ProgressBar from '../../components/dashboard/ProgressBar'
import StatusBadge from '../../components/dashboard/StatusBadge'
import ActionMenu from '../../components/ui/ActionMenu'
import { VerticalBarChart } from '../../components/charts'
import PanduanCard from '../../components/dashboard/PanduanCard'
import { ChartSkeleton, ListItemSkeleton } from '../../components/dashboard/Skeleton'
import { getCurrentUser } from '../../services/authService'
import { getDashboardDosen } from '../../services/dashboardService'

function statusMahasiswa(row) {
  if (row.isLulus || row.status === 'lulus') return 'lulus'
  if (row.status === 'baik' || row.status === 'on_track') return 'baik'
  return row.status || 'perlu_perhatian'
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
      label: 'Total mahasiswa',
      value: String(data?.totalMahasiswa ?? 0),
      link: true,
      action: '/dosen/mahasiswa-bimbingan',
    },
    {
      label: 'Rata-rata IPK',
      value: String(data?.rataRataIpk ?? '-'),
      link: false,
    },
    {
      label: 'Pending approval',
      value: String(data?.pendingApproval ?? 0),
      link: false,
      action: '/dosen/permintaan-persetujuan',
    },
    {
      label: 'Perlu perhatian',
      value: String(data?.perluPerhatian ?? 0),
      link: false,
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
            totalPoin: row.totalPoin ?? 0,
            totalPoinProgres: row.totalPoinProgres ?? row.totalPoin ?? 0,
            totalTarget: row.totalTarget ?? 200,
            isLulus: row.isLulus ?? false,
            statusKelulusan: row.statusKelulusan,
            status: row.status,
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
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-extrabold text-base-content">Dashboard</h2>
          <p className="mt-1 text-sm text-base-content/60">{namaDosen}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} loading={loading} />
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <PanduanCard
              title="Manual Book User Dosen PA"
              description="Panduan Penggunaan Website SAPS untuk Dosen PA"
            />

            <div className="card flex-1 bg-base-100 p-5">
              <h3 className="text-sm font-semibold text-base-content">Permintaan persetujuan</h3>
              <div className="mt-3 divide-y divide-base-300">
                {loading ? (
                  <ListItemSkeleton rows={3} />
                ) : permintaan.length === 0 ? (
                  <p className="py-3 text-sm text-base-content/50">Belum ada permintaan pending.</p>
                ) : (
                  permintaan.map((p, i) => (
                    <div key={i} className="py-3">
                      <p className="truncate text-sm text-base-content">{p.nama}</p>
                      <p className="truncate text-xs text-base-content/60">{p.desc}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => navigate('/dosen/permintaan-persetujuan')}
                  className="btn btn-outline btn-primary btn-sm"
                >
                  Lihat selengkapnya
                </button>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 p-5">
            <h3 className="mb-3 text-sm font-semibold text-base-content">
              Rata-rata capaian jenis kegiatan
            </h3>
            {loading ? (
              <ChartSkeleton height={260} />
            ) : (
              <VerticalBarChart
                labels={['Organisasi', 'Seminar', 'Prestasi']}
                values={chartValues}
                height={260}
              />
            )}
          </div>
        </div>

        <TableCard
          title="Progres capaian tahunan"
          headerRight={
            <button
              type="button"
              onClick={() => navigate('/dosen/mahasiswa-bimbingan')}
              className="btn btn-outline btn-primary btn-sm"
            >
              Lihat selengkapnya
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
                      <p className="text-base-content">{row.nama}</p>
                      <p className="text-xs text-base-content/60">{row.prodi}</p>
                    </div>
                  ),
                },
                { key: 'nim', label: 'NIM' },
                { key: 'ipk', label: 'IPK' },
                {
                  key: 'capaian',
                  label: 'Capaian',
                  render: (row) => (
                    <div className="min-w-28">
                      <ProgressBar value={row.pct} max={100} height={6} showPercent />
                    </div>
                  ),
                },
                {
                  key: 'status',
                  label: 'Status',
                  render: (row) => <StatusBadge status={statusMahasiswa(row)} />,
                },
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
                          onClick: () => navigate(`/dosen/lihat-detail/${row.mahasiswaId || row.nim}`, { state: { mahasiswa: row } }),
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
