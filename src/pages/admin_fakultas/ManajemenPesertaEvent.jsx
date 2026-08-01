import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Download, Upload, X, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import {
  getKegiatanById,
  getPesertaKegiatan,
  updatePesertaKegiatan,
  importPesertaCSV,
  downloadTemplatePeserta,
  submitPoinPeserta,
} from '../../services/kegiatanService'
import { getPeranKegiatan } from '../../services/matriksService'

function mapPesertaRow(p, i) {
  const peranId = p.peran?.id ?? p.peranVerifId ?? p.peranId ?? ''
  return {
    ...p,
    no: i + 1,
    id: p.partisipasiId ?? p.id,
    partisipasiId: p.partisipasiId ?? p.id,
    nama: p.namaMahasiswa || p.nama || '-',
    prodi: p.programStudi || p.prodi || '-',
    fakultas: p.fakultas || '-',
    hadir: p.kehadiran === true || p.kehadiran === 'Hadir' || p.hadir === true,
    peranVerifId: peranId !== '' && peranId != null ? String(peranId) : '',
  }
}

function SubmitModal({ isOpen, onConfirm, onClose }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl text-center">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 text-[#999] hover:text-[#333]"><X className="h-4 w-4" /></button>
        <h4 className="mb-2 text-lg font-bold text-[#222]">Submit Kegiatan Peserta</h4>
        <p className="mb-6 text-sm text-[#666]">Submit data untuk mengklaim poin peserta secara otomatik.</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-gradient-to-r from-brand-dark to-brand-light py-3 text-sm font-bold text-white hover:opacity-90"
          >
            SUBMIT
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border-2 border-[#d1d5db] py-3 text-sm font-bold text-[#444] hover:bg-[#f5f5f5]"
          >
            BATAL
          </button>
        </div>
      </div>
    </div>
  )
}

function ManajemenPesertaEvent() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [event, setEvent] = useState({ nama: 'Kegiatan', jenis: '', tanggal: '', lokasi: '' })
  const [eventStatus, setEventStatus] = useState('')
  const [pesertaList, setPesertaList] = useState([])
  const [peranOptions, setPeranOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterKehadiran, setFilterKehadiran] = useState('semua')
  const [isEditing, setIsEditing] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadData = () => {
    setLoading(true)
    getKegiatanById(id)
      .then(async (keg) => {
        if (keg) {
          setEventStatus(String(keg.status || '').toLowerCase())
          setEvent({
            nama: keg.nama || keg.judul || 'Kegiatan',
            jenis: keg.kategori?.nama || keg.jenis || '',
            tanggal: keg.tanggalMulai || keg.tanggal || '',
            lokasi: keg.lokasi || '',
          })
          const kategoriId = keg.kategoriId || keg.kategori?.id
          if (kategoriId) {
            try {
              const peran = await getPeranKegiatan(kategoriId)
              setPeranOptions(Array.isArray(peran) ? peran : [])
            } catch {
              setPeranOptions([])
            }
          }
        }
        const peserta = await getPesertaKegiatan(id)
        setPesertaList((Array.isArray(peserta) ? peserta : []).map(mapPesertaRow))
      })
      .catch((err) => toast.error('Gagal memuat data', { description: err.message }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [id])

  const filtered = pesertaList.filter((p) => {
    const matchSearch =
      (p.nama || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.nim || '').includes(search) ||
      (p.prodi || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filterKehadiran === 'semua' ||
      (filterKehadiran === 'hadir' && p.hadir) ||
      (filterKehadiran === 'tidak hadir' && !p.hadir)
    return matchSearch && matchFilter
  })

  function toggleHadir(pid) {
    if (!isEditing) return
    setPesertaList((prev) => prev.map((p) => (p.id === pid ? { ...p, hadir: !p.hadir } : p)))
  }

  function setPilihPeran(pid, peranVerifId) {
    if (!isEditing) return
    setPesertaList((prev) => prev.map((p) => (p.id === pid ? { ...p, peranVerifId } : p)))
  }

  async function handleSimpanEdit() {
    setSaving(true)
    try {
      const payload = pesertaList.map((p) => ({
        partisipasiId: p.partisipasiId ?? p.id,
        hadir: !!p.hadir,
        ...(p.peranVerifId ? { peranVerifId: Number(p.peranVerifId) } : {}),
      }))
      await updatePesertaKegiatan(id, payload)
      toast.success('Perubahan berhasil disimpan')
      setIsEditing(false)
    } catch (err) {
      toast.error('Gagal menyimpan', { description: err.message })
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmitConfirm() {
    setShowSubmitModal(false)
    setSaving(true)
    try {
      const payload = pesertaList.map((p) => ({
        partisipasiId: p.partisipasiId ?? p.id,
        hadir: !!p.hadir,
        ...(p.peranVerifId ? { peranVerifId: Number(p.peranVerifId) } : {}),
      }))
      await updatePesertaKegiatan(id, payload)
      await submitPoinPeserta(id)
      setIsEditing(false)
      setSubmitted(true)
      toast.success('Data peserta berhasil disubmit! Poin akan diklaim otomatis.')
    } catch (err) {
      toast.error('Gagal submit', { description: err.message })
    } finally {
      setSaving(false)
    }
  }

  async function handleImport(file) {
    try {
      await importPesertaCSV(id, file)
      toast.success('Import berhasil')
      loadData()
    } catch (err) {
      toast.error('Gagal import', { description: err.message })
    }
  }

  function handleResetFilter() {
    setSearch('')
    setFilterKehadiran('semua')
  }

  const belumDisetujui = !['disetujui', 'terpublikasi'].includes(eventStatus)

  return (
    <DashboardLayout role="admin_fakultas" userName="Admin Fakultas" userRole="Admin Fakultas">
      <SubmitModal
        isOpen={showSubmitModal}
        onConfirm={handleSubmitConfirm}
        onClose={() => setShowSubmitModal(false)}
      />

      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate('/admin_fakultas/manajemen-event')}
          className="flex items-center gap-1.5 text-sm font-medium text-brand-dark hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Manajemen Event
        </button>

        <div>
          <h2 className="text-xl font-extrabold text-brand-dark sm:text-2xl lg:text-3xl">{event.nama}</h2>
          <p className="mt-1 text-sm text-[#616161]">
            {[event.jenis, event.tanggal, event.lokasi].filter(Boolean).join(' · ')}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0a6]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari mahasiswa atau kegiatan..."
              className="w-full rounded-lg border border-[#d1d5db] py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-dark"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 flex-wrap">
            {['semua', 'hadir', 'tidak hadir'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilterKehadiran(f)}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold capitalize transition ${
                  filterKehadiran === f
                    ? 'bg-gradient-to-r from-brand-dark to-brand-light text-white'
                    : 'border border-[#d1d5db] bg-white text-[#444] hover:bg-[#f5f5f5]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => downloadTemplatePeserta(id).catch((err) => toast.error('Gagal download template', { description: err.message }))}
              className="flex items-center gap-1.5 rounded-lg border border-[#d1d5db] bg-white px-3 py-2 text-xs font-semibold text-[#444] hover:bg-[#f5f5f5]"
            >
              <Download className="h-3.5 w-3.5" /> unduh template
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
            >
              <Upload className="h-3.5 w-3.5" /> Import file
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImport(file)
                e.target.value = ''
              }}
            />
            <button
              type="button"
              onClick={handleResetFilter}
              className="flex items-center gap-1.5 rounded-lg border border-brand-dark bg-white px-3 py-2 text-xs font-semibold text-brand-dark hover:bg-[#f5f5f5]"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset filter
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="divide-x divide-white/20 bg-gradient-to-r from-brand-dark to-brand-light text-white">
                  <th className="w-16 px-4 py-3.5 text-center text-xs font-bold uppercase tracking-wide">NO</th>
                  <th className="px-4 py-3.5 text-center text-xs font-bold uppercase tracking-wide">NIM</th>
                  <th className="px-4 py-3.5 text-center text-xs font-bold uppercase tracking-wide">NAMA MAHASISWA</th>
                  <th className="px-4 py-3.5 text-center text-xs font-bold uppercase tracking-wide">FAKULTAS</th>
                  <th className="px-4 py-3.5 text-center text-xs font-bold uppercase tracking-wide">PROGRAM STUDI</th>
                  <th className="px-4 py-3.5 text-center text-xs font-bold uppercase tracking-wide">KEHADIRAN</th>
                  <th className="px-4 py-3.5 text-center text-xs font-bold uppercase tracking-wide">PERAN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-[#9aa0a6]">Memuat data…</td></tr>
                ) : filtered.map((p, i) => (
                  <tr key={p.id} className="divide-x divide-[#f0f0f0] hover:bg-[#f9fafb]">
                    <td className="w-16 px-4 py-3.5 text-center text-[#616161]">{i + 1}</td>
                    <td className="px-4 py-3.5 text-[#616161]">{p.nim}</td>
                    <td className="px-4 py-3.5 font-medium text-[#222]">{p.nama}</td>
                    <td className="px-4 py-3.5 text-[#616161]">{p.fakultas}</td>
                    <td className="px-4 py-3.5 text-[#616161]">{p.prodi}</td>
                    <td className="px-4 py-3.5">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!p.hadir}
                          onChange={() => toggleHadir(p.id)}
                          disabled={!isEditing}
                          className="h-4 w-4 cursor-pointer accent-brand-dark disabled:cursor-default"
                        />
                        <span className="text-xs text-[#616161]">hadir</span>
                      </label>
                    </td>
                    <td className="px-4 py-3.5">
                      <select
                        value={p.peranVerifId || ''}
                        onChange={(e) => setPilihPeran(p.id, e.target.value)}
                        disabled={!isEditing}
                        className="rounded border border-[#d1d5db] px-2 py-1 text-xs text-[#444] outline-none focus:border-brand-dark disabled:cursor-default disabled:bg-[#f9fafb] disabled:text-[#999]"
                      >
                        <option value="">Pilih Peran</option>
                        {peranOptions.map((opt) => (
                          <option key={opt.id} value={String(opt.id)}>{opt.nama}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-[#9aa0a6]">Tidak ada peserta ditemukan.</div>
          )}

          <div className="flex items-center justify-between border-t border-[#f0f0f0] px-6 py-3">
            <span className="text-xs text-[#888]">
              Showing {filtered.length} from Total {pesertaList.length}
            </span>
            <div className="flex items-center gap-3">
              {belumDisetujui && !submitted && !isEditing && (
                <span className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                  Event belum disetujui pimpinan
                </span>
              )}
              {!submitted && !isEditing && !belumDisetujui && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
                >
                  Edit
                </button>
              )}
              {!submitted && isEditing && (
                <>
                  <button
                    type="button"
                    onClick={handleSimpanEdit}
                    disabled={saving}
                    className="rounded-lg border border-brand-dark px-4 py-2 text-xs font-semibold text-brand-dark hover:bg-green-50 disabled:opacity-60"
                  >
                    {saving ? 'Menyimpan…' : 'Simpan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(true)}
                    disabled={saving}
                    className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
                  >
                    submit untuk Klaim Poin Peserta
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {submitted && (
          <div className="pt-2">
            <p className="text-sm font-semibold text-[#444]">Status</p>
            <p className="mt-1 text-2xl font-extrabold">
              <span className="text-[#222]">Telah </span>
              <span className="text-brand-dark">Tercatat</span>
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default ManajemenPesertaEvent
