import React from 'react'
import { CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import ProgressBar from '../../components/dashboard/ProgressBar'
import logoUnand from '../../assets/logo_unand.png'

const subCapaian = [
  { kategori: 'Religious Character Development (Religius)', items: [{ label: 'Leadership', value: 70 }, { label: 'Global', value: 50 }, { label: 'Social', value: 60 }, { label: 'Entrepreneurship', value: 80 }, { label: 'Critical', value: 75 }] },
]

const totalPoinData = [
  { category: 'Fondasi', value: 80 },
  { category: 'Penguatan', value: 90 },
  { category: 'Pemantapan', value: 75 },
  { category: 'Aktualisasi', value: 60 },
]

const timelineAktivitas = [
  { event: 'Seminar nasional AI dan Teknologi', date: '5 Juni 2026', status: 'Disetujui Universitas', statusColor: 'bg-green-100 text-green-700' },
  { event: 'Bakti Sosial Lingkungan Kampus', date: '3 Juni 2026', status: 'Disetujui Fakultas', statusColor: 'bg-green-100 text-green-700' },
  { event: 'Pelatihan kewirausahaan muda', date: '10 Mei 2026', status: 'Pending', statusColor: 'bg-yellow-100 text-yellow-700' },
]

const riwayatCatatan = [
  { message: 'Tingkatkan capaian Social Contribution. Segera ikuti KKN dan kegiatan bakti sebelum akhir semester ini. Progress akademik sudah sangat baik, pertahankan IPK anda.', date: '10 Juli 2026' },
  { message: 'Ikuti good laboratory practice untuk meningkatkan skill SOP dalam labor', date: '5 Juni 2026' },
]

function DosenPADetail() {
  const handleKirimPesan = () => {
    toast.success('Pesan Terkirim!', {
      description: 'Pesan kepada mahasiswa berhasil dikirim.',
    })
  }

  return (
    <DashboardLayout role="dosen-pa" userName="Dr. Efa Yonnedi, SE, MPPM, Akt, CA, CRGP" userRole="Dosen Pembimbing">
      <div className="space-y-6">
        {/* Header Mahasiswa */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <div className="flex items-start gap-6">
            <img src={logoUnand} alt="Logo" className="h-[100px] w-auto object-contain" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-brand-dark">Shafa Salsabilla</h2>
                  <p className="text-sm text-[#616161]">2311121053 • Teknik Mesin</p>
                  <div className="mt-2 flex gap-4 text-xs">
                    <span className="rounded-full bg-brand-dark px-3 py-1 text-white font-medium">Angkatan 23</span>
                    <span className="font-medium text-[#616161]">IPK 3.80</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-brand-dark">470</p>
                  <p className="text-sm text-[#616161]">/ 550 Poin</p>
                  <ProgressBar value={470} max={550} height={8} color="bg-brand-light" />
                  <p className="mt-1 text-xs text-[#616161]">85% dari target yudisium</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sub Capaian & Total Poin per Capaian */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Sub Capaian */}
          <div className="rounded-xl border border-[#e9ebf8] bg-brand-dark p-6 text-white shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Sub Capaian</h3>
              <select className="rounded-md bg-white bg-opacity-20 px-3 py-1 text-sm text-white outline-none">
                <option>--Pilih Capaian--</option>
              </select>
            </div>
            {subCapaian.map((category, index) => (
              <div key={index}>
                <p className="text-sm font-semibold mb-3">{category.kategori}</p>
                <div className="grid grid-cols-2 gap-4">
                  {/* Radar Chart Placeholder */}
                  <div className="h-32 w-32 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-xs">
                    Radar Chart Here
                  </div>
                  <div className="space-y-2">
                    {category.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-xs">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24">
                            <ProgressBar value={item.value} max={100} height={5} color="bg-white" />
                          </div>
                          <span className="text-xs">{item.value}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total Poin per Capaian */}
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-brand-dark">Total Poin per Capaian</h3>
            <p className="text-sm text-[#616161] mb-4">Distribusi poin mahasiswa di setiap area pengembangan</p>
            <div className="space-y-3">
              {totalPoinData.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <span className="w-24 text-sm text-[#333]">{item.category}</span>
                  <div className="flex-1">
                    <ProgressBar value={item.value} max={100} height={8} color="bg-brand-light" />
                  </div>
                  <span className="text-sm text-[#616161]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline Aktivitas */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-brand-dark">Timeline Aktivitas</h3>
          <div className="space-y-4">
            {timelineAktivitas.map((activity, index) => (
              <div key={index} className="flex items-center justify-between border-l-2 border-brand-dark pl-4">
                <div>
                  <p className="font-medium text-[#333]">{activity.event}</p>
                  <p className="text-xs text-[#616161]">{activity.date}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${activity.statusColor}`}>{activity.status}</span>
              </div>
            ))}
            <button className="text-sm font-medium text-brand-dark hover:underline">menampilkan semua Timeline Aktivitas</button>
          </div>
        </div>

        {/* Pesan untuk Mahasiswa */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-brand-dark">Pesan untuk Mahasiswa</h3>
          <textarea className="w-full rounded-lg border border-[#e9ebf8] p-4 text-sm text-[#333] outline-none" rows={4} placeholder="Tuliskan saran bimbingan akademik dan konseling disini" />
          <button
            onClick={handleKirimPesan}
            className="mt-4 rounded-xl bg-brand-dark px-6 py-3 text-white font-semibold shadow-md transition hover:opacity-90"
          >
            Kirim Pesan
          </button>
        </div>

        {/* Riwayat Catatan */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-brand-dark">Riwayat Catatan</h3>
          <div className="space-y-3">
            {riwayatCatatan.map((catatan, index) => (
              <div key={index} className="rounded-lg bg-[#f9fafb] p-3">
                <p className="text-sm text-[#333]">{catatan.message}</p>
                <p className="mt-1 text-xs text-[#616161]">{catatan.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default DosenPADetail