import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Skeleton } from './Skeleton'

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
 *   pageSize?      number — ukuran halaman internal (default 10).
 *                  Dipakai hanya jika page/totalPages/onPageChange TIDAK diberikan,
 *                  yaitu halaman tidak mengelola pagination sendiri.
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
  pageSize = 10,
  // row
  onRowClick,
}) {
  const [internalPage, setInternalPage] = useState(1)
  const hasManagedPagination = page != null && totalPages != null && onPageChange != null

  // Saat pemakai tidak mengelola pagination, reset halaman internal ke 1
  // ketika jumlah data berubah (misal setelah filter/search).
  const dataLength = data ? data.length : 0
  useEffect(() => {
    if (!hasManagedPagination) setInternalPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLength])

  // Saat pemakai tidak mengelola pagination, aktifkan pagination internal.
  const total = data ? data.length : 0
  const internalTotalPages = Math.max(1, Math.ceil(total / pageSize))
  const safeInternalPage = Math.min(internalPage, internalTotalPages)
  const displayData = hasManagedPagination
    ? data
    : (data || []).slice((safeInternalPage - 1) * pageSize, safeInternalPage * pageSize)
  const currentPage = hasManagedPagination ? page : safeInternalPage
  const currentTotalPages = hasManagedPagination ? totalPages : internalTotalPages
  const changePage = (p) => {
    if (hasManagedPagination) onPageChange(p)
    else setInternalPage(p)
  }

  const selectableRows = selectable && displayData ? displayData.filter((r) => !isSelectable || isSelectable(r)) : []
  const allSelected =
    selectable && selectableRows.length > 0 && selected
      ? selectableRows.every((r) => selected.has(r.id ?? r.id))
      : false
  const someSelected = selectable && selected ? selectableRows.some((r) => selected.has(r.id)) : false

  const hasPagination = currentTotalPages > 1

  const totalCols = columns.length + (selectable ? 1 : 0)

  return (
    <div className="space-y-3">
      <div className="-mx-3 overflow-x-auto sm:-mx-0">
        <table className="table table-sm w-full min-w-[600px] text-left text-xs sm:text-sm">
          <thead>
            <tr className="bg-primary text-xs font-semibold uppercase tracking-wide text-primary-content">
              {selectable && (
                <th className="w-10 px-3 py-2.5 text-center sm:px-4 sm:py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected }}
                    onChange={onSelectAll}
                    className="checkbox checkbox-xs checkbox-primary border-primary-content"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="whitespace-nowrap px-3 py-2.5 text-center text-primary-content sm:px-4 sm:py-3"
                  style={{ width: col.width || (isNoColumn(col) ? NO_COLUMN_WIDTH : undefined) }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }, (_, rowIdx) => (
                <tr key={`sk-${rowIdx}`} aria-hidden>
                  {selectable && (
                    <td className="px-3 py-2.5 text-center sm:px-4 sm:py-3">
                      <Skeleton className="mx-auto h-4 w-4" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-3 py-2.5 sm:px-4 sm:py-3"
                    >
                      <Skeleton className={`h-3 ${isNoColumn(col) || isCenteredCol(col) ? 'mx-auto w-10' : 'w-4/5'}`} />
                    </td>
                  ))}
                </tr>
              ))
            ) : !displayData || displayData.length === 0 ? (
              <tr>
                <td colSpan={totalCols} className="px-3 py-8 text-center text-base-content/60 sm:px-4">
                  {emptyText}
                </td>
              </tr>
            ) : (
              displayData.map((row, i) => {
                const rowSelectable = selectable ? (!isSelectable || isSelectable(row)) : false
                const isSelected = selectable && selected ? selected.has(row.id) : false
                const isClickable = !!onRowClick

                return (
                  <tr
                    key={row.id ?? i}
                    onClick={isClickable ? () => onRowClick(row) : undefined}
                    className={[
                      isSelected ? 'bg-primary/5' : '',
                      isClickable ? 'cursor-pointer hover:bg-base-200' : '',
                    ].filter(Boolean).join(' ')}
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
                            className="checkbox checkbox-xs checkbox-primary"
                          />
                        ) : (
                          <span className="checkbox checkbox-xs pointer-events-none opacity-30" />
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
          <p className="text-xs text-base-content/50">
            Halaman {currentPage} dari {currentTotalPages}
          </p>
          <div className="join">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => changePage(currentPage - 1)}
              className="btn btn-outline btn-xs join-item"
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: currentTotalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === currentTotalPages || Math.abs(p - currentPage) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…')
                acc.push(p)
                return acc
              }, [])
              .map((p, idx) =>
                p === '…' ? (
                  <span key={`ellipsis-${idx}`} className="btn btn-ghost btn-xs join-item pointer-events-none">…</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => changePage(p)}
                    className={`btn btn-xs join-item ${p === currentPage ? 'btn-primary' : 'btn-outline'}`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              type="button"
              disabled={currentPage >= currentTotalPages}
              onClick={() => changePage(currentPage + 1)}
              className="btn btn-outline btn-xs join-item"
              aria-label="Halaman berikutnya"
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
