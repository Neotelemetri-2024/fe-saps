import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { toast } from 'sonner'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import { Plus, Edit } from 'lucide-react'
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalTitle } from '../../components/ui/Modal'

export default function ManajemenAkunAdminFakultas() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  
  const [formData, setFormData] = useState({
    nama: '',
    jabatan: 'admin_fakultas',
    email: '',
    password: '',
    aktif: true
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/staff')
      if (res.success) {
        setData(res.data.filter(d => d.jabatan === 'admin_fakultas'))
      }
    } catch (error) {
      toast.error('Gagal mengambil data akun')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editItem) {
        await api.put('/api/staff/' + editItem.id, formData)
        toast.success('Akun berhasil diperbarui')
      } else {
        await api.post('/api/staff', formData)
        toast.success('Akun berhasil ditambahkan')
      }
      setIsModalOpen(false)
      fetchData()
    } catch (error) {
      toast.error(error.message || 'Terjadi kesalahan')
    }
  }

  const handleEdit = (item) => {
    setEditItem(item)
    setFormData({
      nama: item.nama,
      jabatan: item.jabatan,
      email: item.email,
      password: '',
      aktif: item.aktif
    })
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Manajemen Akun Admin Fakultas</h2>
        <p className="text-base-content/70">Kelola akun Admin Tingkat Fakultas Anda</p>
      </div>

      <TableCard
        title="Daftar Akun Admin Fakultas"
        headerRight={
          <button onClick={() => {
            setEditItem(null)
            setFormData({ nama: '', jabatan: 'admin_fakultas', email: '', password: '', aktif: true })
            setIsModalOpen(true)
          }} className="btn btn-primary btn-sm">
            <Plus className="w-4 h-4 mr-2" /> Tambah Akun
          </button>
        }
      >
        <TableFrame>
          <DataTable
            columns={[
              { key: '_no', label: 'No', width: '60px' },
              { key: 'nama', label: 'Nama Lengkap' },
              { key: 'jabatan', label: 'Role', render: () => 'Admin Fakultas' },
              { key: 'email', label: 'Email / Akun' },
              { key: 'aktif', label: 'Status', render: (val) => val ? <span className="badge badge-success">Aktif</span> : <span className="badge badge-error">Non-Aktif</span> },
              { key: 'actions', label: 'Aksi', align: 'center', render: (_, row) => (
                <button onClick={() => handleEdit(row)} className="btn btn-sm btn-ghost text-primary">
                  <Edit className="w-4 h-4" />
                </button>
              )}
            ]}
            data={data.map((r, i) => ({ ...r, _no: i + 1 }))}
            loading={loading}
          />
        </TableFrame>
      </TableCard>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalHeader>
          <ModalTitle>{editItem ? 'Edit Akun Admin' : 'Tambah Akun Admin'}</ModalTitle>
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody className="space-y-4">
            <div className="form-control">
              <label className="label"><span className="label-text">Nama Lengkap</span></label>
              <input type="text" className="input input-bordered" required value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Email / Akun</span></label>
              <input type="email" className="input input-bordered" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Password {editItem && '(Kosongkan jika tidak ingin diubah)'}</span></label>
              <input type="password" className="input input-bordered" required={!editItem} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
            </div>
            <div className="form-control flex-row items-center mt-2">
              <input type="checkbox" className="toggle toggle-primary mr-2" checked={formData.aktif} onChange={(e) => setFormData({...formData, aktif: e.target.checked})} />
              <label className="label-text">Akun Aktif</label>
            </div>
          </ModalBody>
          <ModalFooter>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost">Batal</button>
            <button type="submit" className="btn btn-primary">Simpan</button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
