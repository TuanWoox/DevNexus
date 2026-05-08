'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { useGetAiUsageSummary } from '@/hooks/admin/use-get-ai-usage-summary'
import { useGetAiUsageLogs } from '@/hooks/admin/use-get-ai-usage-logs'
import { AiUsageSummaryCards } from '@/components/admin/ai-usage/ai-usage-summary-cards'
import { AiUsageBreakdownTable } from '@/components/admin/ai-usage/ai-usage-breakdown-table'
import { AiUsageLogsTable } from '@/components/admin/ai-usage/ai-usage-logs-table'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkles } from 'lucide-react'

function getDefaultDates() {
  const today = new Date()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(today.getDate() - 7)
  return {
    from: sevenDaysAgo.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0],
  }
}

const LOGS_PAGE_SIZE = 10

export default function AiUsagePage() {
  const { user } = useSelector((state: RootState) => state.auth)
  const router = useRouter()
  const isAdmin = user?.roles?.includes('Admin') ?? false

  useEffect(() => {
    if (!isAdmin) router.replace('/unauthorized')
  }, [isAdmin, router])

  const defaults = useMemo(() => getDefaultDates(), [])
  const [fromInput, setFromInput] = useState(defaults.from)
  const [toInput, setToInput] = useState(defaults.to)
  const [from, setFrom] = useState(defaults.from)
  const [to, setTo] = useState(defaults.to)
  const [logsPageNumber, setLogsPageNumber] = useState(0)

  const logsPage = useMemo(() => ({
    size: LOGS_PAGE_SIZE,
    pageNumber: logsPageNumber,
    totalElements: 0,
    orders: [],
    filter: [],
    selected: [],
  }), [logsPageNumber])

  const { data, isLoading, isError, refetch } = useGetAiUsageSummary(from, to)
  const {
    data: logsData,
    isLoading: isLogsLoading,
    isFetching: isLogsFetching,
    isError: isLogsError,
    refetch: refetchLogs,
  } = useGetAiUsageLogs(logsPage)

  function handleApply() {
    setFrom(fromInput)
    setTo(toInput)
    setLogsPageNumber(0)
  }

  if (!isAdmin) return null

  return (
    <div className="w-full mx-auto py-4 sm:py-6 px-3 sm:px-6 flex flex-col gap-6 sm:gap-8">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-ai" />
        <h1 className="text-xl font-bold text-heading sm:text-2xl">AI Usage Summary</h1>
      </div>

      {/* Date range picker */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap" htmlFor="from-date">From</label>
          <input
            id="from-date"
            type="date"
            value={fromInput}
            onChange={(e) => setFromInput(e.target.value)}
            className="input w-full sm:max-w-[160px] text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap" htmlFor="to-date">To</label>
          <input
            id="to-date"
            type="date"
            value={toInput}
            onChange={(e) => setToInput(e.target.value)}
            className="input w-full sm:max-w-[160px] text-sm"
          />
        </div>
        <button onClick={handleApply} className="btn-ai text-xs sm:text-sm px-3 sm:px-4">
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          Apply
        </button>
      </div>

      {isError && (
        <div className="card p-4 sm:p-6 flex flex-col items-center gap-3">
          <p className="text-xs sm:text-sm text-muted-foreground">Something went wrong. Try refreshing the page.</p>
          <button onClick={() => refetch()} className="btn-ghost text-xs sm:text-sm">Retry</button>
        </div>
      )}

      {isLogsError && (
        <div className="card p-4 sm:p-6 flex flex-col items-center gap-3">
          <p className="text-xs sm:text-sm text-muted-foreground">Raw logs could not be loaded.</p>
          <button onClick={() => refetchLogs()} className="btn-ghost text-xs sm:text-sm">Retry</button>
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col gap-4 sm:gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 sm:h-24 w-full rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-32 sm:h-40 w-full rounded-lg" />
          <Skeleton className="h-32 sm:h-40 w-full rounded-lg" />
          <Skeleton className="h-32 sm:h-40 w-full rounded-lg" />
        </div>
      )}

      {data && !isLoading && (
        <>
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-ai" />
              <h2 className="text-sm font-semibold text-heading uppercase tracking-wide sm:text-base">Summary</h2>
            </div>
            <AiUsageSummaryCards summary={data} />
          </div>

          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-ai" />
              <h2 className="text-sm font-semibold text-heading uppercase tracking-wide sm:text-base">By Model</h2>
            </div>
            <AiUsageBreakdownTable
              rows={(data.by_model ?? []).map((r) => ({
                label: r.model,
                call_count: r.call_count,
                input_tokens: r.input_tokens,
                output_tokens: r.output_tokens,
                total_tokens: r.total_tokens,
              }))}
            />
          </div>

          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-ai" />
              <h2 className="text-sm font-semibold text-heading uppercase tracking-wide sm:text-base">By Feature</h2>
            </div>
            <AiUsageBreakdownTable
              rows={(data.by_feature ?? []).map((r) => ({
                label: r.feature,
                call_count: r.call_count,
                input_tokens: r.input_tokens,
                output_tokens: r.output_tokens,
                total_tokens: r.total_tokens,
              }))}
            />
          </div>

          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-ai" />
              <h2 className="text-sm font-semibold text-heading uppercase tracking-wide sm:text-base">By Date</h2>
            </div>
            <AiUsageBreakdownTable
              rows={(data.by_date ?? []).map((r) => ({
                label: r.date,
                call_count: r.call_count,
                input_tokens: r.input_tokens,
                output_tokens: r.output_tokens,
                total_tokens: r.total_tokens,
              }))}
            />
          </div>
        </>
      )}

      <AiUsageLogsTable
        logs={logsData?.data ?? []}
        isLoading={isLogsLoading || isLogsFetching}
        pageNumber={logsData?.page.pageNumber ?? logsPageNumber}
        totalElements={logsData?.page.totalElements ?? 0}
        pageSize={logsData?.page.size ?? LOGS_PAGE_SIZE}
        onPreviousPage={() => setLogsPageNumber((page) => Math.max(0, page - 1))}
        onNextPage={() => setLogsPageNumber((page) => page + 1)}
      />

      {data && !isLoading &&
        data.total_calls === 0 &&
        (data.by_model ?? []).length === 0 &&
        (data.by_feature ?? []).length === 0 &&
        (data.by_date ?? []).length === 0 && (
          <p className="text-xs sm:text-sm text-muted-foreground text-center">No AI usage data for selected date range.</p>
        )}
    </div>
  )
}
