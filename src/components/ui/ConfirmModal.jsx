import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

function ConfirmModal({ isOpen, title, message, confirmText, cancelText, onConfirm, onCancel, confirmClassName }) {
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
      onClose={onCancel}
      onCancel={(e) => {
        e.preventDefault()
        onCancel?.()
      }}
    >
      <div className="modal-box max-w-lg text-center">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-ghost btn-square btn-xs absolute right-3 top-3"
          aria-label="Tutup"
        >
          <X className="h-4 w-4" />
        </button>

        {title ? <h3 className="text-lg font-semibold text-base-content">{title}</h3> : null}
        {message ? (
          <p className="mt-3 text-sm leading-relaxed text-base-content/70">{message}</p>
        ) : null}

        <div className="modal-action justify-center">
          <button type="button" onClick={onConfirm} className={confirmClassName || "btn btn-primary"}>
            {confirmText || 'Submit'}
          </button>
          <button type="button" onClick={onCancel} className="btn btn-outline">
            {cancelText || 'Batal'}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  )
}

export default ConfirmModal
