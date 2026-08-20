import { useEffect, useMemo, useState } from 'react'
import { Search, Pencil, Plus, Trash2, RefreshCw, Eye } from 'lucide-react'
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
import { getPengajuan, hapusDraftKegiatanEksternal, subscribeDataUpdate } from '../../services/pengajuanService'
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

      <ConfirmModal
        isOpen={!!hapusDraftTarget}
        message={`Yakin ingin menghapus draft "${hapusDraftTarget?.kegiatan}"?`}
        confirmText="Ya, hapus"
        cancelText="Batal"
        onConfirm={handleHapusDraft}
        onCancel={() => setHapusDraftTarget(null)}
      />

      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg font-bold text-[#222] sm:text-2xl">Daftar Pengajuan</h2>
            <InfoTooltip message={<>Kegiatan berstatus <strong>draft</strong> dapat diedit atau dihapus. Setelah <strong>Kirim</strong>, kegiatan tidak dapat diedit. Kegiatan yang sudah <strong>disetujui</strong> admin dipindah ke halaman Persetujuan Dosen.</>} />
          </div>
          <button
            onClick={() => navigate('/mahasiswa/kegiatan-eksternal/ajukan')}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90 sm:px-6 sm:py-3"
          >
            <Plus className="h-4 w-4" />
            <span className="sm:hidden">Ajukan Baru</span>
            <span className="hidden sm:inline">Tambah Ajukan Kegiatan</span>
          </button>
        </div>

        <TableCard title="Ajukan Kegiatan Eksternal">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
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
              <select
                value={filterKategori}
                onChange={(e) => setFilterKategori(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-[#e9ebf8] px-3 py-2 text-xs text-[#333] outline-none sm:text-sm"
              >
                <option value="">Semua Kategori</option>
                {jenisOptions.map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
              <select
                value={filterSkala}
                onChange={(e) => setFilterSkala(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-[#e9ebf8] px-3 py-2 text-xs text-[#333] outline-none sm:text-sm"
              >
                <option value="">Semua Skala</option>
                {[...new Set(data.map((r) => r.skala).filter((s) => s && s !== '-'))].sort().map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-[#e9ebf8] px-3 py-2 text-xs text-[#333] outline-none sm:text-sm"
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
                  className="rounded-lg border border-brand-dark bg-white px-3 py-2 text-xs font-medium text-brand-dark transition hover:bg-[#f5f5f5] sm:text-sm"
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
                          color: 'text-blue-600',
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
