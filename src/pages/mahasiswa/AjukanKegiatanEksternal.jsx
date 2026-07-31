import { useEffect, useMemo, useState } from 'react'
import { PlusCircle, Search, Filter, UserCheck, Pencil, Trash2, RefreshCw, Eye } from 'lucide-react'
import DataTable from '../../components/dashboard/DataTable'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { getPengajuan, mintaPersetujuanDosenEksternal, hapusDraftKegiatanEksternal, subscribeDataUpdate } from '../../services/pengajuanService'
import { getPeranKegiatan } from '../../services/matriksService'
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

function mapPengajuanRows(items) {
  return items.map((item, i) => {
    // BE kembalikan 'Draft','Pending','Diteruskan','Disetujui','Ditolak','Revisi'
    // normalizePengajuanMahasiswa sudah .toLowerCase() → 'disetujui', dst.
    // Tapi kalau datang langsung dari BE (bypass normalize), tangani juga Title Case
    const statusNorm = (item.status || 'pending').toLowerCase()
    let statusRaw
    if (statusNorm === 'draft') statusRaw = 'draft'
    else if (statusNorm === 'pending' || statusNorm === 'diajukan') statusRaw = 'pending'
    else if (statusNorm === 'disetujui' || statusNorm === 'terpublikasi') statusRaw = 'disetujui'
    else if (statusNorm === 'ditolak') statusRaw = 'ditolak'
    else if (statusNorm === 'diteruskan' || statusNorm === 'terverifikasi') statusRaw = 'diteruskan'
    else if (statusNorm === 'revisi' || statusNorm === 'perlu_revisi') statusRaw = 'revisi'
    else statusRaw = statusNorm
    return {
      ...item,
      no: i + 1,
      kegiatan: item.namaKegiatan || item.kegiatan || '-',
      jenis: item.jenisKegiatan || item.jenis || '-',
      peran: item.peran || '-',
      penyelenggara: item.penyelenggara || '-',
      tanggal: formatTanggal(item.tanggalPelaksanaan || item.tanggal),
      skala: item.skala || '-',
      statusRaw,
    }
  })
}

function AjukanKegiatanEksternal() {
  const navigate = useNavigate()
  const user = getCurrentUser()

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterKategori, setFilterKategori] = useState('')

  // Checkbox selection — hanya baris yg disetujui
  const [pilihanMode, setPilihanMode] = useState(false)
  const [selected, setSelected] = useState(new Set())

  // Hapus draft confirm
  const [hapusDraftTarget, setHapusDraftTarget] = useState(null)

  // Modal popup alasan/catatan
  const [alasanModal, setAlasanModal] = useState(null) // { judul, isi }

  const [showPeranModal, setShowPeranModal] = useState(false)
  // { [kegiatanId]: { peranId, peranList, loading } }
  const [peranPerKegiatan, setPeranPerKegiatan] = useState({})
  const [submittingIzin, setSubmittingIzin] = useState(false)

  const load = () => {
    setLoading(true)
    getPengajuan('mahasiswa')
      .then((res) => {
        const rows = mapPengajuanRows(Array.isArray(res) ? res : [])
        console.log('[AjukanKegiatanEksternal] rows:', rows.map(r => ({ id: r.id, status: r.status, statusRaw: r.statusRaw })))
        setData(rows)
        setSelected(new Set())
      })
      .catch((err) => toast.error('Gagal memuat data', { description: err.message }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    return subscribeDataUpdate((detail) => {
      if (!detail?.type || detail.type === 'pengajuan') load()
    })
  }, [])

  // Bisa dipilih: disetujui + belum ajukan PA + belum klaim
  const disetujuiRows = useMemo(
    () => data.filter((r) => r.statusRaw === 'disetujui' && !r.sudahAjukanPA && !r.sudahKlaim),
    [data]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.filter((row) => {
      if (filterStatus && row.statusRaw !== filterStatus) return false
      if (filterKategori && row.jenis !== filterKategori) return false
      if (!q) return true
      return (
        row.kegiatan.toLowerCase().includes(q) ||
        row.penyelenggara.toLowerCase().includes(q)
      )
    })
  }, [data, search, filterStatus, filterKategori])

  const allDiapproved = disetujuiRows.filter((r) =>
    filtered.some((f) => f.id === r.id)
  )
  const allChecked =
    allDiapproved.length > 0 &&
    allDiapproved.every((r) => selected.has(r.id))

  const toggleAll = () => {
    if (allChecked) {
      setSelected((prev) => {
        const next = new Set(prev)
        allDiapproved.forEach((r) => next.delete(r.id))
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        allDiapproved.forEach((r) => next.add(r.id))
        return next
      })
    }
  }

  const toggleRow = (id, statusRaw, row) => {
    if (statusRaw !== 'disetujui') return
    if (row?.sudahAjukanPA || row?.sudahKlaim) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleEditDraft = (row) => {
    navigate('/mahasiswa/kegiatan-eksternal/ajukan', { state: { draft: row } })
  }

  const handleEditRevisi = (row) => {
    // Kirim ke form dengan mode revisi (pakai state.draft agar form load data)
    navigate('/mahasiswa/kegiatan-eksternal/ajukan', { state: { draft: row, isRevisi: true } })
  }

  const handleHapusDraft = async () => {
    if (!hapusDraftTarget) return
    try {
      await hapusDraftKegiatanEksternal(hapusDraftTarget.id)
      toast.info('Draft dihapus.')
      load()
    } catch (err) {
      toast.error('Gagal menghapus draft', { description: err.message })
    }
    setHapusDraftTarget(null)
  }

  const handleOpenPeranModal = async () => {
    if (selected.size === 0) return
    // Inisialisasi state per kegiatan
    const init = {}
    for (const id of selected) {
      init[id] = { peranId: '', peranList: [], loading: true }
    }
    setPeranPerKegiatan(init)
    setShowPeranModal(true)

    // Fetch peran per kategori, deduplicate
    const cacheKat = {}
    const updates = {}
    for (const id of selected) {
      const row = data.find((r) => r.id === id)
      const katId = row?.kategoriId
      if (!katId) {
        updates[id] = { peranId: '', peranList: [], loading: false }
        continue
      }
      if (!(katId in cacheKat)) {
        try {
          const list = await getPeranKegiatan(katId)
          cacheKat[katId] = Array.isArray(list) ? list : []
        } catch {
          cacheKat[katId] = []
        }
      }
      updates[id] = { peranId: '', peranList: cacheKat[katId], loading: false }
    }
    setPeranPerKegiatan(updates)
  }

  const handleSubmitIzinPA = async () => {
    // Validasi semua kegiatan sudah pilih peran
    for (const id of selected) {
      if (!peranPerKegiatan[id]?.peranId) {
        toast.error('Pilih peran untuk semua kegiatan terlebih dahulu')
        return
      }
    }
    setSubmittingIzin(true)
    let berhasil = 0
    let gagal = 0
    for (const kegiatanId of selected) {
      try {
        await mintaPersetujuanDosenEksternal(kegiatanId, peranPerKegiatan[kegiatanId].peranId)
        berhasil++
      } catch {
        gagal++
      }
    }
    setSubmittingIzin(false)
    setShowPeranModal(false)
    if (berhasil > 0) {
      toast.success(`${berhasil} permintaan terkirim ke Dosen PA!`)
      navigate('/mahasiswa/persetujuan-dosen')
    }
    if (gagal > 0) toast.error(`${gagal} kegiatan gagal dikirim.`)
  }

  const jenisOptions = useMemo(() => {
    const set = new Set(data.map((r) => r.jenis).filter(Boolean))
    return [...set]
  }, [data])

  const statusOptions = [
    { value: 'disetujui', label: 'Disetujui' },
    { value: 'pending', label: 'Pending' },
    { value: 'ditolak', label: 'Ditolak' },
  ]

  return (
    <DashboardLayout role="mahasiswa" userName={user?.nama || 'Mahasiswa'} userRole="Mahasiswa">
      {/* Modal popup alasan/catatan */}
      <Modal isOpen={!!alasanModal} onClose={() => setAlasanModal(null)}>
        <div className="space-y-3">
          <h3 className="text-base font-bold text-[#333]">{alasanModal?.judul}</h3>
          <p className="text-sm text-[#616161] whitespace-pre-wrap">{alasanModal?.isi || 'Tidak ada keterangan.'}</p>
          <button
            type="button"
            onClick={() => setAlasanModal(null)}
            className="w-full rounded-xl border border-[#d9dce7] py-2.5 text-sm font-semibold text-[#333] hover:bg-[#f5f6f8]"
          >
            Tutup
          </button>
        </div>
      </Modal>

      {/* Konfirmasi hapus draft */}
      <ConfirmModal
        isOpen={!!hapusDraftTarget}
        message={`Yakin ingin menghapus draft "${hapusDraftTarget?.kegiatan}"?`}
        confirmText="Ya, hapus"
        cancelText="Batal"
        onConfirm={handleHapusDraft}
        onCancel={() => setHapusDraftTarget(null)}
      />

      {/* Modal pilih peran per kegiatan sebelum minta izin PA */}
      <Modal isOpen={showPeranModal} onClose={() => setShowPeranModal(false)}>
        <div className="space-y-4">
          <h3 className="text-base font-bold text-[#333]">Pilih Peran / Pencapaian</h3>
          <p className="text-sm text-[#616161]">
            Pilih peran untuk setiap kegiatan yang akan dikirim ke Dosen PA.
          </p>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {[...selected].map((id) => {
              const row = data.find((r) => r.id === id)
              const state = peranPerKegiatan[id] || {}
              return (
                <div key={id} className="rounded-xl border border-[#e9ebf8] p-3 space-y-2">
                  <p className="text-sm font-semibold text-[#333] truncate">{row?.kegiatan || '-'}</p>
                  <p className="text-xs text-[#9aa0a6]">{row?.jenis} · {row?.skala}</p>
                  {state.loading ? (
                    <p className="text-xs text-[#9aa0a6]">Memuat peran…</p>
                  ) : !state.peranList?.length ? (
                    <p className="text-xs text-red-400">Peran tidak tersedia untuk kategori ini.</p>
                  ) : (
                    <select
                      value={state.peranId || ''}
                      onChange={(e) =>
                        setPeranPerKegiatan((prev) => ({
                          ...prev,
                          [id]: { ...prev[id], peranId: e.target.value },
                        }))
                      }
                      className="block w-full rounded-lg border border-[#e9ebf8] p-2.5 text-sm text-[#333] focus:border-brand-dark"
                    >
                      <option value="">Pilih peran</option>
                      {(state.peranList || []).map((p) => (
                        <option key={p.id} value={p.id}>{p.nama || p.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              disabled={submittingIzin || [...selected].some((id) => !peranPerKegiatan[id]?.peranId)}
              onClick={handleSubmitIzinPA}
              className="flex-1 rounded-xl bg-gradient-to-r from-brand-dark to-brand-light py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
            >
              {submittingIzin ? 'Mengirim…' : 'Kirim ke Dosen PA'}
            </button>
            <button
              type="button"
              onClick={() => setShowPeranModal(false)}
              className="flex-1 rounded-xl border border-[#d9dce7] py-2.5 text-sm font-semibold text-[#333] hover:bg-[#f5f6f8]"
            >
              Batal
            </button>
          </div>
        </div>
      </Modal>

      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-brand-dark sm:text-2xl">Daftar Pengajuan</h2>
          <button
            onClick={() => navigate('/mahasiswa/kegiatan-eksternal/ajukan')}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90 sm:px-6 sm:py-3"
          >
            <PlusCircle className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
            <span className="sm:hidden">Ajukan Baru</span>
            <span className="hidden sm:inline">Tambah Ajukan Kegiatan</span>
          </button>
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-3 shadow-sm sm:p-6">
          <h3 className="text-sm font-bold text-brand-dark sm:text-lg">Kegiatan yang telah diajukan</h3>

          {/* Filter bar */}
          <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex w-full items-center gap-2 rounded-lg border border-[#e9ebf8] px-3 py-2 sm:w-auto sm:flex-1 sm:px-4">
              <Search className="h-3.5 w-3.5 shrink-0 text-[#616161] sm:h-4 sm:w-4" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kegiatan..."
                className="w-full text-xs outline-none sm:text-sm"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-[#616161]" />
              <select
                value={filterKategori}
                onChange={(e) => setFilterKategori(e.target.value)}
                className="rounded-lg border border-[#e9ebf8] px-3 py-2 text-xs text-[#333] outline-none sm:text-sm"
              >
                <option value="">Semua Kategori</option>
                {jenisOptions.map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-lg border border-[#e9ebf8] px-3 py-2 text-xs text-[#333] outline-none sm:text-sm"
              >
                <option value="">Semua Status</option>
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              {(filterStatus || filterKategori || search) && (
                <button
                  type="button"
                  onClick={() => { setFilterStatus(''); setFilterKategori(''); setSearch('') }}
                  className="rounded-lg border border-brand-dark bg-white px-3 py-2 text-xs font-medium text-brand-dark transition hover:bg-[#f5f5f5] sm:text-sm"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>

          {/* Tabel */}
          <div className="mt-6">
            <DataTable
              columns={[
                { key: 'no', label: 'No' },
                { key: 'kegiatan', label: 'Kegiatan' },
                { key: 'jenis', label: 'Jenis' },
                { key: 'penyelenggara', label: 'Penyelenggara' },
                { key: 'tanggal', label: 'Tanggal' },
                { key: 'skala', label: 'Skala' },
                {
                  key: 'statusRaw',
                  label: 'Status',
                  render: (row) => <StatusBadge status={row.statusRaw} />,
                },
                {
                  key: 'aksi',
                  label: 'Aksi',
                  stopPropagation: true,
                  render: (row) => (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        title="Detail"
                        onClick={() => navigate(`/mahasiswa/kegiatan-eksternal/${row.id}`, { state: { row } })}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-400 bg-blue-50 text-blue-600 transition hover:bg-blue-500 hover:text-white"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Edit"
                        disabled={row.statusRaw !== 'draft'}
                        onClick={() => handleEditDraft(row)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-yellow-400 bg-amber-50 text-yellow-600 transition hover:bg-yellow-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Hapus"
                        disabled={row.statusRaw !== 'draft'}
                        onClick={() => setHapusDraftTarget(row)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-400 bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Ajukan Ulang"
                        disabled={row.statusRaw !== 'revisi'}
                        onClick={() => handleEditRevisi(row)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-400 bg-amber-50 text-amber-600 transition hover:bg-amber-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>

                  ),
                },
              ]}
              data={filtered}
              loading={loading}
              emptyText="Belum ada pengajuan."
              selectable={pilihanMode}
              selected={selected}
              onSelect={(id) => {
                const row = data.find((r) => r.id === id)
                toggleRow(id, row?.statusRaw, row)
              }}
              onSelectAll={toggleAll}
              isSelectable={(row) => row.statusRaw === 'disetujui' && !row.sudahAjukanPA && !row.sudahKlaim}
              onRowClick={pilihanMode ? (row) => toggleRow(row.id, row.statusRaw, row) : undefined}
            />
          </div>

          {/* Tombol bawah tabel */}
          {!loading && (
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#e9ebf8] pt-4">
              {pilihanMode ? (
                <>
                  <span className="text-sm text-[#616161]">{selected.size} kegiatan dipilih</span>
                  <div className="ml-auto flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setPilihanMode(false); setSelected(new Set()) }}
                      className="rounded-lg border border-[#d9dce7] px-4 py-2 text-sm font-semibold text-[#616161] hover:bg-[#f5f6f8]"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      disabled={selected.size === 0 || submittingIzin}
                      onClick={handleOpenPeranModal}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <UserCheck className="h-4 w-4" />
                      Minta Persetujuan Dosen PA
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setPilihanMode(true)}
                  className="ml-auto flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                >
                  <UserCheck className="h-4 w-4" />
                  Minta Persetujuan Dosen PA
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AjukanKegiatanEksternal
