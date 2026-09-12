import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Search, Plus, Key, Trash2, Eye, EyeOff, X } from 'lucide-react'
import StatusBadge from '../../components/dashboard/StatusBadge'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import ConfirmModal from '../../components/ui/ConfirmModal'
import ActionMenu from '../../components/ui/ActionMenu'
import { getCurrentUser } from '../../services/authService'
import {
  getAkunUKMF,
  createAkunUKMF,
  resetPasswordAkunUKMF,
  hapusAkunUKMF,
  toggleStatusAkunUKMF,
} from '../../services/organisasiService'
import { getFakultasList } from '../../services/laporanService'
import { batalBtnClass } from '../../components/ui/buttonStyles'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function TambahAkunModal({ onClose, onSave, fakultasList = [] }) {
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nama: '', email: '', password: '', konfirmasiPassword: '', status: 'aktif', fakultasId: '' })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    const email = form.email.trim()
    if (!form.nama || !email || !form.password) { toast.error('Lengkapi semua field wajib.'); return }
    if (form.nama.trim().length < 3) { toast.error('Nama UKMF minimal 3 karakter.'); return }
    if (!EMAIL_REGEX.test(email)) { toast.error('Format email tidak valid.'); return }
    if (form.password.length < 8) { toast.error('Password minimal 8 karakter.'); return }
    if (form.password !== form.konfirmasiPassword) { toast.error('Password tidak cocok.'); return }
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-base-100 p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-base-content">Tambah Akun UKMF</h3>
          <button type="button" onClick={onClose} className="text-base-content/60 hover:text-base-content text-xl leading-none">&times;</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-base-content">Fakultas</label>
            <select name="fakultasId" value={form.fakultasId} onChange={handleChange}
              className="mt-1 input w-full">
              <option value="">Pilih Fakultas (Opsional)</option>
              {fakultasList.map((f) => (
                <option key={f.id} value={f.id}>{f.nama || f.fakultas}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-base-content">Nama UKMF <span className="text-red-600">*</span></label>
            <input type="text" name="nama" value={form.nama} onChange={handleChange}
              placeholder="Contoh: UKMF Teknologi Informasi"
              className="mt-1 input w-full" />
          </div>
          <div>
            <label className="block text-sm text-base-content">Email <span className="text-red-600">*</span></label>
            <input type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="Contoh: operator.ukmf@unand.ac.id" autoComplete="new-password"
              className="mt-1 input w-full" />
          </div>
          <div>
            <label className="block text-sm text-base-content">Password <span className="text-red-600">*</span></label>
            <div className="relative mt-1">
              <input type={showPwd ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                placeholder="Minimal 8 karakter"
                autoComplete="new-password"
                className="input w-full pr-10" />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50">
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-base-content">Konfirmasi Password <span className="text-red-600">*</span></label>
            <div className="relative mt-1">
              <input type={showConfirmPwd ? 'text' : 'password'} name="konfirmasiPassword" value={form.konfirmasiPassword} onChange={handleChange}
                placeholder="Ulangi password"
                autoComplete="new-password"
                className="input w-full pr-10" />
              <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50">
                {showConfirmPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-base-content">Status <span className="text-red-600">*</span></label>
            <div className="mt-2 flex gap-6 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="status" value="aktif" checked={form.status === 'aktif'} onChange={handleChange} className="accent-brand-dark" /> Aktif
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="status" value="nonaktif" checked={form.status === 'nonaktif'} onChange={handleChange} className="accent-brand-dark" /> Non Aktif
              </label>
            </div>
          </div>
        </div>
        <div className="mt-7 flex gap-3">
          <button type="button" onClick={handleSubmit} disabled={saving}
            className="btn btn-primary flex-1 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
            {saving ? 'Menyimpan...' : 'Buat'}
          </button>
          <button type="button" onClick={onClose} className={batalBtnClass}>Batal</button>
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
    if (newPwd.trim().length < 8) { toast.error('Password baru minimal 8 karakter.'); return }
    setSaving(true)
    try { await onReset(item, newPwd); onClose() } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-base-100 p-8 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-base-content">Reset Password</h3>
          <button type="button" onClick={onClose} className="text-base-content/60 hover:text-base-content"><X className="h-5 w-5" /></button>
        </div>
        <p className="mb-4 text-sm text-base-content/60">Reset password untuk: <strong>{item.nama}</strong></p>
        <div>
          <label className="block text-sm text-base-content">Password Baru <span className="text-red-600">*</span></label>
          <div className="relative mt-1">
            <input type={showPwd ? 'text' : 'password'} value={newPwd} onChange={(e) => setNewPwd(e.target.value)}
              placeholder="Minimal 8 karakter"
              autoComplete="new-password"
              className="w-full rounded-lg border border-base-300 px-3 py-2 pr-10 text-sm outline-none focus:border-brand-dark" />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50">
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={handleSubmit} disabled={saving}
            className="btn btn-primary flex-1 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
            {saving ? 'Memproses...' : 'Reset Password'}
          </button>
          <button type="button" onClick={onClose} className={batalBtnClass}>Batal</button>
        </div>
      </div>
    </div>
  )
}

function ManajemenAkunUKMF() {
  const user = getCurrentUser()
  const [data, setData] = useState([])
  const [fakultasList, setFakultasList] = useState([])
  const [selectedFakultasId, setSelectedFakultasId] = useState('')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showTambah, setShowTambah] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [resetTarget, setResetTarget] = useState(null)

  useEffect(() => {
    getFakultasList()
      .then((list) => setFakultasList(Array.isArray(list) ? list : []))
      .catch(() => setFakultasList([]))
  }, [])

  const loadData = (fId = selectedFakultasId) => {
    setLoading(true)
    getAkunUKMF(fId)
      .then(setData)
      .catch((err) => toast.error('Gagal memuat akun UKMF', { description: err.message }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData(selectedFakultasId)
  }, [selectedFakultasId])

  const filtered = data.filter((d) =>
    (d.nama || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.fakultas || '').toLowerCase().includes(search.toLowerCase()),
  )

  const handleSave = async (form) => {
    try {
      await createAkunUKMF({
        nama: form.nama,
        email: form.email.trim(),
        password: form.password,
        status: form.status === 'aktif',
        fakultasId: form.fakultasId || undefined,
      })
      setShowTambah(false)
      toast.success('Akun UKMF berhasil dibuat!')
      loadData(selectedFakultasId)
    } catch (err) { toast.error('Gagal membuat akun', { description: err.message }); throw err }
  }

  const handleReset = async (item, passwordBaru) => {
    try {
      await resetPasswordAkunUKMF(item.userId, passwordBaru)
      toast.success('Password berhasil direset!')
    } catch (err) { toast.error('Gagal reset password', { description: err.message }); throw err }
  }

  const handleDelete = async () => {
    try {
      await hapusAkunUKMF(confirmDelete.userId)
      toast.success('Akun dihapus.')
      setConfirmDelete(null)
      loadData(selectedFakultasId)
    } catch (err) { toast.error('Gagal menghapus', { description: err.message }) }
  }

  const handleToggleStatus = async (item) => {
    try {
      await toggleStatusAkunUKMF(item.userId)
      toast.success('Status akun diperbarui')
      loadData(selectedFakultasId)
    } catch (err) { toast.error('Gagal mengubah status', { description: err.message }) }
  }

  const columns = useMemo(() => [
    { key: 'no', label: 'No', render: (_, i) => <span className="text-base-content">{i + 1}</span> },
    { key: 'nama', label: 'Nama UKMF', render: (row) => (
      <div>
        <span className="font-medium text-base-content">{row.nama}</span>
        {row.fakultas && (
          <span className="ml-2 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
            {row.fakultas}
          </span>
        )}
      </div>
    )},
    { key: 'email', label: 'Email', render: (row) => <span className="text-base-content">{row.email}</span> },
    { key: 'status', label: 'Status', stopPropagation: true, render: (row) => (
      <button type="button" onClick={() => handleToggleStatus(row)} title="Klik untuk ubah status">
        <StatusBadge status={row.status} />
      </button>
    )},
    { key: 'aksi', label: 'Aksi', stopPropagation: true, render: (row) => (
      <ActionMenu items={[
        { label: 'Reset Password', icon: <Key className="h-4 w-4" />, color: 'text-brand-dark', onClick: () => setResetTarget(row) },
        { label: 'Hapus', icon: <Trash2 className="h-4 w-4" />, color: 'text-red-500', onClick: () => setConfirmDelete(row) },
      ]} />
    )},
  ], [filtered])

  return (
      <>
      {showTambah && <TambahAkunModal onClose={() => setShowTambah(false)} onSave={handleSave} fakultasList={fakultasList} />}
      {resetTarget && <ResetPasswordModal item={resetTarget} onClose={() => setResetTarget(null)} onReset={handleReset} />}
      <ConfirmModal
        isOpen={!!confirmDelete}
        message={confirmDelete ? `Yakin ingin menghapus akun "${confirmDelete.nama}"? Tindakan ini tidak bisa dibatalkan.` : ''}
        confirmText="Ya, Hapus" cancelText="Batal"
        onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)}
      />
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-base-content">Manajemen Akun UKMF (Super Admin)</h2>
          <p className="mt-1 text-sm text-base-content/60">Supervisi dan kelola akun operator UKMF di seluruh 15 fakultas.</p>
        </div>
        <TableCard title="Daftar Akun UKMF Multi-Fakultas">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/50" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari UKMF..."
                  className="input w-full" />
              </div>
              <select
                value={selectedFakultasId}
                onChange={(e) => setSelectedFakultasId(e.target.value)}
                className="rounded-lg border border-base-300 bg-base-100 px-3 py-2 text-sm text-base-content outline-none focus:border-brand-dark"
              >
                <option value="">Semua Fakultas (15 Fakultas)</option>
                {fakultasList.map((f) => (
                  <option key={f.id} value={f.id}>{f.nama || f.fakultas}</option>
                ))}
              </select>
            </div>
            <button type="button" onClick={() => setShowTambah(true)}
              className="btn btn-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90">
              <Plus className="h-4 w-4" />Akun UKMF
            </button>
          </div>
          <TableFrame>
            <DataTable columns={columns} data={filtered} loading={loading} emptyText="Tidak ada data UKMF." />
          </TableFrame>
        </TableCard>
      </div>
      </>
  )
}

export default ManajemenAkunUKMF
