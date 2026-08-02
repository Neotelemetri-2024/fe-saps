import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Search, Key, Trash2, Eye, EyeOff, X } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { getCurrentUser } from '../../services/authService'
import {
  getAkunUKMF,
  createAkunUKMF,
  resetPasswordAkunUKMF,
  hapusAkunUKMF,
  toggleStatusAkunUKMF,
} from '../../services/organisasiService'

function TambahAkunModal({ onClose, onSave }) {
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    namaUkm: '',
    username: '',
    password: '',
    konfirmasiPassword: '',
    status: 'aktif',
  })

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async () => {
    if (
      !form.namaUkm.trim() ||
      !form.username.trim() ||
      !form.password
    ) {
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
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-[#212121]">
            Tambah Akun UKMF
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#616161] transition hover:bg-[#f5f5f5] hover:text-[#333]"
            aria-label="Tutup modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="namaUkm"
              className="block text-sm text-[#212121]"
            >
              Nama UKMF <span className="text-red-600">*</span>
            </label>

            <input
              id="namaUkm"
              type="text"
              name="namaUkm"
              value={form.namaUkm}
              onChange={handleChange}
              placeholder="Contoh: Hima FT UNAND"
              className="mt-1 w-full rounded-lg border border-[#8e98a8] px-3 py-2.5 text-sm outline-none transition focus:border-brand-dark focus:ring-1 focus:ring-brand-dark"
            />
          </div>

          <div>
            <label
              htmlFor="username"
              className="block text-sm text-[#212121]"
            >
              Username <span className="text-red-600">*</span>
            </label>

            <input
              id="username"
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="himaft123"
              autoComplete="off"
              className="mt-1 w-full rounded-lg border border-[#8e98a8] px-3 py-2.5 text-sm outline-none transition focus:border-brand-dark focus:ring-1 focus:ring-brand-dark"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm text-[#212121]"
            >
              Password <span className="text-red-600">*</span>
            </label>

            <div className="relative mt-1">
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full rounded-lg border border-[#8e98a8] px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-brand-dark focus:ring-1 focus:ring-brand-dark"
              />

              <button
                type="button"
                onClick={() => setShowPwd((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e98a8] transition hover:text-[#333]"
                aria-label={
                  showPwd
                    ? 'Sembunyikan password'
                    : 'Tampilkan password'
                }
              >
                {showPwd ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="konfirmasiPassword"
              className="block text-sm text-[#212121]"
            >
              Konfirmasi Password <span className="text-red-600">*</span>
            </label>

            <div className="relative mt-1">
              <input
                id="konfirmasiPassword"
                type={showConfirmPwd ? 'text' : 'password'}
                name="konfirmasiPassword"
                value={form.konfirmasiPassword}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full rounded-lg border border-[#8e98a8] px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-brand-dark focus:ring-1 focus:ring-brand-dark"
              />

              <button
                type="button"
                onClick={() => setShowConfirmPwd((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e98a8] transition hover:text-[#333]"
                aria-label={
                  showConfirmPwd
                    ? 'Sembunyikan konfirmasi password'
                    : 'Tampilkan konfirmasi password'
                }
              >
                {showConfirmPwd ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <fieldset>
            <legend className="block text-sm text-[#212121]">
              Status <span className="text-red-600">*</span>
            </legend>

            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value="aktif"
                  checked={form.status === 'aktif'}
                  onChange={handleChange}
                  className="accent-brand-dark"
                />
                Aktif
              </label>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  value="nonaktif"
                  checked={form.status === 'nonaktif'}
                  onChange={handleChange}
                  className="accent-brand-dark"
                />
                Nonaktif
              </label>
            </div>
          </fieldset>
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-brand-dark px-6 py-2.5 text-sm font-semibold text-brand-dark transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Menyimpan…' : 'Buat Akun'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ResetPasswordModal({
  item,
  onClose,
  onReset,
}) {
  const [newPwd, setNewPwd] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!newPwd.trim()) {
      toast.error('Password baru tidak boleh kosong.')
      return
    }

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
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-[#212121]">
            Reset Password
          </h3>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#616161] transition hover:bg-[#f5f5f5] hover:text-[#333] disabled:opacity-60"
            aria-label="Tutup modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-[#616161]">
          Reset password untuk akun:{' '}
          <strong className="text-[#333]">{item.nama}</strong>
        </p>

        <div>
          <label
            htmlFor="passwordBaru"
            className="block text-sm text-[#212121]"
          >
            Password Baru <span className="text-red-600">*</span>
          </label>

          <div className="relative mt-1">
            <input
              id="passwordBaru"
              type={showPwd ? 'text' : 'password'}
              value={newPwd}
              onChange={(event) => setNewPwd(event.target.value)}
              placeholder="Masukkan password baru"
              autoComplete="new-password"
              className="w-full rounded-lg border border-[#8e98a8] px-3 py-2.5 pr-10 text-sm outline-none transition focus:border-brand-dark focus:ring-1 focus:ring-brand-dark"
            />

            <button
              type="button"
              onClick={() => setShowPwd((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e98a8] transition hover:text-[#333]"
              aria-label={
                showPwd
                  ? 'Sembunyikan password'
                  : 'Tampilkan password'
              }
            >
              {showPwd ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-brand-dark px-6 py-2.5 text-sm font-semibold text-brand-dark transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Memproses…' : 'Reset Password'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ManajemenAkunUKMF() {
  const user = getCurrentUser()

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showTambah, setShowTambah] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [resetTarget, setResetTarget] = useState(null)

  const loadData = () => {
    setLoading(true)

    getAkunUKMF()
      .then((response) => {
        setData(Array.isArray(response) ? response : [])
      })
      .catch((error) => {
        setData([])

        toast.error('Gagal memuat akun UKMF', {
          description: error.message,
        })
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    if (!keyword) {
      return data
    }

    return data.filter((item) => {
      const nama = String(item.nama || '').toLowerCase()
      const username = String(item.username || '').toLowerCase()

      return (
        nama.includes(keyword) ||
        username.includes(keyword)
      )
    })
  }, [data, search])

  const handleSave = async (form) => {
    try {
      await createAkunUKMF({
        namaUkm: form.namaUkm.trim(),
        username: form.username.trim(),
        password: form.password,
        status: form.status === 'aktif',
      })

      setShowTambah(false)

      toast.success('Akun UKMF berhasil dibuat!', {
        description: `${form.namaUkm} (${form.username})`,
      })

      loadData()
    } catch (error) {
      toast.error('Gagal membuat akun', {
        description: error.message,
      })

      throw error
    }
  }

  const handleReset = async (item, passwordBaru) => {
    try {
      await resetPasswordAkunUKMF(
        item.userId,
        passwordBaru
      )

      toast.success('Password berhasil direset!', {
        description: `Akun "${item.nama}" telah diperbarui.`,
      })
    } catch (error) {
      toast.error('Gagal reset password', {
        description: error.message,
      })

      throw error
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete?.userId) {
      return
    }

    try {
      await hapusAkunUKMF(confirmDelete.userId)

      toast.success('Akun dihapus.', {
        description: confirmDelete.nama,
      })

      setConfirmDelete(null)
      loadData()
    } catch (error) {
      toast.error('Gagal menghapus', {
        description: error.message,
      })
    }
  }

  const handleToggleStatus = async (item) => {
    try {
      await toggleStatusAkunUKMF(item.userId)

      toast.success('Status akun berhasil diperbarui.')

      loadData()
    } catch (error) {
      toast.error('Gagal mengubah status', {
        description: error.message,
      })
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'no',
        label: 'No',
        render: (_, index) => (
          <span className="text-[#616161]">
            {index + 1}
          </span>
        ),
      },
      {
        key: 'nama',
        label: 'Nama UKMF',
      },
      {
        key: 'username',
        label: 'Username',
      },
      {
        key: 'status',
        label: 'Status',
        stopPropagation: true,
        render: (row) => (
          <button
            type="button"
            onClick={() => handleToggleStatus(row)}
            className="rounded-full focus:outline-none focus:ring-2 focus:ring-brand-dark focus:ring-offset-2"
            title="Klik untuk mengubah status"
          >
            <StatusBadge status={row.status} />
          </button>
        ),
      },
      {
        key: 'aksi',
        label: 'Aksi',
        stopPropagation: true,
        render: (row) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setResetTarget(row)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-dark bg-[#eaf5ec] text-brand-dark transition hover:bg-brand-dark hover:text-white"
              title="Reset Password"
              aria-label={`Reset password ${row.nama}`}
            >
              <Key className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setConfirmDelete(row)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-400 bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white"
              title="Hapus"
              aria-label={`Hapus akun ${row.nama}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  )

  return (
    <DashboardLayout
      role="admin_fakultas"
      userName={user?.nama || 'Admin Fakultas'}
      userRole="Admin Fakultas"
    >
      {showTambah && (
        <TambahAkunModal
          onClose={() => setShowTambah(false)}
          onSave={handleSave}
        />
      )}

      {resetTarget && (
        <ResetPasswordModal
          item={resetTarget}
          onClose={() => setResetTarget(null)}
          onReset={handleReset}
        />
      )}

      <ConfirmModal
        isOpen={Boolean(confirmDelete)}
        message={
          confirmDelete
            ? `Yakin ingin menghapus akun "${confirmDelete.nama}"? Tindakan ini tidak bisa dibatalkan.`
            : ''
        }
        confirmText="Ya, Hapus"
        cancelText="Batal"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#222] sm:text-2xl">
              Manajemen Akun UKMF
            </h2>

            <p className="mt-1 text-sm text-[#616161]">
              Kelola daftar akun UKMF di fakultas.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowTambah(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90 sm:w-auto"
          >Tambah Akun UKMF
          </button>
        </div>

        <TableCard title="Akun UKMF yang Telah Dibuat">
          <div className="mt-4 flex flex-wrap items-center gap-3 sm:mt-6">
            <div className="relative w-full flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0a6]" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Cari nama UKMF atau username..."
                className="w-full rounded-lg border border-[#e9ebf8] bg-white py-2.5 pl-9 pr-3 text-sm text-[#333] outline-none transition placeholder:text-[#9aa0a6] focus:border-brand-dark focus:ring-1 focus:ring-brand-dark"
              />
            </div>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="rounded-lg border border-brand-dark bg-white px-3 py-2 text-sm font-medium text-brand-dark transition hover:bg-[#f5f5f5]"
              >
                Reset Filter
              </button>
            )}
          </div>

          <TableFrame>
            <DataTable
              columns={columns}
              data={filtered}
              loading={loading}
              emptyText="Tidak ada data UKMF."
            />
          </TableFrame>
        </TableCard>
      </div>
    </DashboardLayout>
  )
}

export default ManajemenAkunUKMF