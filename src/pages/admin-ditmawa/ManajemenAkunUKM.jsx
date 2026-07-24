import { useState } from 'react'
import { toast } from 'sonner'
import { Search, Plus, Key, Trash2, Eye, EyeOff, X } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import ConfirmModal from '../../components/ui/ConfirmModal'

const DUMMY_UKM = [
  { id: 1, nama: 'UKM NEO TELEMETRI', username: 'neotelemetri123', status: 'aktif' },
  { id: 2, nama: 'UKM Penalaran', username: 'ukm.penalaran', status: 'aktif' },
  { id: 3, nama: 'UKM Seni Budaya', username: 'ukm.senibudaya', status: 'aktif' },
]

function TambahAkunModal({ onClose, onSave }) {
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [form, setForm] = useState({ namaUkm: '', username: '', password: '', konfirmasiPassword: '', status: 'aktif' })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = () => {
    if (!form.namaUkm || !form.username || !form.password) {
      toast.error('Lengkapi semua field wajib.')
      return
    }
    if (form.password !== form.konfirmasiPassword) {
      toast.error('Password dan konfirmasi password tidak cocok.')
      return
    }
    onSave(form)
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
          <button type="button" onClick={handleSubmit}
            className="flex-1 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
            Buat
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

function ResetPasswordModal({ item, onClose }) {
  const [newPwd, setNewPwd] = useState('')
  const [showPwd, setShowPwd] = useState(false)

  const handleSubmit = () => {
    if (!newPwd.trim()) { toast.error('Password baru tidak boleh kosong.'); return }
    toast.success('Password berhasil direset!', { description: `Akun "${item.nama}" telah diperbarui.` })
    onClose()
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
          <button type="button" onClick={handleSubmit}
            className="flex-1 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
            Reset Password
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
  const [data, setData] = useState(DUMMY_UKM)
  const [search, setSearch] = useState('')
  const [showTambah, setShowTambah] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [resetTarget, setResetTarget] = useState(null)

  const filtered = data.filter((d) =>
    d.nama.toLowerCase().includes(search.toLowerCase()) ||
    d.username.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = (form) => {
    const newItem = {
      id: Date.now(),
      nama: form.namaUkm,
      username: form.username,
      status: form.status,
    }
    setData((prev) => [newItem, ...prev])
    setShowTambah(false)
    toast.success('Akun UKM berhasil dibuat!', { description: `${form.namaUkm} (${form.username})` })
  }

  const handleDelete = () => {
    setData((prev) => prev.filter((d) => d.id !== confirmDelete.id))
    toast.success('Akun dihapus.', { description: confirmDelete.nama })
    setConfirmDelete(null)
  }

  return (
    <DashboardLayout role="admin-ditmawa" userName="Dr. Efa Yonnedi, SE. MPPM, Akt, CA, CRGP" userRole="Dosen Pembimbing">
      {showTambah && (
        <TambahAkunModal onClose={() => setShowTambah(false)} onSave={handleSave} />
      )}
      {resetTarget && (
        <ResetPasswordModal item={resetTarget} onClose={() => setResetTarget(null)} />
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
            <Plus className="h-4 w-4" />
            Akun UKM
          </button>
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-brand-dark px-4 py-2 sm:max-w-md">
            <Search className="h-4 w-4 shrink-0 text-[#8e98a8]" />
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-xs font-semibold uppercase tracking-wide text-white">
                    <th className="px-4 py-3">No</th>
                    <th className="px-4 py-3">Nama UKM</th>
                    <th className="px-4 py-3">Username</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-[#616161]">Tidak ada data UKM.</td>
                    </tr>
                  ) : (
                    filtered.map((item, idx) => (
                      <tr key={item.id} className="border-b border-[#e9ebf8] last:border-0 hover:bg-[#f9fafb]">
                        <td className="px-4 py-3 text-[#616161]">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-[#333]">{item.nama}</td>
                        <td className="px-4 py-3 text-[#616161]">{item.username}</td>
                        <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setResetTarget(item)}
                              className="rounded p-1 text-brand-dark transition hover:bg-green-50"
                             
                            >
                              <Key className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(item)}
                              className="rounded p-1 text-red-600 transition hover:bg-red-50"
                             
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-[#e9ebf8] px-4 py-3 text-xs text-[#616161] sm:flex-row sm:items-center sm:justify-between">
              <span>Showing 1 - {filtered.length} From Total {data.length}</span>
              <span>Page 1 of 1</span>
              <div className="flex items-center gap-1">
                <button className="rounded px-2 py-1 hover:bg-[#f0f4f0]">Previous</button>
                <button className="rounded bg-brand-dark px-2 py-1 text-white">1</button>
                <button className="rounded px-2 py-1 hover:bg-[#f0f4f0]">Next</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ManajemenAkunUKM
