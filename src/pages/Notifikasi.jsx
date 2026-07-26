import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Bell, FileText, Users, Info } from 'lucide-react'
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

const TYPE_CONFIG = {
  disetujui: { icon: CheckCircle, iconColor: 'text-green-500', bg: 'bg-green-50' },
  ditolak: { icon: XCircle, iconColor: 'text-red-500', bg: 'bg-red-50' },
  pengajuan_baru: { icon: FileText, iconColor: 'text-blue-500', bg: 'bg-blue-50' },
  kegiatan: { icon: FileText, iconColor: 'text-blue-500', bg: 'bg-blue-50' },
  klaim: { icon: FileText, iconColor: 'text-blue-500', bg: 'bg-blue-50' },
  event: { icon: Bell, iconColor: 'text-yellow-500', bg: 'bg-yellow-50' },
  peserta: { icon: Users, iconColor: 'text-purple-500', bg: 'bg-purple-50' },
  saran: { icon: Info, iconColor: 'text-sky-500', bg: 'bg-sky-50' },
  default: { icon: Bell, iconColor: 'text-brand-dark', bg: 'bg-green-50' },
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
  const user = getCurrentUser()
  const role = resolveRoleFromPath(location.pathname) || user?.role || 'mahasiswa'
  const userName = user?.nama || 'Pengguna'
  const userRole = ROLE_LABEL[role] || user?.userRole || role

  const [loading, setLoading] = useState(true)
  const [notifs, setNotifs] = useState([])
  const [activeFilter, setActiveFilter] = useState('Semua')

  const load = () => {
    setLoading(true)
    getNotifikasi()
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data || []
        setNotifs(list.map(normalizeNotif))
      })
      .catch((err) => {
        setNotifs([])
        toast.error('Gagal memuat notifikasi', { description: err.message })
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const belumDibacaCount = notifs.filter((n) => n.belumDibaca).length

  const filterOptions = useMemo(() => {
    const types = new Set(notifs.map((n) => n.type).filter(Boolean))
    return ['Semua', ...Array.from(types)]
  }, [notifs])

  const filtered = notifs.filter((n) => {
    if (activeFilter === 'Semua') return true
    return n.type === activeFilter
  })

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
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-brand-dark sm:text-2xl lg:text-3xl">Notifikasi</h2>
            <p className="mt-1 text-sm text-[#616161]">
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
              className="w-full rounded-lg border border-brand-dark px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-green-50 sm:w-auto"
            >
              Tandai semua dibaca
            </button>
          )}
        </div>

        {filterOptions.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFilter(f)}
                className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition ${
                  activeFilter === f
                    ? 'bg-brand-dark text-white'
                    : 'bg-gray-200 text-[#333] hover:bg-gray-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-3">
          {loading ? (
            <div className="rounded-xl border border-[#e9ebf8] bg-white px-6 py-10 text-center text-sm text-[#616161]">
              Memuat notifikasi…
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-[#e9ebf8] bg-white px-6 py-10 text-center text-sm text-[#616161]">
              Tidak ada notifikasi.
            </div>
          ) : (
            filtered.map((notif) => {
              const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.default
              const Icon = cfg.icon
              return (
                <div
                  key={notif.id}
                  className={`rounded-xl border bg-white p-4 shadow-sm transition ${
                    notif.belumDibaca ? 'border-brand-dark/30 bg-green-50/30' : 'border-[#e9ebf8]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
                      <Icon className={`h-5 w-5 ${cfg.iconColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-brand-dark">
                          {notif.title}
                          {notif.belumDibaca && (
                            <span className="ml-2 inline-block h-2 w-2 rounded-full bg-brand-dark align-middle" />
                          )}
                        </p>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="text-xs text-[#969696]">{notif.time}</span>
                          {notif.belumDibaca && (
                            <button
                              type="button"
                              onClick={() => tandaiSudahDibaca(notif.id)}
                              className="text-xs font-medium text-brand-dark underline hover:opacity-80"
                            >
                              Tandai dibaca
                            </button>
                          )}
                        </div>
                      </div>
                      {notif.message && (
                        <p className="mt-1 text-sm text-[#333]">{notif.message}</p>
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
