import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, CheckCheck } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout'
import { NotifListSkeleton, Skeleton } from '../components/dashboard/Skeleton'
import { getCurrentUser } from '../services/authService'
import { getNotifikasi, bacaNotifikasi, bacaSemua } from '../services/notifikasiService'
import { subscribeDataUpdate } from '../services/pengajuanService'

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

const ACTION_ROUTES = {
  kegiatan: {
    mahasiswa: (id) => /mahasiswa/kegiatan-eksternal/,
    dosen: (id) => /dosen/permintaan-persetujuan/,
    dosen_pa: (id) => /dosen/permintaan-persetujuan/,
    admin_ditmawa: (id) => /admin_ditmawa/verifikasi-pengajuan-eksternal/,
    admin_fakultas: (id) => /admin_fakultas/verifikasi-pengajuan-ukmf/,
    operator_ukm: (id) => /operator_ukm/daftar-kegiatan/,
    operator_ukmf: (id) => /operator_ukmf/daftar-kegiatan/,
    pimpinan_ditmawa: (id) => /pimpinan_ditmawa/verifikasi-pengajuan-internal/,
    pimpinan_fakultas: (id) => /pimpinan_fakultas/verifikasi-kegiatan-internal/,
  },
  kegiatan_internal: {
    pimpinan_ditmawa: (id) => /pimpinan_ditmawa/verifikasi-pengajuan-internal/,
    pimpinan_fakultas: (id) => /pimpinan_fakultas/verifikasi-kegiatan-internal/,
  },
  kegiatan_eksternal: {
    pimpinan_ditmawa: (id) => /pimpinan_ditmawa/verifikasi-pengajuan-eksternal/,
  },
  izin_pa: {
    mahasiswa: (id) => `/mahasiswa/persetujuan-dosen/${id}`,
  },
  saran_pa: {
    mahasiswa: () => '/mahasiswa/dashboard',
  },
  klaim_poin: {
    mahasiswa: () => '/mahasiswa/klaim-poin',
    admin_ditmawa: (id) => `/admin_ditmawa/verifikasi-klaim/${id}`,
    pimpinan_ditmawa: (id) => `/pimpinan_ditmawa/verifikasi-klaim/${id}`,
  },
  perolehan_poin: {
    mahasiswa: () => '/mahasiswa/riwayat-poin',
  },
}

function resolveAction(notif, role) {
  const route = ACTION_ROUTES[notif.type]?.[role]
  if (!route) return null

  const judul = (notif.title || '').toLowerCase()
  const refId = notif.raw?.refId
  const refStatus = notif.raw?.refStatus ? String(notif.raw.refStatus).toLowerCase() : null

  // Cek apakah entitas terkait sudah selesai diputuskan (disetujui, ditolak, dll)
  const sudahSelesai =
    refStatus === 'disetujui' ||
    refStatus === 'terpublikasi' ||
    refStatus === 'ditolak' ||
    refStatus === 'selesai' ||
    refStatus === 'dibatalkan'

  let label = 'Verifikasi Detail Kegiatan'
  if (sudahSelesai) {
    if (refStatus === 'ditolak') {
      label = 'Lihat Alasan Penolakan'
    } else if (notif.type === 'klaim_poin') {
      label = 'Lihat Klaim Poin'
    } else {
      label = 'Lihat Detail Kegiatan'
    }
  } else if (judul.includes('ditolak')) {
    label = 'Lihat Alasan'
  } else if (judul.includes('saran')) {
    label = 'Lihat Saran'
  } else if (
    judul.includes('direview') ||
    judul.includes('menunggu') ||
    judul.includes('review') ||
    judul.includes('diproses') ||
    refStatus === 'terverifikasi' ||
    refStatus === 'diajukan'
  ) {
    label = 'Verifikasi'
  } else if (notif.type === 'klaim_poin' || notif.type === 'perolehan_poin') {
    label = 'Lihat Detail'
  }

  return { label, path: route(refId), sudahSelesai, refStatus }
}

function renderRefStatusBadge(status) {
  if (!status) return null
  const s = String(status).toLowerCase()
  if (s === 'disetujui' || s === 'terpublikasi' || s === 'sah') {
    return <span className="badge badge-success badge-xs font-semibold px-2 py-0.5">Disetujui</span>
  }
  if (s === 'ditolak' || s === 'dibatalkan') {
    return <span className="badge badge-error badge-xs font-semibold px-2 py-0.5">Ditolak</span>
  }
  if (s === 'perlu_revisi' || s === 'revisi') {
    return <span className="badge badge-warning badge-xs font-semibold px-2 py-0.5">Perlu Revisi</span>
  }
  if (s === 'terverifikasi') {
    return <span className="badge badge-info badge-xs font-semibold px-2 py-0.5">Menunggu Persetujuan</span>
  }
  if (s === 'diajukan') {
    return <span className="badge badge-ghost badge-xs font-semibold px-2 py-0.5">Menunggu Verifikasi</span>
  }
  return null
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

function buildPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, current, current - 1, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const result = []
  let prev = 0
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push('...')
    result.push(p)
    prev = p
  }
  return result
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
  const [activeTab, setActiveTab] = useState('semua')
  const [page, setPage] = useState(1)

  const loadData = () => {
    getNotifikasi()
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data || []
        setNotifs(list.map(normalizeNotif))
      })
      .catch((err) => {
        setNotifs([])
        toast.error('Gagal memuat notifikasi', { description: err.message })
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    loadData()
  }, [])

  // Auto-refresh data saat ada event perubahan notifikasi / persetujuan
  useEffect(() => {
    return subscribeDataUpdate((detail) => {
      if (!detail?.type || detail.type === 'notifikasi' || detail.type === 'persetujuan' || detail.type === 'klaim') {
        loadData()
      }
    })
  }, [])

  const belumDibacaCount = notifs.filter((n) => n.belumDibaca).length
  const sudahDibacaCount = notifs.length - belumDibacaCount

  const TABS = [
    { key: 'semua', label: 'Semua', count: notifs.length },
    { key: 'belum_dibaca', label: 'Belum dibaca', count: belumDibacaCount },
    { key: 'sudah_dibaca', label: 'Sudah dibaca', count: sudahDibacaCount },
  ]

  const filteredNotifs = notifs.filter((n) => {
    if (activeTab === 'belum_dibaca') return n.belumDibaca
    if (activeTab === 'sudah_dibaca') return !n.belumDibaca
    return true
  })

  const PAGE_SIZE = 10
  const totalPages = Math.max(1, Math.ceil(filteredNotifs.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageItems = filteredNotifs.slice(start, start + PAGE_SIZE)
  const pageNumbers = buildPageNumbers(currentPage, totalPages)

  const handleTabChange = (key) => {
    setActiveTab(key)
    setPage(1)
  }

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

  // Klik tombol aksi: otomatis tandai sudah dibaca lalu navigasi ke halaman target
  const handleActionClick = async (notif, action) => {
    if (notif.belumDibaca) {
      try {
        await bacaNotifikasi(notif.id)
        setNotifs((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, belumDibaca: false } : n))
        )
      } catch {
        // Tetap lanjutkan navigasi jika API mark-as-read gagal
      }
    }
    if (action?.path) {
      navigate(action.path)
    }
  }

  const emptyText =
    activeTab === 'belum_dibaca'
      ? 'Tidak ada notifikasi belum dibaca.'
      : activeTab === 'sudah_dibaca'
        ? 'Tidak ada notifikasi yang sudah dibaca.'
        : 'Belum ada notifikasi.'

  return (
    <DashboardLayout role={role} userName={userName} userRole={userRole}>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-base-content">Notifikasi</h2>
            {loading ? (
              <Skeleton className="mt-1 h-4 w-48" />
            ) : (
              <p className="mt-1 text-sm text-base-content/60">
                {belumDibacaCount > 0
                  ? `${belumDibacaCount} notifikasi belum dibaca`
                  : 'Semua notifikasi sudah dibaca'}
              </p>
            )}
          </div>
          {belumDibacaCount > 0 ? (
            <button
              type="button"
              onClick={tandaiSemuaDibaca}
              className="btn btn-ghost btn-sm gap-1.5 self-start sm:self-auto text-primary font-semibold hover:bg-primary/10"
            >
              <CheckCheck className="h-4 w-4" />
              Tandai semua dibaca
            </button>
          ) : null}
        </div>

        <div role="tablist" className="tabs tabs-box">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`tab ${activeTab === tab.key ? 'tab-active' : ''}`}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          {loading ? (
            <div className="p-4 sm:p-5">
              <NotifListSkeleton />
            </div>
          ) : filteredNotifs.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-base-content/50">{emptyText}</p>
          ) : (
            <ul className="divide-y divide-base-300">
              {pageItems.map((notif) => {
                const action = resolveAction(notif, role)
                const refStatusBadge = renderRefStatusBadge(notif.raw?.refStatus)

                return (
                  <li
                    key={notif.id}
                    className={`px-4 py-4 sm:px-5 transition-colors ${
                      notif.belumDibaca ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-base-200/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <p className="text-sm font-semibold leading-snug text-base-content">
                          {notif.belumDibaca ? (
                            <span
                              className="mr-2 inline-block h-2 w-2 shrink-0 rounded-full bg-primary align-middle"
                              title="Belum dibaca"
                            />
                          ) : null}
                          {notif.title}
                        </p>
                        {refStatusBadge}
                      </div>
                      <span className="shrink-0 text-xs text-base-content/50">{notif.time}</span>
                    </div>

                    {notif.message ? (
                      <p className="mt-1 text-sm text-base-content/70 leading-relaxed">{notif.message}</p>
                    ) : null}

                    {(action || notif.belumDibaca) ? (
                      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                        {action ? (
                          <button
                            type="button"
                            onClick={() => handleActionClick(notif, action)}
                            className={`text-sm font-semibold hover:underline transition-colors ${
                              action.sudahSelesai ? 'text-base-content/80 hover:text-primary' : 'text-primary'
                            }`}
                          >
                            {action.label}
                          </button>
                        ) : null}
                        {notif.belumDibaca ? (
                          <button
                            type="button"
                            onClick={() => tandaiSudahDibaca(notif.id)}
                            className="text-xs text-base-content/50 hover:text-base-content hover:underline"
                          >
                            Tandai dibaca
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}

          {!loading && filteredNotifs.length > 0 && totalPages > 1 ? (
            <div className="flex flex-col gap-3 border-t border-base-300 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <span className="text-xs text-base-content/50">
                Menampilkan {start + 1}–{Math.min(start + PAGE_SIZE, filteredNotifs.length)} dari {filteredNotifs.length} notifikasi
              </span>
              <div className="join">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                  className="btn btn-sm join-item"
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {pageNumbers.map((p, idx) =>
                  p === '...' ? (
                    <button key={`ellipsis-${idx}`} type="button" className="btn btn-sm join-item btn-disabled">
                      ...
                    </button>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`btn btn-sm join-item ${p === currentPage ? 'btn-active' : ''}`}
                    >
                      {p}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(currentPage + 1)}
                  className="btn btn-sm join-item"
                  aria-label="Halaman berikutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Notifikasi
