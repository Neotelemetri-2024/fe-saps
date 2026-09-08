import { Children } from 'react'
import { ArrowLeft } from 'lucide-react'
import StatusBadge from '../dashboard/StatusBadge'

export function InfoRow({ label, sublabel, value, href, multiline = false }) {
  const display = value || '—'

  return (
    <div className={`grid gap-1 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-6 ${multiline ? 'sm:items-start' : 'sm:items-baseline'}`}>
      <div>
        <p className="text-sm text-base-content/60">{label}</p>
        {sublabel ? <p className="text-xs text-base-content/40">{sublabel}</p> : null}
      </div>
      {href && value && value !== '-' ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="link link-primary break-all text-sm">
          {display}
        </a>
      ) : (
        <p className={`text-sm text-base-content ${multiline ? 'whitespace-pre-wrap leading-relaxed' : ''}`}>
          {display}
        </p>
      )}
    </div>
  )
}

export function SectionCard({ title, icon: Icon, children }) {
  const items = Children.toArray(children).filter(Boolean)

  return (
    <section className="card border border-base-300 bg-base-100">
      <div className="card-body gap-0 p-5">
        <div className="mb-4 flex items-center gap-2">
          {Icon ? <Icon className="h-4 w-4 text-primary" /> : null}
          <h3 className="text-sm font-semibold text-base-content">{title}</h3>
        </div>
        <div className="divide-y divide-base-300">
          {items.map((child, i) => (
            <div key={i} className="py-3 first:pt-0 last:pb-0">
              {child}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function DetailBackButton({ onClick, children = 'Kembali' }) {
  return (
    <button type="button" onClick={onClick} className="btn btn-ghost btn-sm -ml-2">
      <ArrowLeft className="h-4 w-4" />
      {children}
    </button>
  )
}

export function DetailHeader({ title, description, status }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-2xl font-extrabold text-base-content">{title}</h2>
        {description ? <p className="mt-1 text-sm text-base-content/60">{description}</p> : null}
      </div>
      {status ? <StatusBadge status={status} /> : null}
    </div>
  )
}

export function DecisionNote({ status, alasan, title }) {
  if (!alasan) return null

  const tone =
    status === 'ditolak' ? 'alert-error'
      : status === 'perlu_revisi' || status === 'revisi' ? 'alert-warning'
      : 'alert-info'
  const heading =
    title
    || (status === 'ditolak' ? 'Alasan penolakan'
      : status === 'perlu_revisi' || status === 'revisi' ? 'Catatan revisi'
      : 'Catatan')

  return (
    <div role="alert" className={`alert ${tone} text-sm`}>
      <div>
        <p className="font-medium">{heading}</p>
        <p className="mt-1 whitespace-pre-wrap">{alasan}</p>
      </div>
    </div>
  )
}

export function DecisionActions({
  onReject,
  onRevise,
  onApprove,
  rejectLabel = 'Tolak',
  reviseLabel = 'Minta revisi',
  approveLabel = 'Setujui',
}) {
  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      {onReject ? (
        <button type="button" onClick={onReject} className="btn btn-outline btn-error btn-sm">
          {rejectLabel}
        </button>
      ) : null}
      {onRevise ? (
        <button type="button" onClick={onRevise} className="btn btn-outline btn-warning btn-sm">
          {reviseLabel}
        </button>
      ) : null}
      {onApprove ? (
        <button type="button" onClick={onApprove} className="btn btn-primary btn-sm">
          {approveLabel}
        </button>
      ) : null}
    </div>
  )
}

export function EmptyDetail({ onBack, message = 'Data tidak ditemukan.' }) {
  return (
    <div className="space-y-4 py-16 text-center">
      <p className="text-sm text-base-content/60">{message}</p>
      <button type="button" onClick={onBack} className="btn btn-primary btn-sm">Kembali</button>
    </div>
  )
}

export function RejectForm({
  title = 'Tolak pengajuan',
  description = 'Tuliskan alasan penolakan.',
  placeholder = 'Contoh: Kegiatan tidak sesuai kriteria.',
  submitLabel = 'Tolak',
  variant = 'error',
  alasan,
  onChange,
  onSubmit,
  onCancel,
  submitting,
}) {
  const submitClass = variant === 'warning' ? 'btn btn-warning btn-sm' : 'btn btn-error btn-sm'

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-base-content">{title}</h3>
        <p className="mt-0.5 text-sm text-base-content/60">{description}</p>
      </div>
      <textarea
        className="textarea w-full"
        rows={4}
        placeholder={placeholder}
        value={alasan}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <button type="button" disabled={submitting} onClick={onCancel} className="btn btn-ghost btn-sm">
          Batal
        </button>
        <button type="button" disabled={submitting} onClick={onSubmit} className={submitClass}>
          {submitting ? 'Mengirim…' : submitLabel}
        </button>
      </div>
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
  } catch {
    return String(start)
  }
}
