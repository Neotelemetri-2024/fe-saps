import { useState } from 'react'
import { api } from '../services/api'

export default function ParticipantsImport({ kegiatanId }) {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const onFileChange = (e) => setFile(e.target.files?.[0] || null)

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      setStatus('Pilih file .xlsx atau .csv terlebih dahulu.')
      return
    }
    const form = new FormData()
    form.append('file', file)
    setLoading(true)
    setStatus('Mengunggah...')
    try {
      const res = await api.upload(`/kegiatan/${kegiatanId}/peserta/import`, form)
      setStatus(res?.message || 'Import peserta selesai.')
    } catch (err) {
      setStatus((err?.body?.message || err?.message || 'Gagal mengimpor file') + '')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card bg-base-100 p-4">
      <h3 className="text-sm font-semibold text-base-content">Import Peserta</h3>
      <form onSubmit={handleUpload} className="mt-3 space-y-3">
        <input
          type="file"
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, .xlsx"
          onChange={onFileChange}
          className="file-input file-input-sm w-full"
        />
        <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
          {loading ? 'Mengunggah...' : 'Upload & Import'}
        </button>
      </form>
      {status && <p className="mt-2 text-sm text-base-content/60">{status}</p>}
    </div>
  )
}
