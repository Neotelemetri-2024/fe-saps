import { useState, useRef, useEffect } from 'react'
import { History, X, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import ConfirmModal from '../../components/ui/ConfirmModal'
import {
  getMatriks,
  syncMatriks,
  getAllHistoriMatriks,
  hapusKategori,
  getKurikulum,
} from '../../services/kurikulumService'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'

function InputModal({ isOpen, title, placeholder, defaultValue = '', onConfirm, onClose }) {
  const [val, setVal] = useState(defaultValue)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setVal(defaultValue)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen, defaultValue])

  if (!isOpen) return null

  function handleConfirm() {
    if (val.trim()) { onConfirm(val.trim()); onClose() }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-base-100 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-sm font-bold text-base-content">{title}</h4>
          <button type="button" onClick={onClose} className="text-base-content/50 hover:text-base-content">
            <X className="h-4 w-4" />
          </button>
        </div>
        <input
          ref={inputRef}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm() }}
          placeholder={placeholder}
          className="input w-full"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-base-300 px-4 py-2 text-sm font-medium text-base-content/80 hover:bg-base-200"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn btn-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
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
        className="w-full rounded border border-brand-dark px-1 py-0.5 text-center text-sm outline-none"
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
        className="w-full resize-none rounded border border-brand-dark px-1 py-0.5 text-xs font-semibold outline-none"
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

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold text-base-content">{draft.title}</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleEdit}
              className="flex items-center gap-1 rounded-lg border border-brand-dark px-3 py-1.5 text-xs font-medium text-brand-dark hover:bg-brand-dark hover:text-white"
            >Edit Tabel
            </button>
            <button
              type="button"
              onClick={() => setDeleteConfirm({ type: 'matriks' })}
              className="flex items-center gap-1 rounded-lg border border-red-300 bg-base-100 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
            ><Trash2 className="h-3.5 w-3.5" /> Hapus Matriks
            </button>
            <button
              type="button"
              disabled={!editing}
              onClick={() => setModal({
                title: 'Tambah Baris',
                placeholder: 'Nama baris baru...',
                defaultValue: '',
                onConfirm: addRow,
              })}
              className="flex items-center gap-1 rounded-lg border border-base-300 bg-base-100 px-3 py-1.5 text-xs font-medium text-base-content/80 hover:bg-base-200 disabled:opacity-40 disabled:cursor-not-allowed"
            ><Plus className="h-3.5 w-3.5" /> Tambah Baris
            </button>
            <button
              type="button"
              disabled={!editing}
              onClick={() => setModal({
                title: 'Tambah Kolom',
                placeholder: 'Nama kolom baru...',
                defaultValue: '',
                onConfirm: addCol,
              })}
              className="flex items-center gap-1 rounded-lg border border-base-300 bg-base-100 px-3 py-1.5 text-xs font-medium text-base-content/80 hover:bg-base-200 disabled:opacity-40 disabled:cursor-not-allowed"
            ><Plus className="h-3.5 w-3.5" /> Tambah Kolom
            </button>
          </div>
        </div>

        <TableCard title="Bobot Poin">
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
        </TableFrame></TableCard>

        {editing && (
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleBatal}
              className="rounded-lg border border-base-300 px-5 py-2 text-sm font-medium text-base-content/80 hover:bg-base-200"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSimpan}
              className="btn btn-primary px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Simpan
            </button>
          </div>
        )}
      </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-base-100 p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h4 className="text-lg font-bold text-base-content">Tambah Matriks</h4>
          <button type="button" onClick={onClose} className="text-base-content/50 hover:text-base-content">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mb-6">
          <label className="mb-1.5 block text-sm font-semibold text-base-content">
            Nama Matriks <span className="text-red-500">*</span>
          </label>
          <input
            ref={inputRef}
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleNext() }}
            placeholder="Masukkan nama matriks"
            className="input w-full"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-base-300 py-3 text-sm font-bold uppercase text-base-content/80 hover:bg-base-200"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="btn btn-primary flex-1 py-3 text-sm font-bold uppercase text-white hover:opacity-90"
          >
            Selanjutnya
          </button>
        </div>
      </div>
    </div>
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-base-100">
      <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between border-b border-base-300 pb-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-base-content/60" />
            <h4 className="text-lg font-bold text-base-content">Histori Perubahan</h4>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-base-300 bg-base-100 px-4 py-2 text-sm font-semibold text-base-content/80 transition hover:bg-base-200">
            Tutup
          </button>
        </div>
        <div className="flex-1 py-6">
          {loading ? (
            <p className="text-sm text-base-content/50">Memuat histori...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-base-content/50">Belum ada histori perubahan.</p>
          ) : (
            <ul className="space-y-6">
              {history.map((event, index) => (
                <li key={event.id || index} className="flex items-start gap-4 card bg-base-100 p-4">
                  <div className="min-w-0 flex-1">
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
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
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
      title: `${i + 1}. ${kat}`,
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
        if (preferred) {
          setKurikulumId(String(preferred.id))
          return loadMatriks(preferred.id)
        }
        setLoadingMatriks(false)
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
    const idx = sections.length + 1
    setSections((prev) => [
      ...prev,
      {
        id: `s${Date.now()}`,
        kategoriId: undefined,
        title: `${idx}. ${namaMatriks}`,
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
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-extrabold text-base-content sm:text-3xl">Bobot Poin</h2>
          <p className="mt-1 text-sm text-base-content/60">
            Klik nilai poin untuk mengedit langsung. Tekan Enter atau klik di luar untuk konfirmasi.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex min-w-56 flex-col gap-1">
            <span className="text-xs text-base-content/60">Kurikulum</span>
            <select
              className="select select-sm"
              value={kurikulumId}
              onChange={(e) => setKurikulumId(e.target.value)}
            >
              <option value="">Pilih kurikulum</option>
              {kurikulumOptions.map((k) => (
                <option key={k.id} value={k.id}>{k.label}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => setShowTambahMatriks(true)}
            className="btn btn-primary btn-sm px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >Matriks
          </button>
          <button
            type="button"
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 rounded-lg border border-base-300 bg-base-100 px-4 py-2 text-sm font-semibold text-base-content hover:bg-base-200"
          >Histori Perubahan
          </button>
        </div>

        <div className="space-y-10">
          {loadingMatriks ? (
            <p className="text-sm text-base-content/50">Memuat data bobot poin...</p>
          ) : sections.length === 0 ? (
            <p className="rounded-xl border border-dashed border-base-300 bg-base-100 px-6 py-10 text-center text-sm text-base-content/50">
              Belum ada data matriks poin. Klik tombol Matriks untuk menambah kategori baru.
            </p>
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
