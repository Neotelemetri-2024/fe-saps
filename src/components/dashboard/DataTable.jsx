function isPlainObject(value) {
  return value != null && typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value) && typeof value.$$typeof === 'undefined'
}

function DataTable({ columns, data }) {
  return (
    <div className="-mx-3 overflow-x-auto sm:-mx-0 sm:rounded-xl sm:border sm:border-[#e9ebf8] sm:bg-white">
      <table className="w-full min-w-[600px] text-left text-xs sm:text-sm">
        <thead>
          <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-left text-xs font-semibold uppercase tracking-wide text-white">
            {columns.map((col) => (
              <th key={col.key} className="whitespace-nowrap px-3 py-2.5 sm:px-4 sm:py-3 text-left" style={col.width ? { width: col.width } : {}}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-6 text-center text-[#616161] sm:px-4 sm:py-8">
                Tidak ada data
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={row.id || i} className="border-b border-[#e9ebf8] last:border-0 hover:bg-[#f9fafb]">
                {columns.map((col) => {
                  if (col.render) {
                    return (
                      <td key={col.key} className="px-3 py-2.5 sm:px-4 sm:py-3">
                        {col.render(row)}
                      </td>
                    )
                  }

                  let value = row[col.key]
                  if (value instanceof Date) {
                    value = value.toLocaleDateString('id-ID')
                  } else if (isPlainObject(value)) {
                    value = '-'
                  }

                  return (
                    <td key={col.key} className="px-3 py-2.5 sm:px-4 sm:py-3">
                      {value ?? '-'}
                    </td>
                  )
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
