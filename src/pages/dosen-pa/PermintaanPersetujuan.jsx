import React, { useState, useEffect } from 'react'
import { Search, Filter, Pencil } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import StatusBadge from '../../components/dashboard/StatusBadge'
import Modal from '../../components/ui/Modal'
import { getPersetujuanDosen, setujuiTolak } from '../../services/pengajuanService'

const columns = (openModal) => [
  { key: 'no', label: 'NO' },
  { key: 'kegiatan', label: 'KEGIATAN' },
  { key: 'jenis', label: 'JENIS' },
  { key: 'peran', label: 'PERAN' },
  { key: 'penyelenggara', label: 'PENYELENGGARA' },
  { key: 'tanggal', label: 'TANGGAL' },
  { key: 'status', label: 'STATUS', render: (row) => <StatusBadge status={row.status} /> },
  {
    key: 'aksi',
    label: 'AKSI',
    render: (row) => (
      <button
        onClick={() => openModal(row)}
        className="rounded p-1 text-brand-dark transition hover:bg-green-50"
      >
        <Pencil className="h-4 w-4" />
      </button>
    ),
  },
]

function PermintaanPersetujuan() {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState(null)
  const [actionType, setActionType] = useState(null)
  const [alasan, setAlasan] = useState('')
  const [loading, setLoading] = useState(false)

  const openModal = (row) => {
    setSelectedRow(row)
    setActionType(null)
    setAlasan('')
    setModalOpen(true)
  }

  const handleAction = async (type) => {
    if (type === 'setuju') {
      setLoading(true)
      try {
        await setujuiTolak(selectedRow.id, 'disetujui', '')
        toast.success('Disetujui!', {
          description: `Kegiatan "${selectedRow.kegiatan}" berhasil disetujui.`,
        })
        setModalOpen(false)
        const res = await getPersetujuanDosen()
        setData(res.map((item, i) => ({ no: i + 1, ...item })))
      } catch (err) {
        toast.error('Gagal', { description: err.message })
      } finally {
        setLoading(false)
      }
      return
    }
    setActionType(type)
    setAlasan('')
  }

  const handleKirimAlasan = async () => {
    if (alasan.trim() === '') {
      toast.error('Gagal!', {
        description: 'Alasan tidak boleh kosong.',
      })
      return
    }
    setLoading(true)
    try {
      const statusKey = actionType === 'revisi' ? 'revisi' : 'ditolak'
      await setujuiTolak(selectedRow.id, statusKey, alasan.trim())
      toast.success('Berhasil!', {
        description: `Kegiatan "${selectedRow.kegiatan}" berhasil di${actionType}`,
      })
      setAlasan('')
      setModalOpen(false)
      const res = await getPersetujuanDosen()
      setData(res.map((item, i) => ({ no: i + 1, ...item })))
    } catch (err) {
      toast.error('Gagal', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getPersetujuanDosen().then((res) => setData(res.map((item, i) => ({ no: i + 1, ...item }))))
  }, [])

  return (
    <DashboardLayout role="dosen-pa" userName="Dr. Efa Yonnedi, SE, MPPM, Akt, CA, CRGP" userRole="Dosen Pembimbing">
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Setujui Kegiatan dari Mahasiswa">
        {!actionType ? (
          <div className="flex justify-center gap-4">
            <button
              onClick={() => handleAction('setuju')}
              className="flex-1 rounded-xl bg-green-700 px-6 py-3 text-white font-semibold shadow-md transition hover:opacity-90"
            >
              SETUJU
            </button>
            <button
              onClick={() => handleAction('revisi')}
              className="flex-1 rounded-xl bg-orange-500 px-6 py-3 text-white font-semibold shadow-md transition hover:opacity-90"
            >
              REVISI
            </button>
            <button
              onClick={() => handleAction('tolak')}
              className="flex-1 rounded-xl bg-red-700 px-6 py-3 text-white font-semibold shadow-md transition hover:opacity-90"
            >
              TOLAK
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-2 text-sm font-medium text-black">
              Alasan {actionType === 'revisi' ? 'Revisi' : 'Tolak'}<span className="text-red-500">*</span>
            </p>
            <textarea
              className="w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
              rows="4"
              placeholder={actionType === 'revisi' ? 'Alasan revisi...' : 'Tidak sesuai dengan kriteria yang ada'}
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              maxLength={500}
            ></textarea>
            <p className="text-right text-xs text-[#616161] mt-1">{alasan.length}/500</p>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={handleKirimAlasan}
                className={`rounded-xl px-6 py-3 text-white font-semibold shadow-md transition hover:opacity-90 ${actionType === 'revisi' ? 'bg-orange-500' : 'bg-red-700'}`}
              >
                KIRIM ALASAN
              </button>
              <button
                onClick={() => { setActionType(null); setAlasan('') }}
                className="rounded-xl border border-gray-400 px-6 py-3 text-gray-700 font-semibold shadow-md transition hover:bg-gray-100"
              >
                BATAL
              </button>
            </div>
          </div>
        )}
      </Modal>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-brand-dark">Permintaan Persetujuan</h2>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#e9ebf8] px-4 py-2">
            <Search className="h-4 w-4 text-[#616161]" />
            <input
              type="text"
              placeholder="Cari mahasiswa atau kegiatan..."
              className="flex-1 text-sm outline-none"
            />
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-brand-light px-4 py-2 text-sm font-medium text-white transition hover:opacity-90">
            <Filter className="h-4 w-4" />
            Filter
          </button>
          
          <select className="rounded-lg border border-[#e9ebf8] px-4 py-2 text-sm text-[#333] outline-none">
            <option>Kategori</option>
          </select>
          <select className="rounded-lg border border-[#e9ebf8] px-4 py-2 text-sm text-[#333] outline-none">
            <option>Peran</option>
          </select>
          <select className="rounded-lg border border-[#e9ebf8] px-4 py-2 text-sm text-[#333] outline-none">
            <option>Status</option>
          </select>
          <select className="rounded-lg border border-[#e9ebf8] px-4 py-2 text-sm text-[#333] outline-none">
            <option>Skala</option>
          </select>
          <select className="rounded-lg border border-[#e9ebf8] px-4 py-2 text-sm text-[#333] outline-none">
            <option>Tahun</option>
          </select>
          <button className="text-sm font-medium text-[#616161] hover:underline">Reset Filter</button>
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-brand-dark">Permintaan Persetujuan</h3>
          <DataTable columns={columns(openModal)} data={data} />
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PermintaanPersetujuan