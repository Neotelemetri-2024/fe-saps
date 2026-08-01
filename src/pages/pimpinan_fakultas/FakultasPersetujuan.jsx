import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import { CheckCircle2, XCircle } from 'lucide-react'
import DataTable from '../../components/dashboard/DataTable'
import KegiatanCell from '../../components/dashboard/KegiatanCell'
import { getKegiatan, updateKegiatan } from '../../services/kegiatanService'

function PimpinanFakultasPersetujuan() {
  const [data, setData] = useState([])

  useEffect(() => {
    getKegiatan().then((res) => setData(res.slice(0, 4).map((item, i) => ({
      id: item.id,
      no: i + 1,
      kegiatan: item.nama,
      diajukanPada: item.createdAt
        ? new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
        : '',
      pengaju: 'Mahasiswa',
      nim: '-',
      tgl: item.tgl || item.tanggal || '',
      status: item.status,
    }))))
  }, [])

  const columns = [
    { key: 'no', label: 'No', render: (row) => <span className="text-[#616161]">{row.no}</span> },
    { key: 'kegiatan', label: 'Kegiatan', render: (row) => <KegiatanCell nama={row.kegiatan} tanggal={row.diajukanPada} /> },
    { key: 'pengaju', label: 'Pengaju' },
    { key: 'nim', label: 'NIM' },
    { key: 'tgl', label: 'Tanggal' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'aksi',
      label: 'Aksi',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            title="Setujui"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-400 bg-emerald-50 text-emerald-600 transition hover:bg-emerald-500 hover:text-white"
            onClick={async () => {
              try {
                await updateKegiatan(row.id, { status: 'disetujui' })
                toast.success('Disetujui!', { description: `Pengajuan "${row.kegiatan}" telah disetujui.` })
                const res = await getKegiatan()
                setData(res.slice(0, 4).map((item, i) => ({ id: item.id, no: i + 1, kegiatan: item.nama, pengaju: 'Mahasiswa', nim: '-', tgl: item.tgl || item.tanggal || '', status: item.status })))
              } catch (err) { toast.error('Gagal', { description: err.message }) }
            }}
          >
            <CheckCircle2 className="h-4 w-4" />
          </button>
          <button
            title="Tolak"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-400 bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white"
            onClick={async () => {
              try {
                await updateKegiatan(row.id, { status: 'ditolak' })
                toast.error('Ditolak!', { description: `Pengajuan "${row.kegiatan}" telah ditolak.` })
                const res = await getKegiatan()
                setData(res.slice(0, 4).map((item, i) => ({ id: item.id, no: i + 1, kegiatan: item.nama, pengaju: 'Mahasiswa', nim: '-', tgl: item.tgl || item.tanggal || '', status: item.status })))
              } catch (err) { toast.error('Gagal', { description: err.message }) }
            }}
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]
  return (
    <DashboardLayout role="pimpinan_fakultas" userName="Dr. Andi Wijaya" userRole="Pimpinan Fakultas">
      <div className="space-y-6">
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-brand-dark">Persetujuan Kegiatan</h3>
          <DataTable columns={columns} data={data} />
        </div>
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-brand-dark">Alasan Penolakan</h3>
          <textarea className="w-full rounded-lg border border-[#e9ebf8] p-4 text-sm outline-none" rows={3} placeholder="Tuliskan alasan jika menolak pengajuan..." />
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PimpinanFakultasPersetujuan