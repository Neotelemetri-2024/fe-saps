import { X } from 'lucide-react'

function ConfirmModal({ isOpen, title, message, confirmText, cancelText, onConfirm, onCancel }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white px-6 py-8 text-center shadow-xl sm:px-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 text-[#333] transition hover:text-[#616161]"
          aria-label="Tutup"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="px-4 text-lg font-bold leading-snug text-[#111] sm:text-xl">{title}</h3>
        {message ? (
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#4b5563]">{message}</p>
        ) : null}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-5 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition hover:opacity-90"
          >
            {confirmText || 'Submit'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-brand-dark bg-white px-8 py-3 text-sm font-bold uppercase tracking-wide text-brand-dark transition hover:bg-[#f0f7f0]"
          >
            {cancelText || 'Batal'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
