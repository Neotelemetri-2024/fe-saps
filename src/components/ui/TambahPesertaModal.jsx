import { useEffect, useRef, useState } from 'react'
import { Search, Loader2, UserPlus, X } from 'lucide-react'
import { toast } from 'sonner'
import { cariMahasiswaPeserta, tambahPesertaManual } from '../../services/kegiatanService'

function TambahPesertaModal({ isOpen, kegiatanId, onClose, onAdded }) {
  const dialogRef = useRef(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [searched, setSearched] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (isOpen) {
      if (!el.open) el.showModal()
    } else if (el.open) {
      el.close()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setResults([])
      setSelected(new Set())
      setSearched(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || query.trim().length < 2) {
      setResults([])
      setSearched(false)
      return
    }
    setSearching(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        const data = await cariMahasiswaPeserta(kegiatanId, query.trim())
        setResults(Array.isArray(data) ? data : [])
        setSearched(true)
      } catch (err) {
        toast.error('Gagal mencari mahasiswa', { description: err.message })
        setResults([])
        setSearched(true)
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timerRef.current)
  }, [query, isOpen, kegiatanId])

  const toggleSelect = (userId) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (results.length > 0 && results.every((r) => next.has(r.userId))) {
        results.forEach((r) => next.delete(r.userId))
      } else {
        results.forEach((r) => next.add(r.userId))
      }
      return next
    })
  }

  const handleAdd = async () => {
    if (selected.size === 0) return
    setAdding(true)
    let sukses = 0
    try {
      for (const userId of selected) {
        try {
          await tambahPesertaManual(kegiatanId, userId)
          sukses++
        } catch (err) {
          toast.error(err.message || 'Gagal menambahkan peserta')
        }
      }
      if (sukses > 0) {
        toast.success(`${sukses} peserta berhasil ditambahkan`)
        onAdded()
        onClose()
      }
    } finally {
      setAdding(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault()
        onClose?.()
      }}
    >
      <div className="modal-box max-w-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-base-content">Tambah Peserta Manual</h3>
          <button type="button" onClick={onClose} disabled={adding} className="btn btn-ghost btn-square btn-xs" aria-label="Tutup">
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="input w-full">
          <Search className="h-4 w-4 shrink-0 text-base-content/50" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari NIM atau nama mahasiswa…"
            autoFocus
          />
        </label>

        <div className="mt-4 max-h-72 overflow-y-auto rounded-md border border-base-300">
          {searching ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-base-content/50">
              <Loader2 className="h-4 w-4 animate-spin" /> Mencari…
            </div>
          ) : query.trim().length < 2 ? (
            <div className="py-8 text-center text-sm text-base-content/50">Ketik minimal 2 karakter NIM atau nama.</div>
          ) : !searched ? (
            <div className="py-8 text-center text-sm text-base-content/50">Mencari…</div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-sm text-base-content/50">Tidak ada mahasiswa ditemukan (semua sudah terdaftar?).</div>
          ) : (
            <div className="divide-y divide-base-300">
              <button
                type="button"
                onClick={toggleAll}
                className="flex w-full items-center justify-between bg-base-200 px-4 py-2.5 text-left text-xs font-semibold text-base-content/60"
              >
                <span>Pilih semua hasil ({results.length})</span>
              </button>
              {results.map((r) => (
                <label key={r.userId} className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-base-200">
                  <input
                    type="checkbox"
                    checked={selected.has(r.userId)}
                    onChange={() => toggleSelect(r.userId)}
                    className="checkbox checkbox-sm checkbox-primary"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-base-content">{r.nama}</p>
                    <p className="truncate text-xs text-base-content/50">
                      {r.nim} · {r.prodi} · {r.fakultas}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="modal-action items-center justify-between">
          <span className="text-xs text-base-content/50">{selected.size} mahasiswa dipilih</span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} disabled={adding} className="btn btn-ghost btn-sm">
              Batal
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={selected.size === 0 || adding}
              className="btn btn-primary btn-sm"
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {adding ? 'Menambahkan…' : 'Tambah Peserta'}
            </button>
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  )
}

export default TambahPesertaModal
