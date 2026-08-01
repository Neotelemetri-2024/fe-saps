import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import ProgressBar from '../../components/dashboard/ProgressBar'
import { getCurrentUser } from '../../services/authService'
import { get } from '../../services/apiClient'

function MahasiswaPerluPerhatian() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    get('/api/dosen/mahasiswa-perlu-perhatian')
      .then((res) => {
        const list = res?.data || res || []
        setData(
          (Array.isArray(list) ? list : []).map((item, i) => ({
            no: i + 1,
            mahasiswaId: item.mahasiswaId ?? item.id,
            mahasiswa: item.nama || item.mahasiswa || '-',
            nim: item.nim || '-',
            ipk: item.ipk ?? '-',
            capaian: item.capaianPersen ?? item.capaian ?? 0,
            status: 'red',
            prodi: item.prodi || '-',
            poin: item.totalPoin ?? item.poin ?? 0,
          })),
        )
      })
      .catch((err) => {
        setData([])
        toast.error('Gagal memuat data', { description: err.message })
      })
      .finally(() => setLoading(false))
  }, [])

  const columns = useMemo(() => [
    { key: 'no', label: 'NO', render: (row) => <span className="text-[#616161]">{row.no}</span> },
    { key: 'mahasiswa', label: 'MAHASISWA' },
    { key: 'nim', label: 'NIM' },
    { key: 'ipk', label: 'IPK' },
    {
      key: 'capaian',
      label: 'CAPAIAN',
      render: (row) => (
        <div className="flex items-center gap-2">
          <ProgressBar value={row.capaian} max={100} height={8} color="bg-red-500" />
          <span className="text-sm text-[#616161]">{row.capaian}%</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => (
        <div className={`h-4 w-4 rounded-full ${row.status === 'red' ? 'bg-red-500' : 'bg-green-500'}`} />
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      render: (row) => (
        <button
          type="button"
          title="Detail"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-400 bg-blue-50 text-blue-600 transition hover:bg-blue-500 hover:text-white"
          onClick={() => navigate(`/dosen/lihat-detail/${row.mahasiswaId || row.nim}`, {
            state: {
              mahasiswa: {
                mahasiswaId: row.mahasiswaId,
                nama: row.mahasiswa,
                nim: row.nim,
                prodi: row.prodi,
                ipk: row.ipk,
                poin: row.poin,
                capaianPersen: row.capaian,
              },
            },
          })}
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ], [navigate])

  return (
    <DashboardLayout role="dosen" userName={user?.nama || 'Dosen Pembimbing'} userRole="Dosen Pembimbing">
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-[#222] sm:text-2xl">Mahasiswa yang Perlu Perhatian!</h2>
        <TableCard title="Mahasiswa Perlu Perhatian">
          <TableFrame>
            {loading ? (
              <p className="py-8 text-center text-sm text-[#9aa0a6]">Memuat data…</p>
            ) : (
              <>
                <DataTable columns={columns} data={data} />
                <p className="mt-4 text-sm text-[#616161]">
                  menampilkan {data.length === 0 ? 0 : 1} - {data.length} dari {data.length} Mahasiswa
                </p>
              </>
            )}
          </TableFrame>
        </TableCard>
      </div>
    </DashboardLayout>
  )
}

export default MahasiswaPerluPerhatian
