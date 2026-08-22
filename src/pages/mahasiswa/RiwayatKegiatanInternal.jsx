import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import KegiatanCell from '../../components/dashboard/KegiatanCell'
import { getCurrentUser } from '../../services/authService'
import { getRiwayatKegiatanInternal } from '../../services/kegiatanService'
import { mintaPersetujuanDosenInternal } from '../../services/pengajuanService'

function formatTanggal(start, end) {
  if (!start) return '-'
  try {
    const opts = { day: 'numeric', month: 'short', year: 'numeric' }
    const ds = new Date(start)
    if (Number.isNaN(ds.getTime())) return '-'
    const s = ds.toLocaleDateString('id-ID', opts)
    if (!end) return s
    const de = new Date(end)
    if (Number.isNaN(de.getTime())) return s
    const e = de.toLocaleDateString('id-ID', opts)
    return s === e ? s : `${s} - ${e}`
  } catch {
    return '-'
  }
}

function KehadiranBadge({ status }) {
  const cfg =
    status === 'Hadir'
      ? { bg: 'bg-green-100', text: 'text-green-800' }
      : status === 'Tidak Hadir'
        ? { bg: 'bg-red-100', text: 'text-red-800' }
        : { bg: 'bg-gray-100', text: 'text-gray-700' }
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {status}
    </span>
  )
}

function StatusPoinBadge({ label }) {
  const s = String(label || '').toLowerCase()
  const cfg =
    s.includes('terklaim')
      ? { bg: 'bg-green-100', text: 'text-green-800' }
      : s.includes('izin')
        ? { bg: 'bg-blue-100', text: 'text-blue-800' }
        : s.includes('kehadiran') || s.includes('peran')
          ? { bg: 'bg-amber-100', text: 'text-amber-800' }
          : { bg: 'bg-gray-100', text: 'text-gray-700' }
  return (
    <span className={`inline-flex max-w-[11rem] items-center justify-center rounded-full px-3 py-1 text-center text-xs font-medium leading-snug ${cfg.bg} ${cfg.text}`}>
      {label || 'Menunggu Syarat'}
    </span>
  )
}

function isSudahDiklaim(row) {
  return String(row.statusPoin || '').toLowerCase().includes('terklaim')
}

function canMintaIzin(row) {
  if (isSudahDiklaim(row)) return false
  if (typeof row.canMintaIzinPA === 'boolean') return row.canMintaIzinPA
  return !!row.bisaMintaPa
}

function RiwayatKegiatanInternal() {
  const user = getCurrentUser()
  const [loading, setLoading] = useState(true)
  const [riwayat, setRiwayat] = useState([])
  const [search, setSearch] = useState('')
  const [filterJenis, setFilterJenis] = useState('')
  const [filterKehadiran, setFilterKehadiran] = useState('')
  const [filterPenyelenggara, setFilterPenyelenggara] = useState('')
  const [filterSkala, setFilterSkala] = useState('')
  const [filterStatusPoin, setFilterStatusPoin] = useState('')

  const [pilihanMode, setPilihanMode] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [submittingIzin, setSubmittingIzin] = useState(false)

  const load = () => {
    setLoading(true)
    getRiwayatKegiatanInternal()
      .then((data) => {
        const list = Array.isArray(data.riwayat) ? data.riwayat : []
        setRiwayat(list)
        setSelected(new Set())
      })
      .catch((err) => {
        setRiwayat([])
        toast.error('Gagal memuat riwayat kegiatan internal', { description: err.message })
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const jenisOptions = useMemo(
    () => [...new Set(riwayat.map((r) => r.jenisKegiatan).filter((v) => v && v !== '-'))],
    [riwayat],
  )
  const penyelenggaraOptions = useMemo(
    () => [...new Set(riwayat.map((r) => r.penyelenggara).filter((v) => v && v !== '-'))],
    [riwayat],
  )
  const skalaOptions = useMemo(
    () => [...new Set(riwayat.map((r) => r.skala).filter((s) => s && s !== '-'))].sort(),
    [riwayat],
  )
  const statusPoinOptions = useMemo(
    () => [...new Set(riwayat.map((r) => r.statusPoin).filter(Boolean))].sort(),
    [riwayat],
  )

  const bisaMintaCount = useMemo(
    () => riwayat.filter((r) => canMintaIzin(r)).length,
    [riwayat],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return riwayat
      .filter((r) => {
        if (q && !String(r.namaKegiatan || '').toLowerCase().includes(q) && !String(r.penyelenggara || '').toLowerCase().includes(q)) return false
        if (filterJenis && r.jenisKegiatan !== filterJenis) return false
        if (filterKehadiran && r.kehadiran !== filterKehadiran) return false
        if (filterPenyelenggara && r.penyelenggara !== filterPenyelenggara) return false
        if (filterStatusPoin && r.statusPoin !== filterStatusPoin) return false
        if (filterSkala && r.skala !== filterSkala) return false
        return true
      })
      .map((r, i) => ({
        ...r,
        no: i + 1,
        diajukanPada: formatTanggal(r.tanggalDiajukan || r.createdAt || r.dibuatPada),
      }))
  }, [riwayat, search, filterJenis, filterKehadiran, filterPenyelenggara, filterStatusPoin, filterSkala])

  const resetFilter = () => {
    setSearch('')
    setFilterJenis('')
    setFilterKehadiran('')
    setFilterPenyelenggara('')
    setFilterStatusPoin('')
    setFilterSkala('')
  }

  const ajukanIzin = async (row) => {
    const partisipasiId = row.partisipasiId || row.id
    if (!partisipasiId && !row.kegiatanId) {
      throw new Error('Data partisipasi tidak lengkap')
    }
    return mintaPersetujuanDosenInternal({
      partisipasiId,
      kegiatanId: row.kegiatanId,
      peranId: row.peranId,
    })
  }

  const toggleSelect = (id) => {
    const row = riwayat.find((r) => r.id === id) || filtered.find((r) => r.id === id)
    if (!canMintaIzin(row)) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSelectAll = () => {
    const ids = filtered.filter((r) => canMintaIzin(r)).map((r) => r.id)
    const allOn = ids.length > 0 && ids.every((id) => selected.has(id))
    setSelected(allOn ? new Set() : new Set(ids))
  }

  const handleBatalPilih = () => {
    setPilihanMode(false)
    setSelected(new Set())
  }

  const handleSubmitIzinPA = async () => {
    if (selected.size === 0) return
    setSubmittingIzin(true)
    let berhasil = 0
    let gagal = 0
    let lastError = ''
    for (const rowId of selected) {
      const row = riwayat.find((r) => r.id === rowId)
      if (!row) {
        gagal++
        continue
      }
      try {
        await ajukanIzin(row)
        berhasil++
      } catch (err) {
        gagal++
        lastError = err?.message || ''
      }
    }
    setSubmittingIzin(false)
    setPilihanMode(false)
    setSelected(new Set())
    if (berhasil > 0) {
      toast.success(`${berhasil} permintaan terkirim ke Dosen PA!`)
      load()
    }
    if (gagal > 0) {
      toast.error(`${gagal} kegiatan gagal dikirim.`, { description: lastError || undefined })
    }
  }

  const columns = [
    { key: 'no', label: 'NO' },
    { key: 'namaKegiatan', label: 'KEGIATAN', render: (row) => <KegiatanCell nama={row.namaKegiatan} tanggal={row.diajukanPada} /> },
    { key: 'jenisKegiatan', label: 'JENIS' },
    { key: 'skala', label: 'SKALA' },
    { key: 'penyelenggara', label: 'PENYELENGGARA' },
    { key: 'tanggal', label: 'TANGGAL', render: (row) => formatTanggal(row.tanggalMulai, row.tanggalSelesai) },
    { key: 'peran', label: 'PERAN' },
    {
      key: 'kehadiran',
      label: 'KEHADIRAN',
      render: (row) => (
        <div className="flex w-full justify-center">
          <KehadiranBadge status={row.kehadiran} />
        </div>
      ),
    },
    {
      key: 'statusPoin',
      label: 'STATUS POIN',
      render: (row) => (
        <div className="flex w-full justify-center">
          <StatusPoinBadge label={row.statusPoin} />
        </div>
      ),
    },
    {
      key: 'poin',
      label: 'POIN',
      center: true,
      render: (row) => (
        <span className="text-brand-dark">
          {row.poin === null || row.poin === undefined || row.poin === '' ? '-' : row.poin}
        </span>
      ),
    },
  ]

  return (
    <DashboardLayout role="mahasiswa" userName={user?.nama || 'Mahasiswa'} userRole="Mahasiswa">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-[#222] sm:text-2xl">Riwayat Kegiatan Internal</h2>
        </div>
        <p className="text-sm text-[#616161]">
          Rekap kegiatan internal. Poin cair otomatis setelah izin Dosen PA disetujui serta kehadiran & peran diverifikasi UKM.
        </p>

        <TableCard title="Riwayat Kegiatan Internal">
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
              <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-[#d9dce7] px-3 py-2 text-sm text-[#444] outline-none">
                <option value="">Semua Jenis</option>
                {jenisOptions.map((j) => <option key={j} value={j}>{j}</option>)}
              </select>
              <select value={filterKehadiran} onChange={(e) => setFilterKehadiran(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-[#d9dce7] px-3 py-2 text-sm text-[#444] outline-none">
                <option value="">Semua Kehadiran</option>
                <option value="Hadir">Hadir</option>
                <option value="Tidak Hadir">Tidak Hadir</option>
                <option value="Belum Tercatat">Belum Tercatat</option>
              </select>
              <select value={filterStatusPoin} onChange={(e) => setFilterStatusPoin(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-[#d9dce7] px-3 py-2 text-sm text-[#444] outline-none">
                <option value="">Semua Status Poin</option>
                {statusPoinOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filterSkala} onChange={(e) => setFilterSkala(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-[#d9dce7] px-3 py-2 text-sm text-[#444] outline-none">
                <option value="">Semua Skala</option>
                {skalaOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filterPenyelenggara} onChange={(e) => setFilterPenyelenggara(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-[#d9dce7] px-3 py-2 text-sm text-[#444] outline-none">
                <option value="">Semua Penyelenggara</option>
                {penyelenggaraOptions.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              {(search || filterJenis || filterKehadiran || filterStatusPoin || filterSkala || filterPenyelenggara) && (
                <button type="button" onClick={resetFilter} className="rounded-lg border border-brand-dark bg-white px-3 py-2 text-sm font-medium text-brand-dark transition hover:bg-[#f5f5f5]">Reset Filter</button>
              )}
            </div>
          </div>

          <TableFrame>
            <DataTable
              columns={columns}
              data={filtered}
              loading={loading}
              emptyText="Belum ada riwayat kegiatan internal."
              selectable={pilihanMode}
              selected={selected}
              onSelect={toggleSelect}
              onSelectAll={handleSelectAll}
              isSelectable={(row) => canMintaIzin(row)}
              onRowClick={pilihanMode ? (row) => toggleSelect(row.id) : undefined}
            />
          </TableFrame>

          {!loading && filtered.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 border-t border-[#e9ebf8] pt-4">
              {pilihanMode ? (
                <>
                  <span className="text-sm text-[#616161]">{selected.size} kegiatan dipilih</span>
                  <div className="ml-auto flex gap-2">
                    <button
                      type="button"
                      onClick={handleBatalPilih}
                      disabled={submittingIzin}
                      className="rounded-lg border border-[#d9dce7] px-4 py-2 text-sm font-semibold text-[#616161] hover:bg-[#f5f6f8]"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      disabled={selected.size === 0 || submittingIzin}
                      onClick={handleSubmitIzinPA}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submittingIzin ? 'Mengirim…' : 'Minta Izin PA'}
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  disabled={bisaMintaCount === 0}
                  onClick={() => setPilihanMode(true)}
                  className="ml-auto flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Minta Izin PA
                </button>
              )}
            </div>
          )}
        </TableCard>
      </div>
    </DashboardLayout>
  )
}

export default RiwayatKegiatanInternal
