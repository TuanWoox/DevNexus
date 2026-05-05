'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useGetAiUsageSummary } from '@/hooks/admin/use-get-ai-usage-summary';
import { AiUsageSummaryCards } from '@/components/admin/ai-usage/ai-usage-summary-cards';
import { AiUsageBreakdownTable } from '@/components/admin/ai-usage/ai-usage-breakdown-table';
import { Skeleton } from '@/components/ui/skeleton';

function getDefaultDates() {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  return {
    from: sevenDaysAgo.toISOString().split('T')[0],
    to: today.toISOString().split('T')[0],
  };
}

export default function AiUsagePage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const isAdmin = user?.roles?.includes('Admin') ?? false;

  useEffect(() => {
    if (!isAdmin) {
      router.replace('/unauthorized');
    }
  }, [isAdmin, router]);

  const defaults = getDefaultDates();
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);

  const { data, isLoading, isError, refetch } = useGetAiUsageSummary(from, to);

  if (!isAdmin) return null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-heading">AI Usage Summary</h1>

      {/* Date range picker */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground" htmlFor="from-date">From</label>
          <input
            id="from-date"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border border-input rounded-md px-3 py-1.5 text-sm bg-background text-foreground"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground" htmlFor="to-date">To</label>
          <input
            id="to-date"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border border-input rounded-md px-3 py-1.5 text-sm bg-background text-foreground"
          />
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="flex items-center gap-3 text-destructive">
          <p className="text-sm">Something went wrong. Try refreshing the page.</p>
          <button onClick={() => refetch()} className="btn-ghost text-sm">Retry</button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      )}

      {/* Data */}
      {data && !isLoading && (
        <>
          {/* Summary cards */}
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Summary</h2>
            <AiUsageSummaryCards summary={data} />
          </div>

          {/* Breakdown tables */}
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">By Model</h2>
            <AiUsageBreakdownTable
              title="By Model"
              rows={(data.by_model ?? []).map((r) => ({
                label: r.model,
                call_count: r.call_count,
                input_tokens: r.input_tokens,
                output_tokens: r.output_tokens,
                total_tokens: r.total_tokens,
              }))}
            />
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">By Feature</h2>
            <AiUsageBreakdownTable
              title="By Feature"
              rows={(data.by_feature ?? []).map((r) => ({
                label: r.feature,
                call_count: r.call_count,
                input_tokens: r.input_tokens,
                output_tokens: r.output_tokens,
                total_tokens: r.total_tokens,
              }))}
            />
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">By Date</h2>
            <AiUsageBreakdownTable
              title="By Date"
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

      {/* Empty state — data returned but all arrays empty */}
      {data && !isLoading &&
        data.total_calls === 0 &&
        (data.by_model ?? []).length === 0 &&
        (data.by_feature ?? []).length === 0 &&
        (data.by_date ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No AI usage data for selected date range.</p>
        )}
    </div>
  );
}
