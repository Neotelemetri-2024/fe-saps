import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { getCurrentUser } from '../../services/authService'
import { getKurikulumAktif, createKurikulum, tambahCapaian, tambahSubCapaian } from '../../services/kurikulumService'

function TambahMatriks() {
  const navigate = useNavigate()
  const user = getCurrentUser()

  const [namaKurikulum, setNamaKurikulum] = useState('')
  const [tahun, setTahun] = useState('')
  const [loadingCapaian, setLoadingCapaian] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Baris = capaian dari kurikulum aktif; kolom = sub capaian (label)
  const [kolom, setKolom] = useState([
    { id: `kol-${Date.now()}`, label: 'Sub Capaian 1' },
  ])
  const [baris, setBaris] = useState([])

  // Load capaian dari kurikulum aktif sebagai baris awal
  useEffect(() => {
    setLoadingCapaian(true)
    getKurikulumAktif()
      .then((data) => {
        const capaianList = data?.capaian || []
        if (capaianList.length > 0) {
          setBaris(
            capaianList.map((c) => ({
              id: String(c.id),
              label: c.nama || c.label || '-',
              nilai: {},
            }))
          )
        } else {
          setBaris([{ id: `baris-${Date.now()}`, label: 'Capaian 1', nilai: {} }])
        }
      })
      .catch(() => {
        setBaris([{ id: `baris-${Date.now()}`, label: 'Capaian 1', nilai: {} }])
      })
      .finally(() => setLoadingCapaian(false))
  }, [])

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

  const handleSimpan = async () => {
    if (!namaKurikulum.trim()) {
      toast.error('Nama kurikulum tidak boleh kosong.')
      return
    }
    if (!tahun.trim()) {
      toast.error('Tahun tidak boleh kosong.')
      return
    }
    if (baris.length === 0) {
      toast.error('Tambahkan minimal satu capaian.')
      return
    }
    setSubmitting(true)
    try {
      const created = await createKurikulum({
        nama: namaKurikulum.trim(),
        tahunAkademik: tahun.trim(),
      })
      const kurikulumId = created?.id || created?.data?.id
      if (!kurikulumId) throw new Error('Gagal mendapatkan ID kurikulum baru.')

      // Buat tiap baris sebagai capaian, lalu tiap kolom jadi sub capaian
      for (const b of baris) {
        const cap = await tambahCapaian(kurikulumId, { nama: b.label.trim() || 'Capaian' })
        const capId = cap?.id || cap?.data?.id
        if (!capId) continue
        for (const k of kolom) {
          const nilaiRaw = b.nilai[k.id] || ''
          const bobot = Number(nilaiRaw) || 0
          if (k.label.trim()) {
            await tambahSubCapaian(capId, {
              nama: k.label.trim(),
              bobot,
            })
          }
        }
      }

      toast.success('Kurikulum berhasil disimpan!')
      navigate('/pimpinan_ditmawa/manajemen-kurikulum')
    } catch (err) {
      toast.error('Gagal menyimpan', { description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout
      role="pimpinan_ditmawa"
      userName={user?.nama || 'Pimpinan Ditmawa'}
      userRole="Pimpinan Ditmawa"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Tambah Kurikulum / Matriks</h2>
        </div>

        <button
          type="button"
          onClick={() => navigate('/pimpinan_ditmawa/manajemen-kurikulum')}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-dark hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>

        <div className="space-y-6 rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">
                Nama Kurikulum <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={namaKurikulum}
                onChange={(e) => setNamaKurikulum(e.target.value)}
                placeholder="Contoh: Kurikulum Merdeka 2025"
                className="w-full rounded-lg border border-[#d9dce7] px-4 py-2.5 text-sm text-[#333] outline-none focus:border-brand-dark"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">
                Tahun <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
                placeholder="Contoh: 2025/2026"
                className="w-full rounded-lg border border-[#d9dce7] px-4 py-2.5 text-sm text-[#333] outline-none focus:border-brand-dark"
              />
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#111]">Matriks Capaian</h3>
                <p className="mt-0.5 text-xs text-[#888]">
                  Baris = Capaian, Kolom = Sub Capaian. Nilai diisi dengan bobot poin (%).
                </p>
              </div>
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

            {loadingCapaian ? (
              <p className="text-sm text-[#9aa0a6]">Memuat capaian dari kurikulum aktif…</p>
            ) : (
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
                      <tr
                        key={b.id}
                        className={`border-b border-[#e9ebf8] last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-[#f9fafb]'}`}
                      >
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
                              type="number"
                              min="0"
                              max="100"
                              value={b.nilai[k.id] || ''}
                              onChange={(e) => updateNilai(b.id, k.id, e.target.value)}
                              placeholder="0"
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
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/pimpinan_ditmawa/manajemen-kurikulum')}
            className="rounded-lg border border-[#d9dce7] px-6 py-2.5 text-sm font-semibold text-[#333] shadow-sm transition hover:bg-[#f5f6f8]"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={submitting || loadingCapaian}
            onClick={handleSimpan}
            className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-8 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default TambahMatriks
