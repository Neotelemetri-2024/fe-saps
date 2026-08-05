import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import { CheckCircle2, XCircle } from 'lucide-react'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import KegiatanCell from '../../components/dashboard/KegiatanCell'
import ActionMenu from '../../components/ui/ActionMenu'
import { getKegiatan, updateKegiatan } from '../../services/kegiatanService'

function formatTanggal(value) {
  if (!value) return ''
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return String(value)
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return String(value)
  }
}

function mapKegiatanRow(item, i) {
  return {
    id: item.id,
    no: i + 1,
    kegiatan: item.nama,
    diajukanPada: formatTanggal(item.createdAt),
    pengaju: 'Mahasiswa',
    nim: '-',
    tgl: formatTanggal(item.tgl || item.tanggal || item.tanggalMulai),
    status: item.status,
  }
}

function PimpinanFakultasPersetujuan() {
  const [data, setData] = useState([])

  useEffect(() => {
    getKegiatan().then((res) => setData(res.slice(0, 4).map(mapKegiatanRow)))
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
      stopPropagation: true,
      render: (row) => (
        <ActionMenu
          items={[
            {
              label: 'Setujui',
              icon: <CheckCircle2 className="h-4 w-4" />,
              color: 'text-emerald-600',
              onClick: async () => {
                try {
                  await updateKegiatan(row.id, { status: 'disetujui' })
                  toast.success('Disetujui!', { description: `Pengajuan "${row.kegiatan}" telah disetujui.` })
                  const res = await getKegiatan()
                  setData(res.slice(0, 4).map(mapKegiatanRow))
                } catch (err) { toast.error('Gagal', { description: err.message }) }
              },
            },
            {
              label: 'Tolak',
              icon: <XCircle className="h-4 w-4" />,
              color: 'text-red-500',
              onClick: async () => {
                try {
                  await updateKegiatan(row.id, { status: 'ditolak' })
                  toast.error('Ditolak!', { description: `Pengajuan "${row.kegiatan}" telah ditolak.` })
                  const res = await getKegiatan()
                  setData(res.slice(0, 4).map(mapKegiatanRow))
                } catch (err) { toast.error('Gagal', { description: err.message }) }
              },
            },
          ]}
        />
      ),
    },
  ]
  return (
    <DashboardLayout role="pimpinan_fakultas" userName="Dr. Andi Wijaya" userRole="Pimpinan Fakultas">
      <div className="space-y-6">
        <TableCard title="Persetujuan Kegiatan">
          <TableFrame>
            <DataTable columns={columns} data={data} />
          </TableFrame>
        </TableCard>
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-[#222]">Alasan Penolakan</h3>
          <textarea className="w-full rounded-lg border border-[#e9ebf8] p-4 text-sm outline-none" rows={3} placeholder="Tuliskan alasan jika menolak pengajuan..." />
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PimpinanFakultasPersetujuan