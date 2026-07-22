import { useState } from 'react'
import { toast } from 'sonner'
import { Lock, User, Eye, EyeOff } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import logoUnand from '../../assets/logo_unand.png'

function AkunPengaturan() {
  const [form, setForm] = useState({
    namaLengkap: 'Dr. Efa Yonnedi, SE. MPPM, Akt, CA, CRGP',
    nip: '197106011997021001',
    jabatan: 'Dosen Pembimbing',
    email: 'efa.yonnedi@unand.ac.id',
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

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handlePwdChange = (e) => {
    const { name, value } = e.target
    setPwdForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSimpan = () => {
    toast.success('Berhasil Disimpan!', {
      description: 'Perubahan informasi akun telah disimpan.',
    })
  }

  const handleGantiPassword = () => {
    if (!pwdForm.passwordLama || !pwdForm.passwordBaru) {
      toast.error('Lengkapi semua field password.')
      return
    }
    if (pwdForm.passwordBaru !== pwdForm.konfirmasiPassword) {
      toast.error('Password baru dan konfirmasi tidak cocok.')
      return
    }
    toast.success('Password berhasil diubah!')
    setPwdForm({ passwordLama: '', passwordBaru: '', konfirmasiPassword: '' })
  }

  return (
    <DashboardLayout role="admin-ditmawa" userName="Dr. Efa Yonnedi, SE. MPPM, Akt, CA, CRGP" userRole="Dosen Pembimbing">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-brand-dark">Akun dan Pengaturan</h2>

        {/* Header Profil */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-6">
              <img src={logoUnand} alt="Logo Unand" className="h-20 w-auto object-contain" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-brand-dark">{form.namaLengkap}</h3>
                <p className="text-sm text-[#616161]">NIP: {form.nip}</p>
                <p className="text-sm text-[#616161]">{form.jabatan}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center rounded-xl bg-gradient-to-r from-brand-dark to-brand-light p-6 shadow-sm">
            <Lock className="mb-2 h-8 w-8 text-white" />
            <p className="text-lg font-semibold text-white">KEAMANAN</p>
            <p className="mt-1 text-sm text-white/80">
              Data login dan kata sandi Anda terintegrasi dengan portal utama universitas.
            </p>
          </div>
        </div>

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
            <button
              type="button"
              onClick={handleSimpan}
              className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-8 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
            >
              Simpan Perubahan
            </button>
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
                  placeholder="••••••••"
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
                  placeholder="••••••••"
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
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-[#e9ebf8] p-3 pr-10 text-sm text-[#333] shadow-sm outline-none focus:border-brand-dark"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e98a8]">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGantiPassword}
              className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-8 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
            >
              Ganti Password
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AkunPengaturan
