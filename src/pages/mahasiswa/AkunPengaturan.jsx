import { useEffect, useState } from 'react'
import { Lock, User, UserCircle, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { getCurrentUser, updateProfil, gantiPassword } from '../../services/authService'
import { get } from '../../services/apiClient'
import { getFakultas, getProdi } from '../../services/matriksService'

function AkunPengaturan() {
  const user = getCurrentUser()
  const [fakultasList, setFakultasList] = useState([])
  const [prodiList, setProdiList] = useState([])
  const [form, setForm] = useState({
    namaLengkap: user?.nama || '',
    nim: '',
    fakultasId: '',
    programStudiId: '',
    nomorTelepon: '',
    alamat: '',
  })
  const [pwdForm, setPwdForm] = useState({
    passwordLama: '',
    passwordBaru: '',
    konfirmasiPassword: '',
  })
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPwd, setChangingPwd] = useState(false)

  useEffect(() => {
    getFakultas()
      .then((list) => setFakultasList(Array.isArray(list) ? list : []))
      .catch(() => {})

    // Prefill dari /api/auth/me bila tersedia
    get('/api/auth/me')
      .then((res) => {
        const d = res?.data || res || {}
        const mhs = d.mahasiswa || d
        setForm((p) => ({
          ...p,
          namaLengkap: d.nama || p.namaLengkap,
          nim: mhs.nim || '',
          fakultasId: mhs.prodi?.fakultasId || mhs.fakultasId || '',
          programStudiId: mhs.prodiId || mhs.prodi?.id || '',
          nomorTelepon: d.nomorTelepon || p.nomorTelepon,
          alamat: d.alamat || p.alamat,
        }))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!form.fakultasId) {
      setProdiList([])
      return
    }
    getProdi(form.fakultasId)
      .then((list) => setProdiList(Array.isArray(list) ? list : []))
      .catch(() => setProdiList([]))
  }, [form.fakultasId])

  const handleSimpanPerubahan = async () => {
    setSaving(true)
    try {
      await updateProfil({
        nama: form.namaLengkap,
        email: null,
        nomorTelepon: form.nomorTelepon || null,
        alamat: form.alamat || null,
      })
      toast.success('Berhasil Disimpan!', {
        description: 'Perubahan pada informasi pribadi Anda telah disimpan.',
      })
    } catch (err) {
      toast.error(err?.message || 'Gagal menyimpan perubahan.')
    } finally {
      setSaving(false)
    }
  }

  const handlePwdChange = (e) => {
    const { name, value } = e.target
    setPwdForm((prev) => ({ ...prev, [name]: value }))
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
    <DashboardLayout role="mahasiswa" userName={user?.nama || 'Mahasiswa'} userRole="Mahasiswa">
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-[#222] sm:text-2xl">Profil dan Pengaturan</h2>

        <div className="mx-auto max-w-md rounded-xl border border-[#e9ebf8] bg-white px-6 py-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f0f4f0]">
              <UserCircle className="h-12 w-12 text-brand-dark" />
            </span>
            <h3 className="mt-3 text-xl font-bold text-[#222] uppercase">{form.namaLengkap || '—'}</h3>
            <p className="mt-0.5 text-sm text-[#616161]">{form.nim || '—'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Informasi Pribadi */}
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <User className="h-5 w-5 text-brand-dark" />
              <h3 className="text-lg font-bold text-[#222]">Informasi Pribadi</h3>
            </div>

            {loading ? (
              <p className="text-sm text-[#9aa0a6]">Memuat data…</p>
            ) : (
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSimpanPerubahan() }}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-black">Nama Lengkap</label>
                    <input
                      type="text"
                      value={form.namaLengkap}
                      onChange={(e) => setForm((p) => ({ ...p, namaLengkap: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black">NIM</label>
                    <input
                      type="text"
                      value={form.nim}
                      readOnly
                      className="mt-1 block w-full rounded-md border border-[#e9ebf8] bg-[#f9f9f9] p-3 text-sm text-[#333] shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black">Fakultas</label>
                    <select
                      value={form.fakultasId}
                      onChange={(e) => setForm((p) => ({ ...p, fakultasId: e.target.value, programStudiId: '' }))}
                      className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark"
                    >
                      <option value="">Pilih Fakultas</option>
                      {fakultasList.map((f) => (
                        <option key={f.id} value={f.id}>{f.nama}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black">Program Studi</label>
                    <select
                      value={form.programStudiId}
                      onChange={(e) => setForm((p) => ({ ...p, programStudiId: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark"
                      disabled={!form.fakultasId}
                    >
                      <option value="">Pilih Program studi</option>
                      {prodiList.map((p) => (
                        <option key={p.id} value={p.id}>{p.nama}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black">Nomor Telepon</label>
                    <input
                      type="text"
                      value={form.nomorTelepon}
                      onChange={(e) => setForm((p) => ({ ...p, nomorTelepon: e.target.value }))}
                      className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark"
                      placeholder="Masukkan nomor telepon"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">Alamat</label>
                  <textarea
                    rows={3}
                    value={form.alamat}
                    onChange={(e) => setForm((p) => ({ ...p, alamat: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark"
                    placeholder="Masukkan alamat"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-6 py-2.5 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Ganti Password */}
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

        {/* KEAMANAN */}
        <div className="max-w-sm rounded-xl bg-gradient-to-r from-brand-dark to-brand-light p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20">
              <Lock className="h-4 w-4 text-white" />
            </span>
            <div>
              <p className="text-sm font-bold text-white">KEAMANAN</p>
              <p className="mt-0.5 text-xs leading-snug text-white/80">Data login dan kata sandi Anda terintegrasi dengan portal utama universitas.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AkunPengaturan
