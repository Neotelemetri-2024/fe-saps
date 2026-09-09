import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import DataTable from '../dashboard/DataTable'
import StatusBadge from '../dashboard/StatusBadge'
import { TableCard, TableFrame } from '../dashboard/TableFrame'
import Modal from '../ui/Modal'
import ActionMenu from '../ui/ActionMenu'
import { batalBtnClass } from '../ui/buttonStyles'
import { createStaffAccount, getStaffAccounts, updateStaffAccount } from '../../services/staffService'
import { getFakultasList } from '../../services/laporanService'

const EMPTY = { nama: '', nip: '', jabatan: '', fakultasId: '', email: '', password: '', konfirmasiPassword: '', aktif: true }
const LABELS = { pimpinan_utama: 'Pimpinan Utama', pimpinan_fakultas: 'Pimpinan Fakultas', admin_ditmawa: 'Admin Ditmawa', admin_fakultas: 'Admin Fakultas' }
const PIMPINAN_ROLES = ['pimpinan_utama', 'pimpinan_fakultas']
const isPimpinanRole = (role) => PIMPINAN_ROLES.includes(role)

export default function StaffAccountManager({ title, description, tableTitle, allowedRoles, requireNip = false, showFaculty = false }) {
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
    } catch (error) { toast.error('Gagal mengambil data akun', { description: error.message }) }
    finally { setLoading(false) }
  }, [allowedRoles])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!showFaculty) return
    getFakultasList().then((rows) => setFaculties(Array.isArray(rows) ? rows : [])).catch(() => setFaculties([]))
  }, [showFaculty])

  const filtered = useMemo(() => {
    const key = query.toLowerCase()
    return data.filter((item) => [item.nama, item.nip, item.email, item.fakultasNama, LABELS[item.jabatan]].some((value) => String(value || '').toLowerCase().includes(key)))
  }, [data, query])

  function startCreate() {
    setEditing(null)
    setForm({ ...EMPTY, jabatan: allowedRoles[0] })
    setOpen(true)
  }

  function startEdit(item) {
    setEditing(item)
    setForm({ nama: item.nama, nip: (!item.nip || item.nip === '-') ? '' : item.nip, jabatan: item.jabatan, fakultasId: item.fakultasId || '', email: item.email, password: '', konfirmasiPassword: '', aktif: item.aktif })
    setOpen(true)
  }

  const currentNeedsNip = requireNip || isPimpinanRole(form.jabatan)
  const hasPimpinanInAllowed = requireNip || allowedRoles.some(isPimpinanRole)

  async function submit(event) {
    event.preventDefault()
    if (currentNeedsNip && !form.nip.trim()) return toast.error('NIP wajib diisi')
    if (!editing && form.password.length < 8) return toast.error('Password minimal 8 karakter')
    if (form.password && form.password !== form.konfirmasiPassword) return toast.error('Konfirmasi password tidak sama')
    if (showFaculty && form.jabatan === 'pimpinan_fakultas' && !form.fakultasId) return toast.error('Fakultas wajib dipilih')
    const payload = { nama: form.nama.trim(), nip: currentNeedsNip ? form.nip.trim() : null, jabatan: form.jabatan, email: form.email.trim().toLowerCase(), password: form.password, aktif: form.aktif, ...(showFaculty && form.jabatan === 'pimpinan_fakultas' ? { fakultasId: Number(form.fakultasId) } : {}) }
    setSubmitting(true)
    try {
      if (editing) await updateStaffAccount(editing.id, payload)
      else await createStaffAccount(payload)
      toast.success(editing ? 'Akun berhasil diperbarui' : 'Akun berhasil ditambahkan')
      setOpen(false)
      await load()
    } catch (error) { toast.error('Gagal menyimpan akun', { description: error.message }) }
    finally { setSubmitting(false) }
  }

  const columns = [
    { key: '_no', label: 'No', width: '60px' },
    { key: 'nama', label: 'Nama' },
    ...(hasPimpinanInAllowed ? [{ key: 'nip', label: 'NIP', render: (row) => row.nip || '-' }] : []),
    { key: 'jabatan', label: 'Role', render: (row) => LABELS[row.jabatan] || row.jabatan },
    ...(showFaculty ? [{ key: 'fakultasNama', label: 'Fakultas', render: (row) => row.fakultasNama || '-' }] : []),
    { key: 'email', label: 'Akun' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
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
      <div><h2 className="text-2xl font-extrabold text-base-content">{title}</h2><p className="mt-1 text-sm text-base-content/60">{description}</p></div>
      <TableCard title={tableTitle} headerRight={<button type="button" onClick={startCreate} className="btn btn-primary btn-sm"><Plus className="h-4 w-4" /> Tambah Akun</button>}>
        <label className="input input-sm flex w-full items-center gap-2 sm:max-w-sm"><Search className="h-4 w-4 text-base-content/50" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama, akun, atau role..." className="grow" /></label>
        <TableFrame><DataTable columns={columns} data={filtered.map((row, index) => ({ ...row, _no: index + 1 }))} loading={loading} /></TableFrame>
      </TableCard>
      <Modal isOpen={open} onClose={() => !submitting && setOpen(false)} title={editing ? 'Edit Akun' : 'Tambah Akun'} size="lg">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {currentNeedsNip && <label className="space-y-1"><span className="text-sm text-base-content">NIP</span><input className="input w-full" required value={form.nip} onChange={(e) => setForm({ ...form, nip: e.target.value })} /></label>}
            <label className="space-y-1"><span className="text-sm text-base-content">Nama</span><input className="input w-full" required minLength={3} value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} /></label>
            {currentNeedsNip && <label className="space-y-1"><span className="text-sm text-base-content">Jabatan</span><input className="input w-full" value={LABELS[form.jabatan] || form.jabatan} disabled /></label>}
            <label className="space-y-1"><span className="text-sm text-base-content">Role</span><select className="select w-full" value={form.jabatan} onChange={(e) => setForm({ ...form, jabatan: e.target.value, fakultasId: '' })}>{allowedRoles.map((role) => <option key={role} value={role}>{LABELS[role]}</option>)}</select></label>
            {showFaculty && form.jabatan === 'pimpinan_fakultas' && <label className="space-y-1"><span className="text-sm text-base-content">Fakultas</span><select className="select w-full" required value={form.fakultasId} onChange={(e) => setForm({ ...form, fakultasId: e.target.value })}><option value="">Pilih fakultas</option>{faculties.map((item) => <option key={item.id} value={item.id}>{item.nama || item.fakultas}</option>)}</select></label>}
            <label className="space-y-1"><span className="text-sm text-base-content">Akun (Email)</span><input type="email" className="input w-full" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label className="space-y-1"><span className="text-sm text-base-content">Password {editing && '(opsional)'}</span><input type="password" className="input w-full" required={!editing} minLength={form.password ? 8 : undefined} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
            <label className="space-y-1"><span className="text-sm text-base-content">Konfirmasi Password</span><input type="password" className="input w-full" required={!editing || Boolean(form.password)} value={form.konfirmasiPassword} onChange={(e) => setForm({ ...form, konfirmasiPassword: e.target.value })} /></label>
            <label className="flex items-center gap-3 pt-6"><input type="checkbox" className="toggle toggle-primary" checked={form.aktif} onChange={(e) => setForm({ ...form, aktif: e.target.checked })} /><span className="text-sm text-base-content">{form.aktif ? 'Aktif' : 'Nonaktif'}</span></label>
          </div>
          <div className="flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className={batalBtnClass} disabled={submitting}>Batal</button><button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>{submitting ? 'Menyimpan...' : 'Simpan'}</button></div>
        </form>
      </Modal>
    </div>
  )
}
