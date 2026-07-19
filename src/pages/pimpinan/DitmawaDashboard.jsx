import { Download } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'

const ukmData = [
  { label: 'UKM Olahraga', poin: 45 },
  { label: 'UKM Seni', poin: 38 },
  { label: 'UKM Penalaran', poin: 55 },
  { label: 'UKM Sosial', poin: 60 },
  { label: 'UKM Bahasa', poin: 22 },
]

function RoundedBarChart({ data }) {
  const maxPoin = Math.max(...data.map((d) => d.poin))
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-28 text-xs font-medium text-[#333]">{d.label}</span>
          <div className="flex h-6 flex-1 overflow-hidden rounded-full bg-[#e9ebf8]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-dark to-brand-light transition-all"
              style={{ width: `${(d.poin / maxPoin) * 100}%` }}
            />
          </div>
          <span className="w-8 text-right text-xs font-semibold text-[#616161]">{d.poin}</span>
        </div>
      ))}
    </div>
  )
}

const daftarEvent = [
  { no: 1, nama: 'TAC (Training Andalasian Character)', dalam: '2 hari', tipe: 'Lomba', penyelenggara: 'BEM Universitas', kategori: 'Wajib', peserta: 1000, skala: 'Universitas' },
  { no: 2, nama: 'Lomba Debat Mahasiswa', dalam: '3 hari', tipe: 'Lomba', penyelenggara: 'UKM Penalaran', kategori: 'Wajib', peserta: 500, skala: 'Universitas' },
  { no: 3, nama: 'Seminar Nasional AI', dalam: '4 hari', tipe: 'Seminar', penyelenggara: 'Hima FTI', kategori: 'Wajib', peserta: 200, skala: 'Nasional' },
  { no: 4, nama: 'Workshop Digital Marketing', dalam: '1 hari', tipe: 'Workshop', penyelenggara: 'UKM Bisnis', kategori: 'Pilihan', peserta: 100, skala: 'Universitas' },
]

function PimpinanDitmawaDashboard() {
  return (
    <DashboardLayout role="pimpinan-ditmawa" userName="Dr. Dendi Adi Saputra" userRole="Pimpinan Ditmawa">
      <div className="space-y-6">
        <div>
          <h2 className="bg-gradient-to-r from-brand-dark to-brand-light bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl">
            Dashboard Pimpinan / Direktorat
          </h2>
          <p className="mt-1 text-sm text-[#616161]">Pantau aktivitas mahasiswa dan pengajuan UKM secara real-time.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'MAHASISWA AKTIF', value: '12.110' },
            { label: 'TOTAL FAKULTAS', value: '15' },
            { label: 'TOTAL PENDING', value: '3' },
            { label: 'KURIKULUM AKTIF', value: '1' },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#616161]">{card.label}</p>
              <p className="mt-2 text-3xl font-extrabold text-brand-dark">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-brand-dark">Grafik poin per UKM berdasarkan pengajuan Kegiatan</h3>
          <RoundedBarChart data={ukmData} />
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
          <div className="border-b border-[#e9ebf8] px-6 py-4">
            <h3 className="text-lg font-bold text-brand-dark">Daftar Event</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-xs font-semibold uppercase tracking-wide text-white">
                  <th className="px-4 py-3">No</th>
                  <th className="px-4 py-3">Nama Kegiatan</th>
                  <th className="px-4 py-3">Dalam</th>
                  <th className="px-4 py-3">Tipe</th>
                  <th className="px-4 py-3">Penyelenggara</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Peserta</th>
                  <th className="px-4 py-3">Skala</th>
                </tr>
              </thead>
              <tbody>
                {daftarEvent.map((e) => (
                  <tr key={e.no} className="border-b border-[#e9ebf8] last:border-0 hover:bg-[#f9fafb]">
                    <td className="px-4 py-3 text-[#616161]">{e.no}</td>
                    <td className="px-4 py-3 font-medium text-[#333]">{e.nama}</td>
                    <td className="px-4 py-3 text-[#616161]">{e.dalam}</td>
                    <td className="px-4 py-3 text-[#616161]">{e.tipe}</td>
                    <td className="px-4 py-3 text-[#616161]">{e.penyelenggara}</td>
                    <td className="px-4 py-3 text-[#616161]">{e.kategori}</td>
                    <td className="px-4 py-3 text-[#616161]">{e.peserta}</td>
                    <td className="px-4 py-3 text-[#616161]">{e.skala}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-[#e9ebf8] px-4 py-3 text-xs text-[#616161] sm:flex-row sm:items-center sm:justify-between">
            <span>Showing 1 - 10 From Total 20</span>
            <span>Page 1 of 2</span>
            <div className="flex items-center gap-1">
              <button className="rounded px-2 py-1 hover:bg-[#f0f4f0]">Previous</button>
              <button className="rounded bg-brand-dark px-2 py-1 text-white">1</button>
              <button className="rounded px-2 py-1 hover:bg-[#f0f4f0]">2</button>
              <span className="px-1">...</span>
              <button className="rounded px-2 py-1 hover:bg-[#f0f4f0]">3</button>
              <button className="rounded px-2 py-1 hover:bg-[#f0f4f0]">4</button>
              <button className="rounded px-2 py-1 hover:bg-[#f0f4f0]">Next</button>
            </div>
          </div>
        </div>

        <div className="max-w-lg rounded-xl bg-gradient-to-r from-brand-dark to-brand-light p-6 text-white shadow-sm">
          <h3 className="text-lg font-bold">Download Panduan</h3>
          <div className="mt-4 flex items-start gap-3 text-sm text-white/90">
            <Download className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">Panduan Penggunaan Website MyUnand Student Connect 2026.pdf</p>
              <p className="mt-1 text-xs text-white/70">PDF • 2.1 MB</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PimpinanDitmawaDashboard
