export function InfoRow({ label, sublabel, value, href, multiline = false }) {
  return (
    <div className={`flex flex-col gap-0.5 sm:flex-row sm:gap-4 ${multiline ? 'sm:items-start' : 'sm:items-baseline'}`}>
      <p className="w-full shrink-0 text-sm font-medium text-base-content sm:w-44">
        {label}
        {sublabel && <span className="mt-0.5 block text-[10px] font-normal text-base-content/40">{sublabel}</span>}
      </p>
      {href && value && value !== '-' ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="link link-primary break-all text-sm">
          {value}
        </a>
      ) : (
        <p className={`text-sm font-medium text-base-content ${multiline ? 'leading-relaxed' : ''}`}>{value || '-'}</p>
      )}
    </div>
  )
}

export function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="card bg-base-100 overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-base-300 bg-base-200 px-5 py-3.5">
        {Icon && <Icon className="h-4 w-4 text-primary" />}
        <h3 className="text-sm font-semibold text-base-content">{title}</h3>
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
    const ds = new Date(start)
    if (Number.isNaN(ds.getTime())) return String(start)
    const a = ds.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    if (!end) return a
    const de = new Date(end)
    if (Number.isNaN(de.getTime())) return a
    const b = de.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    return `${a} - ${b}`
  } catch { return String(start) }
}
