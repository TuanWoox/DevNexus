interface BreakdownRow {
  label: string
  call_count: number
  input_tokens: number
  output_tokens: number
  total_tokens: number
}

interface AiUsageBreakdownTableProps {
  rows: BreakdownRow[]
}

export function AiUsageBreakdownTable({ rows }: AiUsageBreakdownTableProps) {
  return (
    <div className="card-ai">
      <div className="p-0">
        {rows.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">No data for selected range.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="border-b border-default">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-heading uppercase tracking-wide">Label</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-heading uppercase tracking-wide">Calls</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-heading uppercase tracking-wide">Input Tokens</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-heading uppercase tracking-wide">Output Tokens</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-heading uppercase tracking-wide">Total Tokens</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-default last:border-0 hover:bg-subtle transition-colors">
                    <td className="px-4 py-3 text-foreground/85">
                      <span className="font-mono">{row.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{(row.call_count ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{(row.input_tokens ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{(row.output_tokens ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{(row.total_tokens ?? 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
