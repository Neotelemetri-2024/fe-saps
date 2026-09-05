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
 *       icon: <Eye />,
 *       color: 'text-primary',
 *       hidden: false,
 *       disabled: false,
 *       onClick: () => {},
 *     },
 *   ]
 *   align?: 'left' | 'right'
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
        className="btn btn-ghost btn-square btn-xs"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open &&
        createPortal(
          <ul
            ref={menuRef}
            className="menu z-50 w-[168px] rounded-md border border-base-300 bg-base-100 p-1 shadow-md"
            style={{ position: 'fixed', ...pos }}
            onClick={(e) => e.stopPropagation()}
          >
            {visibleItems.length === 0 ? (
              <li className="px-3 py-2 text-xs text-base-content/50">Tidak ada aksi tersedia</li>
            ) : (
              visibleItems.map((it, i) => (
                <li key={it.label ?? i}>
                  <button
                    type="button"
                    onClick={(e) => runAction(e, it.onClick)}
                    className={it.color || 'text-base-content'}
                  >
                    {it.icon}
                    <span className="truncate">{it.label}</span>
                  </button>
                </li>
              ))
            )}
          </ul>,
          document.body,
        )}
    </>
  )
}

export default ActionMenu
