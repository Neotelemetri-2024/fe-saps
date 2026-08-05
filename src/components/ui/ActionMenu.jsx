import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical } from 'lucide-react'

/**
 * ActionMenu — tombol titik-tiga (kebab menu) untuk kolom aksi di tabel.
 *
 * Props:
 *   items = [
 *     {
 *       label: 'Detail',
 *       icon: <Eye />,        // opsional
 *       color: 'text-blue-600', // opsional, default 'text-[#333]'
 *       hidden: false,        // opsional — jika true, item tidak dirender
 *       disabled: false,      // opsional — jika true, item tidak dirender (sesuai permintaan: aksi nonaktif disembunyikan)
 *       onClick: () => {},
 *     },
 *   ]
 *   align?: 'left' | 'right' // arah dropdown (default 'right')
 *
 * Dropdown dirender lewat portal ke document.body dengan posisi fixed berbasis
 * getBoundingClientRect, sehingga tidak terpotong oleh scroll kontainer tabel.
 */
function ActionMenu({ items = [], align = 'right' }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const btnRef = useRef(null)
  const menuRef = useRef(null)

  const visibleItems = items.filter((it) => it && !it.hidden && !it.disabled)

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (btnRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  useEffect(() => {
    const onScroll = () => setOpen(false)
    document.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const toggle = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const next = !open
    if (next && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const menuW = 168
      let left = align === 'right' ? rect.right - menuW : rect.left
      left = Math.min(left, window.innerWidth - menuW - 8)
      left = Math.max(8, left)
      setPos({ left, top: rect.bottom + 6 })
    }
    setOpen(next)
  }

  const runAction = (e, fn) => {
    e.preventDefault()
    e.stopPropagation()
    setOpen(false)
    if (typeof fn === 'function') fn()
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        title="Aksi"
        aria-label="Aksi"
        onClick={toggle}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#616161] transition hover:bg-[#f0f4f0]"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="z-50 w-[168px] overflow-hidden rounded-xl border border-[#e9ebf8] bg-white py-1 shadow-lg"
            style={{ position: 'fixed', ...pos }}
            onClick={(e) => e.stopPropagation()}
          >
            {visibleItems.length === 0 ? (
              <div className="px-3 py-2 text-xs text-[#9aa0a6]">Tidak ada aksi tersedia</div>
            ) : (
              visibleItems.map((it, i) => (
                <button
                  key={it.label ?? i}
                  type="button"
                  onClick={(e) => runAction(e, it.onClick)}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-[#f5f6f8] ${it.color || 'text-[#333]'}`}
                >
                  {it.icon && <span className="shrink-0">{it.icon}</span>}
                  <span className="truncate">{it.label}</span>
                </button>
              ))
            )}
          </div>,
          document.body,
        )}
    </>
  )
}

export default ActionMenu