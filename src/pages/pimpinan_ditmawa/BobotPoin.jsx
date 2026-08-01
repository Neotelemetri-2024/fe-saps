import { useState, useRef, useEffect } from 'react'
import { Plus, History, Pencil, X, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import ConfirmModal from '../../components/ui/ConfirmModal'
import {
  getMatriks,
  syncMatriks,
  getHistoriMatriks,
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
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-sm font-bold text-[#222]">{title}</h4>
          <button type="button" onClick={onClose} className="text-[#999] hover:text-[#333]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <input
          ref={inputRef}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm() }}
          placeholder={placeholder}
          className="w-full rounded-lg border border-[#d1d5db] px-3 py-2 text-sm outline-none focus:border-brand-dark focus:ring-1 focus:ring-brand-dark"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#d1d5db] px-4 py-2 text-sm font-medium text-[#444] hover:bg-[#f5f5f5]"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
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
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit() }}
        className="w-full rounded border border-brand-dark px-1 py-0.5 text-sm outline-none"
      />
    )
  }

  return (
    <span
      className={`block w-full rounded px-1 py-0.5 text-sm text-[#333] ${editing ? 'cursor-pointer hover:bg-[#f0f7f0]' : ''}`}
      onClick={() => { if (editing) setEditing_(true) }}
      title={editing ? 'Klik untuk mengedit' : ''}
    >
      {value ?? ''}
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
      className={`block rounded px-1 py-0.5 text-xs font-semibold uppercase text-[#333] ${editing ? 'cursor-pointer hover:bg-[#f0f7f0]' : ''}`}
      onClick={() => { if (editing) setEditing_(true) }}
      title={editing ? 'Klik untuk mengedit' : ''}
    >
      {value ?? ''}
    </span>
  )
}

function SectionTable({ section, onUpdate }) {
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
      values: updated.columns.map(() => '0 Poin'),
    })
    updateDraft(updated)
  }

  function addCol(colName) {
    const updated = structuredClone(draftRef.current)
    updated.columns.push({ id: undefined, nama: colName })
    updated.rows = updated.rows.map((r) => ({ ...r, values: [...r.values, '0 Poin'] }))
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
    else deleteCol(deleteConfirm.index)
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
        title={deleteConfirm?.type === 'row' ? 'Hapus Baris?' : 'Hapus Kolom?'}
        message={
          deleteConfirm?.type === 'row'
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
          <h3 className="text-base font-bold text-[#222]">{draft.title}</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleEdit}
              className="flex items-center gap-1 rounded-lg border border-brand-dark px-3 py-1.5 text-xs font-medium text-brand-dark hover:bg-brand-dark hover:text-white"
            >
              <Pencil className="h-3 w-3" /> Edit Tabel
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
              className="flex items-center gap-1 rounded-lg border border-[#ccc] bg-white px-3 py-1.5 text-xs font-medium text-[#444] hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="h-3 w-3" /> Baris
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
              className="flex items-center gap-1 rounded-lg border border-[#ccc] bg-white px-3 py-1.5 text-xs font-medium text-[#444] hover:bg-[#f5f5f5] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="h-3 w-3" /> Kolom
            </button>
          </div>
        </div>

        <TableCard title="Bobot Poin">
        <TableFrame>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="divide-x divide-white/20 bg-gradient-to-r from-brand-dark to-brand-light text-white">
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
                            className="shrink-0 rounded bg-white p-0.5 text-red-500 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-600" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {draft.rows.map((row, ri) => (
                  <tr key={ri} className="divide-x divide-[#f0f0f0] hover:bg-[#f9fafb]">
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
              className="rounded-lg border border-[#d1d5db] px-5 py-2 text-sm font-medium text-[#444] hover:bg-[#f5f5f5]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSimpan}
              className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
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
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h4 className="text-lg font-bold text-[#222]">Tambah Matriks</h4>
          <button type="button" onClick={onClose} className="text-[#999] hover:text-[#333]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mb-6">
          <label className="mb-1.5 block text-sm font-semibold text-[#333]">
            Nama Matriks <span className="text-red-500">*</span>
          </label>
          <input
            ref={inputRef}
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleNext() }}
            placeholder="Masukkan nama matriks"
            className="w-full rounded-lg border border-[#d1d5db] px-3 py-2.5 text-sm outline-none focus:border-brand-dark focus:ring-1 focus:ring-brand-dark"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[#d1d5db] py-3 text-sm font-bold uppercase text-[#444] hover:bg-[#f5f5f5]"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="flex-1 rounded-xl bg-gradient-to-r from-brand-dark to-brand-light py-3 text-sm font-bold uppercase text-white hover:opacity-90"
          >
            Selanjutnya
          </button>
        </div>
      </div>
    </div>
  )
}

const HISTORY_COLORS = ['bg-green-500', 'bg-yellow-500', 'bg-indigo-500', 'bg-rose-500', 'bg-sky-500']

function HistoryModal({ isOpen, onClose }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    // Fetch histori dari endpoint pertama yang tersedia (id=1 sebagai default)
    getHistoriMatriks(1)
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false))
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-gray-700" />
            <h4 className="text-lg font-bold text-[#222]">Histori Perubahan</h4>
          </div>
          <button type="button" onClick={onClose} className="text-[#999] hover:text-[#333]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          {loading ? (
            <p className="text-sm text-[#9aa0a6]">Memuat histori...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-[#9aa0a6]">Belum ada histori perubahan.</p>
          ) : (
            <ul className="space-y-6">
              {history.map((event, index) => (
                <li key={event.id || index} className="flex items-start gap-4">
                  <div className={`mt-1 h-3 w-3 shrink-0 rounded-full ${HISTORY_COLORS[index % HISTORY_COLORS.length]}`} />
                  <div>
                    <p className="text-sm font-semibold text-[#333]">
                      {event.kategori || event.type || '-'} {event.subType ? `· ${event.subType}` : ''}
                    </p>
                    <p className="text-sm text-[#555]">
                      {event.keterangan || event.desc || `${event.nilaiLama ?? '-'} → ${event.nilaiBaru ?? '-'} Poin`}
                    </p>
                    <p className="mt-1 text-xs text-[#999]">
                      {event.tanggal || event.createdAt || event.date || '-'}
                      {event.oleh || event.by ? ` • oleh ${event.oleh || event.by}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex justify-end border-t border-[#e5e7eb] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-6 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Tutup
          </button>
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
    map[katNama].poinMap[`${peranNama}__${skalaNama}`] = `${item.poin ?? 0} Poin`
  })

  return Object.entries(map).map(([kat, { kategoriId, skalaMap, peranMap, poinMap }], i) => {
    const columns = [...skalaMap.values()]
    const rows = [...peranMap.values()].map((peran) => ({
      id: peran.id,
      label: peran.nama,
      values: columns.map((skala) => poinMap[`${peran.nama}__${skala.nama}`] || '0 Poin'),
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

  const loadMatriks = () => {
    setLoadingMatriks(true)
    return getMatriks()
      .then((data) => {
        setSections(apiToSections(data))
      })
      .catch(() => setSections([]))
      .finally(() => setLoadingMatriks(false))
  }

  useEffect(() => { loadMatriks() }, [])

  async function handleUpdate(idx, updated) {
    setSections((prev) => prev.map((s, i) => (i === idx ? updated : s)))
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
            poin: parseInt(String(val).replace(/\D/g, ''), 10) || 0,
          })
        })
      })

      const res = await syncMatriks({
        ...(updated.kategoriId ? { kategoriId: Number(updated.kategoriId) } : {}),
        kategoriNama,
        columns,
        rows,
        cells,
      })

      toast.success('Bobot poin tersimpan & tersinkronisasi', {
        description: res?.message || `${cells.length} sel diperbarui`,
      })
      await loadMatriks()
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
        rows: [{ id: undefined, label: 'Baris 1', values: ['0 Poin'] }],
      },
    ])
  }

  return (
    <DashboardLayout role="pimpinan_ditmawa" userName="Dr. Eng. Ir. Dendi Adi Saputra M, S.T, M.T" userRole="Pimpinan">
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
          <h2 className="text-2xl font-extrabold text-[#222] sm:text-3xl">Bobot Poin</h2>
          <p className="mt-1 text-sm text-[#616161]">
            Klik nilai poin untuk mengedit langsung. Tekan Enter atau klik di luar untuk konfirmasi.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowTambahMatriks(true)}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Matriks
          </button>
          <button
            type="button"
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[#ccc] bg-white px-4 py-2 text-sm font-semibold text-[#333] hover:bg-[#f5f5f5]"
          >
            <History className="h-4 w-4" />
            Histori Perubahan
          </button>
        </div>

        <div className="space-y-10">
          {loadingMatriks ? (
            <p className="text-sm text-[#9aa0a6]">Memuat data bobot poin...</p>
          ) : sections.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#d1d5db] bg-white px-6 py-10 text-center text-sm text-[#9aa0a6]">
              Belum ada data matriks poin. Klik tombol Matriks untuk menambah kategori baru.
            </p>
          ) : (
            sections.map((sec, idx) => (
              <SectionTable
                key={sec.id}
                section={sec}
                onUpdate={(updated) => handleUpdate(idx, updated)}
              />
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default BobotPoin
