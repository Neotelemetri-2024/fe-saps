import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { VerticalBarChart } from '../../components/charts'
import { get } from '../../services/apiClient'
import { getCurrentUser } from '../../services/authService'

function Dashboard() {
  const user = getCurrentUser()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    get('/api/umum/dashboard/pimpinan-ditmawa')
      .then((res) => setStats(res?.data || res))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  const mahasiswaAktif = stats?.mahasiswaAktif ?? stats?.totalMahasiswa ?? '—'
  const totalFakultas  = stats?.totalFakultas ?? '—'
  const totalPending   = stats?.totalPending ?? stats?.pendingVerifikasi ?? '—'
  const kurikulumAktif = stats?.kurikulumAktif?.nama ?? stats?.namaKurikulum ?? '—'

  const ukmChart = stats?.ukmChart || stats?.grafik || []
  const chartLabels = ukmChart.map((d) => d.label || d.nama || d.organisasi || '')
  const chartValues = ukmChart.map((d) => d.poin || d.totalPoin || d.nilai || 0)

  const fallbackLabels = ['Neo Telemetri','Bola Voli','PKK','Pramuka','Sinematografi','Tapak','UKS','Forensic','Pancing','KKO','Penelitian','Karya Andalas','KBK Fast One','Ptek','Raharayo']
  const fallbackValues = [30,12,35,40,42,38,10,15,13,11,12,14,13,12,10]

  return (
    <DashboardLayout
      role="pimpinan_ditmawa"
      userName={user?.nama || 'Dr. Eng. Ir. Dendi Adi Saputra M, S.T, M.T'}
      userRole="Pimpinan"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Dashboard</h2>
          <p className="mt-1 text-sm text-[#616161]">
            Hallo, selamat datang {user?.nama || 'Pimpinan Ditmawa'} !
          </p>
        </div>

        <div>
          <p className="text-base font-bold text-[#333]">Progres Capaian Tahunan</p>
          <p className="text-xs text-[#9aa0a6]">Lacak kelengkapan poin setiap tahun akademik</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Mahasiswa Aktif', value: loading ? '…' : mahasiswaAktif },
            { label: 'Total Fakultas',  value: loading ? '…' : totalFakultas },
            { label: 'Total Pending',   value: loading ? '…' : totalPending },
            { label: 'Kurikulum Aktif', value: loading ? '…' : kurikulumAktif, small: true },
          ].map(({ label, value, small }) => (
            <div key={label} className="rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#616161]">{label}</p>
              <p className={`mt-2 font-extrabold text-brand-dark ${small ? 'text-sm mt-3' : 'text-3xl'}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-bold text-[#333]">
            Grafik poin per UKM berdasarkan pengajuan Kegiatan
          </h3>
          <VerticalBarChart
            labels={chartLabels.length ? chartLabels : fallbackLabels}
            values={chartValues.length ? chartValues : fallbackValues}
            height={260}
          />
        </div>

        <div className="max-w-sm rounded-xl bg-gradient-to-r from-brand-dark to-brand-light p-5 text-white shadow-sm">
          <h3 className="text-sm font-bold">Download Panduan</h3>
          <div className="mt-3 flex items-start gap-3 text-xs text-white/90">
            <Download className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="font-medium leading-snug">
              Pimpinan Ditmawa - Panduan Penggunaan Website MyUnand Student Connect 2026.pdf
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Dashboard
