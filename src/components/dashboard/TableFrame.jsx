/**
 * TableFrame — sub-div pembungkus tabel
 * Mengelilingi DataTable atau <table> dengan border konsisten.
 */
export function TableFrame({ children, className = '' }) {
  return (
    <div className={`overflow-hidden rounded-md border border-base-300 ${className}`}>
      {children}
    </div>
  )
}

/**
 * TableCard — card putih standar untuk tabel
 * Berisi judul (dan optional description / headerRight), lalu children.
 */
export function TableCard({
  title,
  description,
  headerRight,
  children,
  className = '',
}) {
  return (
    <div className={`card bg-base-100 p-3 sm:p-6 ${className}`}>
      <div className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-base-content sm:text-lg">{title}</h3>
            {description && (
              <p className="mt-0.5 text-xs text-base-content/60 sm:text-sm">{description}</p>
            )}
          </div>
          {headerRight && <div>{headerRight}</div>}
        </div>
        <div className="flex flex-col gap-4 sm:gap-6">{children}</div>
      </div>
    </div>
  )
}
