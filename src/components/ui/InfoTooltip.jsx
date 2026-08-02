import { useState } from 'react'
import { Info } from 'lucide-react'

/**
 * Tombol ikon info kecil yang menampilkan pesan singkat saat di-hover/klik.
 * Menggantikan banner besar untuk info non-krusial (mis. aturan status draft).
 */
function InfoTooltip({ message, className = '' }) {
  const [open, setOpen] = useState(false)

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="flex h-6 w-6 items-center justify-center rounded-full text-brand-dark transition hover:bg-[#f1f2f4]"
        aria-label="Info"
      >
        <Info className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-xl border border-[#dddee3] bg-white p-3 text-xs leading-relaxed text-[#454545] shadow-lg sm:w-72">
          {message}
        </div>
      )}
    </span>
  )
}

export default InfoTooltip
