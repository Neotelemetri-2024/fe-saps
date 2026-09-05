import { useNavigate } from 'react-router-dom'
import IconBadge from './IconBadge'

function StatCard({ icon, label, value, sublabel, sublink, link, action, small, iconTone = 'neutral', loading = false }) {
  const navigate = useNavigate()
  const clickable = Boolean(action) && !loading
  const showSkeleton = loading || value === '…'

  return (
    <div
      onClick={() => clickable && navigate(action)}
      className={`card bg-base-100 p-5 ${clickable ? 'cursor-pointer' : ''}`}
      aria-busy={showSkeleton || undefined}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-base-content/60">{label}</p>
          {showSkeleton ? (
            <div className={`skeleton mt-2 ${small ? 'h-5 w-28' : 'h-8 w-16'}`} />
          ) : (
            <p className={`mt-2 font-extrabold text-base-content ${small ? 'text-sm' : 'text-3xl'}`}>{value}</p>
          )}
          {sublabel && (
            <p className="mt-0.5 text-sm font-medium text-base-content/70">{sublabel}</p>
          )}
          {sublink && (
            <p className="mt-1 text-xs text-base-content/60">→ {sublink}</p>
          )}
          {link && (
            <p className="mt-2 text-xs font-medium text-primary">Lihat Detail</p>
          )}
        </div>
        {icon && (
          <IconBadge icon={icon} tone={iconTone} size="md" />
        )}
      </div>
    </div>
  )
}

export default StatCard
