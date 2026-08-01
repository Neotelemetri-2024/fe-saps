/**
 * TableFrame — sub-div pembungkus tabel
 * Mengelilingi DataTable atau <table> dengan border konsisten.
 */
export function TableFrame({ children, className = 'mt-4 sm:mt-6' }) {
  return (
    <div className={`overflow-hidden rounded-xl border border-[#e9ebf8] ${className}`}>
      {children}
    </div>
  )
}

/**
 * TableCard — card putih standar untuk tabel
 * Berisi judul (dan optional description / headerRight), lalu children.
 * Gunakan TableFrame di dalamnya untuk membungkus DataTable/<table>.
 */
export function TableCard({
  title,
  description,
  headerRight,
  children,
  className = '',
}) {
  return (
    <div className={`rounded-xl border border-[#e9ebf8] bg-white p-3 shadow-sm sm:p-6 ${className}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-brand-dark sm:text-lg">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-[#616161] sm:text-sm">{description}</p>
          )}
        </div>
        {headerRight && <div>{headerRight}</div>}
      </div>
      {children}
    </div>
  )
}
