import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Download, Edit3, Trash2 } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { getKegiatan, deleteKegiatan, updateKegiatan } from '../../services/kegiatanService'

const stats = [
  { label: 'DISETUJUI', value: 3, border: 'border-brand-dark', valueColor: 'text-brand-dark' },
  { label: 'PENDING', value: 4, border: 'border-yellow-400', valueColor: 'text-yellow-500' },
  { label: 'DITOLAK', value: 3, border: 'border-red-500', valueColor: 'text-red-600' },
  { label: 'EVENT GLOBAL AKTIF', value: 3, border: 'border-brand-dark', valueColor: 'text-brand-dark' },
]

const kegiatanTerbaru = [
  { no: 1, nama: 'TAC (Training Andalasian Character)', meta: '12 Febu - 14 feb 2026, 8.00 - 16.00', kategori: 'Lomba hackathon', skala: 'Universitas', tanggal: '12 Febu - 14 feb 2026', peserta: 1000, poin: 50, status: 'aktif' },
  { no: 2, nama: 'TAC (Training Andalasian Character)', meta: '12 Febu - 14 feb 2026, 8.00 - 16.00', kategori: 'Lomba hackathon', skala: 'Universitas', tanggal: '12 Febu - 14 feb 2026', peserta: 1000, poin: 50, status: 'aktif' },
  { no: 3, nama: 'TAC (Training Andalasian Character)', meta: '12 Febu - 14 feb 2026, 8.00 - 16.00', kategori: 'Lomba hackathon', skala: 'Universitas', tanggal: '12 Febu - 14 feb 2026', peserta: 1000, poin: 50, status: 'aktif' },
]

function AdminDitmawaDashboard() {
  const [data, setData] = useState([])
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    getKegiatan().then(setData)
  }, [])

  const handleEdit = async (item) => {
    try {
      await updateKegiatan(item.id, { status: 'aktif' })
      toast.success('Data diperbarui!', {
        description: `Kegiatan "${item.nama}" berhasil diperbarui.`,
      })
      const res = await getKegiatan()
      setData(res)
    } catch (err) {
      toast.error('Gagal', { description: err.message })
    }
  }

  const handleDeleteClick = (item) => {
    setSelectedItem(item)
    setShowConfirmDelete(true)
  }

  const handleDeleteConfirm = async () => {
    if (selectedItem) {
      try {
        await deleteKegiatan(selectedItem.id)
        toast.success('Dihapus!', { description: 'Kegiatan berhasil dihapus.' })
        const res = await getKegiatan()
        setData(res)
      } catch (err) {
        toast.error('Gagal', { description: err.message })
      }
    }
    setShowConfirmDelete(false)
    setSelectedItem(null)
  }

  return (
    <DashboardLayout role="admin-ditmawa" userName="Dr. Efa Yonnedi, SE. MPPM, Akt, CA, CRGP" userRole="Dosen Pembimbing">
      <ConfirmModal
        isOpen={showConfirmDelete}
       
        message={selectedItem ? `Yakin ingin menghapus "${selectedItem.nama}"?` : ''}
        confirmText="Ya, hapus"
        cancelText="Batal"
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setShowConfirmDelete(false); setSelectedItem(null) }}
      />

      <div className="space-y-6">
        <div>
          <h2 className="bg-gradient-to-r from-brand-dark to-brand-light bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl">
            Dashboard Admin Ditmawa
          </h2>
          <p className="mt-1 text-sm text-[#616161]">Kelola verifikasi kegiatan nasional/internasional dan event global.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className={`rounded-xl border-2 ${stat.border} bg-white p-4 shadow-sm sm:p-5 lg:p-6`}>
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#616161]">{stat.label}</p>
              <p className={`mt-2 text-3xl font-extrabold ${stat.valueColor}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <section>
          <h3 className="mb-3 text-lg font-bold text-brand-dark">Kegiatan terbaru</h3>
          <div className="overflow-hidden rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-xs font-semibold uppercase tracking-wide text-white">
                    <th className="px-4 py-3">No</th>
                    <th className="px-4 py-3">Nama Kegiatan</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Skala</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Peserta</th>
                    <th className="px-4 py-3">Poin</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {kegiatanTerbaru.map((item) => (
                    <tr key={item.no} className="border-b border-[#e9ebf8] last:border-0 hover:bg-[#f9fafb]">
                      <td className="px-4 py-3 text-[#616161]">{item.no}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#333]">{item.nama}</p>
                        <p className="mt-1 text-[11px] text-[#9aa0a6]">{item.meta}</p>
                      </td>
                      <td className="px-4 py-3 text-[#616161]">{item.kategori}</td>
                      <td className="px-4 py-3 text-[#616161]">{item.skala}</td>
                      <td className="px-4 py-3 text-[#616161]">{item.tanggal}</td>
                      <td className="px-4 py-3 text-[#616161]">{item.peserta}</td>
                      <td className="px-4 py-3 text-[#616161]">{item.poin}</td>
                      <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEdit(item)} className="rounded p-1 text-brand-dark transition hover:bg-green-50" aria-label="Edit kegiatan">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeleteClick(item)} className="rounded p-1 text-red-600 transition hover:bg-red-50" aria-label="Hapus kegiatan">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-[#e9ebf8] px-4 py-3 text-xs text-[#616161] sm:flex-row sm:items-center sm:justify-between">
              <span>Showing 1 - 10 From Total 842</span>
              <span>Page 1 of 84</span>
              <div className="flex items-center gap-1">
                <button className="rounded px-2 py-1 hover:bg-[#f0f4f0]">Prev</button>
                <button className="rounded bg-brand-dark px-2 py-1 text-white">1</button>
                <button className="rounded px-2 py-1 hover:bg-[#f0f4f0]">2</button>
                <span className="px-1">...</span>
                <button className="rounded px-2 py-1 hover:bg-[#f0f4f0]">3</button>
                <button className="rounded px-2 py-1 hover:bg-[#f0f4f0]">4</button>
                <button className="rounded px-2 py-1 hover:bg-[#f0f4f0]">Next</button>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-lg rounded-xl bg-gradient-to-r from-brand-dark to-brand-light p-6 text-white shadow-sm">
          <h3 className="text-lg font-bold">Download Panduan</h3>
          <div className="mt-4 flex items-start gap-3 text-sm text-white/90">
            <Download className="mt-0.5 h-5 w-5 shrink-0" />
            <p>Ditmawa - Panduan Penggunaan Website MyUnand Student Connect 2026.pdf</p>
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}

export default AdminDitmawaDashboard