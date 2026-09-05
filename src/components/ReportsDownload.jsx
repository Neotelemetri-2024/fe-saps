import { useState } from 'react'
import { getAuthToken } from '../services/auth'
import { api } from '../services/api'

export default function ReportsDownload() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const preview = async () => {
    try {
      const res = await api.get('/pimpinan/laporan/preview')
      setMessage('Preview berhasil dimuat.')
      console.log('Preview:', res.data || res)
    } catch {
      setMessage('Gagal memuat preview')
    }
  }

  const download = async (type) => {
    setLoading(true)
    setMessage('Mempersiapkan unduhan...')
    try {
      const token = getAuthToken()
      const resp = await fetch(`/api/pimpinan/laporan/${type}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      })
      if (!resp.ok) throw new Error(`Server error ${resp.status}`)
      const blob = await resp.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      const ext = type === 'excel' ? 'xlsx' : type === 'pdf' ? 'pdf' : 'json'
      a.href = url
      a.download = `laporan_pimpinan.${ext}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      setMessage('Unduhan selesai. Periksa folder unduhan Anda.')
    } catch (err) {
      console.error(err)
      setMessage('Gagal mengunduh laporan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card bg-base-100 p-4">
      <h3 className="text-sm font-semibold text-base-content">Laporan Pimpinan</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={preview} className="btn btn-outline btn-sm">Preview (JSON)</button>
        <button type="button" onClick={() => download('excel')} disabled={loading} className="btn btn-primary btn-sm">
          Download Excel
        </button>
        <button type="button" onClick={() => download('pdf')} disabled={loading} className="btn btn-outline btn-error btn-sm">
          Download PDF
        </button>
      </div>
      {message && <p className="mt-2 text-sm text-base-content/60">{message}</p>}
    </div>
  )
}
