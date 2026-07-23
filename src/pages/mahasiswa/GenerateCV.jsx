import { useState } from 'react'
import { Download, Share2 } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'

const userData = {
  name: 'AMARA MARSHINTA',
  initials: 'AR',
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
    jabatan: 'Ketua Divisi Pengembangan Sumber Daya Manusia',
    organisasi: 'UKM Teknologi Pangan Unand',
    tahunMulai: '2023',
    tahunSelesai: 'sekarang',
  },
  {
    jabatan: 'Anggota Aktif',
    organisasi: 'UKM Robotika Unand',
    tahunMulai: '2023',
    tahunSelesai: '2024',
  },
  {
    jabatan: 'Peserta BAKTI 2023',
    organisasi: 'Ditmawa Unand',
    tahunMulai: '',
    tahunSelesai: 'Jun 2024',
  },
]

const sertifikasiData = [
  { nama: 'Seminar Nasional AI & Teknologi', tahun: '2023' },
  { nama: 'Workshop UI/UX Design', tahun: '2023' },
  { nama: 'Pelatihan Kewirausahaan', tahun: '2023' },
  { nama: 'Seminar Kepemimpinan Nasional', tahun: '2023' },
]

const prestasiData = [
  { nama: 'Juara II Lomba KTI Nasional', pemberi: 'Kemendikbud', tahun: '2023' },
  { nama: 'Finalis Lomba Inovasi Digital', pemberi: 'Fakultas Teknik Unand', tahun: '2023' },
]

function GenerateCV() {
  const [generated, setGenerated] = useState(false)

  return (
    <DashboardLayout role="mahasiswa" userName="Amara Marshinta" userRole="Mahasiswa">
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="text-xs text-[#9aa0a6]">
          <span>Activities</span>
          <span className="mx-1.5">›</span>
          <span className="font-medium text-[#444]">Generate CV</span>
        </div>

        {/* Tombol Generate CV + deskripsi */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setGenerated(true)}
            className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            Generate CV
          </button>
          <p className="text-sm text-[#616161]">Buat CV profesional dari data aktivitas Anda secara otomatis.</p>
        </div>

        {/* CV + tombol aksi — tampil setelah generate */}
        {generated && (
          <div className="space-y-4">
            {/* Tombol Download & Bagikan */}
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                <Download className="h-4 w-4" /> Download PDF
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-[#d1d5db] bg-white px-4 py-2 text-sm font-semibold text-[#444] shadow-sm transition hover:bg-[#f5f5f5]"
              >
                <Share2 className="h-4 w-4" /> Bagikan
              </button>
            </div>

            {/* Dokumen CV */}
            <div className="mx-auto w-full max-w-2xl rounded-xl bg-white p-5 shadow-lg ring-1 ring-[#e9ebf8] sm:p-10">
              {/* Header CV */}
              <div className="mb-7 flex flex-col items-start gap-4 sm:flex-row sm:items-start sm:gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm border-2 border-[#333] text-xl font-extrabold text-[#333]">
                  {userData.initials}
                </div>
                <div>
                  <h2 className="text-lg font-extrabold tracking-wide text-[#111]">{userData.name}</h2>
                  <p className="text-sm text-[#444]">
                    {userData.nim} | {userData.prodi} — {userData.universitas}
                  </p>
                  <div className="mt-1 space-y-0.5 text-xs text-[#555]">
                    <p>✉ {userData.email} &nbsp; ✆ {userData.phone}</p>
                    <p>⊙ {userData.address}</p>
                  </div>
                </div>
              </div>

              <hr className="mb-5 border-[#333]" />

              {/* Pendidikan */}
              <section className="mb-6">
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#333]">Pendidikan</h3>
                {pendidikanData.map((item, i) => (
                  <div key={i} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-[#111]">{item.jenjang}</p>
                      <p className="text-xs text-[#555]">{item.institusi}</p>
                    </div>
                    <div className="text-left text-xs text-[#555] shrink-0 sm:text-right sm:ml-4">
                      <p>{item.tahunMulai} — {item.tahunSelesai}</p>
                      {item.ipk && <p>IPK: {item.ipk}</p>}
                    </div>
                  </div>
                ))}
              </section>

              {/* Pengalaman Organisasi */}
              <section className="mb-6">
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#333]">Pengalaman Organisasi</h3>
                <div className="space-y-3">
                  {organisasiData.map((item, i) => (
                    <div key={i} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-bold text-[#111]">{item.jabatan}</p>
                        <p className="text-xs text-[#555]">{item.organisasi}</p>
                      </div>
                      <div className="text-left text-xs text-[#555] shrink-0 sm:text-right sm:ml-4">
                        {item.tahunMulai && item.tahunSelesai
                          ? `${item.tahunMulai} — ${item.tahunSelesai}`
                          : item.tahunSelesai}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Sertifikasi & Pelatihan */}
              <section className="mb-6">
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#333]">Sertifikasi &amp; Pelatihan</h3>
                <ul className="space-y-1">
                  {sertifikasiData.map((item, i) => (
                    <li key={i} className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between text-sm">
                      <span className="text-[#333]">• {item.nama}</span>
                      <span className="shrink-0 text-xs text-[#555] sm:ml-4">{item.tahun}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Prestasi & Penghargaan */}
              <section className="mb-6">
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#333]">Prestasi &amp; Penghargaan</h3>
                <div className="space-y-3">
                  {prestasiData.map((item, i) => (
                    <div key={i} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="flex items-center gap-1.5 text-sm font-bold text-[#111]">
                          <span className="text-brand-dark">⊙</span> {item.nama}
                        </p>
                        <p className="ml-5 text-xs text-[#555]">{item.pemberi}</p>
                      </div>
                      <span className="shrink-0 text-xs text-[#555] sm:ml-4">{item.tahun}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Footer CV */}
              <hr className="mb-4 border-[#e0e0e0]" />
              <p className="text-center text-[10px] text-[#9aa0a6]">
                Diverifikasi oleh Direktorat Kemahasiswaan Universitas Andalas • 14 Juni 2024
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default GenerateCV
