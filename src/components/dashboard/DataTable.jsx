import { ChevronLeft, ChevronRight } from 'lucide-react'

function isPlainObject(value) {
  return value != null && typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value) && typeof value.$$typeof === 'undefined'
}

const NO_COLUMN_KEYS = new Set(['no', '_no', 'nomor'])
const NO_COLUMN_WIDTH = '64px'
const CENTERED_KEYS = new Set(['aksi', 'Aksi', 'AKSI', 'status', 'Status', 'STATUS', 'statusRaw'])

function isNoColumn(col) {
  return NO_COLUMN_KEYS.has(col.key)
}

function isCenteredCol(col) {
  if (CENTERED_KEYS.has(col.key) || col.center === true) return true
  const label = String(col.label || '').trim().toLowerCase()
  return label === 'status' || label === 'aksi'
}

/**
 * DataTable — komponen tabel universal
 *
 * Props:
 *   columns        { key, label, width?, render?(row) }[]
 *   data           object[]
 *   loading?       boolean
 *   emptyText?     string
 *
 *   // Checkbox/selection (semua opsional)
 *   selectable?    boolean        — tampilkan kolom checkbox
 *   selected?      Set<any>       — set of row.id yang dipilih
 *   onSelect?      (id) => void   — toggle satu baris
 *   onSelectAll?   () => void     — toggle semua
 *   isSelectable?  (row) => bool  — apakah baris bisa dipilih
 *
 *   // Pagination (semua opsional)
 *   page?          number
 *   totalPages?    number
 *   onPageChange?  (page) => void
 *
 *   // Row interaksi
 *   onRowClick?    (row) => void  — klik seluruh baris
 */
function DataTable({
  columns,
  data,
  loading = false,
  emptyText = 'Tidak ada data',
  // selection
  selectable = false,
  selected,
  onSelect,
  onSelectAll,
  isSelectable,
  // pagination
  page,
  totalPages,
  onPageChange,
  // row
  onRowClick,
}) {
  const selectableRows = selectable && data ? data.filter((r) => !isSelectable || isSelectable(r)) : []
  const allSelected =
    selectable && selectableRows.length > 0 && selected
      ? selectableRows.every((r) => selected.has(r.id ?? r.id))
      : false
  const someSelected = selectable && selected ? selectableRows.some((r) => selected.has(r.id)) : false

  const hasPagination = page != null && totalPages != null && onPageChange != null && totalPages > 1

  const totalCols = columns.length + (selectable ? 1 : 0)

  return (
    <div className="space-y-3">
      <div className="-mx-3 overflow-x-auto sm:-mx-0">
        <table className="w-full min-w-[600px] text-left text-xs sm:text-sm">
          <thead>
            <tr className="divide-x divide-white/20 bg-gradient-to-r from-brand-dark to-brand-light text-left text-xs font-semibold uppercase tracking-wide text-white">
              {selectable && (
                <th className="w-10 px-3 py-2.5 text-center sm:px-4 sm:py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected }}
                    onChange={onSelectAll}
                    className="h-4 w-4 cursor-pointer accent-white"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="whitespace-nowrap px-3 py-2.5 text-center sm:px-4 sm:py-3"
                  style={{ width: col.width || (isNoColumn(col) ? NO_COLUMN_WIDTH : undefined) }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={totalCols} className="px-3 py-8 text-center text-sm text-[#9aa0a6] sm:px-4">
                  Memuat data…
                </td>
              </tr>
            ) : !data || data.length === 0 ? (
              <tr>
                <td colSpan={totalCols} className="px-3 py-8 text-center text-[#616161] sm:px-4">
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((row, i) => {
                const rowSelectable = selectable ? (!isSelectable || isSelectable(row)) : false
                const isSelected = selectable && selected ? selected.has(row.id) : false
                const isClickable = !!onRowClick

                return (
                  <tr
                    key={row.id ?? i}
                    onClick={isClickable ? () => onRowClick(row) : undefined}
                    className={[
                      'divide-x divide-[#e9ebf8] border-b border-[#e9ebf8] last:border-0 transition',
                      isSelected ? 'bg-green-50' : i % 2 === 0 ? 'bg-white' : 'bg-[#f9fafb]',
                      isClickable ? 'cursor-pointer hover:bg-[#f0f2ff]' : 'hover:bg-[#f9fafb]',
                    ].join(' ')}
                  >
                    {selectable && (
                      <td
                        className="px-3 py-2.5 text-center sm:px-4 sm:py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {rowSelectable ? (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onSelect && onSelect(row.id)}
                            className="h-4 w-4 cursor-pointer accent-brand-dark"
                          />
                        ) : (
                          <span className="block h-4 w-4 rounded border-2 border-[#e0e0e0] bg-[#f5f5f5] cursor-not-allowed"></span>
                        )}
                      </td>
                    )}
                    {columns.map((col) => {
                      const noCol = isNoColumn(col)
                      const centered = isCenteredCol(col)
                      const cellClassName = `px-3 py-2.5 sm:px-4 sm:py-3 ${noCol || centered ? 'text-center' : ''}`

                      if (col.render) {
                        return (
                          <td
                            key={col.key}
                            className={cellClassName}
                            style={noCol ? { width: NO_COLUMN_WIDTH } : undefined}
                            onClick={col.stopPropagation ? (e) => e.stopPropagation() : undefined}
                          >
                            <div className={centered ? 'flex w-full items-center justify-center' : undefined}>
                              {col.render(row, i)}
                            </div>
                          </td>
                        )
                      }

                      let value = row[col.key]
                      if (value instanceof Date) {
                        value = value.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                      } else if (isPlainObject(value)) {
                        value = '-'
                      }

                      return (
                        <td key={col.key} className={cellClassName} style={noCol ? { width: NO_COLUMN_WIDTH } : undefined}>
                          {value ?? '-'}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {hasPagination && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-[#9aa0a6]">
            Halaman {page} dari {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e9ebf8] text-[#616161] transition hover:bg-[#f0f2ff] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…')
                acc.push(p)
                return acc
              }, [])
              .map((p, idx) =>
                p === '…' ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-xs text-[#9aa0a6]">…</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onPageChange(p)}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold transition ${
                      p === page
                        ? 'bg-brand-dark text-white'
                        : 'border border-[#e9ebf8] text-[#616161] hover:bg-[#f0f2ff]'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e9ebf8] text-[#616161] transition hover:bg-[#f0f2ff] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable
