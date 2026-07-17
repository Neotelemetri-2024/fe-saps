import React, { useState } from 'react'
import Swal from 'sweetalert2'
import RevisiTolakModal from './RevisiTolakModal'

function SetujuiKegiatanModal({ isOpen, onClose, kegiatan }) {
  const [revisiTolakModalOpen, setRevisiTolakModalOpen] = useState(false)
  const [revisiTolakActionType, setRevisiTolakActionType] = useState(null)

  const handleAction = (actionType) => {
    if (actionType === 'revisi' || actionType === 'tolak') {
      setRevisiTolakActionType(actionType)
      setRevisiTolakModalOpen(true)
      return
    }

    // SETUJU — langsung
    Swal.fire({
      icon: 'success',
      title: 'Disetujui!',
      text: `Kegiatan "${kegiatan}" berhasil disetujui.`,
      confirmButtonColor: '#1C4122',
    })
    onClose()
  }

  const handleRevisiTolakClose = () => {
    setRevisiTolakModalOpen(false)
    setRevisiTolakActionType(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-lg text-center">
          <h3 className="mb-6 text-lg font-bold text-brand-dark">Setujui Kegiatan dari Mahasiswa</h3>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => handleAction('setuju')}
              className="flex-1 rounded-xl bg-green-700 px-6 py-3 text-white font-semibold shadow-md transition hover:opacity-90"
            >
              SETUJU
            </button>
            <button
              onClick={() => handleAction('revisi')}
              className="flex-1 rounded-xl bg-orange-500 px-6 py-3 text-white font-semibold shadow-md transition hover:opacity-90"
            >
              REVISI
            </button>
            <button
              onClick={() => handleAction('tolak')}
              className="flex-1 rounded-xl bg-red-700 px-6 py-3 text-white font-semibold shadow-md transition hover:opacity-90"
            >
              TOLAK
            </button>
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <RevisiTolakModal
        isOpen={revisiTolakModalOpen}
        onClose={handleRevisiTolakClose}
        kegiatan={kegiatan}
        actionType={revisiTolakActionType}
      />
    </>
  )
}

export default SetujuiKegiatanModal