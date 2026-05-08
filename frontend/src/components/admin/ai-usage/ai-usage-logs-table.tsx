import { AiUsageLogDTO } from '@/types/admin/ai-usage-dto'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkles } from 'lucide-react'

interface AiUsageLogsTableProps {
  logs: AiUsageLogDTO[]
  isLoading: boolean
  pageNumber: number
  totalElements: number
  pageSize: number
  onPreviousPage: () => void
  onNextPage: () => void
}

function formatDate(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}

function formatNumber(value?: number | null): string {
  return (value ?? 0).toLocaleString()
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
  const canGoPrevious = pageNumber > 0
  const canGoNext = (pageNumber + 1) * pageSize < totalElements

  return (
    <div className="card-ai">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-ai" />
          <span className="text-base font-semibold text-heading uppercase tracking-wide">
            Raw Logs
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{totalElements.toLocaleString()} total</span>
          <button type="button" className="btn-ghost text-xs px-2 py-1 disabled:opacity-40 disabled:cursor-not-allowed" onClick={onPreviousPage} disabled={!canGoPrevious || isLoading}>
            Previous
          </button>
          <button type="button" className="btn-ghost text-xs px-2 py-1 disabled:opacity-40 disabled:cursor-not-allowed" onClick={onNextPage} disabled={!canGoNext || isLoading}>
            Next
          </button>
        </div>
      </div>
      <div className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card z-10">
              <tr className="border-b border-default">
                <th className="px-4 py-3 text-left text-xs font-semibold text-heading uppercase tracking-wide">Feature</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-heading uppercase tracking-wide">Model</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-heading uppercase tracking-wide">Input</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-heading uppercase tracking-wide">Output</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-heading uppercase tracking-wide">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-heading uppercase tracking-wide">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-heading uppercase tracking-wide">Created</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: pageSize }).map((_, i) => (
                  <tr key={i} className="border-b border-default last:border-0">
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
                  <tr key={log.id} className="border-b border-default last:border-0 hover:bg-subtle transition-colors">
                    <td className="px-4 py-3 text-foreground/85">
                      <span className="font-mono">{log.feature_name ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="font-mono">{log.model_used ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{formatNumber(log.input_tokens)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{formatNumber(log.output_tokens)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{formatNumber(log.total_tokens)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="font-mono">{log.user_id ?? 'System'}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="font-mono">{formatDate(log.created_at)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
