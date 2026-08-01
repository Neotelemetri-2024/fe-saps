import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Download, Info, Upload } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatCard from '../../components/dashboard/StatCard'
import { getCurrentUser } from '../../services/authService'
import {
  getKegiatanById,
  getPesertaKegiatanFull,
  updatePesertaKegiatan,
  importPesertaCSV,
  downloadTemplatePeserta,
  submitPoinPeserta,
} from '../../services/kegiatanService'
import { getPeranKegiatan } from '../../services/matriksService'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'

function formatTanggal(val) {
  if (!val) return ''
  try {
    return new Date(val).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return String(val)
  }
}

function mapPesertaRow(p, i) {
  const peranId = p.peran?.id ?? p.peranVerifId ?? p.peranId ?? ''
  return {
    ...p,
    no: i + 1,
    id: p.partisipasiId ?? p.id,
    partisipasiId: p.partisipasiId ?? p.id,
    nama: p.namaMahasiswa || p.nama || p.mahasiswa?.user?.nama || '-',
    nim: p.nim || p.mahasiswa?.nim || '-',
    prodi: p.programStudi || p.prodi || p.mahasiswa?.prodi?.nama || '-',
    fakultas: p.fakultas || p.mahasiswa?.prodi?.fakultas?.nama || '-',
    hadir: p.kehadiran === true || p.kehadiran === 'Hadir' || p.hadir === true,
    peranVerifId: peranId !== '' && peranId != null ? String(peranId) : '',
  }
}

function ManajemenPeserta() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = getCurrentUser()
  const fileRef = useRef(null)

  const [kegiatan, setKegiatan] = useState({ nama: 'Kegiatan', tanggal: '', lokasi: '' })
  const [pesertaData, setPesertaData] = useState([])
  const [peranOptions, setPeranOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [search, setSearch] = useState('')
  const [filterKehadiran, setFilterKehadiran] = useState('semua')
  const [isEditing, setIsEditing] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const loadData = () => {
    setLoading(true)
    getKegiatanById(id)
      .then(async (keg) => {
        if (keg) {
          setKegiatan({
            nama: keg.nama || keg.judul || 'Kegiatan',
            tanggal: formatTanggal(keg.tanggalMulai || keg.tanggal || keg.tgl || ''),
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
        const full = await getPesertaKegiatanFull(id)
        const list = Array.isArray(full.peserta) ? full.peserta : []
        setPesertaData(list.map(mapPesertaRow))
        setSubmitted(full.statusSubmit === 'sudah_submit')
      })
      .catch((err) => toast.error('Gagal memuat data', { description: err.message }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [id])

  const handleKehadiranChange = (pesertaId, checked) => {
    if (!isEditing) return
    setPesertaData((prev) =>
      prev.map((p) => (p.id === pesertaId || p.partisipasiId === pesertaId ? { ...p, hadir: checked } : p)),
    )
  }

  const handlePeranChange = (pesertaId, value) => {
    if (!isEditing) return
    setPesertaData((prev) =>
      prev.map((p) =>
        p.id === pesertaId || p.partisipasiId === pesertaId
          ? { ...p, peranVerifId: value }
          : p,
      ),
    )
  }

  const buildPayload = () =>
    pesertaData.map((p) => ({
      partisipasiId: p.partisipasiId ?? p.id,
      hadir: !!p.hadir,
      ...(p.peranVerifId ? { peranVerifId: Number(p.peranVerifId) } : {}),
    }))

  const handleSubmitPoin = async () => {
    setSubmitLoading(true)
    try {
      await updatePesertaKegiatan(id, buildPayload())

      // Submit selalu dikirim ulang: backend hanya memproses peserta yang
      // kehadiran atau perannya berubah, sehingga poin tidak tercatat dua kali.
      const res = await submitPoinPeserta(id)
      const gagal = res?.data?.errors
      if (gagal?.length) {
        toast.warning(res?.message || 'Sebagian peserta gagal diproses', {
          description: gagal.join(' | '),
        })
      } else {
        toast.success(res?.message || 'Poin peserta berhasil diproses otomatis!')
      }
      setSubmitted(true)
      setIsEditing(false)
      loadData()
    } catch (err) {
      toast.error('Gagal', { description: err.message })
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleImport = async (file) => {
    setImporting(true)
    try {
      const res = await importPesertaCSV(id, file)
      const body = res?.data || res || {}
      const importedCount = body.imported?.length ?? 0
      const errors = body.errors ?? []
      if (errors.length > 0) {
        const msg = errors.slice(0, 3).map((e) => `NIM ${e.nim}: ${e.error}`).join('\n')
        toast.warning(
          `${importedCount} peserta berhasil, ${errors.length} gagal`,
          { description: msg },
        )
      } else {
        toast.success(`Import berhasil: ${importedCount} peserta`)
      }
      loadData()
    } catch (err) {
      toast.error('Gagal import', { description: err.message })
    } finally {
      setImporting(false)
    }
  }

  const filtered = pesertaData.filter((p) => {
    const matchSearch = !search ||
      (p.nama || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.nim || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filterKehadiran === 'semua' ||
      (filterKehadiran === 'hadir' && p.hadir) ||
      (filterKehadiran === 'tidak' && !p.hadir)
    return matchSearch && matchFilter
  })

  const total = pesertaData.length
  const hadir = pesertaData.filter((p) => p.hadir).length
  const tidakHadir = total - hadir

  return (
    <DashboardLayout role="operator_ukm" userName={user?.nama || 'Operator UKM'} userRole="Operator UKM">
      <div className="space-y-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>

        <div>
          <h2 className="text-2xl font-extrabold text-[#222] sm:text-3xl">Manajemen Peserta</h2>
          <p className="mt-1 text-sm text-[#616161]">
            {kegiatan.nama}
            {kegiatan.tanggal && ` · ${kegiatan.tanggal}`}
            {kegiatan.lokasi && ` · ${kegiatan.lokasi}`}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Total Terdaftar" value={total} color="green" />
          <StatCard label="Hadir" value={hadir} color="green" />
          <StatCard label="Tidak Hadir" value={tidakHadir} color="green" />
        </div>

        <div className="flex items-start gap-2 rounded-xl bg-yellow-50 p-3 text-sm text-yellow-700">
          <Info className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            Centang kehadiran dan pilih peran, lalu klik <strong>Submit Poin Peserta</strong>.
            Peserta yang sudah pernah di-submit sebelumnya tidak akan di-submit ulang.
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <input
            type="text"
            placeholder="Cari NIM atau nama…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-[#cfd6df] bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-brand-dark"
          />
          <div className="flex flex-wrap gap-2">
            {['semua', 'hadir', 'tidak'].map((f) => (
              <button
                key={f}
                onClick={() => setFilterKehadiran(f)}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${filterKehadiran === f ? 'bg-brand-dark text-white' : 'bg-[#e9ebf8] text-[#616161]'}`}
              >
                {f === 'semua' ? 'Semua' : f === 'hadir' ? 'Hadir' : 'Tidak Hadir'}
              </button>
            ))}
            <button
              onClick={() => downloadTemplatePeserta(id).catch((err) => toast.error('Gagal download template', { description: err.message }))}
              className="inline-flex items-center gap-2 rounded-lg bg-[#e9ebf8] px-4 py-2.5 text-sm font-semibold text-[#616161] hover:bg-[#d4d9f0]"
            >
              <Download className="h-4 w-4" /> Template CSV
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              className="inline-flex items-center gap-2 rounded-lg bg-[#e9ebf8] px-4 py-2.5 text-sm font-semibold text-[#616161] hover:bg-[#d4d9f0] disabled:opacity-60"
            >
              <Upload className="h-4 w-4" /> {importing ? 'Mengimpor…' : 'Import CSV'}
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
          </div>
        </div>

        <TableCard title="Daftar Peserta">
          <TableFrame>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead>
                  <tr className="divide-x divide-white/20 bg-gradient-to-r from-brand-dark to-brand-light text-xs font-semibold uppercase tracking-wide text-white">
                    <th className="w-16 px-4 py-3 text-center">No</th>
                    <th className="px-4 py-3 text-center">NIM</th>
                    <th className="px-4 py-3 text-center">Nama</th>
                    <th className="px-4 py-3 text-center">Prodi</th>
                    <th className="px-4 py-3 text-center">Hadir</th>
                    <th className="px-4 py-3 text-center">Peran</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-[#9aa0a6]">Memuat data…</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-[#9aa0a6]">Tidak ada peserta.</td></tr>
                  ) : filtered.map((p) => (
                    <tr key={p.partisipasiId || p.id} className="divide-x divide-[#e9ebf8] border-b border-[#e9ebf8] last:border-0 hover:bg-[#f9fafb]">
                      <td className="w-16 px-4 py-3 text-center text-[#616161]">{p.no}</td>
                      <td className="px-4 py-3 font-medium text-[#333]">{p.nim || '-'}</td>
                      <td className="px-4 py-3 text-[#616161]">{p.nama}</td>
                      <td className="px-4 py-3 text-[#616161]">{p.prodi}</td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={!!p.hadir}
                          onChange={(e) => handleKehadiranChange(p.partisipasiId || p.id, e.target.checked)}
                          disabled={!isEditing}
                          className="h-4 w-4 cursor-pointer accent-brand-dark disabled:cursor-default"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={p.peranVerifId || ''}
                          onChange={(e) => handlePeranChange(p.partisipasiId || p.id, e.target.value)}
                          disabled={!isEditing}
                          className="rounded-md border border-[#e9ebf8] p-1.5 text-xs text-[#333] outline-none focus:border-brand-dark disabled:cursor-default disabled:bg-[#f9fafb] disabled:text-[#999]"
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

            {!loading && (
              <div className="flex items-center justify-between border-t border-[#e9ebf8] px-6 py-3">
                <span className="text-xs text-[#888]">
                  Menampilkan {filtered.length} dari {pesertaData.length} peserta
                </span>
                <div className="flex items-center gap-3">
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-90"
                    >
                      Edit
                    </button>
                  )}
                  {isEditing && (
                    <button
                      onClick={handleSubmitPoin}
                      disabled={submitLoading}
                      className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-8 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-60"
                    >
                      {submitLoading ? 'Memproses…' : 'Submit Poin Peserta'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </TableFrame>
        </TableCard>

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

export default ManajemenPeserta
