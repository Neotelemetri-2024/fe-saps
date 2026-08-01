import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Bell, FileText, Users, Info, Clock } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout'
import { getCurrentUser } from '../services/authService'
import { getNotifikasi, bacaNotifikasi, bacaSemua } from '../services/notifikasiService'

const ROLE_LABEL = {
  mahasiswa: 'Mahasiswa',
  dosen: 'Dosen PA',
  dosen_pa: 'Dosen PA',
  admin_ditmawa: 'Admin Ditmawa',
  admin_fakultas: 'Admin Fakultas',
  pimpinan_ditmawa: 'Pimpinan Ditmawa',
  pimpinan_fakultas: 'Pimpinan Fakultas',
  pimpinan_utama: 'Pimpinan Utama',
  operator_ukm: 'Operator UKM',
  operator_ukmf: 'Operator UKMF',
}

// Palet warna kartu mengikuti desain referensi:
// - disetujui  -> lingkaran hijau mint, ikon hijau tua
// - ditolak    -> lingkaran merah muda, ikon merah
// - lainnya    -> lingkaran kuning, ikon oranye-coklat
const TYPE_CONFIG = {
  disetujui: { icon: CheckCircle, iconColor: 'text-[#203820]', bg: 'bg-[#e7fdef]' },
  ditolak: { icon: XCircle, iconColor: 'text-[#cc2719]', bg: 'bg-[#fdf3f1]' },
  pengajuan_baru: { icon: FileText, iconColor: 'text-[#9f4d18]', bg: 'bg-[#fbf1c2]' },
  kegiatan: { icon: Clock, iconColor: 'text-[#9f4d18]', bg: 'bg-[#fbf1c2]' },
  klaim: { icon: FileText, iconColor: 'text-[#203820]', bg: 'bg-[#e7fdef]' },
  event: { icon: Bell, iconColor: 'text-[#9f4d18]', bg: 'bg-[#fbf1c2]' },
  peserta: { icon: Users, iconColor: 'text-[#9f4d18]', bg: 'bg-[#fbf1c2]' },
  saran: { icon: Info, iconColor: 'text-[#9f4d18]', bg: 'bg-[#fbf1c2]' },
  saran_pa: { icon: Info, iconColor: 'text-[#9f4d18]', bg: 'bg-[#fbf1c2]' },
  izin_pa: { icon: CheckCircle, iconColor: 'text-[#203820]', bg: 'bg-[#e7fdef]' },
  klaim_poin: { icon: FileText, iconColor: 'text-[#203820]', bg: 'bg-[#e7fdef]' },
  perolehan_poin: { icon: CheckCircle, iconColor: 'text-[#203820]', bg: 'bg-[#e7fdef]' },
  default: { icon: Bell, iconColor: 'text-[#203820]', bg: 'bg-[#e7fdef]' },
}

// Rute tujuan chip aksi per tipe notifikasi dan role pengguna
const ACTION_ROUTES = {
  kegiatan: {
    mahasiswa: (id) => `/mahasiswa/kegiatan-eksternal/${id}`,
    dosen: (id) => `/dosen/permintaan-persetujuan/${id}`,
    dosen_pa: (id) => `/dosen/permintaan-persetujuan/${id}`,
    admin_ditmawa: (id) => `/admin_ditmawa/verifikasi-pengajuan-eksternal/${id}`,
    admin_fakultas: (id) => `/admin_fakultas/verifikasi-pengajuan-ukmf/${id}`,
    pimpinan_ditmawa: (id) => `/pimpinan_ditmawa/verifikasi-pengajuan-internal/${id}`,
    pimpinan_fakultas: (id) => `/pimpinan_fakultas/verifikasi-kegiatan-internal/${id}`,
    operator_ukm: (id) => `/operator_ukm/daftar-kegiatan/${id}`,
    operator_ukmf: (id) => `/operator_ukmf/daftar-kegiatan/${id}`,
  },
  izin_pa: {
    mahasiswa: (id) => `/mahasiswa/persetujuan-dosen/${id}`,
  },
  saran_pa: {
    mahasiswa: (id) => `/mahasiswa/persetujuan-dosen/${id}`,
  },
  klaim_poin: {
    mahasiswa: () => '/mahasiswa/klaim-poin',
    admin_ditmawa: (id) => `/admin_ditmawa/verifikasi-klaim/${id}`,
  },
  perolehan_poin: {
    mahasiswa: () => '/mahasiswa/riwayat-poin',
  },
}

// Label & warna chip aksi mengikuti isi notifikasi (meniru desain referensi)
function resolveAction(notif, role) {
  const route = ACTION_ROUTES[notif.type]?.[role]
  if (!route) return null

  const judul = (notif.title || '').toLowerCase()
  const refId = notif.raw?.refId

  let label = 'Verifikasi Detail Kegiatan'
  let cls = 'bg-[#e7fdef] text-[#203820]'

  if (judul.includes('ditolak')) {
    label = 'Lihat Alasan'
    cls = 'bg-[#fdf3f1] text-[#cc2719]'
  } else if (judul.includes('saran')) {
    label = 'Saran'
    cls = 'bg-[#fbf1c2] text-[#9f4d18]'
  } else if (judul.includes('direview') || judul.includes('menunggu') || judul.includes('review') || judul.includes('diproses')) {
    label = 'Verifikasi'
    cls = 'bg-[#fbf1c2] text-[#9f4d18]'
  } else if (notif.type === 'klaim_poin' || notif.type === 'perolehan_poin') {
    label = 'Lihat Detail'
  }

  return { label, cls, path: route(refId) }
}

function formatRelativeTime(value) {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const diffMs = Date.now() - d.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Baru saja'
  if (mins < 60) return `${mins} menit lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} hari lalu`
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function normalizeNotif(item) {
  const refType = (item.refType || item.type || item.tipe || 'default').toLowerCase()
  return {
    id: item.id,
    type: refType,
    title: item.judul || item.title || 'Notifikasi',
    message: item.isi || item.message || '',
    time: formatRelativeTime(item.createdAt || item.time),
    belumDibaca: item.dibaca === false || item.belumDibaca === true,
    raw: item,
  }
}

function resolveRoleFromPath(pathname) {
  const segment = pathname.split('/').filter(Boolean)[0]
  if (segment && ROLE_LABEL[segment]) return segment
  return null
}

function Notifikasi() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = getCurrentUser()
  const role = resolveRoleFromPath(location.pathname) || user?.role || 'mahasiswa'
  const userName = user?.nama || 'Pengguna'
  const userRole = ROLE_LABEL[role] || user?.userRole || role

  const [loading, setLoading] = useState(true)
  const [notifs, setNotifs] = useState([])

  useEffect(() => {
    let active = true
    getNotifikasi()
      .then((res) => {
        if (!active) return
        const list = Array.isArray(res) ? res : res?.data || []
        setNotifs(list.map(normalizeNotif))
      })
      .catch((err) => {
        if (!active) return
        setNotifs([])
        toast.error('Gagal memuat notifikasi', { description: err.message })
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const belumDibacaCount = notifs.filter((n) => n.belumDibaca).length

  const tandaiSudahDibaca = async (id) => {
    try {
      await bacaNotifikasi(id)
      setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, belumDibaca: false } : n)))
    } catch (err) {
      toast.error('Gagal menandai dibaca', { description: err.message })
    }
  }

  const tandaiSemuaDibaca = async () => {
    try {
      await bacaSemua()
      setNotifs((prev) => prev.map((n) => ({ ...n, belumDibaca: false })))
      toast.success('Semua notifikasi ditandai dibaca')
    } catch (err) {
      toast.error('Gagal menandai semua', { description: err.message })
    }
  }

  return (
    <DashboardLayout role={role} userName={userName} userRole={userRole}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-brand-dark sm:text-2xl lg:text-3xl">Notifikasi</h2>
            <p className="mt-1.5 text-sm font-medium text-[#203820]">
              {loading
                ? 'Memuat…'
                : belumDibacaCount > 0
                  ? `${belumDibacaCount} notifikasi belum dibaca`
                  : 'Semua notifikasi sudah dibaca'}
            </p>
          </div>
          {belumDibacaCount > 0 && (
            <button
              type="button"
              onClick={tandaiSemuaDibaca}
              className="self-start text-sm font-medium text-brand-dark underline underline-offset-4 transition hover:opacity-80 sm:self-auto"
            >
              Tandai semua dibaca
            </button>
          )}
        </div>

        {/* Daftar kartu notifikasi */}
        <div className="space-y-3">
          {loading ? (
            <div className="rounded-xl border border-[#dddee3] bg-white px-6 py-12 text-center text-sm text-[#6d6868]">
              Memuat notifikasi…
            </div>
          ) : notifs.length === 0 ? (
            <div className="rounded-xl border border-[#dddee3] bg-white px-6 py-12 text-center text-sm text-[#6d6868]">
              Belum ada notifikasi.
            </div>
          ) : (
            notifs.map((notif) => {
              const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.default
              const Icon = cfg.icon
              const action = resolveAction(notif, role)
              return (
                <div
                  key={notif.id}
                  className="rounded-xl border border-[#dddee3] bg-white p-4 sm:p-5"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11 ${cfg.bg}`}>
                      <Icon className={`h-5 w-5 sm:h-[22px] sm:w-[22px] ${cfg.iconColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold leading-snug text-[#212529]">
                          {notif.title}
                          {notif.belumDibaca && (
                            <span className="ml-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#203820] align-middle" title="Belum dibaca"></span>
                          )}
                        </p>
                        <span className="shrink-0 text-xs text-[#9aa49c]">{notif.time}</span>
                      </div>
                      {notif.message && (
                        <p className="mt-1.5 text-sm leading-relaxed text-[#6d6868]">{notif.message}</p>
                      )}
                      {action && (
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => navigate(action.path)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition hover:opacity-80 ${action.cls}`}
                          >
                            {action.label}
                          </button>
                          {notif.belumDibaca && (
                            <button
                              type="button"
                              onClick={() => tandaiSudahDibaca(notif.id)}
                              className="text-xs font-medium text-brand-dark underline underline-offset-4 transition hover:opacity-80"
                            >
                              Tandai dibaca
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Notifikasi
