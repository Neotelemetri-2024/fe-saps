import React from 'react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { Download, Share2 } from 'lucide-react'

function GenerateCV() {
  const userData = {
    name: 'AMARA MARSHINTA',
    nim: '2311121017',
    prodi: 'Teknologi Pangan',
    universitas: 'Universitas Andalas',
    email: 'amara.marshinta@student.unand.ac.id',
    phone: '+62 812-3456-7890',
    address: 'Padang, Sumatera Barat',
  }

  const pendidikanData = [
    {
      jenjang: 'S1 Teknologi Pangan',
      institusi: 'Universitas Andalas, Padang',
      tahunMulai: '2023',
      tahunSelesai: 'sekarang',
      ipk: '3.80',
    },
  ]

  const organisasiData = [
    {
      nama: 'Ketua Divisi Pengembangan Sumber Daya Manusia',
      organisasi: 'UKM Teknologi Pangan Unand',
      tahunMulai: '2023',
      tahunSelesai: 'sekarang',
    },
    {
      nama: 'Anggota Aktif',
      organisasi: 'UKM Robotika Unand',
      tahunMulai: '2023',
      tahunSelesai: '2024',
    },
    {
      nama: 'Peserta BAKTI 2023',
      organisasi: 'Ditmawa Unand',
      tahunMulai: '',
      tahunSelesai: 'Jun 2024',
    },
  ]

  const sertifikasiPelatihanData = [
    { nama: 'Seminar Nasional AI & Teknologi', tahun: '2023' },
    { nama: 'Workshop UI/UX Design', tahun: '2023' },
    { nama: 'Pelatihan Kewirausahaan', tahun: '2023' },
    { nama: 'Seminar Kepemimpinan Nasional', tahun: '2023' },
  ]

  const prestasiPenghargaanData = [
    { nama: 'Juara II Lomba KTI Nasional', pemberi: 'Kemendikbud', tahun: '2023' },
    { nama: 'Finalis Lomba Inovasi Digital', pemberi: 'Fakultas Teknik Unand', tahun: '2023' },
  ]

  return (
    <DashboardLayout role="mahasiswa" userName="Amara Marshinta" userRole="Mahasiswa">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-brand-dark">Generate CV</h2>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 rounded-lg border border-brand-dark px-4 py-2 text-sm font-medium text-brand-dark transition hover:bg-brand-light hover:text-white">
              <Download className="h-4 w-4" /> Download PDF
            </button>
            <button className="flex items-center gap-2 rounded-lg border border-brand-dark px-4 py-2 text-sm font-medium text-brand-dark transition hover:bg-brand-light hover:text-white">
              <Share2 className="h-4 w-4" /> Bagikan
            </button>
          </div>
        </div>
        <p className="text-sm text-[#616161]">Buat CV profesional dari data aktivitas Anda secara otomatis.</p>

        {/* CV Content */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-8 shadow-sm">
          {/* Header */}
          <div className="mb-8 flex items-center gap-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#f0f4f0] text-3xl font-bold text-brand-dark">
              AR
            </div>
            <div>
              <h3 className="text-xl font-bold text-brand-dark">{userData.name}</h3>
              <p className="text-sm text-[#616161]">
                {userData.nim} | {userData.prodi} – {userData.universitas}
              </p>
              <p className="text-xs text-[#616161]">✉️ {userData.email}</p>
              <p className="text-xs text-[#616161]">📞 {userData.phone}</p>
              <p className="text-xs text-[#616161]">📍 {userData.address}</p>
            </div>
          </div>

          {/* Pendidikan */}
          <div className="mb-8">
            <h4 className="mb-4 text-lg font-bold text-brand-dark">PENDIDIKAN</h4>
            {pendidikanData.map((item, index) => (
              <div key={index} className="mb-4 border-l-2 border-brand-dark pl-4 last:mb-0">
                <p className="font-semibold text-brand-dark">{item.jenjang}</p>
                <p className="text-sm text-[#616161]">{item.institusi}</p>
                <p className="text-xs text-[#969696]">
                  {item.tahunMulai} – {item.tahunSelesai}
                </p>
                {item.ipk && <p className="text-xs text-[#969696]">IPK: {item.ipk}</p>}
              </div>
            ))}
          </div>

          {/* Pengalaman Organisasi */}
          <div className="mb-8">
            <h4 className="mb-4 text-lg font-bold text-brand-dark">PENGALAMAN ORGANISASI</h4>
            {organisasiData.map((item, index) => (
              <div key={index} className="mb-4 border-l-2 border-brand-dark pl-4 last:mb-0">
                <p className="font-semibold text-brand-dark">{item.nama}</p>
                <p className="text-sm text-[#616161]">{item.organisasi}</p>
                <p className="text-xs text-[#969696]">
                  {item.tahunMulai} {item.tahunSelesai && `– ${item.tahunSelesai}`}
                </p>
              </div>
            ))}
          </div>

          {/* Sertifikasi & Pelatihan */}
          <div className="mb-8">
            <h4 className="mb-4 text-lg font-bold text-brand-dark">SERTIFIKASI & PELATIHAN</h4>
            <ul className="list-disc pl-5">
              {sertifikasiPelatihanData.map((item, index) => (
                <li key={index} className="mb-2 text-sm text-[#333] last:mb-0">
                  {item.nama} <span className="text-xs text-[#616161]">({item.tahun})</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Prestasi & Penghargaan */}
          <div>
            <h4 className="mb-4 text-lg font-bold text-brand-dark">PRESTASI & PENGHARGAAN</h4>
            {prestasiPenghargaanData.map((item, index) => (
              <div key={index} className="mb-4 border-l-2 border-brand-dark pl-4 last:mb-0">
                <p className="font-semibold text-brand-dark">{item.nama}</p>
                <p className="text-sm text-[#616161]">{item.pemberi}</p>
                <p className="text-xs text-[#969696]">{item.tahun}</p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-[#969696]">
            Diverifikasi oleh Direktorat Kemahasiswaan Universitas Andalas • 14 Juni 2024
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default GenerateCV