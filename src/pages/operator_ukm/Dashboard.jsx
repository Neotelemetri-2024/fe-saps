import { useEffect, useState } from 'react'
import { Clock, Download } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import DataTable from '../../components/dashboard/DataTable'
import { getCurrentUser } from '../../services/authService'
import { get } from '../../services/apiClient'

function UKMDashboard() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [stats, setStats] = useState(null)
  const [riwayat, setRiwayat] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    get('/api/ukm/dashboard')
      .then((res) => {
        const d = res?.data || res || {}
        setStats(d)
        const list = d.riwayatKegiatan || d.kegiatan || []
        setRiwayat(Array.isArray(list) ? list.slice(0, 10) : [])
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  function statusLower(item) { return String(item?.status || '').toLowerCase() }
  const allKegiatan = stats?.riwayatKegiatan || stats?.kegiatan || []
  const draftCount  = allKegiatan.filter((d) => statusLower(d) === 'draft').length
  const pending     = allKegiatan.filter((d) => ['diajukan', 'terverifikasi'].includes(statusLower(d))).length
  const disetujui   = allKegiatan.filter((d) => ['disetujui', 'terpublikasi'].includes(statusLower(d))).length
  const aktif       = allKegiatan.filter((d) => ['terpublikasi', 'berlangsung'].includes(statusLower(d))).length

  return (
    <DashboardLayout role="operator_ukm" userName={user?.nama || 'Operator UKM'} userRole="Operator UKM">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">
            Dashboard UKM {user?.namaOrganisasi || ''}
          </h2>
          <p className="mt-1 text-sm text-[#616161]">Kelola event dan verifikasi Kehadiran Peserta</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Draft',       value: loading ? '…' : draftCount },
            { label: 'Menunggu',    value: loading ? '…' : pending },
            { label: 'Disetujui',   value: loading ? '…' : disetujui },
            { label: 'Event Aktif', value: loading ? '…' : aktif },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border-2 border-brand-dark bg-white p-5 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#616161]">{label}</p>
              <p className="mt-2 text-3xl font-extrabold text-brand-dark">{value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-brand-dark">Riwayat Terbaru Pengajuan Kegiatan</h3>
            <button
              onClick={() => navigate('/operator_ukm/daftar-kegiatan')}
              className="text-sm font-semibold text-brand-dark hover:underline"
            >
              Lihat Semua →
            </button>
          </div>

          <DataTable
            loading={loading}
            data={riwayat}
            emptyText="Belum ada kegiatan."
            columns={[
              { key: 'no', label: 'No', render: (_r, i) => i + 1 },
              {
                key: 'kegiatan', label: 'Kegiatan',
                render: (r) => (
                  <div>
                    <p className="font-medium text-[#333]">{r.nama || r.kegiatan || '-'}</p>
                    {r.diajukanPada && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-[#9a9a9a]">
                        <Clock className="h-3 w-3" />{r.diajukanPada}
                      </p>
                    )}
                  </div>
                ),
              },
              { key: 'jenis', label: 'Jenis', render: (r) => typeof r.jenis === 'object' ? (r.jenis?.nama || '-') : (r.jenis || r.kategori?.nama || '-') },
              { key: 'skala', label: 'Skala', render: (r) => typeof r.skala === 'object' ? (r.skala?.nama || '-') : (r.skala || '-') },
              { key: 'tanggal', label: 'Tanggal', render: (r) => r.tanggal || r.tgl || '-' },
              { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            ]}
          />
        </div>

        <div className="max-w-sm rounded-xl bg-gradient-to-r from-brand-dark to-brand-light p-5 shadow-sm">
          <h3 className="text-sm font-bold text-white">Download Panduan</h3>
          <div className="mt-3 flex items-start gap-3 text-white/90">
            <Download className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-xs leading-snug">UKM – Panduan Penggunaan Website MyUnand Student Connect 2026.pdf</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default UKMDashboard
