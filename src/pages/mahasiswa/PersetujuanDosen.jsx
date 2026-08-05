import { useState, useEffect, useMemo } from 'react'
import { Search, FileText, UploadCloud, Eye, Pencil, RefreshCw } from 'lucide-react'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import KegiatanCell from '../../components/dashboard/KegiatanCell'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import Modal from '../../components/ui/Modal'
import ActionMenu from '../../components/ui/ActionMenu'
import { getIzinPAMahasiswa, mintaPersetujuanDosenEksternal, subscribeDataUpdate } from '../../services/pengajuanService'
import { getPeranKegiatan } from '../../services/matriksService'
import { klaimPoin } from '../../services/poinService'
import { getCurrentUser } from '../../services/authService'
import { statusOptionsFromRows } from '../../utils/statusFilter'

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
    diajukanPada: formatTanggal(item.tanggalDiajukan || item.createdAt || item.dibuatPada),
    jenis: kegiatan.kategori || item.jenis || '-',
    peran: item.peran || '-',
    penyelenggara: kegiatan.penyelenggara || item.penyelenggara || '-',
    tanggal: formatTanggal(kegiatan.tanggalMulai || item.tanggalDiajukan || item.tanggal),
    skala: kegiatan.skala?.nama || item.skala || '-',
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
  const [filterSkala, setFilterSkala] = useState('')

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
      if (filterSkala && row.skala !== filterSkala) return false
      if (!q) return true
      return (
        row.kegiatan.toLowerCase().includes(q) ||
        row.penyelenggara.toLowerCase().includes(q) ||
        row.jenis.toLowerCase().includes(q)
      )
    })
  }, [data, search, filterStatus, filterSkala])

  const statusOptions = useMemo(
    () => statusOptionsFromRows(data, 'status'),
    [data],
  )

  const skalaOptions = useMemo(() => {
    return [...new Set(data.map((r) => r.skala).filter((s) => s && s !== '-'))].sort()
  }, [data])

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
          <h2 className="text-xl font-bold text-[#222] sm:text-2xl">Persetujuan Dosen PA</h2>
          <p className="mt-1 text-sm text-[#616161]">
            Daftar permintaan izin kegiatan yang sudah dikirim ke Dosen Pembimbing Akademik.
          </p>
        </div>

        <TableCard title="Persetujuan Dosen PA">
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
                className="rounded-lg border border-[#d9dce7] px-3 py-2 text-sm text-[#444] outline-none"
              >
                <option value="">Semua Status</option>
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>

              <select
                value={filterSkala}
                onChange={(e) => setFilterSkala(e.target.value)}
                className="rounded-lg border border-[#d9dce7] px-3 py-2 text-sm text-[#444] outline-none"
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
            <DataTable
              columns={[
                { key: 'no', label: 'No' },
                { key: 'kegiatan', label: 'Kegiatan', render: (row) => <KegiatanCell nama={row.kegiatan} tanggal={row.diajukanPada} /> },
                { key: 'jenis', label: 'Jenis' },
                { key: 'peran', label: 'Peran' },
                { key: 'skala', label: 'Skala' },
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
                  key: 'aksi',
                  label: 'Aksi',
                  stopPropagation: true,
                  render: (row) => (
                    <ActionMenu
                      items={[
                        {
                          label: 'Detail',
                          icon: <Eye className="h-4 w-4" />,
                          color: 'text-blue-600',
                          onClick: () => navigate(`/mahasiswa/persetujuan-dosen/${row.id}`, { state: { row } }),
                        },
                        {
                          label: 'Edit',
                          icon: <Pencil className="h-4 w-4" />,
                          color: 'text-yellow-600',
                          disabled: row.status !== 'revisi',
                          onClick: () => handleOpenRevisi(row),
                        },
                        {
                          label: 'Ajukan Ulang',
                          icon: <RefreshCw className="h-4 w-4" />,
                          color: 'text-amber-600',
                          disabled: row.status !== 'revisi',
                          onClick: () => handleOpenRevisi(row),
                        },
                      ]}
                    />
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
          </TableFrame>

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
        </TableCard>
      </div>
    </DashboardLayout>
  )
}

export default PersetujuanDosen
