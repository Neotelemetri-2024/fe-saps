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
        aria-label="Cari menu atau halaman"
        title="Cari menu (Tekan /)"
      >
        <Search className="h-5 w-5" />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="hidden cursor-pointer items-center gap-2.5 rounded-md border border-base-300 bg-base-100 px-3.5 py-2 text-sm text-base-content/50 transition-colors hover:border-base-content/20 hover:bg-base-200 hover:text-base-content/80 sm:flex w-56"
      title="Cari menu atau halaman (Tekan / atau Ctrl+K)"
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-left">Cari...</span>
      <kbd className="kbd kbd-sm font-mono text-xs text-base-content/60">/</kbd>
    </button>
  )
}

export function NavSearchModal({
  open,
  isOpen,
  onClose,
  menuItems = [],
  extras = [],
  extraItems = [],
}) {
  const isModalOpen = open ?? isOpen ?? false
  const resolvedExtras = extras.length ? extras : extraItems
  const dialogRef = useRef(null)
  const inputRef = useRef(null)
  const closedByProp = useRef(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isModalOpen) {
      if (!dialog.open) {
        dialog.showModal()
      }
      setQuery('')
      setSelectedIndex(0)
      requestAnimationFrame(() => {
        setTimeout(() => {
          inputRef.current?.focus()
        }, 50)
      })
    } else if (dialog.open) {
      closedByProp.current = true
      dialog.close()
    }
  }, [isModalOpen])

  const handleClose = () => {
    if (closedByProp.current) {
      closedByProp.current = false
      return
    }
    onClose?.()
  }

  const index = useMemo(() => {
    const seen = new Set()
    const items = [...flattenMenu(menuItems), ...resolvedExtras.filter(Boolean)]
    return items.filter((item) => {
      if (!item?.path || seen.has(item.path)) return false
      seen.add(item.path)
      return true
    })
  }, [menuItems, resolvedExtras])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return index
    return index.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.group && item.group.toLowerCase().includes(q)),
    )
  }, [query, index])

  // Reset selected index when search query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleSelect = (path) => {
    navigate(path)
    onClose?.()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0))
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault()
      handleSelect(results[selectedIndex]?.path || results[0].path)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose?.()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={`modal ${isModalOpen ? 'modal-open' : ''} bg-black/40 backdrop-blur-xs`}
      onClose={handleClose}
      onCancel={(e) => {
        e.preventDefault()
        onClose?.()
      }}
    >
      <div className="modal-box max-w-lg p-0 shadow-2xl">
        <div className="flex items-center gap-2 border-b border-base-300 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-base-content/50" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Cari menu, fitur, atau halaman..."
            className="w-full bg-transparent text-sm outline-hidden placeholder:text-base-content/40"
          />
          <kbd className="kbd kbd-xs font-mono text-[10px] text-base-content/50">ESC</kbd>
          <button
            type="button"
            className="btn btn-ghost btn-square btn-xs"
            onClick={onClose}
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-base-content/50">
              Tidak ada hasil untuk &ldquo;{query}&rdquo;
            </p>
          ) : (
            <ul className="menu w-full p-0 gap-0.5">
              {results.map((item, idx) => {
                const isSelected = idx === selectedIndex
                return (
                  <li key={item.path}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item.path)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        isSelected
                          ? 'bg-primary text-primary-content font-medium'
                          : 'text-base-content hover:bg-base-200'
                      }`}
                    >
                      <span className="font-medium">{item.label}</span>
                      {item.group && (
                        <span
                          className={`text-xs rounded px-1.5 py-0.5 ${
                            isSelected
                              ? 'bg-primary-content/20 text-primary-content'
                              : 'bg-base-200 text-base-content/60'
                          }`}
                        >
                          {item.group}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-base-300 px-4 py-2 text-xs text-base-content/50">
          <div className="flex items-center gap-2">
            <span>Navigasi:</span>
            <span className="flex gap-1 font-mono">
              <kbd className="kbd kbd-xs">↑</kbd>
              <kbd className="kbd kbd-xs">↓</kbd>
            </span>
            <span>Pilih:</span>
            <kbd className="kbd kbd-xs">↵</kbd>
          </div>
          <div>
            <span>Tutup:</span> <kbd className="kbd kbd-xs">ESC</kbd>
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit" onClick={onClose}>close</button>
      </form>
    </dialog>
  )
}
