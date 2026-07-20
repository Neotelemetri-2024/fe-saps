import React from 'react'

function ConfirmModal({ isOpen, title, message, confirmText, cancelText, onConfirm, onCancel }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-lg text-center" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-2 text-lg font-bold text-brand-dark">{title}</h3>
        <p className="mb-6 text-sm text-[#616161]">{message}</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={onConfirm}
            className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-8 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
          >
            {confirmText || 'Submit'}
          </button>
          <button
            onClick={onCancel}
            className="rounded-lg border border-[#cfd6df] bg-white px-8 py-2.5 text-sm font-semibold text-[#616161] shadow-sm transition hover:bg-gray-50"
          >
            {cancelText || 'Batal'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal