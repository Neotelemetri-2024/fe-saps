import React from 'react'
import { CheckCircle, Volume2, MessageSquare, XCircle, MoreVertical } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'

const notifikasiData = [
  {
    id: 1,
    type: 'disetujui',
    title: 'Kegiatan Disetujui',
    message: 'Kegiatan Seminar Nasional AI & Teknologi berhasil diverifikasi. Poin +50 telah ditambahkan ke profil Anda.',
    time: '5 menit lalu',
  },
  {
    id: 2,
    type: 'event_baru',
    title: 'Event Baru Tersedia',
    message: 'BAKTI 2024 – Pengabdian Masyarakat Desa Binaan kini dibuka untuk pendaftaran. Kuota terbatas!',
    time: '1 jam lalu',
  },
  {
    id: 3,
    type: 'saran_dosen',
    title: 'Saran dari Dosen PA',
    message: 'Dr. Sari Indah memberikan saran: "Tingkatkan kegiatan pengabdian masyarakat sebelum akhir semester ini."',
    time: '2 jam lalu',
  },
  {
    id: 4,
    type: 'direview',
    title: 'Pengajuan Sedang Direview',
    message: 'Pengajuan Pelatihan Kewirausahaan Muda Anda sedang dalam proses review oleh Admin Fakultas.',
    time: '1 hari lalu',
  },
  {
    id: 5,
    type: 'ditolak',
    title: 'Pengajuan Ditolak',
    message: 'Pengajuan kegiatan Workshop Memasak ditolak karena tidak sesuai dengan sub-kurikulum yang ada.',
    alasan: 'Kegiatan tidak relevan dengan jurusan.',
    time: '4 hari lalu',
  },
]

function Notifikasi() {
  const getIcon = (type) => {
    switch (type) {
      case 'disetujui':
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case 'event_baru':
        return <Volume2 className="h-6 w-6 text-blue-500" />
      case 'saran_dosen':
        return <MessageSquare className="h-6 w-6 text-orange-500" />
      case 'direview':
        return <CheckCircle className="h-6 w-6 text-yellow-500" />
      case 'ditolak':
        return <XCircle className="h-6 w-6 text-red-500" />
      default:
        return null
    }
  }

  const getBackgroundColor = (type) => {
    switch (type) {
      case 'disetujui':
        return 'bg-green-50'
      case 'event_baru':
        return 'bg-blue-50'
      case 'saran_dosen':
        return 'bg-orange-50'
      case 'direview':
        return 'bg-yellow-50'
      case 'ditolak':
        return 'bg-red-50'
      default:
        return 'bg-gray-50'
    }
  }

  return (
    <DashboardLayout role="mahasiswa" userName="Amara Marshinta" userRole="Mahasiswa">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-brand-dark">Notifikasi</h2>
        <p className="text-sm text-[#616161]">3 notifikasi belum dibaca</p>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button className="rounded-full bg-brand-dark px-4 py-2 text-sm font-medium text-white">Semua</button>
          <button className="rounded-full bg-gray-200 px-4 py-2 text-sm font-medium text-[#333]">Verifikasi</button>
          <button className="rounded-full bg-gray-200 px-4 py-2 text-sm font-medium text-[#333]">Event</button>
          <button className="rounded-full bg-gray-200 px-4 py-2 text-sm font-medium text-[#333]">Saran</button>
          <button className="ml-auto rounded-full bg-gray-200 px-3 py-2 text-sm font-medium text-[#333]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4H21M3 8H21M3 12H21" />
            </svg>
          </button>
        </div>

        {/* Notifikasi List */}
        <div className="space-y-4">
          {notifikasiData.map((notif) => (
            <div key={notif.id} className="rounded-xl border border-[#e9ebf8] bg-white p-4 shadow-sm">
              <div className="flex items-start gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${getBackgroundColor(notif.type)}`}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-brand-dark">{notif.title}</p>
                    <span className="text-xs text-[#969696]">{notif.time}</span>
                    <MoreVertical className="h-4 w-4 text-[#969696] cursor-pointer" />
                  </div>
                  <p className="mt-1 text-sm text-[#333]">{notif.message}</p>
                  <div className="mt-2 flex gap-2">
                    {notif.type === 'disetujui' && (
                      <>
                        <button className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">Verifikasi</button>
                        <button className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">Detail Kegiatan</button>
                      </>
                    )}
                    {notif.type === 'event_baru' && (
                      <>
                        <button className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">Verifikasi</button>
                        <button className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">Detail Kegiatan</button>
                      </>
                    )}
                    {notif.type === 'saran_dosen' && (
                      <button className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">Saran</button>
                    )}
                    {notif.type === 'direview' && (
                      <button className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">Verifikasi</button>
                    )}
                    {notif.type === 'ditolak' && (
                      <>
                        <button className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">Verifikasi</button>
                        <button className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">Lihat Alasan</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Notifikasi