import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Clock } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import DataTable from '../../components/dashboard/DataTable'
import KegiatanCell from '../../components/dashboard/KegiatanCell'
import { getPengajuanPimpinanDitmawa, subscribeDataUpdate } from '../../services/pengajuanService'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'

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
    <DashboardLayout role="pimpinan_ditmawa" userName="Dr. Dendi Adi Saputra" userRole="Pimpinan Ditmawa">
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-extrabold text-[#222] sm:text-3xl">
            Verifikasi Pengajuan Kegiatan Eksternal
          </h2>
          <p className="mt-1 text-sm text-[#616161]">
            Pengajuan yang telah diteruskan oleh Admin Ditmawa.
          </p>
        </div>

        <TableCard title="Daftar Pengajuan Eksternal">
          <TableFrame>
            <DataTable
              loading={loading}
              data={items}
              emptyText="Belum ada pengajuan yang diteruskan dari Admin Ditmawa."
              columns={[
                { key: 'no', label: 'No', render: (_item, index) => index + 1 },
                {
                  key: 'mahasiswa', label: 'Mahasiswa',
                  render: (item) => (
                    <div className="flex flex-col gap-0.5">
                      <p className="font-bold uppercase text-black">{item.namaMahasiswa || '-'}</p>
                      <p className="text-sm font-medium text-orange-500">{item.nim || '-'}</p>
                      <p className="text-sm text-sky-500">{item.prodi || '-'}</p>
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>{item.diajukanPada || '-'}</span>
                      </div>
                    </div>
                  ),
                },
                { key: 'kegiatan', label: 'Kegiatan', render: (item) => <KegiatanCell nama={item.kegiatan || '-'} tanggal={item.diajukanPada || '-'} /> },
                { key: 'kategori', label: 'Kategori', render: (item) => <span className="text-black">{item.kategori || '-'}</span> },
                { key: 'tanggal', label: 'Tanggal', render: (item) => item.tanggal || '-' },
                { key: 'status', label: 'Status', render: (item) => <StatusBadge status={item.status} /> },
              ]}
            />
          </TableFrame>
        </TableCard>
      </div>
    </DashboardLayout>
  )
}

export default VerifikasiPengajuanEksternalPimpinan
