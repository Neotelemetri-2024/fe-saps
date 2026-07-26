import { useEffect, useState } from 'react'
import { Lock, User } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import logoUnand from '../../assets/logo_unand.png'
import { getCurrentUser } from '../../services/authService'
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
  const [loading, setLoading] = useState(true)

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

  const handleSimpanPerubahan = () => {
    // Endpoint PUT profil belum ada di BE — simpan lokal toast saja
    toast.success('Berhasil Disimpan!', {
      description: 'Perubahan pada informasi pribadi Anda telah disimpan. (Endpoint update profil BE belum tersedia)',
    })
  }

  return (
    <DashboardLayout role="mahasiswa" userName={user?.nama || 'Mahasiswa'} userRole="Mahasiswa">
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-brand-dark sm:text-2xl">Profil dan Pengaturan</h2>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-6">
              <img src={logoUnand} alt="Logo" className="h-20 w-auto object-contain" />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-brand-dark uppercase">{form.namaLengkap || '—'}</h3>
                <p className="text-sm text-[#616161]">{form.nim || '—'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#e9ebf8] bg-gradient-to-br from-brand-dark to-brand-light p-6 shadow-sm flex flex-col justify-center">
            <Lock className="h-8 w-8 text-white mb-2" />
            <p className="font-semibold text-white text-lg">KEAMANAN</p>
            <p className="text-sm text-gray-200">Data login dan kata sandi Anda terintegrasi dengan portal utama universitas.</p>
          </div>
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <User className="h-5 w-5 text-brand-dark" />
            <h3 className="text-lg font-bold text-brand-dark">Informasi Pribadi</h3>
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
              <button
                type="submit"
                className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-6 py-2.5 text-sm font-bold text-white shadow-sm"
              >
                Simpan Perubahan
              </button>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AkunPengaturan
