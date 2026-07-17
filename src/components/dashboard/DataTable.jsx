function DataTable({ columns, data, renderRow, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#e9ebf8] bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[#e9ebf8] bg-[#f9fafb]">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 font-semibold text-[#333]" style={col.width ? { width: col.width } : {}}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-[#616161]">
                Tidak ada data
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={row.id || i} className="border-b border-[#e9ebf8] last:border-0 hover:bg-[#f9fafb]">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
