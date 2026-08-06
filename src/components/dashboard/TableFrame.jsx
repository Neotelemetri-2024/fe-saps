/**
 * TableFrame — sub-div pembungkus tabel
 * Mengelilingi DataTable atau <table> dengan border konsisten.
 */
export function TableFrame({ children, className = '' }) {
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
 *
 * Jarak antara header (judul) dan children dijamin oleh flex `gap` di sini
 * (bukan margin milik children), supaya konsisten terlepas dari isi children
 * (TableFrame langsung, toolbar search/filter, dsb).
 */
export function TableCard({
  title,
  description,
  headerRight,
  children,
  className = '',
}) {
  return (
    <div className={`flex flex-col gap-4 rounded-xl border border-[#e9ebf8] bg-white p-3 shadow-sm sm:gap-6 sm:p-6 ${className}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#222] sm:text-lg">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-[#616161] sm:text-sm">{description}</p>
          )}
        </div>
        {headerRight && <div>{headerRight}</div>}
      </div>
      <div className="flex flex-col gap-4 sm:gap-6">{children}</div>
    </div>
  )
}
