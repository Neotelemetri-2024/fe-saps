import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import DataTable from '../../components/dashboard/DataTable'
import { getKegiatan, updateKegiatan } from '../../services/kegiatanService'

function PimpinanFakultasPersetujuan() {
  const [data, setData] = useState([])

  useEffect(() => {
    getKegiatan().then((res) => setData(res.slice(0, 4).map((item, i) => ({
      id: item.id,
      kegiatan: item.nama,
      pengaju: 'Mahasiswa',
      nim: '-',
      tgl: item.tgl || item.tanggal || '',
      status: item.status,
    }))))
  }, [])

  const columns = [
    { key: 'kegiatan', label: 'Kegiatan' },
    { key: 'pengaju', label: 'Pengaju' },
    { key: 'nim', label: 'NIM' },
    { key: 'tgl', label: 'Tanggal' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'aksi',
      label: 'Aksi',
      render: (row) => (
        <div className="flex gap-2">
          <button
            className="rounded-lg bg-brand-dark px-4 py-1.5 text-xs font-medium text-white transition hover:opacity-90"
            onClick={async () => {
              try {
                await updateKegiatan(row.id, { status: 'disetujui' })
                toast.success('Disetujui!', { description: `Pengajuan "${row.kegiatan}" telah disetujui.` })
                const res = await getKegiatan()
                setData(res.slice(0, 4).map((item) => ({ id: item.id, kegiatan: item.nama, pengaju: 'Mahasiswa', nim: '-', tgl: item.tgl || item.tanggal || '', status: item.status })))
              } catch (err) { toast.error('Gagal', { description: err.message }) }
            }}
          >
            Setujui
          </button>
          <button
            className="rounded-lg border border-red-500 px-4 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
            onClick={async () => {
              try {
                await updateKegiatan(row.id, { status: 'ditolak' })
                toast.error('Ditolak!', { description: `Pengajuan "${row.kegiatan}" telah ditolak.` })
                const res = await getKegiatan()
                setData(res.slice(0, 4).map((item) => ({ id: item.id, kegiatan: item.nama, pengaju: 'Mahasiswa', nim: '-', tgl: item.tgl || item.tanggal || '', status: item.status })))
              } catch (err) { toast.error('Gagal', { description: err.message }) }
            }}
          >
            Tolak
          </button>
        </div>
      ),
    },
  ]
  return (
    <DashboardLayout role="pimpinan-fakultas" userName="Dr. Andi Wijaya" userRole="Pimpinan Fakultas">
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