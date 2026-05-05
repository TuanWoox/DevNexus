import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BreakdownRow {
  label: string;
  call_count: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
}

interface AiUsageBreakdownTableProps {
  title: string;
  rows: BreakdownRow[];
}

export function AiUsageBreakdownTable({ title, rows }: AiUsageBreakdownTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">No data for selected range.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left font-semibold text-heading">Label</th>
                <th className="px-4 py-3 text-right font-semibold text-heading">Calls</th>
                <th className="px-4 py-3 text-right font-semibold text-heading">Input Tokens</th>
                <th className="px-4 py-3 text-right font-semibold text-heading">Output Tokens</th>
                <th className="px-4 py-3 text-right font-semibold text-heading">Total Tokens</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-4 py-3 text-foreground">{row.label}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{(row.call_count ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{(row.input_tokens ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{(row.output_tokens ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{(row.total_tokens ?? 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
