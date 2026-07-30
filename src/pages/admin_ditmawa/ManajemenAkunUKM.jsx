import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Search, Plus, Key, Trash2, Eye, EyeOff, X } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import DataTable from '../../components/dashboard/DataTable'
import ConfirmModal from '../../components/ui/ConfirmModal'
import {
  getAkunUKM,
  createAkunUKM,
  resetPasswordAkunUKM,
  hapusAkunUKM,
  toggleStatusAkunUKM,
} from '../../services/organisasiService'

function TambahAkunModal({ onClose, onSave }) {
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ namaUkm: '', username: '', password: '', konfirmasiPassword: '', status: 'aktif' })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    if (!form.namaUkm || !form.username || !form.password) {
      toast.error('Lengkapi semua field wajib.')
      return
    }
    if (form.password !== form.konfirmasiPassword) {
      toast.error('Password dan konfirmasi password tidak cocok.')
      return
    }
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#212121]">Tambah Akun UKM</h3>
          <button type="button" onClick={onClose} className="text-[#616161] hover:text-[#333] text-xl leading-none">×</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#212121]">Nama UKM <span className="text-red-600">*</span></label>
            <input type="text" name="namaUkm" value={form.namaUkm} onChange={handleChange}
              placeholder="Contoh : Neo telemetri"
              className="mt-1 w-full rounded-lg border border-[#8e98a8] px-3 py-2 text-sm outline-none focus:border-brand-dark" />
          </div>
          <div>
            <label className="block text-sm text-[#212121]">Username <span className="text-red-600">*</span></label>
            <input type="text" name="username" value={form.username} onChange={handleChange}
              placeholder="neotelemetri123"
              className="mt-1 w-full rounded-lg border border-[#8e98a8] px-3 py-2 text-sm outline-none focus:border-brand-dark" />
          </div>
          <div>
            <label className="block text-sm text-[#212121]">Password <span className="text-red-600">*</span></label>
            <div className="relative mt-1">
              <input type={showPwd ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                placeholder="••••••••"
                className="w-full rounded-lg border border-[#8e98a8] px-3 py-2 text-sm outline-none focus:border-brand-dark pr-10" />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e98a8]">
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-[#212121]">Konfirmasi Password <span className="text-red-600">*</span></label>
            <div className="relative mt-1">
              <input type={showConfirmPwd ? 'text' : 'password'} name="konfirmasiPassword" value={form.konfirmasiPassword} onChange={handleChange}
                placeholder="••••••••"
                className="w-full rounded-lg border border-[#8e98a8] px-3 py-2 text-sm outline-none focus:border-brand-dark pr-10" />
              <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e98a8]">
                {showConfirmPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-[#212121]">Status <span className="text-red-600">*</span></label>
            <div className="mt-2 flex gap-6 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="status" value="aktif" checked={form.status === 'aktif'} onChange={handleChange} className="accent-brand-dark" />
                Aktif
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="status" value="nonaktif" checked={form.status === 'nonaktif'} onChange={handleChange} className="accent-brand-dark" />
                Non Aktif
              </label>
            </div>
          </div>
        </div>
        <div className="mt-7 flex gap-3">
          <button type="button" onClick={handleSubmit} disabled={saving}
            className="flex-1 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
            {saving ? 'Menyimpan…' : 'Buat'}
          </button>
          <button type="button" onClick={onClose}
            className="rounded-lg border border-brand-dark px-6 py-2.5 text-sm font-semibold text-brand-dark transition hover:bg-green-50">
            Batal
          </button>
        </div>
      </div>
    </div>
  )
}

function ResetPasswordModal({ item, onClose, onReset }) {
  const [newPwd, setNewPwd] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!newPwd.trim()) { toast.error('Password baru tidak boleh kosong.'); return }
    setSaving(true)
    try {
      await onReset(item, newPwd)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#212121]">Reset Password</h3>
          <button type="button" onClick={onClose} className="text-[#616161] hover:text-[#333]"><X className="h-5 w-5" /></button>
        </div>
        <p className="mb-4 text-sm text-[#616161]">Reset password untuk akun: <strong>{item.nama}</strong></p>
        <div>
          <label className="block text-sm text-[#212121]">Password Baru <span className="text-red-600">*</span></label>
          <div className="relative mt-1">
            <input type={showPwd ? 'text' : 'password'} value={newPwd} onChange={(e) => setNewPwd(e.target.value)}
              placeholder="Masukkan password baru"
              className="w-full rounded-lg border border-[#8e98a8] px-3 py-2 pr-10 text-sm outline-none focus:border-brand-dark" />
            <button type="button" onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e98a8]">
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={handleSubmit} disabled={saving}
            className="flex-1 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
            {saving ? 'Memproses…' : 'Reset Password'}
          </button>
          <button type="button" onClick={onClose}
            className="rounded-lg border border-brand-dark px-6 py-2.5 text-sm font-semibold text-brand-dark transition hover:bg-green-50">
            Batal
          </button>
        </div>
      </div>
    </div>
  )
}

function ManajemenAkunUKM() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showTambah, setShowTambah] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [resetTarget, setResetTarget] = useState(null)

  const loadData = () => {
    setLoading(true)
    getAkunUKM()
      .then(setData)
      .catch((err) => toast.error('Gagal memuat akun UKM', { description: err.message }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const filtered = data.filter((d) =>
    (d.nama || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.username || '').toLowerCase().includes(search.toLowerCase()),
  )

  const handleSave = async (form) => {
    try {
      await createAkunUKM({
        namaUkm: form.namaUkm,
        username: form.username,
        password: form.password,
        status: form.status === 'aktif',
      })
      setShowTambah(false)
      toast.success('Akun UKM berhasil dibuat!', { description: `${form.namaUkm} (${form.username})` })
      loadData()
    } catch (err) {
      toast.error('Gagal membuat akun', { description: err.message })
      throw err
    }
  }

  const handleReset = async (item, passwordBaru) => {
    try {
      await resetPasswordAkunUKM(item.userId, passwordBaru)
      toast.success('Password berhasil direset!', { description: `Akun "${item.nama}" telah diperbarui.` })
    } catch (err) {
      toast.error('Gagal reset password', { description: err.message })
      throw err
    }
  }

  const handleDelete = async () => {
    try {
      await hapusAkunUKM(confirmDelete.userId)
      toast.success('Akun dihapus.', { description: confirmDelete.nama })
      setConfirmDelete(null)
      loadData()
    } catch (err) {
      toast.error('Gagal menghapus', { description: err.message })
    }
  }

  const handleToggleStatus = async (item) => {
    try {
      await toggleStatusAkunUKM(item.userId)
      toast.success('Status akun diperbarui')
      loadData()
    } catch (err) {
      toast.error('Gagal mengubah status', { description: err.message })
    }
  }

  const columns = useMemo(() => [
    { key: 'no', label: 'No', render: (row) => <span className="text-[#616161]">{filtered.indexOf(row) + 1}</span> },
    { key: 'nama', label: 'Nama UKM', render: (row) => <span className="font-medium text-[#333]">{row.nama}</span> },
    { key: 'username', label: 'Username', render: (row) => <span className="text-[#616161]">{row.username}</span> },
    { key: 'status', label: 'Status', stopPropagation: true, render: (row) => (
      <button type="button" onClick={() => handleToggleStatus(row)} title="Klik untuk ubah status">
        <StatusBadge status={row.status} />
      </button>
    )},
    { key: 'aksi', label: 'Aksi', stopPropagation: true, render: (row) => (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setResetTarget(row)}
          title="Reset Password"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-dark bg-[#eaf5ec] text-brand-dark transition hover:bg-brand-dark hover:text-white"
        >
          <Key className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setConfirmDelete(row)}
          title="Hapus"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-400 bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    )},
  ], [filtered, handleToggleStatus])

  return (
    <DashboardLayout role="admin_ditmawa" userName="Admin Ditmawa" userRole="Admin Ditmawa">
      {showTambah && (
        <TambahAkunModal onClose={() => setShowTambah(false)} onSave={handleSave} />
      )}
      {resetTarget && (
        <ResetPasswordModal item={resetTarget} onClose={() => setResetTarget(null)} onReset={handleReset} />
      )}
      <ConfirmModal
        isOpen={!!confirmDelete}
        message={confirmDelete ? `Yakin ingin menghapus akun "${confirmDelete.nama}"? Tindakan ini tidak bisa dibatalkan.` : ''}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-brand-dark">Manajemen Akun UKM</h2>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setShowTambah(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f0f4f0] text-[#616161]">
              <Plus className="h-4 w-4" />
            </span>
            Akun UKM
          </button>
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-brand-dark px-4 py-2 sm:max-w-md">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f0f4f0] text-[#616161]">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari UKM..."
              className="w-full text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-bold text-brand-dark">Akun UKM yang telah dibuat</h3>
          <div className="overflow-hidden rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
            <DataTable
              columns={columns}
              data={filtered}
              loading={loading}
              emptyText="Tidak ada data UKM."
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ManajemenAkunUKM
