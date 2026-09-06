const TONE = {
  success: 'badge-success',
  warning: 'badge-warning',
  error: 'badge-error',
  info: 'badge-info',
  neutral: 'badge-neutral',
}

const statusConfig = {
  draft: { tone: 'neutral', label: 'Draft' },
  diajukan: { tone: 'info', label: 'Diajukan' },
  diajukan_ulang: { tone: 'info', label: 'Diajukan Ulang' },
  terverifikasi: { tone: 'info', label: 'Menunggu Persetujuan' },
  perlu_revisi: { tone: 'warning', label: 'Perlu Revisi' },
  revisi: { tone: 'warning', label: 'Revisi' },
  disetujui: { tone: 'success', label: 'Disetujui' },
  ditolak: { tone: 'error', label: 'Ditolak' },
  terpublikasi: { tone: 'success', label: 'Disetujui' },
  dipublikasikan: { tone: 'success', label: 'Dipublikasikan' },
  berlangsung: { tone: 'success', label: 'Berlangsung' },
  selesai: { tone: 'neutral', label: 'Selesai' },
  diarsipkan: { tone: 'neutral', label: 'Diarsipkan' },
  dibatalkan: { tone: 'error', label: 'Dibatalkan' },
  diteruskan: { tone: 'info', label: 'Diteruskan' },
  pending: { tone: 'warning', label: 'Pending' },
  belum_diklaim: { tone: 'warning', label: 'Belum Diklaim' },
  menunggu: { tone: 'info', label: 'Menunggu' },
  aktif: { tone: 'success', label: 'Aktif' },
  'sudah tercatat': { tone: 'success', label: 'Sudah Tercatat' },
  'belum tercatat': { tone: 'info', label: 'Belum Tercatat' },
  tercapai: { tone: 'success', label: 'Tercapai' },
  belum_tercapai: { tone: 'warning', label: 'Belum Tercapai' },
  'belum tercapai': { tone: 'warning', label: 'Belum Tercapai' },
  sah: { tone: 'success', label: 'Sah' },
  lulus: { tone: 'success', label: 'Lulus' },
  baik: { tone: 'success', label: 'Baik' },
  on_track: { tone: 'success', label: 'On Track' },
  perlu_perhatian: { tone: 'error', label: 'Perlu Perhatian' },
  belum_lulus: { tone: 'warning', label: 'Belum memenuhi syarat' },
}

function StatusBadge({ status }) {
  const key = String(status || '').toLowerCase()
  const cfg = statusConfig[key] || {
    tone: 'warning',
    label: status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending',
  }
  return (
    <span className={`badge badge-sm h-auto shrink-0 overflow-visible whitespace-nowrap ${TONE[cfg.tone] || TONE.neutral}`}>
      {cfg.label}
    </span>
  )
}

export default StatusBadge
