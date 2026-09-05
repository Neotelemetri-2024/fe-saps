import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'

function flattenMenu(menuItems = []) {
  const items = []
  for (const item of menuItems) {
    if (item.children?.length) {
      for (const child of item.children) {
        if (child.path && child.path !== '#') {
          items.push({ label: child.label, path: child.path, group: item.label })
        }
      }
    } else if (item.path && item.path !== '#') {
      items.push({ label: item.label, path: item.path, group: null })
    }
  }
  return items
}

export function NavSearchTrigger({ onOpen, iconOnly = false }) {
  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="btn btn-ghost btn-square btn-sm sm:hidden"
        aria-label="Cari"
      >
        <Search className="h-5 w-5" />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="hidden items-center gap-2.5 rounded-md border border-base-300 bg-base-100 px-3.5 py-2 text-sm text-base-content/50 hover:bg-base-200 hover:text-base-content/70 sm:flex w-56"
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-left">Cari...</span>
      <kbd className="kbd kbd-sm">/</kbd>
    </button>
  )
}

export function NavSearchModal({ open, onClose, menuItems = [], extras = [] }) {
  const dialogRef = useRef(null)
  const inputRef = useRef(null)
  const closedByProp = useRef(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
      requestAnimationFrame(() => {
        setQuery('')
        inputRef.current?.focus()
      })
    } else if (!open && dialog.open) {
      closedByProp.current = true
      dialog.close()
    }
  }, [open])

  const handleClose = () => {
    if (closedByProp.current) {
      closedByProp.current = false
      return
    }
    onClose()
  }

  const index = useMemo(() => {
    const seen = new Set()
    const items = [...flattenMenu(menuItems), ...extras.filter(Boolean)]
    return items.filter((item) => {
      if (!item?.path || seen.has(item.path)) return false
      seen.add(item.path)
      return true
    })
  }, [menuItems, extras])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return index
    return index.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.group && item.group.toLowerCase().includes(q)),
    )
  }, [query, index])

  const handleSelect = (path) => {
    navigate(path)
    onClose()
  }

  return (
    <dialog ref={dialogRef} className="modal" onClose={handleClose}>
      <div className="modal-box max-w-lg p-0">
        <div className="flex items-center gap-2 border-b border-base-300 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-base-content/50" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && results.length > 0) handleSelect(results[0].path)
              if (e.key === 'Escape') onClose()
            }}
            placeholder="Cari menu atau halaman..."
            className="w-full bg-transparent text-sm outline-hidden placeholder:text-base-content/40"
          />
          <button type="button" className="btn btn-ghost btn-square btn-xs" onClick={onClose} aria-label="Tutup">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-base-content/50">
              Tidak ada hasil untuk “{query}”
            </p>
          ) : (
            <ul className="menu w-full p-0">
              {results.map((item) => (
                <li key={item.path}>
                  <button
                    type="button"
                    onClick={() => handleSelect(item.path)}
                    className="flex items-center justify-between gap-3"
                  >
                    <span>{item.label}</span>
                    {item.group && (
                      <span className="text-xs font-normal text-base-content/50">{item.group}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  )
}
