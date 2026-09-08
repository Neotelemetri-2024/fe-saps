import { useState, useRef, useEffect } from 'react'
import { Database, History, Pencil, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import ConfirmModal from '../../components/ui/ConfirmModal'
import Modal from '../../components/ui/Modal'
import {
  getMatriks,
  syncMatriks,
  getAllHistoriMatriks,
  hapusKategori,
  getKurikulum,
} from '../../services/kurikulumService'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import { batalBtnClass } from '../../components/ui/buttonStyles'

function InputModal({ isOpen, title, placeholder, defaultValue = '', onConfirm, onClose }) {
  const [val, setVal] = useState(defaultValue)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setVal(defaultValue)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen, defaultValue])

  function handleConfirm() {
    if (val.trim()) { onConfirm(val.trim()); onClose() }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <input
        ref={inputRef}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm() }}
        placeholder={placeholder}
        className="input w-full"
      />
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onClose} className={batalBtnClass}>Batal</button>
        <button type="button" onClick={handleConfirm} className="btn btn-primary btn-sm">Simpan</button>
      </div>
    </Modal>
  )
}

function colName(col) {
  return typeof col === 'object' ? (col?.nama ?? '') : String(col ?? '')
}

function colId(col) {
  return typeof col === 'object' ? col?.id : undefined
}

function EditableCell({ value, onChange, editing }) {
  const [editing_, setEditing_] = useState(false)
  const [val, setVal] = useState(value ?? '')
  const inputRef = useRef(null)

  useEffect(() => { setVal(value ?? '') }, [value])
  useEffect(() => { if (editing_) inputRef.current?.focus() }, [editing_])

  function commit() {
    setEditing_(false)
    onChange(val)
  }

  if (editing_) {
    return (
      <input
        ref={inputRef}
        type="number"
        min={0}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit() }}
        className="input input-sm w-full min-w-20 text-center"
      />
    )
  }

  return (
    <span
      className={`block w-full rounded px-1 py-0.5 text-center text-sm text-base-content ${editing ? 'cursor-pointer hover:bg-base-200' : ''}`}
      onClick={() => { if (editing) setEditing_(true) }}
      title={editing ? 'Klik untuk mengedit' : ''}
    >
      {value ?? '0'}
    </span>
  )
}

function EditableRowLabel({ value, onChange, editing }) {
  const [editing_, setEditing_] = useState(false)
  const [val, setVal] = useState(value ?? '')
  const inputRef = useRef(null)

  useEffect(() => { setVal(value ?? '') }, [value])
  useEffect(() => { if (editing_) inputRef.current?.focus() }, [editing_])

  function commit() {
    setEditing_(false)
    onChange(val)
  }

  if (editing_) {
    return (
      <textarea
        ref={inputRef}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit() } }}
        rows={2}
        className="textarea textarea-sm w-full resize-none text-xs font-semibold"
      />
    )
  }

  return (
    <span
      className={`block rounded px-1 py-0.5 text-xs font-semibold uppercase text-base-content ${editing ? 'cursor-pointer hover:bg-base-200' : ''}`}
      onClick={() => { if (editing) setEditing_(true) }}
      title={editing ? 'Klik untuk mengedit' : ''}
    >
      {value ?? ''}
    </span>
  )
}

function SectionTable({ section, onUpdate, onDelete }) {
  const [modal, setModal] = useState(null)
  const [draft, setDraft] = useState(() => structuredClone(section))
  const [saved, setSaved] = useState(() => structuredClone(section))
  const [editing, setEditing] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // { type: 'row'|'col', index, label }

  // Blur input terjadi tepat sebelum klik tombol simpan, sehingga state draft
  // belum ter-render ulang. Ref ini menyimpan nilai terbaru secara sinkron.
  const draftRef = useRef(draft)

  useEffect(() => {
    const fresh = structuredClone(section)
    draftRef.current = fresh
    setDraft(fresh)
    setSaved(structuredClone(section))
    setEditing(false)
    setDeleteConfirm(null)
  }, [section])

  function updateDraft(updated) {
    draftRef.current = updated
    setDraft(updated)
  }

  function updateCell(rowIdx, colIdx, newVal) {
    const updated = structuredClone(draftRef.current)
    updated.rows[rowIdx].values[colIdx] = newVal
    updateDraft(updated)
  }

  function updateRowLabel(rowIdx, newVal) {
    const updated = structuredClone(draftRef.current)
    updated.rows[rowIdx].label = newVal
    updateDraft(updated)
  }

  function updateColLabel(colIdx, newVal) {
    const updated = structuredClone(draftRef.current)
    const prev = updated.columns[colIdx]
    updated.columns[colIdx] = typeof prev === 'object'
      ? { ...prev, nama: newVal }
      : { nama: newVal }
    updateDraft(updated)
  }

  function addRow(label) {
    const updated = structuredClone(draftRef.current)
    updated.rows.push({
      id: undefined,
      label,
      values: updated.columns.map(() => '0'),
    })
    updateDraft(updated)
  }

  function addCol(colName) {
    const updated = structuredClone(draftRef.current)
    updated.columns.push({ id: undefined, nama: colName })
    updated.rows = updated.rows.map((r) => ({ ...r, values: [...r.values, '0'] }))
    updateDraft(updated)
  }

  function deleteRow(rowIdx) {
    const updated = structuredClone(draftRef.current)
    if (updated.rows.length <= 1) {
      toast.error('Minimal harus ada 1 baris')
      return
    }
    updated.rows.splice(rowIdx, 1)
    updateDraft(updated)
  }

  function deleteCol(colIdx) {
    const updated = structuredClone(draftRef.current)
    if (updated.columns.length <= 1) {
      toast.error('Minimal harus ada 1 kolom')
      return
    }
    updated.columns.splice(colIdx, 1)
    updated.rows = updated.rows.map((r) => ({
      ...r,
      values: r.values.filter((_, i) => i !== colIdx),
    }))
    updateDraft(updated)
  }

  function handleConfirmDelete() {
    if (!deleteConfirm) return
    if (deleteConfirm.type === 'row') deleteRow(deleteConfirm.index)
    else if (deleteConfirm.type === 'col') deleteCol(deleteConfirm.index)
    else if (deleteConfirm.type === 'matriks') onDelete()
    setDeleteConfirm(null)
  }

  function handleEdit() {
    setEditing(true)
  }

  function handleSimpan() {
    const latest = draftRef.current
    setSaved(structuredClone(latest))
    setEditing(false)
    setDeleteConfirm(null)
    onUpdate(latest)
  }

  function handleBatal() {
    const restored = structuredClone(saved)
    draftRef.current = restored
    setDraft(restored)
    setEditing(false)
    setDeleteConfirm(null)
  }

  return (
    <>
      <InputModal
        isOpen={modal !== null}
        title={modal?.title ?? ''}
        placeholder={modal?.placeholder ?? ''}
        defaultValue={modal?.defaultValue ?? ''}
        onConfirm={modal?.onConfirm ?? (() => {})}
        onClose={() => setModal(null)}
      />

      <ConfirmModal
        isOpen={!!deleteConfirm}
        title={deleteConfirm?.type === 'matriks' ? 'Hapus Matriks?' : deleteConfirm?.type === 'row' ? 'Hapus Baris?' : 'Hapus Kolom?'}
        message={
          deleteConfirm?.type === 'matriks'
            ? `Seluruh data matriks "${draft.title}" akan dihapus, termasuk semua peran, skala, dan nilai poinnya. Tindakan ini tidak dapat dibatalkan. Lanjutkan?`
            : deleteConfirm?.type === 'row'
              ? `Baris "${deleteConfirm?.label}" akan dihapus beserta seluruh nilai poinnya. Lanjutkan?`
              : `Kolom "${deleteConfirm?.label}" akan dihapus beserta seluruh nilai poinnya. Lanjutkan?`
        }
        confirmText="Ya, Hapus"
        cancelText="Batal"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      <TableCard
        title={draft.title}
        description={editing ? 'Klik nama atau nilai untuk mengedit matriks.' : 'Daftar bobot poin berdasarkan peran dan skala kegiatan.'}
        headerRight={(
          <div className="flex flex-wrap gap-2">
            {!editing ? (
              <button type="button" onClick={handleEdit} className="btn btn-outline btn-primary btn-sm">
                <Pencil className="h-4 w-4" /> Edit
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setModal({ title: 'Tambah Baris', placeholder: 'Nama baris baru...', defaultValue: '', onConfirm: addRow })}
                  className="btn btn-outline btn-sm"
                ><Plus className="h-4 w-4" /> Tambah Baris</button>
                <button
                  type="button"
                  onClick={() => setModal({ title: 'Tambah Kolom', placeholder: 'Nama kolom baru...', defaultValue: '', onConfirm: addCol })}
                  className="btn btn-outline btn-sm"
                ><Plus className="h-4 w-4" /> Tambah Kolom</button>
              </>
            )}
            <button type="button" onClick={() => setDeleteConfirm({ type: 'matriks' })} className="btn btn-error btn-sm text-white">
              <Trash2 className="h-4 w-4" /> Hapus
            </button>
          </div>
        )}
      >
        <TableFrame>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="px-5 py-3.5 text-center text-xs font-bold uppercase tracking-wide">
                    {draft.rowHeader}
                  </th>
                  {draft.columns.map((col, ci) => (
                    <th key={colId(col) ?? `col-${ci}`} className="px-5 py-3.5 text-center text-xs font-bold uppercase tracking-wide">
                      <div className="flex items-start justify-center gap-2">
                        <span
                          className={`block flex-1 ${editing ? 'cursor-pointer hover:opacity-80' : ''}`}
                          title={editing ? 'Klik untuk mengedit' : ''}
                          onClick={() => {
                            if (!editing) return
                            setModal({
                              title: 'Edit Nama Kolom',
                              placeholder: 'Nama kolom...',
                              defaultValue: colName(col),
                              onConfirm: (v) => updateColLabel(ci, v),
                            })
                          }}
                        >
                          {colName(col)}
                        </span>
                        {editing && (
                          <button
                            type="button"
                            title="Hapus kolom"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteConfirm({ type: 'col', index: ci, label: colName(col) })
                            }}
                            className="shrink-0 rounded bg-base-100 p-0.5 text-red-500 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-600" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-base-300">
                {draft.rows.map((row, ri) => (
                  <tr key={ri} className="divide-x divide-base-300 hover:bg-base-200">
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <EditableRowLabel value={row.label} onChange={(v) => updateRowLabel(ri, v)} editing={editing} />
                        </div>
                        {editing && (
                          <button
                            type="button"
                            title="Hapus baris"
                            onClick={() => setDeleteConfirm({ type: 'row', index: ri, label: row.label })}
                            className="mt-0.5 shrink-0 rounded p-0.5 text-red-500 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-600" />
                          </button>
                        )}
                      </div>
                    </td>
                    {row.values.map((val, ci) => (
                      <td key={ci} className="px-5 py-4">
                        <EditableCell value={val} onChange={(v) => updateCell(ri, ci, v)} editing={editing} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TableFrame>

        {editing && (
          <div className="flex justify-end gap-2">
            <button type="button" onClick={handleBatal} className={batalBtnClass}>Batal</button>
            <button type="button" onClick={handleSimpan} className="btn btn-primary btn-sm">Simpan</button>
          </div>
        )}
      </TableCard>
    </>
  )
}

function TambahMatriksModal({ isOpen, onClose, onNext }) {
  const [nama, setNama] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) { setNama(''); setTimeout(() => inputRef.current?.focus(), 50) }
  }, [isOpen])

  if (!isOpen) return null

  function handleNext() {
    if (nama.trim()) onNext(nama.trim())
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tambah Matriks" size="md">
      <label className="mb-1.5 block text-sm font-medium text-base-content">
        Nama Matriks <span className="text-error">*</span>
      </label>
      <input
        ref={inputRef}
        value={nama}
        onChange={(e) => setNama(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleNext() }}
        placeholder="Masukkan nama matriks"
        className="input w-full"
      />
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onClose} className={batalBtnClass}>Batal</button>
        <button type="button" onClick={handleNext} className="btn btn-primary btn-sm">Selanjutnya</button>
      </div>
    </Modal>
  )
}

function HistoryModal({ isOpen, onClose }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    getAllHistoriMatriks()
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false))
  }, [isOpen])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Histori Perubahan" size="4xl">
      <div className="max-h-[65vh] overflow-y-auto pr-1">
        {loading ? (
          <div className="space-y-3" aria-label="Memuat histori">
            {[1, 2, 3].map((item) => <div key={item} className="skeleton h-20 w-full" />)}
          </div>
        ) : history.length === 0 ? (
          <div className="py-10 text-center">
            <History className="mx-auto h-8 w-8 text-base-content/30" />
            <p className="mt-2 text-sm text-base-content/50">Belum ada histori perubahan.</p>
          </div>
        ) : (
          <ul className="divide-y divide-base-300">
            {history.map((event, index) => (
              <li key={event.id || index} className="py-4 first:pt-0 last:pb-0">
                <p className="text-sm font-semibold text-base-content">
                  {event.kategori || event.kategoriNama || '-'}
                  {event.peran ? ` · ${event.peran}` : ''}
                  {event.skala ? ` · ${event.skala}` : ''}
                </p>
                <p className="mt-0.5 text-sm text-base-content/70">
                  {event.keterangan || event.desc || `${event.poinLama ?? '-'} → ${event.poinBaru ?? '-'} Poin`}
                </p>
                <p className="mt-1 text-xs text-base-content/50">
                  {event.tanggal || event.diubahPada
                    ? new Date(event.diubahPada || event.tanggal).toLocaleString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })
                    : '-'}
                  {event.oleh || event.namaPengubah ? ` • oleh ${event.oleh || event.namaPengubah}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-5 flex justify-end">
        <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">Tutup</button>
      </div>
    </Modal>
  )
}

/**
 * Konversi data matriks dari API ke format sections yang dipakai komponen.
 * Menyimpan ID kategori/peran/skala agar sync bisa create/rename dengan benar.
 */
function apiToSections(data) {
  if (!Array.isArray(data) || data.length === 0) return []

  const map = {}
  data.forEach((item) => {
    const katObj = typeof item.kategori === 'object' ? item.kategori : null
    const katNama = katObj?.nama || item.kategori || item.namaKategori || 'Lainnya'
    const katId = katObj?.id || item.kategoriId
    if (String(katNama).startsWith('(tidak digunakan)')) return

    if (!map[katNama]) {
      map[katNama] = {
        kategoriId: katId,
        skalaMap: new Map(), // nama -> {id, nama}
        peranMap: new Map(),
        poinMap: {},
      }
    }
    if (!map[katNama].kategoriId && katId) map[katNama].kategoriId = katId

    const skalaObj = typeof item.skala === 'object' ? item.skala : null
    const skalaNama = skalaObj?.nama || item.skala || item.namaSkala || '-'
    const skalaId = skalaObj?.id || item.skalaId
    if (String(skalaNama).startsWith('(tidak digunakan)')) return

    const peranObj = typeof item.peran === 'object' ? item.peran : null
    const peranNama = peranObj?.nama || item.peran || item.namaPeran || '-'
    const peranId = peranObj?.id || item.peranId
    if (String(peranNama).startsWith('(tidak digunakan)')) return

    if (!map[katNama].skalaMap.has(skalaNama)) {
      map[katNama].skalaMap.set(skalaNama, { id: skalaId, nama: skalaNama })
    }
    if (!map[katNama].peranMap.has(peranNama)) {
      map[katNama].peranMap.set(peranNama, { id: peranId, nama: peranNama })
    }
    map[katNama].poinMap[`${peranNama}__${skalaNama}`] = String(item.poin ?? 0)
  })

  return Object.entries(map).map(([kat, { kategoriId, skalaMap, peranMap, poinMap }], i) => {
    const columns = [...skalaMap.values()]
    const rows = [...peranMap.values()].map((peran) => ({
      id: peran.id,
      label: peran.nama,
      values: columns.map((skala) => poinMap[`${peran.nama}__${skala.nama}`] || '0'),
    }))
    return {
      id: `api-${kategoriId || i}`,
      kategoriId,
      title: kat,
      rowHeader: 'PERAN',
      columns,
      rows,
    }
  })
}

function BobotPoin() {
  const [sections, setSections] = useState([])
  const [loadingMatriks, setLoadingMatriks] = useState(true)
  const [showTambahMatriks, setShowTambahMatriks] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [kurikulumOptions, setKurikulumOptions] = useState([])
  const [kurikulumId, setKurikulumId] = useState('')

  const loadMatriks = (selectedId = kurikulumId) => {
    if (!selectedId) {
      setSections([])
      setLoadingMatriks(false)
      return Promise.resolve()
    }
    setLoadingMatriks(true)
    return getMatriks(selectedId)
      .then((data) => {
        setSections(apiToSections(data))
      })
      .catch(() => setSections([]))
      .finally(() => setLoadingMatriks(false))
  }

  useEffect(() => {
    getKurikulum()
      .then((list) => {
        const options = (Array.isArray(list) ? list : []).map((k) => ({
          id: k.id,
          label: `${k.nama}${k.angkatanMulai ? ` (angkatan ${k.angkatanMulai}+)` : ''}`,
          status: k.status,
        }))
        setKurikulumOptions(options)
        const preferred = options.find((k) => k.status === 'aktif') || options[0]
        if (preferred) setKurikulumId(String(preferred.id))
        else setLoadingMatriks(false)
      })
      .catch(() => setLoadingMatriks(false))
  }, [])

  useEffect(() => {
    if (kurikulumId) loadMatriks(kurikulumId)
  }, [kurikulumId])

  async function handleUpdate(idx, updated) {
    setSections((prev) => prev.map((s, i) => (i === idx ? updated : s)))
    if (!kurikulumId) {
      toast.error('Pilih kurikulum terlebih dahulu')
      return
    }
    try {
      const kategoriNama = updated.title.replace(/^\d+\.\s*/, '')
      const columns = updated.columns.map((c) => ({
        ...(colId(c) ? { id: Number(colId(c)) } : {}),
        nama: colName(c),
      }))
      const rows = updated.rows.map((r) => ({
        ...(r.id ? { id: Number(r.id) } : {}),
        nama: r.label,
      }))
      const cells = []
      updated.rows.forEach((row, ri) => {
        row.values.forEach((val, ci) => {
          const peranKey = row.id ? Number(row.id) : row.label
          const col = updated.columns[ci]
          const skalaKey = colId(col) ? Number(colId(col)) : colName(col)
          cells.push({
            peranKey,
            skalaKey,
            poin: Math.max(0, parseInt(String(val).replace(/\D/g, ''), 10) || 0),
          })
        })
      })

      const res = await syncMatriks({
        kurikulumId: Number(kurikulumId),
        ...(updated.kategoriId ? { kategoriId: Number(updated.kategoriId) } : {}),
        kategoriNama,
        columns,
        rows,
        cells,
      })

      toast.success('Bobot poin tersimpan & tersinkronisasi', {
        description: res?.message || `${cells.length} sel diperbarui`,
      })
      await loadMatriks(kurikulumId)
    } catch (err) {
      toast.error('Gagal menyimpan ke server', { description: err.message })
    }
  }

  function handleNextMatriks(namaMatriks) {
    setShowTambahMatriks(false)
    setSections((prev) => [
      ...prev,
      {
        id: `s${Date.now()}`,
        kategoriId: undefined,
        title: namaMatriks,
        rowHeader: 'PERAN',
        columns: [{ id: undefined, nama: 'Kolom 1' }],
        rows: [{ id: undefined, label: 'Baris 1', values: ['0'] }],
      },
    ])
  }

  async function handleHapusMatriks(sec) {
    if (!sec.kategoriId) {
      setSections((prev) => prev.filter((s) => s.id !== sec.id))
      toast.success(`Matriks "${sec.title}" dihapus`)
      return
    }
    try {
      await hapusKategori(sec.kategoriId)
      toast.success(`Matriks "${sec.title}" dihapus`)
      await loadMatriks()
    } catch (err) {
      toast.error('Gagal menghapus matriks', { description: err.message })
    }
  }

  return (
      <>
      <TambahMatriksModal
        isOpen={showTambahMatriks}
        onClose={() => setShowTambahMatriks(false)}
        onNext={handleNextMatriks}
      />
      <HistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-extrabold text-base-content">Bobot Poin</h2>
          <p className="mt-1 text-sm text-base-content/60">Kelola bobot poin berdasarkan kurikulum, kategori, peran, dan skala kegiatan.</p>
        </div>

        <div className="card border border-base-300 bg-base-100 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <label className="flex min-w-64 flex-col gap-1">
              <span className="text-xs text-base-content/60">Kurikulum</span>
              <select className="select select-sm w-full" value={kurikulumId} onChange={(e) => setKurikulumId(e.target.value)}>
                <option value="">Pilih kurikulum</option>
                {kurikulumOptions.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
              </select>
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setShowHistory(true)} className="btn btn-outline btn-sm">
                <History className="h-4 w-4" /> Histori Perubahan
              </button>
              <button type="button" onClick={() => setShowTambahMatriks(true)} className="btn btn-primary btn-sm" disabled={!kurikulumId}>
                <Plus className="h-4 w-4" /> Tambah Matriks
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {loadingMatriks ? (
            <div className="space-y-4" aria-label="Memuat data bobot poin">
              {[1, 2].map((item) => (
                <div key={item} className="card bg-base-100 p-6">
                  <div className="skeleton h-5 w-40" />
                  <div className="mt-5 skeleton h-44 w-full" />
                </div>
              ))}
            </div>
          ) : sections.length === 0 ? (
            <div className="rounded-lg border border-dashed border-base-300 bg-base-100 px-6 py-10 text-center">
              <Database className="mx-auto h-9 w-9 text-base-content/30" />
              <p className="mt-3 text-sm font-medium text-base-content">Belum ada matriks poin</p>
              <p className="mt-1 text-sm text-base-content/50">Tambahkan matriks pertama untuk kurikulum yang dipilih.</p>
              <button type="button" onClick={() => setShowTambahMatriks(true)} className="btn btn-primary btn-sm mt-4" disabled={!kurikulumId}>
                <Plus className="h-4 w-4" /> Tambah Matriks
              </button>
            </div>
          ) : (
            sections.map((sec, idx) => (
              <SectionTable
                key={sec.id}
                section={sec}
                onUpdate={(updated) => handleUpdate(idx, updated)}
                onDelete={() => handleHapusMatriks(sec)}
              />
            ))
          )}
        </div>
      </div>
      </>
  )
}

export default BobotPoin
