import { useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'

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
    navigate('/pimpinan-ditmawa/bobot-poin')
  }

  return (
    <DashboardLayout role="pimpinan-ditmawa" userName="Dr. Dendi Adi Saputra" userRole="Pimpinan Ditmawa">
      <div className="space-y-5">
        <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Edit Poin</h2>

        <button
          type="button"
          onClick={() => navigate('/pimpinan-ditmawa/bobot-poin')}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-dark hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Bobot Poin
        </button>

        <div className="max-w-lg rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">Kategori</label>
            <input
              type="text"
              value={kategori}
              disabled
              className="w-full rounded-lg border border-[#e9ebf8] bg-[#f5f6f8] px-4 py-2.5 text-sm text-[#616161] outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">
              Nama Sub Kategori <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full rounded-lg border border-[#d9dce7] px-4 py-2.5 text-sm text-[#333] outline-none focus:border-brand-dark"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">
              Poin <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={poin}
              onChange={(e) => setPoin(e.target.value === '' ? '' : Number(e.target.value))}
              min={0}
              max={1000}
              className="w-full rounded-lg border border-[#d9dce7] px-4 py-2.5 text-sm text-[#333] outline-none focus:border-brand-dark"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/pimpinan-ditmawa/bobot-poin')}
              className="rounded-lg border border-[#d9dce7] px-6 py-2.5 text-sm font-semibold text-[#333] shadow-sm transition hover:bg-[#f5f6f8]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSimpan}
              disabled={submitting}
              className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-8 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default EditPoin
