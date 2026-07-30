const statusConfig = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
  diajukan: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Diajukan' },
  diajukan_ulang: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Diajukan Ulang' },
  terverifikasi: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Terverifikasi' },
  perlu_revisi: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Perlu Revisi' },
  revisi: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Revisi' },
  disetujui: { bg: 'bg-green-100', text: 'text-green-800', label: 'Disetujui' },
  ditolak: { bg: 'bg-red-100', text: 'text-red-800', label: 'Ditolak' },
  terpublikasi: { bg: 'bg-green-100', text: 'text-green-800', label: 'Terpublikasi' },
  dipublikasikan: { bg: 'bg-green-100', text: 'text-green-800', label: 'Dipublikasikan' },
  berlangsung: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Berlangsung' },
  selesai: { bg: 'bg-slate-100', text: 'text-slate-800', label: 'Selesai' },
  diarsipkan: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Diarsipkan' },
  dibatalkan: { bg: 'bg-red-50', text: 'text-red-700', label: 'Dibatalkan' },
  diteruskan: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Diteruskan' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
  menunggu: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Menunggu' },
  aktif: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aktif' },
  'sudah tercatat': { bg: 'bg-green-50', text: 'text-green-800', label: 'Sudah Tercatat' },
  'belum tercatat': { bg: 'bg-emerald-50', text: 'text-emerald-800', label: 'Belum Tercatat' },
}

function StatusBadge({ status }) {
  const key = String(status || '').toLowerCase()
  const cfg = statusConfig[key] || {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    label: status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  )
}

export default StatusBadge
