const toneMap = {
  brand: { box: 'bg-primary/10', text: 'text-primary' },
  success: { box: 'bg-success/10', text: 'text-success' },
  danger: { box: 'bg-error/10', text: 'text-error' },
  warning: { box: 'bg-warning/10', text: 'text-warning' },
  info: { box: 'bg-info/10', text: 'text-info' },
  neutral: { box: 'bg-base-200', text: 'text-base-content/60' },
}

const sizeMap = {
  sm: { box: 'h-8 w-8', icon: 'h-4 w-4' },
  md: { box: 'h-10 w-10', icon: 'h-5 w-5' },
  lg: { box: 'h-12 w-12', icon: 'h-6 w-6' },
}

function IconBadge({ icon, tone = 'neutral', size = 'md', rounded = 'rounded-md' }) {
  const t = toneMap[tone] || toneMap.neutral
  const s = sizeMap[size] || sizeMap.md
  return (
    <div className={`flex shrink-0 items-center justify-center ${s.box} ${rounded} ${t.box} ${t.text}`}>
      {icon}
    </div>
  )
}

export default IconBadge
