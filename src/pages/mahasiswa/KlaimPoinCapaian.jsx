import { useEffect, useMemo, useState } from 'react'
import { Search, FileText, UploadCloud } from 'lucide-react'
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

const riwayatColumns = [
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
  }
}

function mapSiapKlaim(item, i) {
  const kegiatan = typeof item.kegiatan === 'object' && item.kegiatan ? item.kegiatan : {}
  return {
    no: i + 1,
    id: item.id ?? i,
    partisipasiId: item.partisipasiId || null,
    peranId: item.peranId || null,
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

  const handleBatalPilih = () => {
    setPilihanMode(false)
    setSelected(new Set())
  }

  const handleOpenKlaimModal = () => {
    if (selected.size === 0) {
      toast.error('Pilih minimal satu kegiatan')
      return
    }
    const selectedRows = siapKlaim.filter((row) => selected.has(row.id))
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
            <h3 className="text-base font-bold text-[#333]">Ajukan Klaim Poin Capaian</h3>
            <p className="mt-0.5 text-sm text-[#616161]">
              Upload bukti PDF untuk masing-masing kegiatan yang dipilih. Kegiatan tanpa bukti tidak dapat diklaim.
            </p>
          </div>

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

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-[#222] sm:text-2xl">Klaim Poin Capaian</h2>
          <p className="mt-1 text-sm text-[#616161]">
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
              isSelectable={() => true}
              onRowClick={pilihanMode ? (row) => toggleSelect(row.id) : undefined}
            />
          </TableFrame>

          {!loading && siapKlaim.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 border-t border-[#e9ebf8] pt-4">
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
          )}
        </TableCard>

        <TableCard title="Riwayat Klaim Poin Anda">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative flex w-full sm:flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0a6]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kegiatan..."
                className="w-full rounded-lg border border-[#d9dce7] py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-dark"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-[#d9dce7] px-3 py-2 text-sm text-[#444] outline-none"
              >
                <option value="">Semua Status</option>
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <select
                value={filterSkala}
                onChange={(e) => setFilterSkala(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-[#d9dce7] px-3 py-2 text-sm text-[#444] outline-none"
              >
                <option value="">Semua Skala</option>
                {skalaOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {(search || filterStatus || filterSkala) && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setFilterStatus(''); setFilterSkala('') }}
                  className="rounded-lg border border-brand-dark bg-white px-3 py-2 text-sm font-medium text-brand-dark transition hover:bg-[#f5f5f5]"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>
          <TableFrame>
            <DataTable columns={riwayatColumns} data={filteredRiwayat} loading={loading} />
          </TableFrame>
        </TableCard>
      </div>
    </DashboardLayout>
  )
}

export default KlaimPoinCapaian
