import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'

const DUMMY_CAPAIAN = [
  { id: 'cap-1', label: 'Fondasi' },
  { id: 'cap-2', label: 'Penguatan' },
  { id: 'cap-3', label: 'Pengembangan' },
]

function TambahMatriks() {
  const navigate = useNavigate()

  const [namaKurikulum, setNamaKurikulum] = useState('')
  const [tahun, setTahun] = useState('')

  const [kolom, setKolom] = useState([
    { id: 'kol-1', label: 'Sub Capaian 1' },
    { id: 'kol-2', label: 'Sub Capaian 2' },
  ])
  const [baris, setBaris] = useState(
    DUMMY_CAPAIAN.map((c) => ({
      id: c.id,
      label: c.label,
      nilai: {},
    }))
  )

  const addKolom = () => {
    const id = `kol-${Date.now()}`
    setKolom((prev) => [...prev, { id, label: `Sub Capaian ${prev.length + 1}` }])
  }

  const removeKolom = (id) => {
    setKolom((prev) => prev.filter((k) => k.id !== id))
    setBaris((prev) =>
      prev.map((b) => {
        const next = { ...b.nilai }
        delete next[id]
        return { ...b, nilai: next }
      })
    )
  }

  const addBaris = () => {
    const id = `baris-${Date.now()}`
    setBaris((prev) => [...prev, { id, label: `Capaian ${prev.length + 1}`, nilai: {} }])
  }

  const removeBaris = (id) => setBaris((prev) => prev.filter((b) => b.id !== id))

  const updateNilai = (barisId, kolomId, value) => {
    setBaris((prev) =>
      prev.map((b) => (b.id === barisId ? { ...b, nilai: { ...b.nilai, [kolomId]: value } } : b))
    )
  }

  const updateBarisLabel = (id, value) => {
    setBaris((prev) => prev.map((b) => (b.id === id ? { ...b, label: value } : b)))
  }

  const updateKolomLabel = (id, value) => {
    setKolom((prev) => prev.map((k) => (k.id === id ? { ...k, label: value } : k)))
  }

  const handleSimpan = () => {
    if (!namaKurikulum.trim()) {
      toast.error('Nama kurikulum tidak boleh kosong.')
      return
    }
    toast.success('Kurikulum berhasil disimpan!')
    navigate('/pimpinan-ditmawa/manajemen-kurikulum')
  }

  return (
    <DashboardLayout role="pimpinan-ditmawa" userName="Dr. Dendi Adi Saputra" userRole="Pimpinan Ditmawa">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Tambah Kurikulum / Matriks</h2>
        </div>

        <button
          type="button"
          onClick={() => navigate('/pimpinan-ditmawa/manajemen-kurikulum')}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-dark hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">
                Nama Kurikulum <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={namaKurikulum}
                onChange={(e) => setNamaKurikulum(e.target.value)}
                placeholder="Contoh: Kurikulum 2024"
                className="w-full rounded-lg border border-[#d9dce7] px-4 py-2.5 text-sm text-[#333] outline-none focus:border-brand-dark"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">Tahun</label>
              <input
                type="number"
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
                placeholder="Contoh: 2024"
                className="w-full rounded-lg border border-[#d9dce7] px-4 py-2.5 text-sm text-[#333] outline-none focus:border-brand-dark"
              />
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#111]">Matriks Capaian</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addKolom}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#d9dce7] bg-white px-3 py-2 text-xs font-semibold text-[#333] shadow-sm transition hover:bg-[#f5f6f8]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tambah Kolom
                </button>
                <button
                  type="button"
                  onClick={addBaris}
                  className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tambah Baris
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-[#e9ebf8]">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-xs font-semibold uppercase tracking-wide text-white">
                    <th className="px-4 py-3">Capaian / Sub Capaian</th>
                    {kolom.map((k) => (
                      <th key={k.id} className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={k.label}
                            onChange={(e) => updateKolomLabel(k.id, e.target.value)}
                            className="w-full min-w-[100px] rounded border border-white/30 bg-white/10 px-2 py-0.5 text-xs text-white placeholder-white/60 outline-none focus:bg-white/20"
                          />
                          <button
                            type="button"
                            onClick={() => removeKolom(k.id)}
                            className="shrink-0 rounded p-0.5 text-white/70 hover:text-white"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {baris.map((b, i) => (
                    <tr key={b.id} className={`border-b border-[#e9ebf8] last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-[#f9fafb]'}`}>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={b.label}
                          onChange={(e) => updateBarisLabel(b.id, e.target.value)}
                          className="w-full rounded border border-[#e9ebf8] px-2 py-1 text-sm text-[#333] outline-none focus:border-brand-dark"
                        />
                      </td>
                      {kolom.map((k) => (
                        <td key={k.id} className="px-4 py-3">
                          <input
                            type="text"
                            value={b.nilai[k.id] || ''}
                            onChange={(e) => updateNilai(b.id, k.id, e.target.value)}
                            placeholder="-"
                            className="w-full rounded border border-[#e9ebf8] px-2 py-1 text-sm text-[#333] outline-none focus:border-brand-dark"
                          />
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => removeBaris(b.id)}
                          className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/pimpinan-ditmawa/manajemen-kurikulum')}
            className="rounded-lg border border-[#d9dce7] px-6 py-2.5 text-sm font-semibold text-[#333] shadow-sm transition hover:bg-[#f5f6f8]"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSimpan}
            className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-8 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
          >
            Simpan
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default TambahMatriks
