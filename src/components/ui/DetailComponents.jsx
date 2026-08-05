export function InfoRow({ label, sublabel, value, href, multiline = false }) {
  return (
    <div className={`flex flex-col gap-0.5 sm:flex-row sm:gap-4 ${multiline ? 'sm:items-start' : 'sm:items-baseline'}`}>
      <p className="w-full shrink-0 text-sm font-medium text-[#111] sm:w-44">
        {label}
        {sublabel && <span className="mt-0.5 block text-[10px] font-normal normal-case tracking-normal text-[#b3b8c2]">{sublabel}</span>}
      </p>
      {href && value && value !== '-' ? (
        <a href={href} target="_blank" rel="noopener noreferrer"
          className="break-all text-sm text-brand-dark underline hover:opacity-75">{value}</a>
      ) : (
        <p className={`text-sm font-medium text-[#111] ${multiline ? 'leading-relaxed' : ''}`}>{value || '-'}</p>
      )}
    </div>
  )
}

export function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="rounded-xl border border-[#e9ebf8] bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-[#e9ebf8] bg-[#f9fafb] px-5 py-3.5">
        {Icon && <Icon className="h-4 w-4 text-brand-dark" />}
        <h3 className="text-sm font-bold text-brand-dark">{title}</h3>
      </div>
      <div className="space-y-3.5 p-5">{children}</div>
    </div>
  )
}

export function mapUiStatus(status) {
  const s = String(status || '').toLowerCase()
  if (['diajukan', 'pending'].includes(s)) return 'pending'
  if (['terverifikasi'].includes(s)) return 'diteruskan'
  if (['perlu_revisi', 'revisi'].includes(s)) return 'revisi'
  if (['ditolak'].includes(s)) return 'ditolak'
  if (['disetujui', 'terpublikasi'].includes(s)) return 'disetujui'
  return s || 'pending'
}

export function formatTanggal(start, end) {
  if (!start) return '-'
  try {
    const a = new Date(start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    if (!end) return a
    const b = new Date(end).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    return `${a} - ${b}`
  } catch { return String(start) }
}
