import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { HorizontalBarChart } from '../../components/charts'
import { toast } from 'sonner'
import { get } from '../../services/apiClient'
import { getCurrentUser } from '../../services/authService'
import { getKegiatan } from '../../services/kegiatanService'

function PimpinanDitmawaDashboard() {
  const user = getCurrentUser()
  const [stats, setStats] = useState({
    mahasiswaAktif: 0, totalFakultas: 0, totalPending: 0, kurikulumAktif: '-',
  })
  const [grafikData, setGrafikData] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      get('/api/umum/dashboard/pimpinan-ditmawa').catch(() => null),
      getKegiatan({ limit: 10, status: 'terpublikasi' }).catch(() => []),
    ]).then(([dash, keg]) => {
      if (dash?.data) {
        const s = dash.data.statistik || {}
        setStats({
          mahasiswaAktif: s.mahasiswaAktif ?? 0,
          totalFakultas: s.totalFakultas ?? 0,
          totalPending: s.totalPending ?? 0,
          kurikulumAktif: s.kurikulumAktif ?? '-',
        })
        setGrafikData(
          (dash.data.grafikPoinUkm || []).map((d) => ({
            label: d.ukm || d.label || '-',
            poin: d.totalPoin ?? d.poin ?? 0,
          }))
        )
      }
      const kegList = Array.isArray(keg) ? keg : []
      setEvents(kegList.map((k, i) => ({
        no: i + 1,
        nama: k.nama || '-',
        tipe: k.kategori?.nama || '-',
        penyelenggara: k.organisasi?.nama || k.pembuat?.nama || '-',
        kategori: k.kategori?.nama || '-',
        peserta: k._count?.partisipasi ?? k.peserta ?? 0,
        skala: k.skala?.nama || '-',
      })))
    }).finally(() => setLoading(false))
  }, [])

  const cards = [
    { label: 'MAHASISWA AKTIF', value: stats.mahasiswaAktif },
    { label: 'TOTAL FAKULTAS', value: stats.totalFakultas },
    { label: 'TOTAL PENDING', value: stats.totalPending },
    { label: 'KURIKULUM AKTIF', value: stats.kurikulumAktif },
  ]

  return (
    <DashboardLayout
      role="pimpinan_ditmawa"
      userName={user?.nama || 'Pimpinan Ditmawa'}
      userRole="Pimpinan Ditmawa"
    >
      <div className="space-y-6">
        <div>
          <h2 className="bg-gradient-to-r from-brand-dark to-brand-light bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl">
            Dashboard Pimpinan / Direktorat
          </h2>
          <p className="mt-1 text-sm text-[#616161]">
            Pantau aktivitas mahasiswa dan pengajuan UKM secara real-time.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#616161]">{card.label}</p>
              <p className="mt-2 text-3xl font-extrabold text-brand-dark">
                {loading ? '…' : String(card.value)}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-brand-dark">
            Grafik poin per UKM berdasarkan pengajuan Kegiatan
          </h3>
          {grafikData.length === 0 ? (
            <p className="mt-4 text-sm text-[#9aa0a6]">{loading ? 'Memuat…' : 'Belum ada data.'}</p>
          ) : (
            <HorizontalBarChart
              labels={grafikData.map((d) => d.label)}
              values={grafikData.map((d) => d.poin)}
              max={Math.max(...grafikData.map((d) => d.poin), 10)}
            />
          )}
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
          <div className="border-b border-[#e9ebf8] px-6 py-4">
            <h3 className="text-lg font-bold text-brand-dark">Daftar Event Terpublikasi</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-xs font-semibold uppercase tracking-wide text-white">
                  <th className="px-4 py-3 text-center">No</th>
                  <th className="px-4 py-3">Nama Kegiatan</th>
                  <th className="px-4 py-3">Tipe</th>
                  <th className="px-4 py-3">Penyelenggara</th>
                  <th className="px-4 py-3 text-center">Peserta</th>
                  <th className="px-4 py-3">Skala</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-[#9aa0a6]">
                      Memuat…
                    </td>
                  </tr>
                ) : events.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-[#9aa0a6]">
                      Belum ada event terpublikasi.
                    </td>
                  </tr>
                ) : (
                  events.map((e) => (
                    <tr key={e.no} className="border-b border-[#e9ebf8] last:border-0 hover:bg-[#f9fafb]">
                      <td className="px-4 py-3 text-center text-[#616161]">{e.no}</td>
                      <td className="px-4 py-3 font-medium text-[#333]">{e.nama}</td>
                      <td className="px-4 py-3 text-[#616161]">{e.tipe}</td>
                      <td className="px-4 py-3 text-[#616161]">{e.penyelenggara}</td>
                      <td className="px-4 py-3 text-center text-[#616161]">{e.peserta}</td>
                      <td className="px-4 py-3 text-[#616161]">{e.skala}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PimpinanDitmawaDashboard
