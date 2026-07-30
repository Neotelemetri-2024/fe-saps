const toneMap = {
  brand:   { bg: 'bg-[#eaf5ec]', text: 'text-brand-dark' },
  success: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  danger:  { bg: 'bg-red-50',     text: 'text-red-600' },
  warning: { bg: 'bg-amber-50',   text: 'text-amber-600' },
  info:    { bg: 'bg-blue-50',    text: 'text-blue-600' },
  neutral: { bg: 'bg-[#f0f4f0]',  text: 'text-[#616161]' },
}

const sizeMap = {
  sm: { box: 'h-8 w-8', icon: 'h-4 w-4' },
  md: { box: 'h-10 w-10', icon: 'h-5 w-5' },
  lg: { box: 'h-12 w-12', icon: 'h-6 w-6' },
}

function IconBadge({ icon, tone = 'neutral', size = 'md', rounded = 'rounded-lg' }) {
  const t = toneMap[tone] || toneMap.neutral
  const s = sizeMap[size] || sizeMap.md
  return (
    <div className={`flex shrink-0 items-center justify-center ${s.box} ${rounded} ${t.bg} ${t.text}`}>
      {icon}
    </div>
  )
}

export default IconBadge
