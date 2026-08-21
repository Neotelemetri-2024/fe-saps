import { useState, useEffect, useMemo } from 'react'
import { Search, Eye, Pencil, RefreshCw } from 'lucide-react'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import KegiatanCell from '../../components/dashboard/KegiatanCell'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import Modal from '../../components/ui/Modal'
import ActionMenu from '../../components/ui/ActionMenu'
import {
  getIzinPAMahasiswa,
  getPengajuan,
  mintaPersetujuanDosenEksternal,
  subscribeDataUpdate,
} from '../../services/pengajuanService'
import { getPeranKegiatan } from '../../services/matriksService'
import { getCurrentUser } from '../../services/authService'
import { statusOptionsFromRows } from '../../utils/statusFilter'

function formatTanggal(value) {
  if (!value) return '-'
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '-'
    return d.toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch {
    return String(value)
  }
}

function mapPengajuanSiapPA(item, i) {
  return {
    id: `kegiatan-${item.id}`,
    kegiatanId: item.id,
    rowKind: 'siap_pa',
    kegiatan: item.namaKegiatan || item.kegiatan || '-',
    namaKegiatan: item.namaKegiatan || item.kegiatan || '-',
    diajukanPada: formatTanggal(item.tanggalPengajuan || item.tanggalDiajukan || item.dibuatPada || item.createdAt),
    jenis: item.jenisKegiatan || item.jenis || '-',
    jenisKegiatan: item.jenisKegiatan || item.jenis || '-',
    peran: item.peran || '-',
    penyelenggara: item.penyelenggara || '-',
    tanggal: formatTanggal(item.tanggalPelaksanaan || item.tanggal),
    tanggalPelaksanaan: item.tanggalPelaksanaan || item.tanggal || null,
    tanggalPengajuan: item.tanggalPengajuan || item.createdAt || item.dibuatPada || null,
    skala: item.skala || '-',
    kategoriId: item.kategoriId || null,
    deskripsi: item.deskripsi || null,
    linkWebsite: item.linkWebsite || null,
    emailPenyelenggara: item.emailPenyelenggara || null,
    status: 'pending',
    alasan: null,
    isUlang: false,
    no: i + 1,
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
    rowKind: 'izin_pa',
    kategoriId: kegiatan.kategoriId || null,
    peranId: item.peranId || null,
    kegiatan: kegiatan.nama || item.namaKegiatan || (typeof item.kegiatan === 'string' ? item.kegiatan : '-') || '-',
    diajukanPada: formatTanggal(item.tanggalDiajukan || item.createdAt || item.dibuatPada),
    tanggalDiajukan: item.tanggalDiajukan || item.createdAt || null,
    createdAt: item.createdAt || item.tanggalDiajukan || null,
    jenis: kegiatan.kategori || item.jenis || '-',
    peran: item.peran || '-',
    penyelenggara: kegiatan.penyelenggara || item.penyelenggara || '-',
    tanggal: formatTanggal(kegiatan.tanggalMulai || item.tanggalDiajukan || item.tanggal),
    tanggalMulai: kegiatan.tanggalMulai || null,
    tanggalPelaksanaan: kegiatan.tanggalMulai || null,
    skala: kegiatan.skala?.nama || (typeof kegiatan.skala === 'string' ? kegiatan.skala : null) || item.skala || '-',
    deskripsi: kegiatan.deskripsi || item.deskripsi || null,
    linkWebsite: kegiatan.linkPenyelenggara || kegiatan.linkWebsite || null,
    emailPenyelenggara: kegiatan.emailPenyelenggara || null,
    status: statusUI,
    alasan: item.alasanDitolak || item.alasan || null,
    isUlang: false,
    no: i + 1,
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

  const [infoModal, setInfoModal] = useState(null)
  const [revisiTarget, setRevisiTarget] = useState(null)
  const [peranList, setPeranList] = useState([])
  const [peranId, setPeranId] = useState('')
  const [loadingPeran, setLoadingPeran] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [pilihanMode, setPilihanMode] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [showPeranModal, setShowPeranModal] = useState(false)
  const [peranPerKegiatan, setPeranPerKegiatan] = useState({})
  const [submittingIzin, setSubmittingIzin] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([getIzinPAMahasiswa(), getPengajuan('mahasiswa')])
      .then(([izinRes, pengajuanRes]) => {
        const izinItems = Array.isArray(izinRes) ? izinRes : []
        const pengajuanItems = Array.isArray(pengajuanRes) ? pengajuanRes : []

        const kegiatanCount = {}
        izinItems.forEach((it) => {
          const kid = it.kegiatan?.id || it.kegiatanId
          if (kid) kegiatanCount[kid] = (kegiatanCount[kid] || 0) + 1
        })

        const seenKid = new Set()
        const izinRows = izinItems
          .map((it, i) => {
            const row = normalizeIzinPA(it, i)
            if (row.status === 'disetujui') return null
            const kid = it.kegiatan?.id || it.kegiatanId
            const isUlang = kid && kegiatanCount[kid] > 1 && !seenKid.has(kid)
            if (kid) seenKid.add(kid)
            return { ...row, isUlang: !!isUlang }
          })
          .filter(Boolean)

        const siapPaRows = pengajuanItems
          .filter((item) => {
            const statusNorm = (item.status || 'pending').toLowerCase()
            const disetujui = statusNorm === 'disetujui' || statusNorm === 'terpublikasi'
            return disetujui && !item.sudahAjukanPA && !item.sudahKlaim
          })
          .map((item, i) => mapPengajuanSiapPA(item, i))

        const combined = [...siapPaRows, ...izinRows].map((row, i) => ({ ...row, no: i + 1 }))
        setData(combined)
        setSelected(new Set())
      })
      .catch((err) => toast.error('Gagal memuat data', { description: err.message }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    return subscribeDataUpdate((detail) => {
      if (!detail?.type || detail.type === 'persetujuan' || detail.type === 'pengajuan') load()
    })
  }, [])

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

  const siapPaRows = useMemo(() => data.filter((r) => r.rowKind === 'siap_pa'), [data])

  const toggleSelect = (id) => {
    const row = data.find((r) => r.id === id)
    if (row?.rowKind !== 'siap_pa') return
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

  const handleOpenPeranModal = async () => {
    if (selected.size === 0) return
    const init = {}
    for (const id of selected) {
      init[id] = { peranId: '', peranList: [], loading: true }
    }
    setPeranPerKegiatan(init)
    setShowPeranModal(true)

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
    for (const id of selected) {
      if (!peranPerKegiatan[id]?.peranId) {
        toast.error('Pilih peran untuk semua kegiatan terlebih dahulu')
        return
      }
    }
    setSubmittingIzin(true)
    let berhasil = 0
    let gagal = 0
    for (const rowId of selected) {
      const row = data.find((r) => r.id === rowId)
      if (!row?.kegiatanId) continue
      try {
        await mintaPersetujuanDosenEksternal(row.kegiatanId, peranPerKegiatan[rowId].peranId)
        berhasil++
      } catch {
        gagal++
      }
    }
    setSubmittingIzin(false)
    setShowPeranModal(false)
    setPilihanMode(false)
    setSelected(new Set())
    if (berhasil > 0) {
      toast.success(`${berhasil} permintaan terkirim ke Dosen PA!`)
      load()
    }
    if (gagal > 0) toast.error(`${gagal} kegiatan gagal dikirim.`)
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

  const handleSelectAll = () => {
    const ids = filtered.filter((r) => r.rowKind === 'siap_pa').map((r) => r.id)
    const allOn = ids.length > 0 && ids.every((id) => selected.has(id))
    setSelected(allOn ? new Set() : new Set(ids))
  }

  const statusOptions = useMemo(
    () => statusOptionsFromRows(data, 'status'),
    [data],
  )

  const skalaOptions = useMemo(() => {
    return [...new Set(data.map((r) => r.skala).filter((s) => s && s !== '-'))].sort()
  }, [data])

  return (
    <DashboardLayout role="mahasiswa" userName={user?.nama || 'Mahasiswa'} userRole="Mahasiswa">
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

      <Modal isOpen={showPeranModal} onClose={() => !submittingIzin && setShowPeranModal(false)}>
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
            Kegiatan eksternal yang sudah disetujui admin dapat diminta persetujuan ke Dosen PA. Pantau juga status permintaan izin yang sudah dikirim.
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
                  render: (row) => {
                    if (row.isUlang && row.status === 'pending') {
                      return (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                          Diajukan Ulang
                        </span>
                      )
                    }
                    return <StatusBadge status={row.status} />
                  },
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
                          onClick: () => {
                            if (row.rowKind === 'siap_pa') {
                              navigate(`/mahasiswa/kegiatan-eksternal/${row.kegiatanId}`, { state: { row } })
                            } else {
                              navigate(`/mahasiswa/persetujuan-dosen/${row.id}`, { state: { row } })
                            }
                          },
                        },
                        {
                          label: 'Edit',
                          icon: <Pencil className="h-4 w-4" />,
                          color: 'text-yellow-600',
                          disabled: row.rowKind !== 'izin_pa' || row.status !== 'revisi',
                          onClick: () => handleOpenRevisi(row),
                        },
                        {
                          label: 'Ajukan Ulang',
                          icon: <RefreshCw className="h-4 w-4" />,
                          color: 'text-amber-600',
                          disabled: row.rowKind !== 'izin_pa' || row.status !== 'revisi',
                          onClick: () => handleOpenRevisi(row),
                        },
                      ]}
                    />
                  ),
                },
              ]}
              data={filtered}
              loading={loading}
              emptyText={data.length === 0 ? 'Belum ada kegiatan atau permintaan izin ke Dosen PA.' : 'Tidak ada data yang sesuai filter.'}
              selectable={pilihanMode}
              selected={selected}
              onSelect={toggleSelect}
              onSelectAll={handleSelectAll}
              isSelectable={(row) => row.rowKind === 'siap_pa'}
              onRowClick={pilihanMode ? (row) => toggleSelect(row.id) : undefined}
            />
          </TableFrame>

          {!loading && siapPaRows.length > 0 && (
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
                      disabled={selected.size === 0 || submittingIzin}
                      onClick={handleOpenPeranModal}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
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
                  Minta Persetujuan Dosen PA
                </button>
              )}
            </div>
          )}
        </TableCard>
      </div>
    </DashboardLayout>
  )
}

export default PersetujuanDosen
