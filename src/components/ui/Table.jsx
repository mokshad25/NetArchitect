/**
 * Data table. columns: [{ key, label, align?: 'right', mono?: bool, render?(row) }]
 */
export default function Table({ columns, rows, rowKey, caption, rowClassName, compact = false }) {
  return (
    <div className="table-wrap">
      <table className={`table ${compact ? 'table-compact' : ''}`}>
        {caption && <caption className="visually-hidden">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={c.align === 'right' ? 'is-right' : ''}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className={rowClassName?.(row)}>
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`${c.mono ? 'mono' : ''} ${c.align === 'right' ? 'is-right' : ''}`.trim() || undefined}
                >
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
