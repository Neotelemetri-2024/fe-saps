function StatCard({ icon, label, value, sublabel, color = 'brand-dark' }) {
  return (
    <div className="rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[#616161]">{label}</p>
          <p className={`mt-2 text-3xl font-bold text-${color}`}>{value}</p>
          {sublabel && (
            <p className="mt-1 text-xs text-[#616161]">{sublabel}</p>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0f4f0] text-brand-dark">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

export default StatCard
