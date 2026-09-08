import { Info } from 'lucide-react'

function InfoTooltip({ message, className = '' }) {
  return (
    <span className={`group relative inline-flex shrink-0 ${className}`}>
      <button type="button" className="btn btn-ghost btn-circle btn-xs" aria-label="Info">
        <Info className="h-4 w-4 text-primary" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 hidden w-max max-w-xs -translate-x-1/2 rounded-md bg-neutral px-3 py-2 text-left text-xs leading-snug text-neutral-content shadow group-hover:block group-focus-within:block"
      >
        {message}
      </span>
    </span>
  )
}

export default InfoTooltip
