import { useEffect, useState } from 'react'
import { Clock, Download } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import { getCurrentUser } from '../../services/authService'
import { getKegiatan } from '../../services/kegiatanService'

function mapStatus(status) {
  const s = String(status || '').toLowerCase()
  if (['diajukan', 'pending'].includes(s)) return 'pending'
  if (['terverifikasi', 'diteruskan'].includes(s)) return 'diteruskan'
  if (['disetujui', 'terpublikasi', 'aktif'].includes(s)) return 'disetujui'
  if (['ditolak'].includes(s)) return 'ditolak'
  if (['perlu_revisi', 'revisi'].includes(s)) return 'revisi'
  return s || 'pending'
}

function formatTanggal(value) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return String(value)
  }
}

function UKMFDashboard() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [riwayat, setRiwayat] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getKegiatan()
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setRiwayat(list)
      })
      .catch((err) => {
        setRiwayat([])
        toast.error('Gagal memuat dashboard', { description: err.message })
      })
      .finally(() => setLoading(false))
  }, [])

  const pending = riwayat.filter((d) => ['diajukan', 'pending'].includes(String(d.status || '').toLowerCase())).length
  const disetujui = riwayat.filter((d) => ['disetujui', 'terpublikasi', 'aktif'].includes(String(d.status || '').toLowerCase())).length
  const ditolak = riwayat.filter((d) => String(d.status || '').toLowerCase() === 'ditolak').length
  const aktif = riwayat.filter((d) => ['terpublikasi', 'aktif', 'disetujui'].includes(String(d.status || '').toLowerCase())).length

  const preview = riwayat.slice(0, 10)

  return (
    <DashboardLayout
      role="operator_ukmf"
      userName={user?.nama || 'Operator UKMF'}
      userRole="Operator UKMF"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">
            Dashboard UKMF {user?.namaOrganisasi || ''}
          </h2>
          <p className="mt-1 text-sm text-[#616161]">Kelola event dan verifikasi kehadiran peserta</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Pending', value: loading ? '…' : pending },
            { label: 'Disetujui', value: loading ? '…' : disetujui },
            { label: 'Ditolak', value: loading ? '…' : ditolak },
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
              type="button"
              onClick={() => navigate('/operator_ukmf/daftar-kegiatan')}
              className="text-sm font-semibold text-brand-dark hover:underline"
            >
              Lihat Semua →
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-xs font-semibold uppercase tracking-wide text-white">
                    <th className="px-4 py-4 text-center">No</th>
                    <th className="px-4 py-4 text-center">Kegiatan</th>
                    <th className="px-4 py-4 text-center">Jenis</th>
                    <th className="px-4 py-4 text-center">Skala</th>
                    <th className="px-4 py-4 text-center">Tanggal</th>
                    <th className="px-4 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-[#9aa0a6]">Memuat data…</td>
                    </tr>
                  ) : preview.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-[#9aa0a6]">Belum ada kegiatan.</td>
                    </tr>
                  ) : (
                    preview.map((r, i) => (
                      <tr key={r.id ?? i} className="border-b border-[#e9ebf8] last:border-0 hover:bg-[#f9fafb]">
                        <td className="px-4 py-4 text-[#616161]">{i + 1}</td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-[#333]">{r.nama || '-'}</p>
                          {r.createdAt && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-[#9a9a9a]">
                              <Clock className="h-3 w-3" />
                              {formatTanggal(r.createdAt)}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-[#616161]">{r.kategori?.nama || r.jenis || '-'}</td>
                        <td className="px-4 py-4 text-[#616161]">{r.skala?.nama || r.skala || '-'}</td>
                        <td className="px-4 py-4 text-[#616161]">{formatTanggal(r.tanggalMulai || r.tanggal)}</td>
                        <td className="px-4 py-4">
                          <StatusBadge status={mapStatus(r.status)} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="max-w-sm rounded-xl bg-gradient-to-r from-brand-dark to-brand-light p-5 shadow-sm">
          <h3 className="text-sm font-bold text-white">Download Panduan</h3>
          <div className="mt-3 flex items-start gap-3 text-white/90">
            <Download className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-xs leading-snug">
              UKMF – Panduan Penggunaan Website MyUnand Student Connect 2026.pdf
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default UKMFDashboard
