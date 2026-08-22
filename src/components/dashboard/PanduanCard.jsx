import { Download, Eye } from 'lucide-react'
import { toast } from 'sonner'

function PanduanCard({ title, description, fileUrl, className = '' }) {
  const handleDownload = () => {
    if (fileUrl) {
      const link = document.createElement('a')
      link.href = fileUrl
      link.download = ''
      link.click()
    } else {
      toast.info('Panduan belum tersedia', { description: 'File panduan akan segera diunggah.' })
    }
  }

  const handleView = () => {
    if (fileUrl) {
      window.open(fileUrl, '_blank', 'noopener,noreferrer')
    } else {
      toast.info('Panduan belum tersedia', { description: 'File panduan akan segera diunggah.' })
    }
  }

  return (
    <div className={`rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm ${className}`}>
      <h3 className="text-base font-bold text-[#1f2937]">{title}</h3>
      {description && <p className="mt-1 text-sm text-[#616161]">{description}</p>}

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={handleDownload}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-dark px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Download className="h-4 w-4" /> Download
        </button>
        <button
          type="button"
          onClick={handleView}
          title="Lihat Panduan"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-blue-600 transition hover:bg-[#f0f4f0]"
        >
          <Eye className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default PanduanCard
