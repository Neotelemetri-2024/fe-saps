import { useState } from 'react'
import { CheckCircle, XCircle, Bell, FileText, MoreVertical, Users } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'

const NOTIF_DATA = [
  {
    id: 1,
    type: 'disetujui',
    title: 'Pengajuan Disetujui',
    message: 'Pengajuan kegiatan "Seminar Nasional AI & Teknologi" dari Aufa Alata telah diverifikasi dan diteruskan ke Pimpinan Ditmawa.',
    time: '5 menit lalu',
    belumDibaca: true,
  },
  {
    id: 2,
    type: 'pengajuan_baru',
    title: 'Pengajuan Baru Masuk',
    message: 'Ada pengajuan kegiatan eksternal baru dari Budi Santoso: "Workshop IoT 2026". Silakan lakukan verifikasi.',
    time: '1 jam lalu',
    belumDibaca: true,
  },
  {
    id: 3,
    type: 'pengajuan_baru',
    title: 'Pengajuan Baru Masuk',
    message: 'Ada pengajuan kegiatan UKM baru dari Citra Dewi: "Latihan Dasar Organisasi". Silakan lakukan verifikasi.',
    time: '2 jam lalu',
    belumDibaca: true,
  },
  {
    id: 4,
    type: 'ditolak',
    title: 'Pengajuan Ditolak',
    message: 'Pengajuan kegiatan "Workshop Memasak" dari Dina Lestari ditolak karena tidak sesuai kurikulum.',
    time: '1 hari lalu',
    belumDibaca: false,
  },
  {
    id: 5,
    type: 'event',
    title: 'Event Segera Dimulai',
    message: 'TAC (Training Andalasian Character) akan dimulai besok, 12 Februari 2026. Pastikan peserta sudah terdaftar.',
    time: '2 hari lalu',
    belumDibaca: false,
  },
  {
    id: 6,
    type: 'peserta',
    title: 'Peserta Baru Terdaftar',
    message: '5 mahasiswa baru mendaftar untuk event "TAC 2026". Verifikasi kehadiran diperlukan.',
    time: '3 hari lalu',
    belumDibaca: false,
  },
]

const FILTER_OPTIONS = ['Semua', 'Pengajuan', 'Event', 'Peserta']

const TYPE_CONFIG = {
  disetujui: { icon: CheckCircle, iconColor: 'text-green-500', bg: 'bg-green-50' },
  pengajuan_baru: { icon: FileText, iconColor: 'text-blue-500', bg: 'bg-blue-50' },
  ditolak: { icon: XCircle, iconColor: 'text-red-500', bg: 'bg-red-50' },
  event: { icon: Bell, iconColor: 'text-yellow-500', bg: 'bg-yellow-50' },
  peserta: { icon: Users, iconColor: 'text-purple-500', bg: 'bg-purple-50' },
}

const FILTER_MAP = {
  Semua: null,
  Pengajuan: ['disetujui', 'pengajuan_baru', 'ditolak'],
  Event: ['event'],
  Peserta: ['peserta'],
}

function Notifikasi() {
  const [activeFilter, setActiveFilter] = useState('Semua')
  const [notifs, setNotifs] = useState(NOTIF_DATA)

  const belumDibacaCount = notifs.filter((n) => n.belumDibaca).length

  const filtered = notifs.filter((n) => {
    const types = FILTER_MAP[activeFilter]
    if (!types) return true
    return types.includes(n.type)
  })

  const tandaiSudahDibaca = (id) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, belumDibaca: false } : n)))
  }

  const tandaiSemuaDibaca = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, belumDibaca: false })))
  }

  return (
    <DashboardLayout role="admin-ditmawa" userName="Dr. Efa Yonnedi, SE. MPPM, Akt, CA, CRGP" userRole="Dosen Pembimbing">
      <div className="space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-brand-dark">Notifikasi</h2>
            <p className="mt-1 text-sm text-[#616161]">
              {belumDibacaCount > 0 ? `${belumDibacaCount} notifikasi belum dibaca` : 'Semua notifikasi sudah dibaca'}
            </p>
          </div>
          {belumDibacaCount > 0 && (
            <button
              type="button"
              onClick={tandaiSemuaDibaca}
              className="rounded-lg border border-brand-dark px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-green-50"
            >
              Tandai semua dibaca
            </button>
          )}
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeFilter === f
                  ? 'bg-brand-dark text-white'
                  : 'bg-gray-200 text-[#333] hover:bg-gray-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-[#e9ebf8] bg-white px-6 py-10 text-center text-sm text-[#616161]">
              Tidak ada notifikasi.
            </div>
          ) : (
            filtered.map((notif) => {
              const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.event
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-brand-dark">
                          {notif.title}
                          {notif.belumDibaca && (
                            <span className="ml-2 inline-block h-2 w-2 rounded-full bg-brand-dark align-middle" />
                          )}
                        </p>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-xs text-[#969696]">{notif.time}</span>
                          <button
                            type="button"
                            onClick={() => tandaiSudahDibaca(notif.id)}
                           
                          >
                            <MoreVertical className="h-4 w-4 text-[#969696] hover:text-brand-dark" />
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-[#333]">{notif.message}</p>
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
