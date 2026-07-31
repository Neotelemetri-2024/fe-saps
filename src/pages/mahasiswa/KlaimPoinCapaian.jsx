import { useState, useEffect, useMemo } from 'react'
import { Search, UploadCloud, FileText, X, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import DataTable from '../../components/dashboard/DataTable'
import StatusBadge from '../../components/dashboard/StatusBadge'
import { getCurrentUser } from '../../services/authService'
import { klaimPoin, getKlaim, getKegiatanTersediaKlaim } from '../../services/poinService'
import { getPeranKegiatan } from '../../services/matriksService'

const columns = [
  { key: 'no', label: 'NO' },
  { key: 'kegiatan', label: 'KEGIATAN' },
  { key: 'jenis', label: 'JENIS' },
  { key: 'peran', label: 'PERAN' },
  { key: 'penyelenggara', label: 'PENYELENGGARA' },
  { key: 'tanggal', label: 'TANGGAL' },
  { key: 'skala', label: 'SKALA' },
  { key: 'status', label: 'STATUS', render: (row) => <StatusBadge status={row.status} /> },
  {
    key: 'aksi',
    label: 'AKSI',
    render: () => <span className="text-gray-400">-</span>,
  },
]

function mapRiwayat(item, i) {
  return {
    no: i + 1,
    id: item.id,
    kegiatan: item.namaKegiatan || item.kegiatan || '-',
    jenis: item.jenisKegiatan || item.jenis || '-',
    peran: item.peran || '-',
    penyelenggara: item.penyelenggara || '-',
    tanggal: item.tanggalPelaksanaan
      ? new Date(item.tanggalPelaksanaan).toLocaleDateString('id-ID')
      : item.tanggal || '-',
    skala: item.skala || '-',
    status: String(item.status || 'pending').toLowerCase(),
    alasan: item.alasan || null,
  }
}

function KlaimPoinCapaian() {
  const user = getCurrentUser()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [tersedia, setTersedia] = useState([])
  const [search, setSearch] = useState('')

  const [selectedIds, setSelectedIds] = useState(new Set())
  const [itemData, setItemData] = useState({}) // { [partisipasiId]: { peranUsulanId, buktiDokumen } }
  const [peranByKategori, setPeranByKategori] = useState({}) // cache per kategoriId

  const loadRiwayat = () => {
    getKlaim()
      .then((res) => setData((Array.isArray(res) ? res : []).map(mapRiwayat)))
      .catch(() => setData([]))
  }

  useEffect(() => {
    loadRiwayat()
  }, [])

  useEffect(() => {
    if (!showForm) return
    getKegiatanTersediaKlaim()
      .then((list) => setTersedia(Array.isArray(list) ? list : []))
      .catch(() => setTersedia([]))
  }, [showForm])

  const filteredTersedia = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return tersedia
    return tersedia.filter(
      (k) =>
        (k.namaKegiatan || '').toLowerCase().includes(q) ||
        (k.jenisKegiatan || '').toLowerCase().includes(q)
    )
  }, [tersedia, search])

  const selectedList = useMemo(
    () => tersedia.filter((t) => selectedIds.has(String(t.partisipasiId))),
    [tersedia, selectedIds],
  )

  const ensurePeranLoaded = (kategoriId) => {
    if (!kategoriId || peranByKategori[kategoriId]) return
    getPeranKegiatan(kategoriId)
      .then((peran) =>
        setPeranByKategori((prev) => ({ ...prev, [kategoriId]: Array.isArray(peran) ? peran : [] }))
      )
      .catch(() => setPeranByKategori((prev) => ({ ...prev, [kategoriId]: [] })))
  }

  const toggleSelect = (kegiatan) => {
    const id = String(kegiatan.partisipasiId)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setItemData((d) => {
          const copy = { ...d }
          delete copy[id]
          return copy
        })
      } else {
        next.add(id)
        setItemData((d) => ({ ...d, [id]: { peranUsulanId: '', buktiDokumen: null } }))
        ensurePeranLoaded(kegiatan.kategoriId)
      }
      return next
    })
  }

  const removeSelected = (kegiatan) => toggleSelect(kegiatan)

  const updateItem = (id, patch) => {
    setItemData((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  const handlePeranChange = (id, value) => updateItem(id, { peranUsulanId: value })

  const handleFileChange = (id, e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      toast.error('Gagal', { description: 'Hanya file PDF yang diizinkan.' })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Gagal', { description: 'Ukuran file maksimal 10 MB.' })
      return
    }
    updateItem(id, { buktiDokumen: file })
  }

  const isItemComplete = (id) => !!itemData[id]?.peranUsulanId && !!itemData[id]?.buktiDokumen
  const jumlahLengkap = selectedList.filter((k) => isItemComplete(String(k.partisipasiId))).length
  const isReadyToSubmit = selectedList.length > 0 && jumlahLengkap === selectedList.length

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (selectedList.length === 0) {
      toast.error('Pilih minimal satu kegiatan untuk diklaim.')
      return
    }
    const belumLengkap = selectedList.filter((k) => !isItemComplete(String(k.partisipasiId)))
    if (belumLengkap.length > 0) {
      toast.error('Lengkapi peran & bukti dokumen', {
        description: `Belum lengkap: ${belumLengkap.map((k) => k.namaKegiatan).join(', ')}`,
      })
      return
    }

    setLoading(true)
    let success = 0
    const failed = []
    for (const k of selectedList) {
      const id = String(k.partisipasiId)
      try {
        await klaimPoin({
          partisipasiId: id,
          peranUsulanId: itemData[id].peranUsulanId,
          bukti: itemData[id].buktiDokumen,
        })
        success += 1
      } catch {
        failed.push(k.namaKegiatan)
      }
    }
    setLoading(false)

    if (success > 0) {
      toast.success('Berhasil!', {
        description: `${success} klaim poin berhasil diajukan dan akan diverifikasi.`,
      })
    }
    if (failed.length > 0) {
      toast.error('Sebagian klaim gagal diajukan', { description: failed.join(', ') })
    }

    setSelectedIds(new Set())
    setItemData({})
    setSearch('')
    setShowForm(false)
    loadRiwayat()
  }

  const handleBatal = () => {
    setSelectedIds(new Set())
    setItemData({})
    setSearch('')
    setShowForm(false)
  }

  const inputCls =
    'mt-1 block w-full rounded-lg border border-[#d1d5db] p-3 text-sm text-[#333] outline-none focus:border-brand-dark'
  const selectCls = `${inputCls} disabled:cursor-not-allowed disabled:bg-[#f5f5f5] disabled:text-[#aaa]`

  return (
    <DashboardLayout
      role="mahasiswa"
      userName={user?.nama || user?.name || 'Mahasiswa'}
      userRole="Mahasiswa"
    >
      <div className="space-y-6">
        {showForm ? (
          <div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-brand-dark sm:text-2xl">
                  Klaim Poin Capaian Kegiatan Eksternal (Luar Unand)
                </h2>
                <p className="mt-1 text-sm text-[#616161]">
                  Pilih satu atau lebih kegiatan eksternal yang sudah disetujui dan diizinkan PA, lalu unggah
                  bukti dokumen untuk masing-masing kegiatan.
                </p>
              </div>
              {selectedList.length > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-[#e9ebf8] bg-white px-4 py-2.5 shadow-sm">
                  <CheckCircle2 className="h-4 w-4 text-brand-dark" />
                  <span className="text-sm text-[#616161]">
                    <span className="font-bold text-brand-dark">{jumlahLengkap}</span> / {selectedList.length} lengkap
                  </span>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-5">
              {/* Daftar kegiatan tersedia */}
              <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
                <label className="block text-sm font-medium text-[#222]">
                  Kegiatan siap diklaim<span className="text-red-500">*</span>
                </label>
                <div className="mt-2 flex items-center gap-3 rounded-lg border border-[#e9ebf8] px-3 py-2">
                  <Search className="h-4 w-4 shrink-0 text-[#9aa0a6]" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari kegiatan..."
                    className="w-full text-sm outline-none"
                  />
                </div>

                {tersedia.length === 0 ? (
                  <p className="mt-3 text-xs text-[#9aa0a6]">
                    Belum ada kegiatan yang bisa diklaim. Pastikan pengajuan eksternal & izin PA sudah disetujui.
                  </p>
                ) : (
                  <div className="mt-3 max-h-64 divide-y divide-[#e9ebf8] overflow-y-auto rounded-lg border border-[#e9ebf8]">
                    {filteredTersedia.length === 0 ? (
                      <p className="p-4 text-center text-xs text-[#9aa0a6]">Tidak ada kegiatan yang cocok.</p>
                    ) : (
                      filteredTersedia.map((k) => {
                        const id = String(k.partisipasiId)
                        const checked = selectedIds.has(id)
                        return (
                          <label
                            key={id}
                            className={`flex cursor-pointer items-start gap-3 px-4 py-3 text-sm transition ${
                              checked ? 'bg-brand-dark/5' : 'hover:bg-[#f9fafb]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5 h-4 w-4 accent-brand-dark"
                              checked={checked}
                              onChange={() => toggleSelect(k)}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-medium text-[#333]">{k.namaKegiatan}</span>
                              <span className="block truncate text-xs text-[#9aa0a6]">
                                {k.jenisKegiatan || '-'}
                              </span>
                            </span>
                          </label>
                        )
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Form per kegiatan terpilih: peran + bukti dokumen */}
              {selectedList.length > 0 && (
                <div className="space-y-4">
                  {selectedList.map((k) => {
                    const id = String(k.partisipasiId)
                    const item = itemData[id] || {}
                    const peranList = peranByKategori[k.kategoriId] || []
                    const complete = isItemComplete(id)
                    return (
                      <div
                        key={id}
                        className={`rounded-xl border bg-white p-5 shadow-sm sm:p-6 ${
                          complete ? 'border-green-200' : 'border-[#e9ebf8]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-brand-dark">{k.namaKegiatan}</p>
                            <p className="mt-0.5 text-xs text-[#9aa0a6]">{k.jenisKegiatan || '-'}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {complete && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700">
                                <CheckCircle2 className="h-3 w-3" /> Lengkap
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => removeSelected(k)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 text-red-500 transition hover:bg-red-50"
                              title="Hapus dari pilihan"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-[#222]">
                              Peran dalam Kegiatan<span className="text-red-500">*</span>
                            </label>
                            <select
                              value={item.peranUsulanId || ''}
                              onChange={(e) => handlePeranChange(id, e.target.value)}
                              className={selectCls}
                              required
                            >
                              <option value="">-- pilih peran --</option>
                              {peranList.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.nama || opt.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-[#222]">
                              Bukti Dokumen <span className="text-red-500">*</span>
                              <span className="ml-1 text-xs font-normal text-[#888]">(PDF · maks 10 MB)</span>
                            </label>
                            <div
                              className="mt-1 flex h-[46px] cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-[#d1d5db] bg-[#fafafa] px-3 transition hover:border-brand-dark hover:bg-green-50"
                              onClick={() => document.getElementById(`klaim-file-upload-${id}`)?.click()}
                            >
                              {item.buktiDokumen ? (
                                <FileText className="h-4 w-4 shrink-0 text-brand-dark" />
                              ) : (
                                <UploadCloud className="h-4 w-4 shrink-0 text-[#9aa0a6]" />
                              )}
                              <span
                                className={`truncate text-sm ${
                                  item.buktiDokumen ? 'font-semibold text-brand-dark' : 'text-[#888]'
                                }`}
                              >
                                {item.buktiDokumen ? item.buktiDokumen.name : 'Klik untuk unggah PDF'}
                              </span>
                              <input
                                id={`klaim-file-upload-${id}`}
                                type="file"
                                className="hidden"
                                accept=".pdf"
                                onChange={(e) => handleFileChange(id, e)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={loading || !isReadyToSubmit}
                  className="flex-1 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none sm:px-10"
                >
                  {loading
                    ? 'Mengirim...'
                    : selectedList.length > 1
                      ? `Klaim Poin (${selectedList.length} Kegiatan)`
                      : 'Klaim Poin'}
                </button>
                <button
                  type="button"
                  onClick={handleBatal}
                  className="flex-1 rounded-lg border border-brand-dark py-3 text-sm font-bold text-brand-dark shadow-sm transition hover:bg-brand-dark hover:text-white sm:flex-none sm:px-10"
                >
                  Batal
                </button>
              </div>
              {selectedList.length > 0 && !isReadyToSubmit && (
                <p className="text-xs text-[#9aa0a6]">
                  Lengkapi peran & bukti dokumen untuk semua kegiatan yang dipilih sebelum dapat diajukan.
                </p>
              )}
            </form>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-extrabold text-brand-dark sm:text-2xl">Klaim Poin Capaian</h2>
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="w-full rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 sm:w-auto"
              >
                + Tambah Klaim Poin
              </button>
            </div>

            <div className="rounded-xl border border-[#e9ebf8] bg-white p-3 shadow-sm sm:p-6">
              <h3 className="text-base font-bold text-brand-dark">Klaim Poin Anda</h3>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-lg border border-[#e9ebf8] px-3 py-2">
                  <Search className="h-4 w-4 shrink-0 text-[#9aa0a6]" />
                  <input type="text" placeholder="Cari kegiatan..." className="flex-1 text-sm outline-none" />
                </div>
              </div>
              <div className="mt-6">
                <DataTable columns={columns} data={data} />
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default KlaimPoinCapaian
