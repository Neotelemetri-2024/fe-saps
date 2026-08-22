import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Lock, User, UserCircle, Eye, EyeOff } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { getCurrentUser, updateProfil, gantiPassword } from '../../services/authService'
import { get } from '../../services/apiClient'

const ROLE_LABELS = {
  admin_ditmawa: 'Admin Ditmawa',
  admin_fakultas: 'Admin Fakultas',
  dosen: 'Dosen Pembimbing',
  dosen_pa: 'Dosen Pembimbing',
  pimpinan_ditmawa: 'Pimpinan Ditmawa',
  pimpinan_fakultas: 'Pimpinan Fakultas',
  pimpinan_utama: 'Pimpinan Utama',
  operator_ukm: 'Operator UKM',
  operator_ukmf: 'Operator UKMF',
  mahasiswa: 'Mahasiswa',
  staff: 'Staf',
}

function labelJabatanStaff(jabatan) {
  if (!jabatan) return null
  return ROLE_LABELS[jabatan] || String(jabatan).replace(/_/g, ' ')
}

function AkunPengaturan({ role: roleProp } = {}) {
  const storedUser = getCurrentUser()
  const role = roleProp || storedUser?.role || 'admin_ditmawa'
  const roleLabel = ROLE_LABELS[role] || storedUser?.userRole || role

  const [form, setForm] = useState({
    namaLengkap: storedUser?.nama || '',
    identitas: '',
    identitasLabel: 'Identitas',
    jabatan: roleLabel,
    email: storedUser?.email || '',
    nomorTelepon: '',
    alamat: '',
  })
  const [loading, setLoading] = useState(true)
  const [pwdForm, setPwdForm] = useState({
    passwordLama: '',
    passwordBaru: '',
    konfirmasiPassword: '',
  })
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [changingPwd, setChangingPwd] = useState(false)
  const [displayName, setDisplayName] = useState(storedUser?.nama || 'Pengguna')

  useEffect(() => {
    setLoading(true)
    get('/api/auth/me')
      .then((res) => {
        const me = res?.data || res || {}
        const nidn = me.dosen?.nidn || ''
        const nim = me.mahasiswa?.nim || ''
        let identitas = ''
        let identitasLabel = 'Identitas'
        if (nidn) {
          identitas = nidn
          identitasLabel = 'NIDN'
        } else if (nim) {
          identitas = nim
          identitasLabel = 'NIM'
        }

        const jabatan =
          labelJabatanStaff(me.staff?.jabatan) ||
          ROLE_LABELS[role] ||
          ROLE_LABELS[me.peran] ||
          me.organisasiOperator?.organisasi?.nama ||
          roleLabel

        setForm({
          namaLengkap: me.nama || '',
          identitas,
          identitasLabel,
          jabatan,
          email: me.email || '',
          nomorTelepon: me.nomorTelepon || '',
          alamat: me.alamat || '',
        })
        setDisplayName(me.nama || 'Pengguna')
      })
      .catch(() => {
        // fallback: tetap pakai data lokal
      })
      .finally(() => setLoading(false))
  }, [role, roleLabel])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handlePwdChange = (e) => {
    const { name, value } = e.target
    setPwdForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSimpan = async () => {
    if (!form.namaLengkap.trim()) {
      toast.error('Nama lengkap wajib diisi.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        nama: form.namaLengkap.trim(),
        nomorTelepon: form.nomorTelepon || null,
        alamat: form.alamat || null,
      }
      if (form.email) payload.email = form.email.trim()
      const updated = await updateProfil(payload)
      setDisplayName(updated?.nama || form.namaLengkap)
      toast.success('Berhasil Disimpan!', {
        description: 'Perubahan informasi akun telah disimpan.',
      })
    } catch (err) {
      toast.error(err?.message || 'Gagal menyimpan perubahan.')
    } finally {
      setSaving(false)
    }
  }

  const handleGantiPassword = async () => {
    if (!pwdForm.passwordLama || !pwdForm.passwordBaru) {
      toast.error('Lengkapi semua field password.')
      return
    }
    if (pwdForm.passwordBaru !== pwdForm.konfirmasiPassword) {
      toast.error('Password baru dan konfirmasi tidak cocok.')
      return
    }
    setChangingPwd(true)
    try {
      await gantiPassword({
        passwordLama: pwdForm.passwordLama,
        passwordBaru: pwdForm.passwordBaru,
        konfirmasiPassword: pwdForm.konfirmasiPassword,
      })
      toast.success('Password berhasil diubah!')
      setPwdForm({ passwordLama: '', passwordBaru: '', konfirmasiPassword: '' })
    } catch (err) {
      toast.error(err?.message || 'Gagal mengganti password.')
    } finally {
      setChangingPwd(false)
    }
  }

  const showIdentitas = Boolean(form.identitas)

  return (
    <DashboardLayout role={role} userName={displayName || 'Pengguna'} userRole={roleLabel}>
      <div className="space-y-6">
        <div className="flex flex-col gap-10">
          <h2 className="text-xl font-bold text-[#222] sm:text-2xl lg:text-3xl">Akun dan Pengaturan</h2>

          <div className="mx-auto w-full max-w-md rounded-xl border border-[#e9ebf8] bg-white px-6 py-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f0f4f0]">
                <UserCircle className="h-12 w-12 text-brand-dark" />
              </span>
              <h3 className="mt-3 text-lg font-bold text-[#222]">{form.namaLengkap || '—'}</h3>
              {showIdentitas && (
                <p className="mt-0.5 text-sm text-[#616161]">
                  {form.identitasLabel}: {form.identitas}
                </p>
              )}
              <p className="text-sm text-[#616161]">{form.jabatan}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <User className="h-5 w-5 text-brand-dark" />
              <h3 className="text-lg font-bold text-[#222]">Informasi Akun</h3>
            </div>
            {loading ? (
              <p className="text-sm text-[#9aa0a6]">Memuat data…</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black">Nama Lengkap</label>
                  <input
                    type="text"
                    name="namaLengkap"
                    value={form.namaLengkap}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm outline-none focus:border-brand-dark"
                  />
                </div>
                {showIdentitas && (
                  <div>
                    <label className="block text-sm font-medium text-black">{form.identitasLabel}</label>
                    <input
                      type="text"
                      value={form.identitas}
                      readOnly
                      className="mt-1 w-full rounded-lg border border-[#e9ebf8] bg-[#f9f9f9] p-3 text-sm text-[#333] shadow-sm"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-black">Jabatan</label>
                  <input
                    type="text"
                    value={form.jabatan}
                    readOnly
                    className="mt-1 w-full rounded-lg border border-[#e9ebf8] bg-[#f9f9f9] p-3 text-sm text-[#333] shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-lg border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm outline-none focus:border-brand-dark"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">Nomor Telepon</label>
                  <input
                    type="text"
                    name="nomorTelepon"
                    value={form.nomorTelepon}
                    onChange={handleChange}
                    placeholder="Masukkan nomor telepon"
                    className="mt-1 w-full rounded-lg border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm outline-none focus:border-brand-dark"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">Alamat</label>
                  <textarea
                    name="alamat"
                    rows={3}
                    value={form.alamat}
                    onChange={handleChange}
                    placeholder="Masukkan alamat"
                    className="mt-1 w-full rounded-lg border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm outline-none focus:border-brand-dark"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSimpan}
                    disabled={saving}
                    className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-8 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <Lock className="h-5 w-5 text-brand-dark" />
              <h3 className="text-lg font-bold text-[#222]">Ganti Password</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black">Password Lama <span className="text-red-500">*</span></label>
                <div className="relative mt-1">
                  <input
                    type={showOld ? 'text' : 'password'}
                    name="passwordLama"
                    value={pwdForm.passwordLama}
                    onChange={handlePwdChange}
                    className="w-full rounded-lg border border-[#e9ebf8] p-3 pr-10 text-sm text-[#333] shadow-sm outline-none focus:border-brand-dark"
                  />
                  <button type="button" onClick={() => setShowOld(!showOld)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e98a8]">
                    {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-black">Password Baru <span className="text-red-500">*</span></label>
                <div className="relative mt-1">
                  <input
                    type={showNew ? 'text' : 'password'}
                    name="passwordBaru"
                    value={pwdForm.passwordBaru}
                    onChange={handlePwdChange}
                    className="w-full rounded-lg border border-[#e9ebf8] p-3 pr-10 text-sm text-[#333] shadow-sm outline-none focus:border-brand-dark"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e98a8]">
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-black">Konfirmasi Password Baru <span className="text-red-500">*</span></label>
                <div className="relative mt-1">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="konfirmasiPassword"
                    value={pwdForm.konfirmasiPassword}
                    onChange={handlePwdChange}
                    className="w-full rounded-lg border border-[#e9ebf8] p-3 pr-10 text-sm text-[#333] shadow-sm outline-none focus:border-brand-dark"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e98a8]">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleGantiPassword}
                  disabled={changingPwd}
                  className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-8 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {changingPwd ? 'Mengganti…' : 'Ganti Password'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-sm rounded-xl bg-gradient-to-r from-brand-dark to-brand-light p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20">
              <Lock className="h-4 w-4 text-white" />
            </span>
            <div>
              <p className="text-sm font-bold text-white">KEAMANAN</p>
              <p className="mt-0.5 text-xs leading-snug text-white/80">
                Data login dan kata sandi Anda terintegrasi dengan portal utama universitas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AkunPengaturan
