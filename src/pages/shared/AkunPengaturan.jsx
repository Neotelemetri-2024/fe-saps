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
}

function AkunPengaturan({ role: roleProp } = {}) {
  const storedUser = getCurrentUser()
  const role = roleProp || storedUser?.role || 'admin_ditmawa'
  const roleLabel = ROLE_LABELS[role] || storedUser?.userRole || role

  const [form, setForm] = useState({
    namaLengkap: storedUser?.nama || '',
    nip: '',
    jabatan: roleLabel,
    email: storedUser?.email || '',
    nomorTelepon: '',
  })

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

  useEffect(() => {
    get('/api/auth/me')
      .then((res) => {
        const me = res?.data || res || {}
        setForm((prev) => ({
          ...prev,
          namaLengkap: me.nama || me.user?.nama || prev.namaLengkap,
          email: me.email || me.user?.email || prev.email,
          nip: me.nip || me.nim || me.staff?.nip || prev.nip,
          nomorTelepon: me.nomorTelepon || me.phone || prev.nomorTelepon,
          jabatan: ROLE_LABELS[role] || me.jabatan || me.peran || prev.jabatan,
        }))
      })
      .catch(() => {
        // fallback: tetap pakai data lokal
      })
  }, [role])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handlePwdChange = (e) => {
    const { name, value } = e.target
    setPwdForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSimpan = async () => {
    setSaving(true)
    try {
      await updateProfil({
        nama: form.namaLengkap,
        email: form.email,
        nomorTelepon: form.nomorTelepon || null,
        alamat: null,
      })
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

  return (
    <DashboardLayout role={role} userName={form.namaLengkap || 'Pengguna'} userRole={roleLabel}>
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-brand-dark sm:text-2xl lg:text-3xl">Akun dan Pengaturan</h2>

        {/* Header Profil */}
        <div className="mx-auto max-w-md rounded-xl border border-[#e9ebf8] bg-white px-6 py-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f0f4f0]">
              <UserCircle className="h-12 w-12 text-brand-dark" />
            </span>
            <h3 className="mt-3 text-lg font-bold text-brand-dark">{form.namaLengkap || '—'}</h3>
            <p className="mt-0.5 text-sm text-[#616161]">NIP: {form.nip || '—'}</p>
            <p className="text-sm text-[#616161]">{form.jabatan}</p>
          </div>
        </div>

        {/* Informasi Akun + Ganti Password — berdampingan */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Informasi Akun */}
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <User className="h-5 w-5 text-brand-dark" />
              <h3 className="text-lg font-bold text-brand-dark">Informasi Akun</h3>
            </div>
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
              <div>
                <label className="block text-sm font-medium text-black">NIP</label>
                <input
                  type="text"
                  name="nip"
                  value={form.nip}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm outline-none focus:border-brand-dark"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black">Jabatan</label>
                <input
                  type="text"
                  name="jabatan"
                  value={form.jabatan}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm outline-none focus:border-brand-dark"
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
          </div>

          {/* Ganti Password */}
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <Lock className="h-5 w-5 text-brand-dark" />
              <h3 className="text-lg font-bold text-brand-dark">Ganti Password</h3>
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

        {/* KEAMANAN */}
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
