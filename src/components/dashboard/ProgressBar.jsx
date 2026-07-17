function ProgressBar({ value, max = 550, height = 8, color = 'bg-brand-light', label, showPercent }) {
  const pct = Math.min(Math.round((value / max) * 100), 100)

  return (
    <div>
      {(label || showPercent) && (
        <div className="mb-1 flex items-center justify-between">
          {label && <span className="text-xs text-[#616161]">{label}</span>}
          {showPercent && <span className="text-xs font-medium text-brand-dark">{pct}%</span>}
        </div>
      )}
      <div className="w-full rounded-full bg-[#e9ebf8]" style={{ height }}>
        <div
          className={`rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%`, height }}
        />
      </div>
    </div>
  )
}

export default ProgressBar
