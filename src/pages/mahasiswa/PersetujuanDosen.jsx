import { useState, useEffect, useMemo } from 'react'
import { Search, FileText, UploadCloud, Eye, RefreshCw } from 'lucide-react'
import DataTable from '../../components/dashboard/DataTable'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import Modal from '../../components/ui/Modal'
import { getIzinPAMahasiswa, mintaPersetujuanDosenEksternal, subscribeDataUpdate } from '../../services/pengajuanService'
import { getPeranKegiatan } from '../../services/matriksService'
import { klaimPoin } from '../../services/poinService'
import { getCurrentUser } from '../../services/authService'

function formatTanggal(value) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch {
    return String(value)
  }
}

function normalizeIzinPA(item, i = 0) {
  const kegiatan = typeof item.kegiatan === 'object' && item.kegiatan ? item.kegiatan : {}
  const statusRaw = (item.statusIzin || item.status || 'diajukan').toLowerCase()
  let statusUI = statusRaw
  if (statusRaw === 'diajukan') statusUI = 'pending'
  else if (statusRaw === 'disetujui') statusUI = 'disetujui'
  else if (statusRaw === 'ditolak') statusUI = 'ditolak'
  else if (statusRaw === 'revisi') statusUI = 'revisi'

  return {
    id: item.id ?? i,
    kegiatanId: kegiatan.id || item.kegiatanId || null,
    partisipasiId: item.partisipasiId || null,
    kategoriId: kegiatan.kategoriId || null,
    skalaId: kegiatan.skalaId || null,
    peranId: item.peranId || null,
    sudahDiklaim: item.sudahDiklaim || false,
    // field display
    kegiatan: kegiatan.nama || item.namaKegiatan || item.kegiatan || '-',
    jenis: kegiatan.kategori || item.jenis || '-',
    peran: item.peran || '-',
    penyelenggara: kegiatan.penyelenggara || item.penyelenggara || '-',
    tanggal: formatTanggal(kegiatan.tanggalMulai || item.tanggalDiajukan || item.tanggal),
    status: statusUI,
    alasan: item.alasanDitolak || item.alasan || null,
  }
}

function PersetujuanDosen() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Modal info (alasan/catatan)
  const [infoModal, setInfoModal] = useState(null) // { judul, isi }

  // Modal revisi izin PA
  const [revisiTarget, setRevisiTarget] = useState(null) // row
  const [peranList, setPeranList] = useState([])
  const [peranId, setPeranId] = useState('')
  const [loadingPeran, setLoadingPeran] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Checkbox klaim poin
  const [pilihanMode, setPilihanMode] = useState(false)
  const [selected, setSelected] = useState(new Set()) // set of row.id

  // Modal klaim poin — sekarang setiap kegiatan punya bukti PDF sendiri
  const [showKlaimModal, setShowKlaimModal] = useState(false)
  const [klaimItems, setKlaimItems] = useState([]) // [{id, partisipasiId, peranId, kegiatan, peran, bukti}]
  const [submittingKlaim, setSubmittingKlaim] = useState(false)

  const load = () => {
    setLoading(true)
    getIzinPAMahasiswa()
      .then((res) => {
        const items = Array.isArray(res) ? res : []
        // Deteksi kegiatan yang pernah diajukan ulang: kegiatanId muncul > 1x
        const kegiatanCount = {}
        items.forEach((it) => {
          const kid = it.kegiatan?.id || it.kegiatanId
          if (kid) kegiatanCount[kid] = (kegiatanCount[kid] || 0) + 1
        })
        // Data sudah diurutkan terbaru di atas (orderBy createdAt desc)
        // kegiatanId yang muncul >1x → yang pertama (index 0) = terbaru = "diajukan ulang"
        const seenKid = new Set()
        const normalized = items.map((it, i) => {
          const kid = it.kegiatan?.id || it.kegiatanId
          const isUlang = kid && kegiatanCount[kid] > 1 && !seenKid.has(kid)
          if (kid) seenKid.add(kid)
          return { ...normalizeIzinPA(it, i), no: i + 1, isUlang: !!isUlang }
        })
        setData(normalized)
      })
      .catch((err) => toast.error('Gagal memuat data', { description: err.message }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    return subscribeDataUpdate((detail) => {
      if (!detail?.type || detail.type === 'persetujuan') load()
    })
  }, [])

  // Fetch peran saat modal revisi dibuka
  useEffect(() => {
    if (!revisiTarget?.kategoriId) {
      setPeranList([])
      setPeranId(revisiTarget?.peranId || '')
      return
    }
    setPeranId(revisiTarget.peranId || '')
    setLoadingPeran(true)
    getPeranKegiatan(revisiTarget.kategoriId)
      .then((l) => setPeranList(Array.isArray(l) ? l : []))
      .catch(() => setPeranList([]))
      .finally(() => setLoadingPeran(false))
  }, [revisiTarget])

  const handleOpenRevisi = (row) => {
    setRevisiTarget(row)
  }

  const handleCloseRevisi = () => {
    setRevisiTarget(null)
    setPeranList([])
    setPeranId('')
  }

  const handleSubmitRevisi = async () => {
    if (!peranId) {
      toast.error('Pilih peran terlebih dahulu')
      return
    }
    if (!revisiTarget?.kegiatanId) {
      toast.error('Data kegiatan tidak lengkap')
      return
    }
    setSubmitting(true)
    try {
      await mintaPersetujuanDosenEksternal(revisiTarget.kegiatanId, peranId)
      toast.success('Berhasil diajukan ulang ke Dosen PA!')
      handleCloseRevisi()
      load()
    } catch (err) {
      toast.error('Gagal mengajukan ulang', { description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  // --- Checkbox & Klaim Handlers ---
  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBatalPilih = () => {
    setPilihanMode(false)
    setSelected(new Set())
  }

  const handleOpenKlaimModal = () => {
    if (selected.size === 0) {
      toast.error('Pilih minimal satu kegiatan')
      return
    }
    const selectedRows = data.filter((row) => selected.has(row.id))
    const items = selectedRows.map((row) => ({
      id: row.id,
      partisipasiId: row.partisipasiId,
      kegiatan: row.kegiatan,
      peran: row.peran || '-',
      peranId: row.peranId || '',
      bukti: null,
    }))
    setKlaimItems(items)
    setShowKlaimModal(true)
  }

  const handleKlaimFileChange = (itemId, e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      toast.error('Hanya file PDF yang diizinkan')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10 MB')
      return
    }
    setKlaimItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, bukti: file } : it)))
  }

  const semuaBuktiLengkap = klaimItems.length > 0 && klaimItems.every((it) => !!it.bukti)

  const handleSubmitKlaim = async () => {
    if (!semuaBuktiLengkap) {
      toast.error('Upload bukti PDF untuk setiap kegiatan terlebih dahulu')
      return
    }
    setSubmittingKlaim(true)
    let berhasil = 0
    let gagal = 0
    try {
      for (const item of klaimItems) {
        try {
          await klaimPoin({
            partisipasiId: item.partisipasiId,
            peranUsulanId: item.peranId,
            bukti: item.bukti,
          })
          berhasil++
        } catch {
          gagal++
        }
      }
      if (berhasil > 0) {
        toast.success(`${berhasil} klaim poin berhasil diajukan ke Admin Ditmawa!`)
      }
      if (gagal > 0) {
        toast.error(`${gagal} klaim gagal diajukan (mungkin sudah pernah diklaim).`)
      }
      setShowKlaimModal(false)
      setSelected(new Set())
      setPilihanMode(false)
      load()
    } finally {
      setSubmittingKlaim(false)
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.filter((row) => {
      if (filterStatus && row.status !== filterStatus) return false
      if (!q) return true
      return (
        row.kegiatan.toLowerCase().includes(q) ||
        row.penyelenggara.toLowerCase().includes(q) ||
        row.jenis.toLowerCase().includes(q)
      )
    })
  }, [data, search, filterStatus])

  const statusOptions = [
    { value: 'pending', label: 'Menunggu' },
    { value: 'disetujui', label: 'Disetujui' },
    { value: 'ditolak', label: 'Ditolak' },
    { value: 'revisi', label: 'Revisi' },
  ]

  return (
    <DashboardLayout role="mahasiswa" userName={user?.nama || 'Mahasiswa'} userRole="Mahasiswa">
      {/* Modal info catatan/alasan */}
      <Modal isOpen={!!infoModal} onClose={() => setInfoModal(null)}>
        <div className="space-y-3">
          <h3 className="text-base font-bold text-[#333]">{infoModal?.judul}</h3>
          <p className="text-sm text-[#616161] whitespace-pre-wrap">{infoModal?.isi || 'Tidak ada keterangan.'}</p>
          <button
            type="button"
            onClick={() => setInfoModal(null)}
            className="w-full rounded-xl border border-[#d9dce7] py-2.5 text-sm font-semibold text-[#333] hover:bg-[#f5f6f8]"
          >
            Tutup
          </button>
        </div>
      </Modal>

      {/* Modal klaim poin — upload bukti PDF per kegiatan */}
      <Modal isOpen={showKlaimModal} onClose={() => !submittingKlaim && setShowKlaimModal(false)} size="md">
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#333]">Ajukan Klaim Poin Capaian</h3>
            <p className="mt-0.5 text-sm text-[#616161]">
              Upload bukti PDF untuk masing-masing kegiatan yang dipilih. Kegiatan tanpa bukti tidak dapat diklaim.
            </p>
          </div>

          {/* Daftar kegiatan yang diklaim, masing-masing dengan upload bukti sendiri */}
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {klaimItems.map((item) => (
              <div key={item.id} className={`rounded-lg border p-3 ${item.bukti ? 'border-green-200 bg-green-50/40' : 'border-[#e9ebf8] bg-[#f9fafb]'}`}>
                <p className="text-sm font-medium text-[#333]">{item.kegiatan}</p>
                <p className="text-xs text-[#616161] mt-0.5">Peran: <span className="font-medium text-brand-dark">{item.peran}</span></p>

                <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-[#d1d5db] bg-white px-3 py-2 transition hover:border-brand-dark hover:bg-green-50">
                  {item.bukti ? (
                    <FileText className="h-4 w-4 shrink-0 text-brand-dark" />
                  ) : (
                    <UploadCloud className="h-4 w-4 shrink-0 text-[#9aa0a6]" />
                  )}
                  <span className={`truncate text-xs ${item.bukti ? 'font-semibold text-brand-dark' : 'text-[#888]'}`}>
                    {item.bukti ? item.bukti.name : 'Klik untuk upload bukti PDF (maks 10 MB)'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={(e) => handleKlaimFileChange(item.id, e)}
                  />
                </label>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              disabled={submittingKlaim || !semuaBuktiLengkap}
              onClick={handleSubmitKlaim}
              className="flex-1 rounded-xl bg-gradient-to-r from-brand-dark to-brand-light py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submittingKlaim ? 'Mengirim…' : 'Ajukan Klaim Poin'}
            </button>
            <button
              type="button"
              disabled={submittingKlaim}
              onClick={() => setShowKlaimModal(false)}
              className="flex-1 rounded-xl border border-[#d9dce7] py-2.5 text-sm font-semibold text-[#333] hover:bg-[#f5f6f8]"
            >
              Batal
            </button>
          </div>
          {klaimItems.length > 0 && !semuaBuktiLengkap && (
            <p className="text-xs text-[#9aa0a6]">Lengkapi bukti dokumen untuk semua kegiatan sebelum dapat diajukan.</p>
          )}
        </div>
      </Modal>

      {/* Modal revisi izin PA — hanya ganti peran, data kegiatan tidak berubah */}
      <Modal isOpen={!!revisiTarget} onClose={handleCloseRevisi} size="md">
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#333]">Ajukan Ulang ke Dosen PA</h3>
            <p className="mt-0.5 text-sm text-[#616161]">
              Kegiatan: <span className="font-medium">{revisiTarget?.kegiatan}</span>
            </p>
          </div>

          {revisiTarget?.alasan && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
              <p className="text-xs font-semibold text-yellow-700 mb-1">Catatan Revisi Dosen PA</p>
              <p className="text-sm text-yellow-800 whitespace-pre-wrap">{revisiTarget.alasan}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#333] mb-1">
              Peran / Pencapaian<span className="text-red-500">*</span>
            </label>
            {loadingPeran ? (
              <p className="text-sm text-[#9aa0a6]">Memuat pilihan peran…</p>
            ) : peranList.length === 0 ? (
              <p className="text-sm text-red-400">Peran tidak tersedia untuk kategori ini.</p>
            ) : (
              <select
                value={peranId}
                onChange={(e) => setPeranId(e.target.value)}
                className="block w-full rounded-lg border border-[#e9ebf8] p-2.5 text-sm text-[#333] focus:border-brand-dark"
              >
                <option value="">Pilih peran</option>
                {peranList.map((p) => (
                  <option key={p.id} value={p.id}>{p.nama || p.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              disabled={submitting || !peranId}
              onClick={handleSubmitRevisi}
              className="flex-1 rounded-xl bg-gradient-to-r from-brand-dark to-brand-light py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? 'Mengirim…' : 'Ajukan Ulang'}
            </button>
            <button
              type="button"
              onClick={handleCloseRevisi}
              className="flex-1 rounded-xl border border-[#d9dce7] py-2.5 text-sm font-semibold text-[#333] hover:bg-[#f5f6f8]"
            >
              Batal
            </button>
          </div>
        </div>
      </Modal>

      <div className="space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-xl font-bold text-brand-dark sm:text-2xl">Persetujuan Dosen PA</h2>
          <p className="mt-1 text-sm text-[#616161]">
            Daftar permintaan izin kegiatan yang sudah dikirim ke Dosen Pembimbing Akademik.
          </p>
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-3 sm:p-6 shadow-sm">
          <h3 className="text-base font-bold text-brand-dark sm:text-lg">
            Kegiatan yang telah diajukan ke Dosen PA
          </h3>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#e9ebf8] px-4 py-2">
              <Search className="h-4 w-4 text-[#616161]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kegiatan..."
                className="flex-1 text-sm outline-none"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-[#e9ebf8] px-3 py-2 text-sm text-[#333] outline-none"
            >
              <option value="">Semua Status</option>
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            {(search || filterStatus) && (
              <button
                type="button"
                onClick={() => { setSearch(''); setFilterStatus('') }}
                className="text-xs font-medium text-[#616161] hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          <div className="mt-4">
            <DataTable
              columns={[
                { key: 'no', label: 'No' },
                { key: 'kegiatan', label: 'Kegiatan' },
                { key: 'jenis', label: 'Jenis' },
                { key: 'peran', label: 'Peran' },
                { key: 'penyelenggara', label: 'Penyelenggara' },
                { key: 'tanggal', label: 'Tanggal' },
                {
                  key: 'status',
                  label: 'Status',
                  render: (row) =>
                    row.isUlang && row.status === 'pending' ? (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        Diajukan Ulang
                      </span>
                    ) : (
                      <StatusBadge status={row.status} />
                    ),
                },
                {
                  key: 'keterangan',
                  label: 'Keterangan',
                  stopPropagation: true,
                  render: (row) => (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        title="Detail"
                        onClick={() => navigate(`/mahasiswa/persetujuan-dosen/${row.id}`, { state: { row } })}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-400 bg-blue-50 text-blue-600 transition hover:bg-blue-500 hover:text-white"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Ajukan Ulang"
                        disabled={row.status !== 'revisi'}
                        onClick={() => handleOpenRevisi(row)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-400 bg-amber-50 text-amber-600 transition hover:bg-amber-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      {row.status === 'disetujui' && (
                        row.sudahDiklaim
                          ? <span className="text-xs font-medium text-brand-dark">Klaim diajukan ✓</span>
                          : <span className="text-xs font-medium text-green-600">Disetujui Dosen PA ✓</span>
                      )}
                    </div>
                  ),
                },
              ]}
              data={filtered}
              loading={loading}
              emptyText={data.length === 0 ? 'Belum ada permintaan izin ke Dosen PA.' : 'Tidak ada data yang sesuai filter.'}
              selectable={pilihanMode}
              selected={selected}
              onSelect={toggleSelect}
              isSelectable={(row) => row.status === 'disetujui' && !row.sudahDiklaim}
            />
          </div>

          {/* Tombol klaim poin — di bawah tabel */}
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#e9ebf8] pt-4">
            {pilihanMode ? (
              <>
                <span className="text-sm text-[#616161]">{selected.size} kegiatan dipilih</span>
                <div className="ml-auto flex gap-2">
                  <button
                    type="button"
                    onClick={handleBatalPilih}
                    className="rounded-lg border border-[#d9dce7] px-4 py-2 text-sm font-semibold text-[#616161] hover:bg-[#f5f6f8]"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenKlaimModal}
                    disabled={selected.size === 0}
                    className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-6 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
                  >
                    Klaim Poin Capaian
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setPilihanMode(true)}
                className="ml-auto rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                Klaim Poin Capaian
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PersetujuanDosen
