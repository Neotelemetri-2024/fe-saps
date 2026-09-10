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
  '5xl': 'max-w-5xl',
}

function Modal({ isOpen, onClose, title, description, children, size = 'lg' }) {
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
      className={`modal modal-bottom sm:modal-middle bg-black/40 backdrop-blur-xs transition-all duration-200 ${isOpen ? 'modal-open' : ''}`}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault()
        onClose?.()
      }}
    >
      <div
        className={`modal-box relative p-5 sm:p-6 rounded-xl shadow-xl border border-base-200 bg-base-100 ${
          SIZE_CLASS[size] || SIZE_CLASS.lg
        }`}
      >
        {(title || onClose) && (
          <div className="mb-4 flex items-start justify-between gap-3 border-b border-base-200 pb-3">
            <div>
              {title ? (
                <h3 className="text-base sm:text-lg font-semibold text-base-content">
                  {title}
                </h3>
              ) : null}
              {description ? (
                <p className="mt-0.5 text-xs text-base-content/60 leading-relaxed sm:text-sm">
                  {description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-circle btn-xs text-base-content/40 hover:text-base-content hover:bg-base-200"
              aria-label="Tutup"
            >
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
