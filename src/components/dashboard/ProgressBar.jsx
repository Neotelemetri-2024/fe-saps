function progressTone(color = '') {
  const c = String(color)
  if (c.includes('emerald') || c.includes('success') || c.includes('green')) return 'progress-success'
  if (c.includes('amber') || c.includes('warning') || c.includes('yellow')) return 'progress-warning'
  if (c.includes('red') || c.includes('error')) return 'progress-error'
  return 'progress-primary'
}

function ProgressBar({ value, max = 550, height = 8, color = 'bg-brand-light', label, showPercent }) {
  const pct = Math.min(Math.round((value / max) * 100), 100)

  return (
    <div>
      {(label || showPercent) && (
        <div className="mb-1 flex items-center justify-between">
          {label && <span className="text-xs text-base-content/60">{label}</span>}
          {showPercent && <span className="text-xs font-medium text-base-content">{pct}%</span>}
        </div>
      )}
      <progress
        className={`progress ${progressTone(color)} w-full`}
        value={pct}
        max={100}
        style={{ height }}
      />
    </div>
  )
}

export default ProgressBar
