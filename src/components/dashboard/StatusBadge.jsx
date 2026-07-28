const statusConfig = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500', label: 'Draft' },
  diajukan: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500', label: 'Diajukan' },
  terverifikasi: { bg: 'bg-indigo-100', text: 'text-indigo-800', dot: 'bg-indigo-500', label: 'Terverifikasi' },
  perlu_revisi: { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500', label: 'Perlu Revisi' },
  revisi: { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500', label: 'Revisi' },
  disetujui: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500', label: 'Disetujui' },
  ditolak: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500', label: 'Ditolak' },
  terpublikasi: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500', label: 'Terpublikasi' },
  dipublikasikan: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500', label: 'Dipublikasikan' },
  berlangsung: { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500', label: 'Berlangsung' },
  selesai: { bg: 'bg-slate-100', text: 'text-slate-800', dot: 'bg-slate-500', label: 'Selesai' },
  diarsipkan: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400', label: 'Diarsipkan' },
  dibatalkan: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400', label: 'Dibatalkan' },
  diteruskan: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500', label: 'Diteruskan' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500', label: 'Pending' },
  menunggu: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500', label: 'Menunggu' },
  aktif: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500', label: 'Aktif' },
  'sudah tercatat': { bg: 'bg-green-50', text: 'text-green-800', dot: 'bg-green-500', label: 'sudah tercatat' },
  'belum tercatat': { bg: 'bg-emerald-50', text: 'text-emerald-800', dot: 'bg-emerald-500', label: 'belum tercatat' },
}

function StatusBadge({ status }) {
  const key = String(status || '').toLowerCase()
  const cfg = statusConfig[key] || {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    dot: 'bg-yellow-500',
    label: status || 'Pending',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  )
}

export default StatusBadge
