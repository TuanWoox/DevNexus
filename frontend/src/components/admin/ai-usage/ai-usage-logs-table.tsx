import { AiUsageLogDTO } from '@/types/admin/ai-usage-dto';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface AiUsageLogsTableProps {
  logs: AiUsageLogDTO[];
  isLoading: boolean;
  pageNumber: number;
  totalElements: number;
  pageSize: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function formatNumber(value?: number | null): string {
  return (value ?? 0).toLocaleString();
}

export function AiUsageLogsTable({
  logs,
  isLoading,
  pageNumber,
  totalElements,
  pageSize,
  onPreviousPage,
  onNextPage,
}: AiUsageLogsTableProps) {
  const canGoPrevious = pageNumber > 0;
  const canGoNext = (pageNumber + 1) * pageSize < totalElements;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Raw Logs
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{totalElements.toLocaleString()} total</span>
          <Button type="button" variant="outline" size="sm" onClick={onPreviousPage} disabled={!canGoPrevious || isLoading}>
            Previous
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onNextPage} disabled={!canGoNext || isLoading}>
            Next
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left font-semibold text-heading">Feature</th>
                <th className="px-4 py-3 text-left font-semibold text-heading">Model</th>
                <th className="px-4 py-3 text-right font-semibold text-heading">Input</th>
                <th className="px-4 py-3 text-right font-semibold text-heading">Output</th>
                <th className="px-4 py-3 text-right font-semibold text-heading">Total</th>
                <th className="px-4 py-3 text-left font-semibold text-heading">User</th>
                <th className="px-4 py-3 text-left font-semibold text-heading">Created</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: pageSize }).map((_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    {Array.from({ length: 7 }).map((__, cell) => (
                      <td key={cell} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                    No raw logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0">
                    <td className="px-4 py-3 text-foreground">{log.feature_name ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.model_used ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{formatNumber(log.input_tokens)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{formatNumber(log.output_tokens)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{formatNumber(log.total_tokens)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.user_id ?? 'System'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(log.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
