import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

const SIZE_CLASS = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
}

function Modal({ isOpen, onClose, title, children, size = 'lg' }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (isOpen) {
      if (!el.open) el.showModal()
    } else if (el.open) {
      el.close()
    }
  }, [isOpen])

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
      <div className={`modal-box ${SIZE_CLASS[size] || SIZE_CLASS.lg}`}>
        {(title || onClose) && (
          <div className="mb-4 flex items-center justify-between">
            {title ? <h3 className="text-lg font-semibold text-base-content">{title}</h3> : <span />}
            <button type="button" onClick={onClose} className="btn btn-ghost btn-square btn-xs" aria-label="Tutup">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {children}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  )
}

export default Modal
