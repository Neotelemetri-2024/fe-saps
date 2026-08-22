import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, Info, ChevronLeft, ChevronRight, Search, Download, UploadCloud, UserPlus } from 'lucide-react'
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
import TambahPesertaModal from '../../components/ui/TambahPesertaModal'
import {
  kehadiranFilterBtnClass,
  pesertaResetFilterBtnClass,
  pesertaDownloadBtnClass,
  pesertaImportBtnClass,
  pesertaTambahBtnClass,
  pesertaEditBtnClass,
  pesertaBatalBtnClass,
  pesertaSubmitBtnClass,
} from '../../components/dashboard/pesertaToolbarStyles'

function formatTanggal(val) {
  if (!val) return ''
  try {
    const d = new Date(val)
    if (Number.isNaN(d.getTime())) return String(val)
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return String(val)
  }
}

function mapPesertaRow(p, i) {
  const peranId = p.peran?.id ?? p.peranVerifId ?? p.peranId ?? ''
  let hadir = null
  if (p.kehadiran === true || p.kehadiran === 'Hadir' || p.hadir === true) hadir = true
  else if (p.kehadiran === false || p.kehadiran === 'Tidak Hadir' || p.hadir === false) hadir = false
  return {
    ...p,
    no: i + 1,
    id: p.partisipasiId ?? p.id,
    partisipasiId: p.partisipasiId ?? p.id,
    nama: p.namaMahasiswa || p.nama || p.mahasiswa?.user?.nama || '-',
    nim: p.nim || p.mahasiswa?.nim || '-',
    prodi: p.programStudi || p.prodi || p.mahasiswa?.prodi?.nama || '-',
    fakultas: p.fakultas || p.mahasiswa?.prodi?.fakultas?.nama || '-',
    hadir,
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
  const [showTambahModal, setShowTambahModal] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [page, setPage] = useState(1)

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

  const handleKehadiranChange = (pesertaId, value) => {
    if (!isEditing) return
    const hadir = value === '' ? null : value === 'true'
    setPesertaData((prev) =>
      prev.map((p) => (p.id === pesertaId || p.partisipasiId === pesertaId ? { ...p, hadir } : p)),
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
      hadir: p.hadir === true ? true : p.hadir === false ? false : null,
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

  const handleBatalEdit = () => {
    setIsEditing(false)
    loadData()
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
      (filterKehadiran === 'hadir' && p.hadir === true) ||
      (filterKehadiran === 'tidak' && p.hadir === false) ||
      (filterKehadiran === 'belum' && p.hadir == null)
    return matchSearch && matchFilter
  })

  const total = pesertaData.length
  const hadir = pesertaData.filter((p) => p.hadir === true).length
  const tidakHadir = pesertaData.filter((p) => p.hadir === false).length

  const PAGE_SIZE = 10
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageItems = filtered.slice(start, start + PAGE_SIZE)

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
          <StatCard label="Total Terdaftar" value={total} />
          <StatCard label="Hadir" value={hadir} />
          <StatCard label="Tidak Hadir" value={tidakHadir} />
        </div>

        <div className="flex items-start gap-2 rounded-xl bg-yellow-50 p-3 text-sm text-yellow-700">
          <Info className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            Centang/pilih kehadiran dan peran boleh dikosongkan dulu. Poin cair otomatis setelah
            Dosen PA menyetujui izin serta kehadiran & peran terverifikasi. Klik <strong>Submit Poin Peserta</strong> untuk menyimpan perubahan.
          </p>
        </div>

        <TableCard title="Daftar Peserta">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 lg:flex-1 lg:flex-row lg:items-center">
              <div className="relative flex w-full flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0a6]" />
                <input
                  type="text"
                  placeholder="Cari NIM atau nama…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-[#d9dce7] bg-white py-2 pl-9 pr-3 text-sm shadow-sm outline-none focus:border-brand-dark"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {['semua', 'hadir', 'tidak', 'belum'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilterKehadiran(f)}
                    className={kehadiranFilterBtnClass(filterKehadiran === f)}
                  >
                    {f === 'semua' ? 'Semua' : f === 'hadir' ? 'Hadir' : f === 'tidak' ? 'Tidak Hadir' : 'Belum'}
                  </button>
                ))}
                {(search || filterKehadiran !== 'semua') && (
                  <button
                    type="button"
                    onClick={() => { setSearch(''); setFilterKehadiran('semua') }}
                    className={pesertaResetFilterBtnClass}
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => downloadTemplatePeserta(id).catch((err) => toast.error('Gagal download template', { description: err.message }))}
                className={pesertaDownloadBtnClass}
              ><Download className="h-4 w-4" /> Unduh Template
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={importing}
                className={pesertaImportBtnClass}
              >{importing ? 'Mengimpor…' : <><UploadCloud className="h-4 w-4" /> Import File</>}
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

          <TambahPesertaModal
            isOpen={showTambahModal}
            kegiatanId={id}
            onClose={() => setShowTambahModal(false)}
            onAdded={loadData}
          />

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
                ) : pageItems.map((p) => (
                    <tr key={p.partisipasiId || p.id} className="divide-x divide-[#e9ebf8] border-b border-[#e9ebf8] last:border-0 hover:bg-[#f9fafb]">
                      <td className="w-16 px-4 py-3 text-center text-black">{p.no}</td>
                      <td className="px-4 py-3 font-medium text-black">{p.nim || '-'}</td>
                      <td className="px-4 py-3 text-black">{p.nama}</td>
                      <td className="px-4 py-3 text-black">{p.prodi}</td>
                      <td className="px-4 py-3 text-center">
                        <select
                          value={p.hadir === true ? 'true' : p.hadir === false ? 'false' : ''}
                          onChange={(e) => handleKehadiranChange(p.partisipasiId || p.id, e.target.value)}
                          disabled={!isEditing}
                          className="rounded-md border border-[#e9ebf8] p-1.5 text-xs text-[#333] outline-none focus:border-brand-dark disabled:cursor-default disabled:bg-[#f9fafb] disabled:text-[#999]"
                        >
                          <option value="">Belum</option>
                          <option value="true">Hadir</option>
                          <option value="false">Tidak Hadir</option>
                        </select>
                      </td>                      <td className="px-4 py-3">
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
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setPage(currentPage - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e9ebf8] text-[#616161] transition hover:bg-[#f0f2ff] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="px-2 text-xs text-[#9aa0a6]">
                      Halaman {currentPage} dari {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setPage(currentPage + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e9ebf8] text-[#616161] transition hover:bg-[#f0f2ff] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTambahModal(true)}
                    className={pesertaTambahBtnClass}
                  ><UserPlus className="h-4 w-4" /> Tambah Peserta
                  </button>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className={pesertaEditBtnClass}
                    >
                      Edit
                    </button>
                  )}
                  {isEditing && (
                    <>
                      <button
                        type="button"
                        onClick={handleBatalEdit}
                        disabled={submitLoading}
                        className={`${pesertaBatalBtnClass} disabled:opacity-60`}
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmitPoin}
                        disabled={submitLoading}
                        className={pesertaSubmitBtnClass}
                      >
                        {submitLoading ? 'Memproses…' : 'Submit Poin Peserta'}
                      </button>
                    </>
                  )}
                </div>
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
