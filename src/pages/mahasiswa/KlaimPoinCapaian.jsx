import { useEffect, useMemo, useState } from 'react'
import { Search, FileText, UploadCloud, X, Loader2 } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import StatusBadge from '../../components/dashboard/StatusBadge'
import KegiatanCell from '../../components/dashboard/KegiatanCell'
import Modal from '../../components/ui/Modal'
import { toast } from 'sonner'
import { getCurrentUser } from '../../services/authService'
import { statusOptionsFromRows } from '../../utils/statusFilter'
import { getKlaim, klaimPoin } from '../../services/poinService'
import { getIzinPAMahasiswa, subscribeDataUpdate } from '../../services/pengajuanService'
import { getPeranKegiatan } from '../../services/matriksService'

const riwayatColumns = [
  { key: 'no', label: 'NO' },
  {
    key: 'kegiatan',
    label: 'KEGIATAN',
    render: (row) => (
      <div className="flex flex-col gap-1">
        <KegiatanCell nama={row.kegiatan} tanggal={row.diajukanPada} />
        {row.isIku3 ? (
          <span className="badge badge-success badge-sm h-auto w-fit shrink-0 whitespace-nowrap">
            Diakui IKU 3
          </span>
        ) : null}
      </div>
    ),
  },
  { key: 'jenis', label: 'JENIS' },
  { key: 'peran', label: 'PERAN' },
  { key: 'penyelenggara', label: 'PENYELENGGARA' },
  { key: 'tanggal', label: 'TANGGAL' },
  { key: 'skala', label: 'SKALA' },
  { key: 'status', label: 'STATUS', render: (row) => <StatusBadge status={row.status} /> },
]

const siapKlaimColumns = [
  { key: 'no', label: 'NO' },
  {
    key: 'kegiatan',
    label: 'KEGIATAN',
    render: (row) => <KegiatanCell nama={row.kegiatan} tanggal={row.diajukanPada} />,
  },
  { key: 'jenis', label: 'JENIS' },
  { key: 'peran', label: 'PERAN' },
  { key: 'penyelenggara', label: 'PENYELENGGARA' },
  { key: 'tanggal', label: 'TANGGAL' },
  { key: 'skala', label: 'SKALA' },
  {
    key: 'status',
    label: 'STATUS',
    render: () => <StatusBadge status="belum_diklaim" />,
  },
]

function formatDate(val) {
  if (!val) return ''
  try {
    const d = new Date(val)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return ''
  }
}

function mapRiwayat(item, i) {
  const raw = String(item.status || 'pending').toLowerCase()
  // Setelah klaim diajukan, tunggu admin Ditmawa → tampil Pending
  const status =
    raw === 'menunggu_validasi' || raw === 'menunggu' || raw === 'diajukan'
      ? 'pending'
      : raw
  return {
    no: i + 1,
    id: item.id,
    kegiatan: item.namaKegiatan || item.kegiatan || '-',
    diajukanPada: formatDate(item.tanggalKlaim),
    jenis: item.jenisKegiatan || item.jenis || '-',
    peran: item.peran || '-',
    penyelenggara: item.penyelenggara || '-',
    tanggal: formatDate(item.tanggalPelaksanaan) || formatDate(item.tanggal) || '-',
    skala: item.skala || '-',
    status,
    alasan: item.alasan || null,
    isIku3: Boolean(item.isIku3),
    estimasiBobotIku3: item.estimasiBobotIku3,
    badgeIku3: item.badgeIku3 || null,
  }
}

function isPrestasiNasionalJuara(skala, peran) {
  const s = String(skala || '').toLowerCase()
  const p = String(peran || '').toLowerCase()
  return s.includes('nasional') && (p.includes('juara 1') || p.includes('juara i'))
}

function mapSiapKlaim(item, i) {
  const kegiatan = typeof item.kegiatan === 'object' && item.kegiatan ? item.kegiatan : {}
  return {
    no: i + 1,
    id: item.id ?? i,
    partisipasiId: item.partisipasiId || null,
    kegiatanId: kegiatan.id || item.kegiatanId || null,
    kategoriId: kegiatan.kategoriId || item.kategoriId || null,
    peranId: item.peranId ? String(item.peranId) : '',
    kegiatan: kegiatan.nama || item.namaKegiatan || item.kegiatan || '-',
    diajukanPada: formatDate(item.tanggalDiajukan || item.createdAt || item.dibuatPada),
    jenis: kegiatan.kategori || item.jenis || '-',
    peran: item.peran || '-',
    penyelenggara: kegiatan.penyelenggara || item.penyelenggara || '-',
    tanggal: formatDate(kegiatan.tanggalMulai || item.tanggalDiajukan || item.tanggal) || '-',
    skala: kegiatan.skala?.nama || item.skala || '-',
  }
}

function KlaimPoinCapaian() {
  const user = getCurrentUser()
  const [riwayat, setRiwayat] = useState([])
  const [siapKlaim, setSiapKlaim] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSkala, setFilterSkala] = useState('')

  const [pilihanMode, setPilihanMode] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [showKlaimModal, setShowKlaimModal] = useState(false)
  const [klaimItems, setKlaimItems] = useState([])
  const [submittingKlaim, setSubmittingKlaim] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([getKlaim(), getIzinPAMahasiswa()])
      .then(([klaimRes, izinRes]) => {
        const klaimItemsArr = Array.isArray(klaimRes) ? klaimRes : []
        const izinItems = Array.isArray(izinRes) ? izinRes : []

        setRiwayat(klaimItemsArr.map(mapRiwayat))

        const siap = izinItems
          .filter((item) => {
            const statusRaw = (item.statusIzin || item.status || '').toLowerCase()
            return statusRaw === 'disetujui' && !item.sudahDiklaim
          })
          .map(mapSiapKlaim)
          .map((row, i) => ({ ...row, no: i + 1 }))

        setSiapKlaim(siap)
        setSelected(new Set())
      })
      .catch(() => {
        setRiwayat([])
        setSiapKlaim([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    return subscribeDataUpdate((detail) => {
      if (!detail?.type || detail.type === 'persetujuan' || detail.type === 'klaim') load()
    })
  }, [])

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelectAll = () => {
    const ids = siapKlaim.map((r) => r.id).filter(Boolean)
    const allOn = ids.length > 0 && ids.every((id) => selected.has(id))
    setSelected(allOn ? new Set() : new Set(ids))
  }

  const handleBatalPilih = () => {
    setPilihanMode(false)
    setSelected(new Set())
  }

  const handleOpenKlaimModal = async () => {
    if (selected.size === 0) {
      toast.error('Pilih minimal satu kegiatan')
      return
    }
    const selectedRows = siapKlaim.filter((row) => selected.has(row.id))
    const items = selectedRows.map((row) => ({
      id: row.id,
      partisipasiId: row.partisipasiId,
      kegiatanId: row.kegiatanId,
      kategoriId: row.kategoriId,
      kegiatan: row.kegiatan,
      peran: row.peran || '-',
      peranId: row.peranId ? String(row.peranId) : '',
      skala: row.skala || '-',
      bukti: null,
      buktiError: null,
      peranList: [],
      loadingPeran: true,
    }))
    setKlaimItems(items)
    setShowKlaimModal(true)

    // Ambil daftar peran berdasarkan kategoriId untuk masing-masing kegiatan
    const cacheKat = {}
    const updated = await Promise.all(
      items.map(async (it) => {
        if (!it.kategoriId) {
          return { ...it, loadingPeran: false }
        }
        if (!(it.kategoriId in cacheKat)) {
          try {
            const list = await getPeranKegiatan(it.kategoriId)
            cacheKat[it.kategoriId] = Array.isArray(list) ? list : []
          } catch {
            cacheKat[it.kategoriId] = []
          }
        }
        const peranList = cacheKat[it.kategoriId] || []
        let peranId = it.peranId
        // Jika belum ada peranId tapi ada peran nama bukan '-', cari kecocokannya
        if (!peranId && it.peran && it.peran !== '-') {
          const matched = peranList.find(
            (p) => p.nama.toLowerCase().trim() === it.peran.toLowerCase().trim()
          )
          if (matched) peranId = String(matched.id)
        }
        let peranNama = it.peran
        if (peranId) {
          const matched = peranList.find((p) => String(p.id) === String(peranId))
          if (matched) peranNama = matched.nama
        }
        return {
          ...it,
          peranList,
          peranId: peranId || '',
          peran: peranNama,
          loadingPeran: false,
        }
      })
    )
    setKlaimItems(updated)
  }

  const handlePeranChange = (itemId, newPeranId) => {
    setKlaimItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it
        const matched = it.peranList.find((p) => String(p.id) === String(newPeranId))
        return {
          ...it,
          peranId: newPeranId,
          peran: matched ? matched.nama : '-',
        }
      })
    )
  }

  const handleKlaimFileChange = (itemId, e) => {
    const input = e.target
    const file = input.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      input.value = ''
      toast.warning('Format tidak didukung', {
        description: 'Bukti harus berupa file PDF.',
      })
      setKlaimItems((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, bukti: null, buktiError: 'Hanya file PDF yang diizinkan.' } : it)),
      )
      return
    }
    if (file.size > 1 * 1024 * 1024) {
      input.value = ''
      toast.warning('Ukuran file terlalu besar', {
        description: 'Maksimal ukuran bukti PDF adalah 1 MB. Kompres file lalu unggah ulang.',
      })
      setKlaimItems((prev) =>
        prev.map((it) => (
          it.id === itemId
            ? { ...it, bukti: null, buktiError: 'File melebihi 1 MB. Unggah ulang dengan ukuran maksimal 1 MB.' }
            : it
        )),
      )
      return
    }
    setKlaimItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, bukti: file, buktiError: null } : it)),
    )
  }

  const handleClearBukti = (itemId) => {
    setKlaimItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, bukti: null, buktiError: null } : it)),
    )
  }

  const semuaPeranDipilih = klaimItems.length > 0 && klaimItems.every((it) => !!it.peranId)
  const semuaBuktiLengkap = klaimItems.length > 0 && klaimItems.every((it) => !!it.bukti)
  const formKlaimSiap = semuaPeranDipilih && semuaBuktiLengkap

  const handleSubmitKlaim = async () => {
    for (const item of klaimItems) {
      if (!item.peranId) {
        toast.error(`Pilih peran capaian untuk kegiatan "${item.kegiatan}" terlebih dahulu`)
        return
      }
      if (!item.bukti) {
        toast.error(`Upload bukti PDF untuk kegiatan "${item.kegiatan}" terlebih dahulu`)
        return
      }
    }

    setSubmittingKlaim(true)
    let berhasil = 0
    let gagal = 0
    const pesanError = []
    try {
      for (const item of klaimItems) {
        try {
          await klaimPoin({
            partisipasiId: item.partisipasiId,
            peranUsulanId: item.peranId,
            bukti: item.bukti,
          })
          berhasil++
        } catch (err) {
          gagal++
          const msg =
            err?.message ||
            err?.data?.message ||
            (typeof err === 'string' ? err : 'Gagal mengajukan klaim')
          if (!pesanError.includes(msg)) {
            pesanError.push(msg)
          }
        }
      }
      if (berhasil > 0) {
        toast.success(`${berhasil} klaim poin berhasil diajukan ke Admin Ditmawa!`)
      }
      if (gagal > 0) {
        const detailError = pesanError.length > 0 ? `: ${pesanError.join(', ')}` : ''
        toast.error(`${gagal} klaim gagal diajukan${detailError}`)
      }
      setShowKlaimModal(false)
      setSelected(new Set())
      setPilihanMode(false)
      load()
    } finally {
      setSubmittingKlaim(false)
    }
  }

  const filteredRiwayat = useMemo(() => {
    const q = search.trim().toLowerCase()
    return riwayat.filter((row) => {
      if (filterStatus && row.status !== filterStatus) return false
      if (filterSkala && row.skala !== filterSkala) return false
      if (!q) return true
      return (
        row.kegiatan.toLowerCase().includes(q) ||
        row.penyelenggara.toLowerCase().includes(q) ||
        row.jenis.toLowerCase().includes(q)
      )
    })
  }, [riwayat, search, filterStatus, filterSkala])

  const statusOptions = useMemo(
    () => statusOptionsFromRows(riwayat, 'status'),
    [riwayat],
  )

  const skalaOptions = useMemo(() => {
    return [...new Set(riwayat.map((r) => r.skala).filter((s) => s && s !== '-'))].sort()
  }, [riwayat])

  return (
    <DashboardLayout
      role="mahasiswa"
      userName={user?.nama || user?.name || 'Mahasiswa'}
      userRole="Mahasiswa"
    >
      <Modal isOpen={showKlaimModal} onClose={() => !submittingKlaim && setShowKlaimModal(false)} size="md">
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-base-content">Ajukan Klaim Poin Capaian</h3>
            <p className="mt-0.5 text-sm text-base-content/60">
              Pilih peran capaian dan unggah bukti PDF untuk masing-masing kegiatan yang dipilih.
            </p>
          </div>

          {klaimItems.some((item) => isPrestasiNasionalJuara(item.skala, item.peran)) ? (
            <div className="alert alert-info">
              <span className="text-sm">
                Prestasi juara 1 skala nasional berpotensi diakui sebagai kontributor IKU 3 (estimasi bobot 0,60).
              </span>
            </div>
          ) : null}

          <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
            {klaimItems.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl border p-3.5 transition-all ${
                  item.bukti && item.peranId
                    ? 'border-green-200 bg-green-50/40'
                    : item.buktiError || !item.peranId
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-base-300 bg-base-200/60'
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-base-content">{item.kegiatan}</p>
                  <p className="text-xs text-base-content/60 mt-0.5">
                    Skala: <span className="font-medium text-base-content">{item.skala}</span>
                  </p>
                </div>

                {/* Dropdown Pilihan Peran Capaian */}
                <div className="mt-2.5">
                  <label className="block text-xs font-semibold text-base-content mb-1">
                    Peran Capaian <span className="text-error">*</span>
                  </label>
                  {item.loadingPeran ? (
                    <div className="flex items-center gap-2 py-2 px-3 rounded-lg border border-base-300 bg-base-100 text-xs text-base-content/60">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span>Memuat opsi peran...</span>
                    </div>
                  ) : item.peranList && item.peranList.length > 0 ? (
                    <select
                      value={item.peranId || ''}
                      onChange={(e) => handlePeranChange(item.id, e.target.value)}
                      className={`select select-sm w-full rounded-lg border text-xs ${
                        !item.peranId ? 'border-amber-400 bg-amber-50/40 font-medium' : 'border-base-300 bg-base-100'
                      }`}
                    >
                      <option value="">-- Pilih Peran Capaian Anda --</option>
                      {item.peranList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nama}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="py-1.5 px-3 rounded-lg border border-base-300 bg-base-100 text-xs text-base-content font-medium">
                      {item.peran && item.peran !== '-' ? item.peran : 'Peserta'}
                    </div>
                  )}
                  {!item.peranId && !item.loadingPeran && item.peranList.length > 0 && (
                    <p className="text-[11px] text-amber-600 mt-1 font-medium">
                      ⚠️ Wajib pilih peran capaian untuk kegiatan ini.
                    </p>
                  )}
                </div>

                {/* Upload Bukti PDF */}
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-base-content mb-1">
                    Bukti Dokumen (PDF) <span className="text-error">*</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <label
                      className={`flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed bg-base-100 px-3 py-2 transition ${
                        item.buktiError
                          ? 'border-error/50 hover:border-error'
                          : 'border-base-300 hover:border-primary hover:bg-base-200'
                      }`}
                    >
                      {item.bukti ? (
                        <FileText className="h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <UploadCloud
                          className={`h-4 w-4 shrink-0 ${item.buktiError ? 'text-error' : 'text-base-content/50'}`}
                        />
                      )}
                      <span
                        className={`truncate text-xs ${
                          item.bukti
                            ? 'font-semibold text-base-content'
                            : item.buktiError
                            ? 'text-error'
                            : 'text-base-content/50'
                        }`}
                      >
                        {item.bukti ? item.bukti.name : 'Klik untuk upload bukti PDF (maks 1 MB)'}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf"
                        onChange={(e) => handleKlaimFileChange(item.id, e)}
                      />
                    </label>
                    {item.bukti ? (
                      <button
                        type="button"
                        onClick={() => handleClearBukti(item.id)}
                        disabled={submittingKlaim}
                        className="btn btn-ghost btn-xs btn-circle shrink-0 text-base-content/50 hover:bg-error/10 hover:text-error"
                        title="Hapus file"
                        aria-label="Hapus file bukti"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                  {item.buktiError ? (
                    <p className="mt-1.5 text-xs text-error font-medium">{item.buktiError}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              disabled={submittingKlaim || !formKlaimSiap}
              onClick={handleSubmitKlaim}
              className="btn btn-primary flex-1 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submittingKlaim ? 'Mengirim...' : 'Ajukan Klaim Poin'}
            </button>
            <button
              type="button"
              disabled={submittingKlaim}
              onClick={() => setShowKlaimModal(false)}
              className="flex-1 rounded-xl border border-base-300 py-2.5 text-sm font-semibold text-base-content hover:bg-base-200"
            >
              Batal
            </button>
          </div>
          {klaimItems.length > 0 && !formKlaimSiap && (
            <p className="text-xs text-amber-600 text-center font-medium">
              {!semuaPeranDipilih
                ? 'Pilih peran capaian untuk semua kegiatan sebelum dapat diajukan.'
                : 'Lengkapi bukti dokumen PDF untuk semua kegiatan sebelum dapat diajukan.'}
            </p>
          )}
        </div>
      </Modal>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-base-content sm:text-2xl">Klaim Poin Capaian</h2>
          <p className="mt-1 text-sm text-base-content/60">
            Klaim poin untuk kegiatan eksternal yang sudah disetujui Dosen PA, lalu pantau riwayat klaim Anda.
          </p>
        </div>

        <TableCard title="Kegiatan yang Belum Diklaim">
          <TableFrame>
            <DataTable
              columns={siapKlaimColumns}
              data={siapKlaim}
              loading={loading}
              emptyText="Belum ada kegiatan yang siap diklaim. Kegiatan harus sudah disetujui Dosen PA."
              selectable={pilihanMode}
              selected={selected}
              onSelect={toggleSelect}
              onSelectAll={handleSelectAll}
              isSelectable={() => true}
              onRowClick={pilihanMode ? (row) => toggleSelect(row.id) : undefined}
            />
          </TableFrame>

          {!loading && siapKlaim.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 border-t border-base-300 pt-4">
              {pilihanMode ? (
                <>
                  <span className="text-sm text-base-content/60">{selected.size} kegiatan dipilih</span>
                  <div className="ml-auto flex gap-2">
                    <button
                      type="button"
                      onClick={handleBatalPilih}
                      className="btn btn-ghost btn-sm"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenKlaimModal}
                      disabled={selected.size === 0}
                      className="btn btn-primary btn-sm"
                    >
                      Klaim Poin Capaian
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setPilihanMode(true)}
                  className="btn btn-primary btn-sm ml-auto"
                >
                  Klaim Poin Capaian
                </button>
              )}
            </div>
          )}
        </TableCard>

        <TableCard title="Riwayat Klaim Poin Anda">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative flex w-full sm:flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/50" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kegiatan..."
                className="input w-full"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-base-300 px-3 py-2 text-sm text-base-content/80 outline-none"
              >
                <option value="">Semua Status</option>
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <select
                value={filterSkala}
                onChange={(e) => setFilterSkala(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-base-300 px-3 py-2 text-sm text-base-content/80 outline-none"
              >
                <option value="">Semua Skala</option>
                {skalaOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <TableFrame>
            <DataTable
              columns={riwayatColumns}
              data={filteredRiwayat}
              loading={loading}
              emptyText="Belum ada riwayat klaim poin."
            />
          </TableFrame>
        </TableCard>
      </div>
    </DashboardLayout>
  )
}

export default KlaimPoinCapaian
