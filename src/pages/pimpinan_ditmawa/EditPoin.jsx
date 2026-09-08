import { useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { batalBtnClass } from '../../components/ui/buttonStyles'

function EditPoin() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()

  const stateItem = location.state?.item
  const stateKategori = location.state?.kategori || 'Kompetisi'

  const [nama, setNama] = useState(stateItem?.nama || 'Juara 1 Internasional')
  const [poin, setPoin] = useState(stateItem?.poin ?? 100)
  const [kategori] = useState(stateKategori)
  const [submitting, setSubmitting] = useState(false)

  const handleSimpan = async () => {
    if (!nama.trim()) {
      toast.error('Nama sub kategori tidak boleh kosong.')
      return
    }
    if (poin === '' || poin === null) {
      toast.error('Poin tidak boleh kosong.')
      return
    }
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 400))
    toast.success('Poin berhasil diperbarui!')
    setSubmitting(false)
    navigate('/pimpinan_ditmawa/bobot-poin')
  }

  return (
      <div className="space-y-5">
        <h2 className="text-2xl font-extrabold text-base-content sm:text-3xl">Edit Poin</h2>

        <button
          type="button"
          onClick={() => navigate('/pimpinan_ditmawa/bobot-poin')}
          className="inline-flex items-center gap-1 text-sm font-medium text-base-content hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>

        <div className="max-w-lg card bg-base-100 p-6 space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-base-content">Kategori</label>
            <input
              type="text"
              value={kategori}
              disabled
              className="w-full rounded-lg border border-base-300 bg-base-200 px-4 py-2.5 text-sm text-base-content/60 outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-base-content">
              Nama Sub Kategori <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="input w-full"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-base-content">
              Poin <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={poin}
              onChange={(e) => setPoin(e.target.value === '' ? '' : Number(e.target.value))}
              min={0}
              max={1000}
              className="input w-full"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/pimpinan_ditmawa/bobot-poin')} className={batalBtnClass}>
              Batal
            </button>
            <button
              type="button"
              onClick={handleSimpan}
              disabled={submitting}
              className="btn btn-primary px-8 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>
  )
}

export default EditPoin
