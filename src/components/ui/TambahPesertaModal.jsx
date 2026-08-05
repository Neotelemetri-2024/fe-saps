import { useEffect, useRef, useState } from 'react'
import { Search, Loader2, UserPlus, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cariMahasiswaPeserta, tambahPesertaManual } from '../../services/kegiatanService'

/**
 * TambahPesertaModal — modal pencarian & penambahan peserta secara manual.
 *
 * Props:
 *   isOpen: boolean
 *   kegiatanId: number|string
 *   onClose: () => void
 *   onAdded: () => void   // dipanggil setelah 1+ peserta berhasil ditambahkan
 */
function TambahPesertaModal({ isOpen, kegiatanId, onClose, onAdded }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [searched, setSearched] = useState(false)
  const timerRef = useRef(null)

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

  if (!isOpen) return null

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#222]">Tambah Peserta Manual</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={adding}
            className="text-xl leading-none text-[#9aa0a6] hover:text-[#333] disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0a6]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari NIM atau nama mahasiswa…"
            autoFocus
            className="w-full rounded-lg border border-[#d9dce7] py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-dark"
          />
        </div>

        <div className="mt-4 max-h-72 overflow-y-auto rounded-lg border border-[#e9ebf8]">
          {searching ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-[#9aa0a6]">
              <Loader2 className="h-4 w-4 animate-spin" /> Mencari…
            </div>
          ) : query.trim().length < 2 ? (
            <div className="py-8 text-center text-sm text-[#9aa0a6]">Ketik minimal 2 karakter NIM atau nama.</div>
          ) : !searched ? (
            <div className="py-8 text-center text-sm text-[#9aa0a6]">Mencari…</div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#9aa0a6]">Tidak ada mahasiswa ditemukan (semua sudah terdaftar?).</div>
          ) : (
            <div className="divide-y divide-[#f0f0f0]">
              <button
                type="button"
                onClick={toggleAll}
                className="flex w-full items-center justify-between bg-[#f9fafb] px-4 py-2.5 text-left text-xs font-semibold text-[#616161] hover:bg-[#f0f4f0]"
              >
                <span>Pilih semua hasil ({results.length})</span>
                {results.every((r) => selected.has(r.userId)) && <Check className="h-4 w-4 text-brand-dark" />}
              </button>
              {results.map((r) => (
                <label key={r.userId} className="flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-[#f9fafb]">
                  <input
                    type="checkbox"
                    checked={selected.has(r.userId)}
                    onChange={() => toggleSelect(r.userId)}
                    className="h-4 w-4 shrink-0 cursor-pointer accent-brand-dark"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#222]">{r.nama}</p>
                    <p className="truncate text-xs text-[#9aa0a6]">
                      {r.nim} · {r.prodi} · {r.fakultas}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="text-xs text-[#9aa0a6]">{selected.size} mahasiswa dipilih</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={adding}
              className="rounded-lg border border-[#d9dce7] px-4 py-2 text-sm font-semibold text-[#616161] hover:bg-[#f5f6f8] disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={selected.size === 0 || adding}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2 text-sm font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {adding ? 'Menambahkan…' : 'Tambah Peserta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TambahPesertaModal