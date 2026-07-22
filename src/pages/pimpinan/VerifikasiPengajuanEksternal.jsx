import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Clock } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import { getPengajuanPimpinanDitmawa, subscribeDataUpdate } from '../../services/pengajuanService'

function VerifikasiPengajuanEksternalPimpinan() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    getPengajuanPimpinanDitmawa()
      .then(setItems)
      .catch((err) => toast.error('Gagal memuat data', { description: err.message }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    return subscribeDataUpdate((detail) => {
      if (!detail?.type || detail.type === 'pengajuan') load()
    })
  }, [])

  return (
    <DashboardLayout role="pimpinan-ditmawa" userName="Dr. Dendi Adi Saputra" userRole="Pimpinan Ditmawa">
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">
            Verifikasi Pengajuan Kegiatan Eksternal
          </h2>
          <p className="mt-1 text-sm text-[#616161]">
            Pengajuan yang telah diteruskan oleh Admin Ditmawa.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-xs font-semibold uppercase tracking-wide text-white">
                  <th className="px-4 py-3">No</th>
                  <th className="px-4 py-3">Mahasiswa</th>
                  <th className="px-4 py-3">Kegiatan</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-[#616161]">
                      Memuat data...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-[#616161]">
                      Belum ada pengajuan yang diteruskan dari Admin Ditmawa.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={item.id} className="border-b border-[#e9ebf8] last:border-0 hover:bg-[#f9fafb]">
                      <td className="px-4 py-3 text-[#616161]">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <p className="font-bold uppercase text-[#333]">{item.namaMahasiswa || '-'}</p>
                          <p className="text-sm font-medium text-orange-500">{item.nim || '-'}</p>
                          <p className="text-sm text-sky-500">{item.prodi || '-'}</p>
                          <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            <span>{item.diajukanPada || '-'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#616161]">{item.kegiatan || '-'}</td>
                      <td className="px-4 py-3 text-brand-light">{item.kategori || '-'}</td>
                      <td className="px-4 py-3 text-[#616161]">{item.tanggal || '-'}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>
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

export default VerifikasiPengajuanEksternalPimpinan
