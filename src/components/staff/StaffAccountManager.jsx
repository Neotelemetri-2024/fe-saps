import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Search, Pencil } from 'lucide-react'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import Modal from '../../components/ui/Modal'
import StatusBadge from '../../components/dashboard/StatusBadge'
import ActionMenu from '../ui/ActionMenu'
import { batalBtnClass } from '../../components/ui/buttonStyles'
import { getFakultasList } from '../../services/fakultasService'
import { createStaffAccount, getStaffAccounts, updateStaffAccount } from '../../services/staffService'

const LABELS = {
  admin_ditmawa: 'Admin Ditmawa',
  pimpinan_ditmawa: 'Pimpinan Ditmawa',
  admin_fakultas: 'Admin Fakultas',
  pimpinan_fakultas: 'Pimpinan Fakultas',
  pimpinan_utama: 'Pimpinan Utama',
}

const EMPTY = {
  nama: '',
  nip: '',
  namaJabatan: '',
  jabatan: '',
  fakultasId: '',
  email: '',
  password: '',
  konfirmasiPassword: '',
  aktif: true,
}

export default function StaffAccountManager({
  title,
  description,
  tableTitle,
  allowedRoles,
  showFaculty = false,
}) {
  const [data, setData] = useState([])
  const [faculties, setFaculties] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ ...EMPTY, jabatan: allowedRoles[0] })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await getStaffAccounts()
      setData(rows.filter((row) => allowedRoles.includes(row.jabatan)))
    } catch (error) {
      toast.error('Gagal mengambil data akun', { description: error.message })
    } finally {
      setLoading(false)
    }
  }, [allowedRoles])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!showFaculty) return
    getFakultasList()
      .then((rows) => setFaculties(Array.isArray(rows) ? rows : []))
      .catch(() => setFaculties([]))
  }, [showFaculty])

  const filtered = useMemo(() => {
    const key = query.toLowerCase()
    return data.filter((item) =>
      [
        item.nama,
        item.nip,
        item.namaJabatan,
        item.email,
        item.fakultasNama,
        LABELS[item.jabatan],
      ].some((value) => String(value || '').toLowerCase().includes(key)),
    )
  }, [data, query])

  function startCreate() {
    setEditing(null)
    setForm({ ...EMPTY, jabatan: allowedRoles[0] })
    setOpen(true)
  }

  function startEdit(item) {
    setEditing(item)
    setForm({
      nama: item.nama === '-' ? '' : item.nama,
      nip: !item.nip || item.nip === '-' ? '' : item.nip,
      namaJabatan: !item.namaJabatan || item.namaJabatan === '-' ? '' : item.namaJabatan,
      jabatan: item.jabatan,
      fakultasId: item.fakultasId || '',
      email: item.email === '-' ? '' : item.email,
      password: '',
      konfirmasiPassword: '',
      aktif: item.aktif,
    })
    setOpen(true)
  }

  async function submit(event) {
    event.preventDefault()
    if (!editing && form.password.length < 8) {
      return toast.error('Password minimal 8 karakter')
    }
    if (form.password && form.password !== form.konfirmasiPassword) {
      return toast.error('Konfirmasi password tidak sama')
    }
    if (showFaculty && form.jabatan === 'pimpinan_fakultas' && !form.fakultasId) {
      return toast.error('Fakultas wajib dipilih')
    }

    const payload = {
      nama: form.nama.trim(),
      nip: form.nip?.trim() || null,
      namaJabatan: form.namaJabatan?.trim() || null,
      jabatan: form.jabatan,
      email: form.email.trim().toLowerCase(),
      password: form.password,
      aktif: form.aktif,
      ...(showFaculty && form.jabatan === 'pimpinan_fakultas'
        ? { fakultasId: Number(form.fakultasId) }
        : {}),
    }

    setSubmitting(true)
    try {
      if (editing) {
        await updateStaffAccount(editing.id, payload)
        toast.success('Akun berhasil diperbarui')
      } else {
        await createStaffAccount(payload)
        toast.success('Akun berhasil ditambahkan')
      }
      setOpen(false)
      await load()
    } catch (error) {
      toast.error('Gagal menyimpan akun', { description: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: '_no', label: 'No', width: '60px' },
    { key: 'nama', label: 'Nama' },
    {
      key: 'nip',
      label: 'NIP',
      render: (row) => (row.nip && row.nip !== '-' ? row.nip : '-'),
    },
    {
      key: 'namaJabatan',
      label: 'Jabatan',
      render: (row) => (row.namaJabatan && row.namaJabatan !== '-' ? row.namaJabatan : '-'),
    },
    {
      key: 'jabatan',
      label: 'Role',
      render: (row) => LABELS[row.jabatan] || row.jabatan,
    },
    ...(showFaculty
      ? [{ key: 'fakultasNama', label: 'Fakultas', render: (row) => row.fakultasNama || '-' }]
      : []),
    { key: 'email', label: 'Akun' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'aksi',
      label: 'Aksi',
      align: 'center',
      stopPropagation: true,
      render: (row) => (
        <ActionMenu
          items={[
            {
              label: 'Edit',
              icon: <Pencil className="h-4 w-4" />,
              onClick: () => startEdit(row),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold text-base-content">{title}</h2>
        <p className="mt-1 text-sm text-base-content/60">{description}</p>
      </div>

      <TableCard
        title={tableTitle}
        headerRight={
          <button
            type="button"
            onClick={startCreate}
            className="btn btn-primary btn-sm flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Tambah Akun
          </button>
        }
      >
        <label className="input input-sm flex w-full items-center gap-2 sm:max-w-sm">
          <Search className="h-4 w-4 text-base-content/50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama, NIP, jabatan, akun..."
            className="grow"
          />
        </label>
        <TableFrame>
          <DataTable
            columns={columns}
            data={filtered.map((row, index) => ({ ...row, _no: index + 1 }))}
            loading={loading}
          />
        </TableFrame>
      </TableCard>

      <Modal
        isOpen={open}
        onClose={() => !submitting && setOpen(false)}
        title={editing ? 'Edit Akun' : 'Tambah Akun'}
        size="lg"
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium text-base-content">NIP (Opsional)</span>
              <input
                className="input w-full"
                placeholder="Contoh: 198507152010121002"
                value={form.nip}
                onChange={(e) => setForm({ ...form, nip: e.target.value })}
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-base-content">Nama Lengkap</span>
              <input
                className="input w-full"
                required
                minLength={3}
                placeholder="Nama lengkap beserta gelar"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-base-content">Jabatan (Bisa diisi)</span>
              <input
                className="input w-full"
                placeholder="Contoh: Rektor, Dekan FTI, Kasubag Kemahasiswaan"
                value={form.namaJabatan}
                onChange={(e) => setForm({ ...form, namaJabatan: e.target.value })}
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-base-content">Role Sistem</span>
              <select
                className="select w-full"
                value={form.jabatan}
                onChange={(e) => setForm({ ...form, jabatan: e.target.value, fakultasId: '' })}
              >
                {allowedRoles.map((role) => (
                  <option key={role} value={role}>
                    {LABELS[role] || role}
                  </option>
                ))}
              </select>
            </label>

            {showFaculty && form.jabatan === 'pimpinan_fakultas' && (
              <label className="space-y-1">
                <span className="text-sm font-medium text-base-content">Fakultas</span>
                <select
                  className="select w-full"
                  required
                  value={form.fakultasId}
                  onChange={(e) => setForm({ ...form, fakultasId: e.target.value })}
                >
                  <option value="">Pilih fakultas</option>
                  {faculties.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nama || item.fakultas}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="space-y-1">
              <span className="text-sm font-medium text-base-content">Akun (Email)</span>
              <input
                type="email"
                className="input w-full"
                required
                placeholder="nama@unand.ac.id"
                autoComplete="new-password"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-base-content">
                Password {editing && '(Kosongkan jika tidak ingin diubah)'}
              </span>
              <input
                type="password"
                className="input w-full"
                required={!editing}
                minLength={form.password ? 8 : undefined}
                placeholder={editing ? '•••••••• (tidak diubah)' : 'Minimal 8 karakter'}
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-base-content">Konfirmasi Password</span>
              <input
                type="password"
                className="input w-full"
                required={!editing || Boolean(form.password)}
                placeholder="Ulangi password"
                autoComplete="new-password"
                value={form.konfirmasiPassword}
                onChange={(e) => setForm({ ...form, konfirmasiPassword: e.target.value })}
              />
            </label>

            <label className="flex items-center gap-3 pt-4 sm:col-span-2 cursor-pointer">
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={form.aktif}
                onChange={(e) => setForm({ ...form, aktif: e.target.checked })}
              />
              <span className="text-sm font-medium text-base-content">
                Status Akun: {form.aktif ? 'Aktif' : 'Nonaktif'}
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={batalBtnClass}
              disabled={submitting}
            >
              Batal
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
