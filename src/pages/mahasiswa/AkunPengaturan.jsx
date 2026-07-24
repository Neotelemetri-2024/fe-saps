import React from 'react'
import { Lock, User } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import logoUnand from '../../assets/logo_unand.png'

function AkunPengaturan() {
  const handleSimpanPerubahan = () => {
    toast.success('Berhasil Disimpan!', {
      description: 'Perubahan pada informasi pribadi Anda telah disimpan.',
    })
  }

  return (
    <DashboardLayout role="mahasiswa" userName="Amara Marshinta" userRole="Mahasiswa">
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-brand-dark sm:text-2xl">Profil dan Pengaturan</h2>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Header Profil */}
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-6">
              <img src={logoUnand} alt="Logo" className="h-20 w-auto object-contain" />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-brand-dark">AMARA MARSHINTA</h3>
                <p className="text-sm text-[#616161]">2311121017</p>
                <p className="text-sm text-[#616161]">Teknologi Pangan - Angkatan 2021</p>
              </div>
            </div>
          </div>

          {/* Keamanan Card */}
          <div className="rounded-xl border border-[#e9ebf8] bg-gradient-to-br from-brand-dark to-brand-light p-6 shadow-sm flex flex-col justify-center">
            <Lock className="h-8 w-8 text-white mb-2" />
            <p className="font-semibold text-white text-lg">KEAMANAN</p>
            <p className="text-sm text-gray-200">Data login dan kata sandi Anda terintegrasi dengan portal utama universitas.</p>
          </div>
        </div>

        {/* Informasi Pribadi */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <User className="h-5 w-5 text-brand-dark" />
            <h3 className="text-lg font-bold text-brand-dark">Informasi Pribadi</h3>
          </div>
          
          <form className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="namaLengkap" className="block text-sm font-medium text-black">Nama Lengkap</label>
                <input type="text" id="namaLengkap" className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark" placeholder="Masukkan nama lengkap" />
              </div>
              <div>
                <label htmlFor="nim" className="block text-sm font-medium text-black">NIM</label>
                <input type="text" id="nim" className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark" placeholder="Masukkan NIM" />
              </div>
              <div>
                <label htmlFor="programStudi" className="block text-sm font-medium text-black">Program Studi</label>
                <select id="programStudi" className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark">
                  <option>Pilih Program studi</option>
                </select>
              </div>
              <div>
                <label htmlFor="fakultas" className="block text-sm font-medium text-black">Fakultas</label>
                <select id="fakultas" className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark">
                  <option>Masukkan Fakultas</option>
                </select>
              </div>
              <div>
                <label htmlFor="nomorTelepon" className="block text-sm font-medium text-black">Nomor Telepon</label>
                <input type="text" id="nomorTelepon" className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark" placeholder="Masukkan nomor telepon" />
              </div>
            </div>
            <div>
              <label htmlFor="alamat" className="block text-sm font-medium text-black">Alamat</label>
              <textarea id="alamat" rows="3" className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark" placeholder="Masukkan alamat" />
            </div>
            <button
              type="button"
              onClick={handleSimpanPerubahan}
              className="w-full rounded-xl bg-gradient-to-r from-brand-dark to-brand-light px-6 py-3 text-white font-semibold shadow-md transition hover:opacity-90 sm:w-auto"
            >
              Simpan Perubahan
            </button>
          </form>
        </div>

        {/* Pengaturan Notifikasi */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <svg className="h-5 w-5 text-brand-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h3 className="text-lg font-bold text-brand-dark">Pengaturan Notifikasi</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-black">Status Pengajuan Akademik</p>
              <p className="text-sm text-[#616161]">Update ketika surat disetujui</p>
            </div>
            <label htmlFor="toggleNotifAkademik" className="flex items-center cursor-pointer">
              <div className="relative">
                <input type="checkbox" id="toggleNotifAkademik" className="sr-only" />
                <div className="block bg-gray-300 w-10 h-6 rounded-full"></div>
                <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition"></div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AkunPengaturan