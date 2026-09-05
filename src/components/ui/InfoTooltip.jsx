import { Info } from 'lucide-react'

function InfoTooltip({ message, className = '' }) {
  return (
    <span className={`tooltip tooltip-bottom ${className}`} data-tip={message}>
      <button type="button" className="btn btn-ghost btn-circle btn-xs" aria-label="Info">
        <Info className="h-4 w-4 text-primary" />
      </button>
    </span>
  )
}

export default InfoTooltip
