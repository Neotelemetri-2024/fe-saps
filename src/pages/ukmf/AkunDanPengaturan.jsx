import React from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { CheckCircle, Bell, Settings, Filter, MoreVertical } from 'lucide-react'

function AkunDanPengaturan() {
  const navigate = useNavigate()

  return (
    <DashboardLayout role="ukmf" userName="Operator UKMF" userRole="Operator UKMF">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Profile dan Pengaturan</h2>
          <p className="mt-1 text-sm text-[#616161]">3 notifikasi belum dibaca</p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button className="rounded-lg bg-brand-dark px-4 py-2 text-sm font-semibold text-white shadow-sm">Semua</button>
          <button className="rounded-lg bg-[#e9ebf8] px-4 py-2 text-sm font-semibold text-[#616161]">Verifikasi</button>
          <button className="rounded-lg bg-[#e9ebf8] px-4 py-2 text-sm font-semibold text-[#616161]">Event</button>
          <button className="rounded-lg bg-[#e9ebf8] px-4 py-2 text-sm font-semibold text-[#616161]">Saran</button>
          <button className="inline-flex items-center gap-1 rounded-lg bg-[#e9ebf8] px-3 py-2 text-sm font-semibold text-[#616161]">
            <Filter className="h-4 w-4" />
          </button>
        </div>

        {/* Notification Cards */}
        <div className="space-y-4">
          {/* Card 1: Kegiatan Disetujui */}
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <div>
                  <h3 className="font-semibold text-brand-dark">Kegiatan Disetujui</h3>
                  <p className="text-sm text-[#616161]">Kegiatan Seminar Nasional AI & Teknologi berhasil diverifikasi. Poin +50 telah ditambahkan ke profil Anda.</p>
                  <div className="mt-2 flex gap-3">
                    <button className="text-xs font-semibold text-brand-dark hover:underline">Verifikasi</button>
                    <button className="text-xs font-semibold text-brand-dark hover:underline">Detail Kegiatan</button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#9aa0a6]">
                <span>5 menit lalu</span>
                <MoreVertical className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Card 2: Event Baru Tersedia */}
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-6 w-6 text-blue-500" />
                <div>
                  <h3 className="font-semibold text-brand-dark">Event Baru Tersedia</h3>
                  <p className="text-sm text-[#616161]">BAKTI 2024 — Pengabdian Masyarakat Desa Binaan kini dibuka untuk pendaftaran. Kuota terbatas!</p>
                  <div className="mt-2 flex gap-3">
                    <button className="text-xs font-semibold text-brand-dark hover:underline">Verifikasi</button>
                    <button className="text-xs font-semibold text-brand-dark hover:underline">Detail Kegiatan</button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#9aa0a6]">
                <span>1 jam lalu</span>
                <MoreVertical className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AkunDanPengaturan