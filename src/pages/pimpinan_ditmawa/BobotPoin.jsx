import { useState, useRef, useEffect } from 'react'
import { Plus, History, Pencil, X } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import {
  getMatriks,
  updateMatriks,
  getMatriksKategori,
  getMatriksSkala,
  getMatriksPeran,
  getHistoriMatriks,
} from '../../services/kurikulumService'

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

const initialSections = [
  {
    id: 's1',
    title: '1. Prestasi & Kompetisi',
    rowHeader: 'SKALA KEGIATAN',
    columns: ['Internasional', 'Nasional (Pusprenas/ DIKTISAINTEK)', 'Regional/ Provinsi', 'Internal UNAND (universitas/ fakultas)'],
    rows: [
      { label: 'JUARA 1/ EMAS', values: ['100 Poin', '90 Poin', '80 Poin', '50 Poin'] },
      { label: 'JUARA 2/ PERAK', values: ['80 Poin', '70 Poin', '60 Poin', '40 Poin'] },
      { label: 'JUARA 3/ PERUNGGU', values: ['50 Poin', '45 Poin', '40 Poin', '25 Poin'] },
      { label: 'PENGHARGAAN/ FINALIS/PESERTA', values: ['30 Poin', '25 Poin', '20 Poin', '10 Poin'] },
    ],
  },
  {
    id: 's2',
    title: '2. Organisasi',
    rowHeader: 'JABATAN',
    columns: ['SKALA UNIVERSITAS', 'SKALA FAKULTAS/ KEDEPUTIAN', 'SKALA DEPARTEMEN'],
    rows: [
      { label: 'Ketua umum/ Presiden Mahasiswa', values: ['80 Poin', '60 Poin', '40 Poin'] },
      { label: 'Pengurus Inti (sekretaris, Bendahara/ Kabid)', values: ['50 Poin', '40 Poin', '30 Poin'] },
      { label: 'Anggota Aktif/ Staff', values: ['25 Poin', '20 Poin', '15 Poin'] },
      { label: 'Ketua Panitia/ Pelaksana Event', values: ['40 Poin', '30 Poin', '20 Poin'] },
    ],
  },
  {
    id: 's3',
    title: '3. Pelatihan dan Seminar',
    rowHeader: 'JENIS KETERLIBATAN',
    columns: ['SKALA INTERNATIONAL', 'SKALA NASIONAL', 'SKALA LOKAL/ UNAND'],
    rows: [
      { label: 'Pembicara/ Narasumber/ Fasilitator', values: ['60 Poin', '50 Poin', '30 Poin'] },
      { label: 'Moderator/ Panitia Eksekutif', values: ['35 Poin', '25 Poin', '15 Poin'] },
      { label: 'Peserta Pelatihan Terstruktur', values: ['30 Poin', '20 Poin', '15 Poin'] },
      { label: 'Peserta Pelatihan Umum/ Kuliah Umum/ Webinar', values: ['15 Poin', '10 Poin', '5 Poin'] },
    ],
  },
]

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

  useEffect(() => {
    setDraft(structuredClone(section))
    setSaved(structuredClone(section))
    setEditing(false)
  }, [section.id])

  function updateDraft(updated) {
    setDraft(updated)
  }

  function updateCell(rowIdx, colIdx, newVal) {
    const updated = structuredClone(draft)
    updated.rows[rowIdx].values[colIdx] = newVal
    updateDraft(updated)
  }

  function updateRowLabel(rowIdx, newVal) {
    const updated = structuredClone(draft)
    updated.rows[rowIdx].label = newVal
    updateDraft(updated)
  }

  function updateColLabel(colIdx, newVal) {
    const updated = structuredClone(draft)
    updated.columns[colIdx] = newVal
    updateDraft(updated)
  }

  function addRow(label) {
    const updated = structuredClone(draft)
    updated.rows.push({ label, values: draft.columns.map(() => '0 Poin') })
    updateDraft(updated)
  }

  function addCol(colName) {
    const updated = structuredClone(draft)
    updated.columns.push(colName)
    updated.rows = updated.rows.map((r) => ({ ...r, values: [...r.values, '0 Poin'] }))
    updateDraft(updated)
  }

  function handleEdit() {
    setEditing(true)
  }

  function handleSimpan() {
    setSaved(structuredClone(draft))
    setEditing(false)
    onUpdate(draft)
  }

  function handleBatal() {
    setDraft(structuredClone(saved))
    setEditing(false)
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

        <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-white">
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide">
                    {draft.rowHeader}
                  </th>
                  {draft.columns.map((col, ci) => (
                    <th key={ci} className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wide">
                      <span
                        className={`block ${editing ? 'cursor-pointer hover:opacity-80' : ''}`}
                        title={editing ? 'Klik untuk mengedit' : ''}
                        onClick={() => {
                          if (!editing) return
                          setModal({
                            title: 'Edit Nama Kolom',
                            placeholder: 'Nama kolom...',
                            defaultValue: col,
                            onConfirm: (v) => updateColLabel(ci, v),
                          })
                        }}
                      >
                        {col}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {draft.rows.map((row, ri) => (
                  <tr key={ri} className="hover:bg-[#f9fafb]">
                    <td className="px-5 py-4">
                      <EditableRowLabel value={row.label} onChange={(v) => updateRowLabel(ri, v)} editing={editing} />
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
        </div>

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
              simpan
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
            placeholder="masukkan nama matriks"
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
 * API mengembalikan array kategori, masing-masing punya skala (kolom) dan peran (baris) beserta poin.
 */
function apiToSections(data) {
  if (!Array.isArray(data) || data.length === 0) return initialSections

  // Kelompokkan berdasarkan kategori
  const map = {}
  data.forEach((item) => {
    const kat = item.kategori || item.namaKategori || 'Lainnya'
    if (!map[kat]) map[kat] = { skalaSet: [], peranSet: [], poinMap: {} }
    const skala = item.skala || item.namaSkala || '-'
    const peran = item.peran || item.namaPeran || '-'
    if (!map[kat].skalaSet.includes(skala)) map[kat].skalaSet.push(skala)
    if (!map[kat].peranSet.includes(peran)) map[kat].peranSet.push(peran)
    map[kat].poinMap[`${peran}__${skala}`] = `${item.poin ?? 0} Poin`
  })

  return Object.entries(map).map(([kat, { skalaSet, peranSet, poinMap }], i) => ({
    id: `api-${i}`,
    title: `${i + 1}. ${kat}`,
    rowHeader: 'PERAN',
    columns: skalaSet,
    rows: peranSet.map((peran) => ({
      label: peran,
      values: skalaSet.map((skala) => poinMap[`${peran}__${skala}`] || '0 Poin'),
    })),
  }))
}

function BobotPoin() {
  const [sections, setSections] = useState(initialSections)
  const [loadingMatriks, setLoadingMatriks] = useState(true)
  const [showTambahMatriks, setShowTambahMatriks] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    getMatriks()
      .then((data) => {
        const converted = apiToSections(data)
        if (converted.length) setSections(converted)
      })
      .catch(() => {})
      .finally(() => setLoadingMatriks(false))
  }, [])

  async function handleUpdate(idx, updated) {
    setSections((prev) => prev.map((s, i) => (i === idx ? updated : s)))
    // Kirim perubahan poin ke API
    try {
      const payload = []
      updated.rows.forEach((row) => {
        row.values.forEach((val, ci) => {
          payload.push({
            kategori: updated.title.replace(/^\d+\.\s*/, ''),
            peran: row.label,
            skala: updated.columns[ci],
            poin: parseInt(val) || 0,
          })
        })
      })
      await updateMatriks(payload)
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
        title: `${idx}. ${namaMatriks}`,
        rowHeader: 'KATEGORI',
        columns: ['Kolom 1'],
        rows: [{ label: 'Baris 1', values: ['0 Poin'] }],
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
          <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Bobot Poin</h2>
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
            className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Edit Poin
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
