import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { toast } from 'sonner'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalTitle } from '../../components/ui/Modal'

export default function ManajemenAkunPimpinan() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  
  const [formData, setFormData] = useState({
    nama: '',
    nip: '',
    jabatan: 'pimpinan_utama',
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
        setData(res.data.filter(d => d.jabatan === 'pimpinan_utama' || d.jabatan === 'pimpinan_fakultas'))
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
      nip: item.nip || '',
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
        <h2 className="text-2xl font-bold">Manajemen Akun Pimpinan</h2>
        <p className="text-base-content/70">Kelola akun Pimpinan Utama dan Pimpinan Fakultas</p>
      </div>

      <TableCard
        title="Daftar Akun Pimpinan"
        headerRight={
          <button onClick={() => {
            setEditItem(null)
            setFormData({ nama: '', nip: '', jabatan: 'pimpinan_utama', email: '', password: '', aktif: true })
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
              { key: 'nip', label: 'NIP' },
              { key: 'jabatan', label: 'Jabatan', render: (val) => val === 'pimpinan_utama' ? 'Pimpinan Utama' : 'Pimpinan Fakultas' },
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
          <ModalTitle>{editItem ? 'Edit Akun Pimpinan' : 'Tambah Akun Pimpinan'}</ModalTitle>
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody className="space-y-4">
            <div className="form-control">
              <label className="label"><span className="label-text">Nama Lengkap</span></label>
              <input type="text" className="input input-bordered" required value={formData.nama} onChange={(e) => setFormData({...formData, nama: e.target.value})} />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">NIP</span></label>
              <input type="text" className="input input-bordered" value={formData.nip} onChange={(e) => setFormData({...formData, nip: e.target.value})} />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Jabatan</span></label>
              <select className="select select-bordered" value={formData.jabatan} onChange={(e) => setFormData({...formData, jabatan: e.target.value})}>
                <option value="pimpinan_utama">Pimpinan Utama</option>
                <option value="pimpinan_fakultas">Pimpinan Fakultas</option>
              </select>
            </div>
            {formData.jabatan === 'pimpinan_fakultas' && (
              <div className="form-control">
                <label className="label"><span className="label-text">ID Fakultas</span></label>
                <input type="number" className="input input-bordered" required value={formData.fakultasId || ''} onChange={(e) => setFormData({...formData, fakultasId: Number(e.target.value)})} />
              </div>
            )}
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
