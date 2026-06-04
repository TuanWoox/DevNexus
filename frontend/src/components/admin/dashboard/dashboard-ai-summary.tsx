'use client'

import { useMemo } from 'react'
import { useGetAiUsageSummary } from '@/hooks/admin/use-get-ai-usage-summary'
import { format, subDays } from 'date-fns'
import { BrainCircuit, ExternalLink, Cpu, Zap } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

export function DashboardAiSummary() {
  const { from, to } = useMemo(() => {
    const now = new Date()
    return {
      from: format(subDays(now, 30), 'yyyy-MM-dd'),
      to: format(now, 'yyyy-MM-dd'),
    }
  }, [])

  const { data, isLoading } = useGetAiUsageSummary(from, to)

  const topFeature = useMemo(() => {
    if (!data?.by_feature?.length) return null
    return [...data.by_feature].sort((a, b) => b.call_count - a.call_count)[0]
  }, [data])

  const topModel = useMemo(() => {
    if (!data?.by_model?.length) return null
    return [...data.by_model].sort((a, b) => b.call_count - a.call_count)[0]
  }, [data])

  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-semibold text-heading uppercase tracking-wide">
            AI Usage
          </h3>
        </div>
        <Link
          href="/admin/ai-usage"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Details <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
      ) : !data || data.total_calls === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <BrainCircuit className="w-8 h-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No AI activity in last 30 days</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-3xl font-bold text-heading tabular-nums">
              {data.total_calls.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              AI calls in the last 30 days
            </p>
          </div>

          <div className="border-t border-default" />

          <div className="flex flex-col gap-2.5">
            <div className="flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Total tokens used</p>
                <p className="text-sm font-semibold text-heading tabular-nums">
                  {data.total_tokens.toLocaleString()}
                </p>
              </div>
            </div>

            {topFeature && (
              <div className="flex items-start gap-2.5">
                <Cpu className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Top feature</p>
                  <p className="text-sm font-semibold text-heading truncate">
                    {topFeature.feature}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {topFeature.call_count.toLocaleString()} calls
                  </p>
                </div>
              </div>
            )}

            {topModel && (
              <div className="flex items-start gap-2.5">
                <BrainCircuit className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Primary model</p>
                  <p className="text-sm font-semibold text-heading font-mono truncate">
                    {topModel.model}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground mt-auto">
        Last 30 days · {from} → {to}
      </p>
    </div>
  )
}
