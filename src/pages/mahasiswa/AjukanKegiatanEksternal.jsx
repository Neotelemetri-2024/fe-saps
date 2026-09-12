import { useEffect, useMemo, useState } from 'react'
import { Search, Pencil, Plus, Trash2, RefreshCw, Eye, Info } from 'lucide-react'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import KegiatanCell from '../../components/dashboard/KegiatanCell'
import Modal from '../../components/ui/Modal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import InfoTooltip from '../../components/ui/InfoTooltip'
import ActionMenu from '../../components/ui/ActionMenu'
import { getPengajuan, hapusDraftKegiatanEksternal, subscribeDataUpdate, getKegiatanEksternalTerdaftar } from '../../services/pengajuanService'
import { getCurrentUser } from '../../services/authService'
import { statusOptionsFromRows } from '../../utils/statusFilter'
import { batalBtnClass } from '../../components/ui/buttonStyles'

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

function mapPengajuanRows(items) {
  return items.map((item, i) => {
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
      diajukanPada: formatTanggal(item.tanggalPengajuan || item.tanggalDiajukan || item.dibuatPada || item.createdAt),
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
  const [showPilihModal, setShowPilihModal] = useState(false)
  const [kegiatanTerdaftarList, setKegiatanTerdaftarList] = useState([])
  const [loadingTerdaftar, setLoadingTerdaftar] = useState(false)
  const [selectedKegiatanId, setSelectedKegiatanId] = useState('')
  const [modalSearch, setModalSearch] = useState('')

  const modalFilteredKegiatan = useMemo(() => {
    const q = modalSearch.trim().toLowerCase()
    if (!q) return kegiatanTerdaftarList
    return kegiatanTerdaftarList.filter((k) => {
      const nama = (k.nama || '').toLowerCase()
      const pen = (k.penyelenggara || '').toLowerCase()
      const skala = (k.skalaNama || '').toLowerCase()
      const thn = String(k.tahun || '')
      return nama.includes(q) || pen.includes(q) || skala.includes(q) || thn.includes(q)
    })
  }, [kegiatanTerdaftarList, modalSearch])

  const handleOpenPilihModal = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSelectedKegiatanId('')
    setModalSearch('')
    setShowPilihModal(true)
    setLoadingTerdaftar(true)
    getKegiatanEksternalTerdaftar()
      .then((list) => {
        setKegiatanTerdaftarList(Array.isArray(list) ? list : [])
      })
      .catch((err) => {
        console.error('Error fetching kegiatan terdaftar:', err)
        setKegiatanTerdaftarList([])
      })
      .finally(() => {
        setLoadingTerdaftar(false)
      })
  }

  const handleLanjutPilihKegiatan = () => {
    if (!selectedKegiatanId) {
      toast.error('Pilih kegiatan terlebih dahulu')
      return
    }
    setShowPilihModal(false)
    if (selectedKegiatanId === 'BELUM_TERDAFTAR') {
      navigate('/mahasiswa/kegiatan-eksternal/ajukan', { state: { mode: 'baru' } })
    } else {
      const chosen = kegiatanTerdaftarList.find((k) => String(k.id) === String(selectedKegiatanId))
      navigate('/mahasiswa/kegiatan-eksternal/ajukan', {
        state: { mode: 'terdaftar', selectedKegiatan: chosen },
      })
    }
  }
  const [filterStatus, setFilterStatus] = useState('')
  const [filterKategori, setFilterKategori] = useState('')
  const [filterSkala, setFilterSkala] = useState('')

  const [hapusDraftTarget, setHapusDraftTarget] = useState(null)
  const [alasanModal, setAlasanModal] = useState(null)

  const load = () => {
    setLoading(true)
    getPengajuan('mahasiswa')
      .then((res) => {
        const rows = mapPengajuanRows(Array.isArray(res) ? res : [])
          .filter((r) => r.statusRaw !== 'disetujui')
        setData(rows)
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.filter((row) => {
      if (filterStatus && row.statusRaw !== filterStatus) return false
      if (filterKategori && row.jenis !== filterKategori) return false
      if (filterSkala && row.skala !== filterSkala) return false
      if (!q) return true
      return (
        row.kegiatan.toLowerCase().includes(q) ||
        row.penyelenggara.toLowerCase().includes(q)
      )
    })
  }, [data, search, filterStatus, filterKategori, filterSkala])

  const handleEditDraft = (row) => {
    navigate('/mahasiswa/kegiatan-eksternal/ajukan', { state: { draft: row } })
  }

  const handleEditRevisi = (row) => {
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

  const jenisOptions = useMemo(() => {
    const set = new Set(data.map((r) => r.jenis).filter(Boolean))
    return [...set]
  }, [data])

  const statusOptions = useMemo(
    () => statusOptionsFromRows(data, 'statusRaw'),
    [data],
  )

  return (
    <DashboardLayout role="mahasiswa" userName={user?.nama || 'Mahasiswa'} userRole="Mahasiswa">
      <Modal isOpen={!!alasanModal} onClose={() => setAlasanModal(null)}>
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-base-content">{alasanModal?.judul}</h3>
          <p className="text-sm text-base-content/60 whitespace-pre-wrap">{alasanModal?.isi || 'Tidak ada keterangan.'}</p>
          <button
            type="button"
            onClick={() => setAlasanModal(null)}
            className="btn btn-ghost btn-sm w-full"
          >
            Tutup
          </button>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!hapusDraftTarget}
        message={`Yakin ingin menghapus draft "${hapusDraftTarget?.kegiatan}"?`}
        confirmText="Ya, hapus"
        cancelText="Batal"
        onConfirm={handleHapusDraft}
        onCancel={() => setHapusDraftTarget(null)}
      />

      {/* Modal Dialog: Pilih Kegiatan Eksternal (Gambar 1) */}
      <Modal
        isOpen={showPilihModal}
        onClose={() => setShowPilihModal(false)}
        title="Pilih Kegiatan Eksternal"
        size="xl"
      >
        <div className="space-y-5">
          <p className="text-sm leading-relaxed text-base-content/70">
            Cari kegiatan yang sudah terdaftar. Jika belum tersedia, lanjutkan dengan mendaftarkan kegiatan baru.
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="cari-kegiatan-eksternal" className="text-sm font-medium text-base-content">Kegiatan terdaftar</label>
              <span className="text-xs text-base-content/50">{kegiatanTerdaftarList.length} kegiatan</span>
            </div>
            <label className="input input-sm flex w-full items-center gap-2 sm:input-md" htmlFor="cari-kegiatan-eksternal">
              <Search className="h-4 w-4 shrink-0 text-base-content/40" />
              <input
                id="cari-kegiatan-eksternal"
                type="search"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="Cari nama, skala, tahun, atau penyelenggara"
                className="grow text-sm"
              />
            </label>
          </div>

          <div className="max-h-72 overflow-y-auto rounded-md border border-base-300 bg-base-100">

            {loadingTerdaftar ? (
              <div className="space-y-3 p-4" aria-label="Memuat kegiatan terdaftar">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="space-y-2 border-b border-base-300 pb-3 last:border-b-0 last:pb-0">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : modalFilteredKegiatan.length > 0 ? (
              modalFilteredKegiatan.map((keg) => {
                const isSelected = String(selectedKegiatanId) === String(keg.id)
                return (
                  <label
                    key={keg.id}
                    className={`flex min-h-20 cursor-pointer items-start gap-3 border-b border-base-300 px-4 py-3 transition-colors last:border-b-0 ${
                      isSelected ? 'bg-primary/5' : 'hover:bg-base-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="pilihKegiatanRadio"
                      checked={isSelected}
                      onChange={() => setSelectedKegiatanId(keg.id)}
                      className="radio radio-primary radio-sm mt-0.5 shrink-0"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium leading-snug text-base-content">{keg.nama}</span>
                      <span className="mt-1 block text-xs text-base-content/60">{keg.penyelenggara || 'Penyelenggara belum dicantumkan'}</span>
                      <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-base-content/50">
                        <span>{keg.tahun || '-'}</span>
                        <span>{keg.skalaNama || '-'}</span>
                        {keg.kategoriNama ? <span>{keg.kategoriNama}</span> : null}
                      </span>
                    </span>
                  </label>
                )
              })
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-medium text-base-content">{modalSearch ? 'Kegiatan tidak ditemukan' : 'Belum ada kegiatan terdaftar'}</p>
                <p className="mt-1 text-xs text-base-content/60">
                  {modalSearch ? 'Ubah kata pencarian atau pilih kegiatan belum terdaftar.' : 'Pilih kegiatan belum terdaftar untuk melanjutkan.'}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-base-300 bg-base-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-base-content">Kegiatan belum terdaftar?</p>
                <p className="mt-0.5 text-xs text-base-content/60">Isi data kegiatan baru untuk diverifikasi Admin Ditmawa.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPilihModal(false)
                  navigate('/mahasiswa/kegiatan-eksternal/ajukan', { state: { mode: 'baru' } })
                }}
                className="btn btn-primary min-h-11 shrink-0 sm:btn-sm sm:min-h-0"
              >
                <Plus className="h-4 w-4" />
                Tambah Kegiatan
              </button>
            </div>
          </div>

          {/* Kotak Informasi Dinamis */}
          {selectedKegiatanId && selectedKegiatanId !== 'BELUM_TERDAFTAR' && (
            <div className="flex items-start gap-2.5 rounded-md border border-base-300 bg-base-200 p-3.5 text-xs text-base-content/70">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-base-content/60" />
              <div className="leading-relaxed">
                <span className="font-medium text-base-content">Kegiatan terdaftar: </span>
                Kegiatan ini sudah diverifikasi di sistem. Anda tidak perlu memasukkan ulang detail kegiatan dan dapat langsung meminta persetujuan Dosen PA.
              </div>
            </div>
          )}
          {selectedKegiatanId === 'BELUM_TERDAFTAR' && (
            <div className="flex items-start gap-2.5 rounded-md border border-base-300 bg-base-200 p-3.5 text-xs text-base-content/70">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-base-content/60" />
              <div className="leading-relaxed">
                <span className="font-medium text-base-content">Kegiatan baru: </span>
                Anda akan diarahkan ke formulir pendaftaran kegiatan eksternal baru untuk diajukan dan diverifikasi oleh Admin Ditmawa.
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-base-300 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setShowPilihModal(false)}
              className={`${batalBtnClass} min-h-11 sm:min-h-0`}
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!selectedKegiatanId}
              onClick={handleLanjutPilihKegiatan}
              className="btn btn-primary min-h-11 px-6 sm:btn-sm sm:min-h-0"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </Modal>

      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <h2 className="text-xl font-semibold text-base-content sm:text-2xl">Kegiatan Eksternal</h2>
            <InfoTooltip message={<>Kegiatan berstatus <strong>draft</strong> dapat diedit atau dihapus. Setelah <strong>Kirim</strong>, kegiatan tidak dapat diedit. Kegiatan yang sudah <strong>disetujui</strong> admin dipindah ke halaman Persetujuan Dosen.</>} />
          </div>
          <button
            type="button"
            onClick={handleOpenPilihModal}
            className="btn btn-primary btn-sm"
          >
            <Plus className="h-4 w-4" />
            <span className="sm:hidden">Ajukan</span>
            <span className="hidden sm:inline">Ajukan Kegiatan</span>
          </button>
        </div>

        <TableCard>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <label className="input input-sm flex w-full items-center gap-2 sm:w-auto sm:flex-1">
              <Search className="h-3.5 w-3.5 shrink-0 text-base-content/60 sm:h-4 sm:w-4" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kegiatan..."
                className="grow text-sm"
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterKategori}
                onChange={(e) => setFilterKategori(e.target.value)}
                className="select select-sm min-w-0 flex-1 text-sm"
              >
                <option value="">Semua Kategori</option>
                {jenisOptions.map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
              <select
                value={filterSkala}
                onChange={(e) => setFilterSkala(e.target.value)}
                className="select select-sm min-w-0 flex-1 text-sm"
              >
                <option value="">Semua Skala</option>
                {[...new Set(data.map((r) => r.skala).filter((s) => s && s !== '-'))].sort().map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="select select-sm min-w-0 flex-1 text-sm"
              >
                <option value="">Semua Status</option>
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              {(filterStatus || filterKategori || filterSkala || search) && (
                <button
                  type="button"
                  onClick={() => { setFilterStatus(''); setFilterKategori(''); setFilterSkala(''); setSearch('') }}
                  className="btn btn-ghost btn-sm"
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
                    <ActionMenu
                      items={[
                        {
                          label: 'Detail',
                          icon: <Eye className="h-4 w-4" />,
                          color: 'text-primary',
                          onClick: () => navigate(`/mahasiswa/kegiatan-eksternal/${row.id}`, { state: { row } }),
                        },
                        {
                          label: 'Edit',
                          icon: <Pencil className="h-4 w-4" />,
                          color: 'text-yellow-600',
                          disabled: row.statusRaw !== 'draft',
                          onClick: () => handleEditDraft(row),
                        },
                        {
                          label: 'Hapus',
                          icon: <Trash2 className="h-4 w-4" />,
                          color: 'text-red-500',
                          disabled: row.statusRaw !== 'draft',
                          onClick: () => setHapusDraftTarget(row),
                        },
                        {
                          label: 'Ajukan Ulang',
                          icon: <RefreshCw className="h-4 w-4" />,
                          color: 'text-amber-600',
                          disabled: row.statusRaw !== 'revisi',
                          onClick: () => handleEditRevisi(row),
                        },
                      ]}
                    />
                  ),
                },
              ]}
              data={filtered}
              loading={loading}
              emptyText="Belum ada pengajuan."
            />
          </TableFrame>
        </TableCard>
      </div>
    </DashboardLayout>
  )
}

export default AjukanKegiatanEksternal
