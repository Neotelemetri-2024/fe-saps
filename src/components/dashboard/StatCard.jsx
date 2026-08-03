import { useNavigate } from 'react-router-dom'
import IconBadge from './IconBadge'

// Angka pada kartu statistik selalu hitam (text-brand-dark, di-force #111 via index.css)
// agar konsisten di semua dashboard, terlepas dari makna status (pending/disetujui/ditolak/dst).
function StatCard({ icon, label, value, sublabel, sublink, link, action, small, iconTone = 'neutral' }) {
  const navigate = useNavigate()
  const clickable = Boolean(action)

  return (
    <div
      onClick={() => clickable && navigate(action)}
      className={`rounded-xl bg-white p-5 shadow-sm ${clickable ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#616161]">{label}</p>
          <p className={`mt-2 font-extrabold text-brand-dark ${small ? 'text-sm' : 'text-3xl'}`}>{value}</p>
          {sublabel && (
            <p className="mt-0.5 text-sm font-semibold text-brand-dark">{sublabel}</p>
          )}
          {sublink && (
            <p className="mt-1 flex items-center gap-0.5 text-xs font-medium text-[#444]">→ {sublink}</p>
          )}
          {link && (
            <p className="mt-2 text-xs font-medium text-emerald-600 hover:underline">Lihat Detail</p>
          )}
        </div>
        {icon && (
          <IconBadge icon={icon} tone={iconTone} size="md" />
        )}
      </div>
    </div>
  )
}

export default StatCard
