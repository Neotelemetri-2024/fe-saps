import React, { useState } from 'react'
import Swal from 'sweetalert2'

function RevisiTolakModal({ isOpen, onClose, kegiatan, actionType }) {
  const [alasan, setAlasan] = useState('')

  const title = actionType === 'revisi' ? 'Revisi Pengajuan' : 'Tolak Pengajuan'
  const buttonText = actionType === 'revisi' ? 'KIRIM ALASAN' : 'KIRIM ALASAN' // Same for both, per image

  const handleKirimAlasan = () => {
    if (alasan.trim() === '') {
      Swal.fire({
        icon: 'error',
        title: 'Gagal!',
        text: 'Alasan tidak boleh kosong.',
        confirmButtonColor: '#1C4122',
      })
      return
    }

    Swal.fire({
      icon: 'success',
      title: 'Berhasil!',
      text: `Kegiatan "${kegiatan}" berhasil di${actionType} dengan alasan: "${alasan}"`,
      confirmButtonColor: '#1C4122',
    })
    setAlasan('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <h3 className="mb-6 text-lg font-bold text-brand-dark">{title}</h3>
        <p className="mb-2 text-sm font-medium text-black">Alasan {actionType === 'revisi' ? 'Revisi' : 'Tolak'}<span className="text-red-500">*</span></p>
        <textarea
          className="w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
          rows="4"
          placeholder={actionType === 'revisi' ? 'Alasan revisi...' : 'Tidak sesuai dengan kriteria yang ada'}
          value={alasan}
          onChange={(e) => setAlasan(e.target.value)}
          maxLength={500}
        ></textarea>
        <p className="text-right text-xs text-[#616161] mt-1">{alasan.length}/500</p>

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={handleKirimAlasan}
            className={`rounded-xl px-6 py-3 text-white font-semibold shadow-md transition hover:opacity-90 ${actionType === 'revisi' ? 'bg-orange-500' : 'bg-red-700'}`}
          >
            {buttonText}
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-400 px-6 py-3 text-gray-700 font-semibold shadow-md transition hover:bg-gray-100"
          >
            BATAL
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
  )
}

export default RevisiTolakModal