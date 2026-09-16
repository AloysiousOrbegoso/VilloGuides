import { Icon } from "./icons";

/*
  Data table on a single quiet surface: hairline rows, muted header, no zebra stripes.
  columns: [{ key, label, width, align, render(row) }]
*/

export function Table({ columns, rows, rowKey = "id", onRowClick, empty }) {
  if (rows.length === 0 && empty) return <Panel>{empty}</Panel>;
  return (
    <div className="bg-card border border-line rounded-xl overflow-x-auto">
      <table className="w-full min-w-[640px] text-left border-collapse">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                style={{ width: c.width }}
                className={`text-xs font-normal text-muted px-5 py-3 border-b border-line-soft whitespace-nowrap ${c.align === "right" ? "text-right" : ""}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r[rowKey]}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
              className={`border-b border-line-soft last:border-b-0 ${onRowClick ? "cursor-pointer hover:bg-field" : ""}`}
            >
              {columns.map((c) => (
                <td key={c.key} className={`px-5 py-3.5 align-middle ${c.align === "right" ? "text-right" : ""}`}>
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Panel({ children, className = "", padded = true }) {
  return <div className={`bg-card border border-line rounded-xl ${padded ? "p-6" : ""} ${className}`}>{children}</div>;
}

export function EmptyState({ icon = "inbox", title, children, action }) {
  return (
    <div className="flex flex-col items-start gap-3 py-6 px-2">
      <Icon name={icon} className="text-2xl text-faint" />
      <div>
        <p className="font-semibold m-0">{title}</p>
        {children && <p className="text-muted mt-1 mb-0 max-w-md">{children}</p>}
      </div>
      {action}
    </div>
  );
}

/** Two-line cell: primary text with muted detail underneath. */
export function Cell({ title, detail, children }) {
  return (
    <div className="min-w-0">
      <div className="font-semibold truncate">{title}</div>
      {detail && <div className="text-sm text-muted truncate">{detail}</div>}
      {children}
    </div>
  );
}
