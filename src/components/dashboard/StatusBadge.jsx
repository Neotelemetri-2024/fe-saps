const statusConfig = {
  diteruskan: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500', label: 'Diteruskan' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500', label: 'Pending' },
  disetujui: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500', label: 'Disetujui' },
  ditolak: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500', label: 'Ditolak' },
  revisi: { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500', label: 'Revisi' },
  dipublikasikan: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500', label: 'Dipublikasikan' },
  menunggu: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500', label: 'Menunggu' },
  'sudah tercatat': { bg: 'bg-green-50', text: 'text-green-800', dot: 'bg-green-500', label: 'sudah tercatat' },
  'belum tercatat': { bg: 'bg-emerald-50', text: 'text-emerald-800', dot: 'bg-emerald-500', label: 'belum tercatat' },
  aktif: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500', label: 'Aktif' },
}

function StatusBadge({ status }) {
  const cfg = statusConfig[status] || statusConfig.pending
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

export default StatusBadge
