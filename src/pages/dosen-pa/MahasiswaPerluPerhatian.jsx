import React from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import ProgressBar from '../../components/dashboard/ProgressBar'

const mahasiswaPerluPerhatianData = [
  { mahasiswa: 'Ihom', nim: '24812064', ipk: 2.70, capaian: 40, status: 'red' },
  { mahasiswa: 'Ihom', nim: '24812064', ipk: 2.70, capaian: 60, status: 'red' },
]

const columns = [
  { key: 'mahasiswa', label: 'MAHASISWA' },
  { key: 'nim', label: 'NIM' },
  { key: 'ipk', label: 'IPK' },
  { key: 'capaian', label: 'CAPAIAN', render: (row) => (
    <div className="flex items-center gap-2">
      <ProgressBar value={row.capaian} max={100} height={8} color="bg-red-500" />
      <span className="text-sm text-[#616161]">{row.capaian}%</span>
    </div>
  ) },
  { key: 'status', label: 'STATUS', render: (row) => (
    <div className={`h-4 w-4 rounded-full ${row.status === 'red' ? 'bg-red-500' : 'bg-green-500'}`} />
  ) },
  { key: 'aksi', label: 'AKSI', render: (row) => (
    <button className="text-sm font-medium text-brand-dark hover:underline" onClick={() => navigate(`/dosen-pa/lihat-detail/${row.nim}`)}>
      Lihat detail
    </button>
  ) },
]

function MahasiswaPerluPerhatian() {
  const navigate = useNavigate()

  return (
    <DashboardLayout role="dosen-pa" userName="Dr. Efa Yonnedi, SE, MPPM, Akt, CA, CRGP" userRole="Dosen Pembimbing">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-brand-dark">Mahasiswa yang Perlu Perhatian!</h2>
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <DataTable columns={columns} data={mahasiswaPerluPerhatianData} />
          <p className="mt-4 text-sm text-[#616161]">menampilkan 1 - 2 dari 2 Mahasiswa</p>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default MahasiswaPerluPerhatian