'use client'

import { useGetAdminDashboard } from '@/hooks/admin/use-get-admin-dashboard'
import { useGetModerationQueue } from '@/hooks/admin/use-get-moderation-queue'
import { useGetAdminReports } from '@/hooks/admin/use-get-admin-reports'
import { DashboardMetricCard } from '@/components/admin/dashboard/dashboard-metric-card'
import { DashboardTopTags } from '@/components/admin/dashboard/dashboard-top-tags'
import { DashboardModerationWidget } from '@/components/admin/dashboard/dashboard-moderation-widget'
import { DashboardAttentionPanel } from '@/components/admin/dashboard/dashboard-attention-panel'
import { DashboardActivityChart } from '@/components/admin/dashboard/dashboard-activity-chart'
import { DashboardContentDistribution } from '@/components/admin/dashboard/dashboard-content-distribution'
import { DashboardAiSummary } from '@/components/admin/dashboard/dashboard-ai-summary'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  FileText,
  Clock,
  AlertTriangle,
  Tag,
  BrainCircuit,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react'
import { useState, useCallback } from 'react'

// ─── Skeleton loaders ───────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card p-5 border-l-4 border-l-muted">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-9 w-16 mb-2" />
          <Skeleton className="h-3 w-28" />
        </div>
      ))}
    </div>
  )
}

function AttentionSkeleton() {
  return (
    <div className="card p-5">
      <Skeleton className="h-4 w-32 mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-default p-4">
            <Skeleton className="h-5 w-5 mb-3 rounded" />
            <Skeleton className="h-7 w-10 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="card p-5">
      <Skeleton className="h-4 w-32 mb-5" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 flex-1 rounded-md" style={{ width: `${40 + i * 10}%`, maxWidth: '100%' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function QueueSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-default px-4 py-3.5">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-14 rounded-md" />
          </div>
          <Skeleton className="h-3 w-40" />
        </div>
      ))}
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

const EMPTY_REPORTS_PAGE: import('@/types/common/page').Page<string> = {
  pageNumber: 0,
  size: 5,
  orders: [],
  filter: [],
  selected: [],
}

const EMPTY_QUEUE_PAGE = {
  pageNumber: 0,
  size: 3,
  totalElements: 0,
  orders: [],
  filter: [],
  selected: [],
}

export default function AdminDashboardPage() {
  const [lastRefreshed] = useState(() => new Date())

  const { data, isLoading, isError, refetch, isFetching } = useGetAdminDashboard()
  const { data: queueData, isLoading: queueLoading } = useGetModerationQueue(EMPTY_QUEUE_PAGE)
  const { data: reportsData } = useGetAdminReports(EMPTY_REPORTS_PAGE)

  // Derive pending reports count from paging metadata
  const pendingReportsCount = reportsData?.page?.totalElements ?? reportsData?.data?.length ?? 0

  const handleRefresh = useCallback(() => {
    void refetch()
  }, [refetch])

  return (
    <div className="w-full mx-auto py-6 px-4 sm:px-6 flex flex-col gap-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-heading">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Platform overview · Last refreshed {lastRefreshed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isFetching}
          title="Refresh dashboard"
          aria-label="Refresh dashboard data"
          className="btn-ghost flex items-center gap-2 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Error State ── */}
      {isError && (
        <div className="card p-6 flex flex-col items-center gap-3 border-destructive/30">
          <AlertTriangle className="w-8 h-8 text-destructive" />
          <p className="text-sm text-muted-foreground">
            Could not load dashboard data. Check your connection and try again.
          </p>
          <button onClick={() => refetch()} className="btn-ghost text-sm">
            Retry
          </button>
        </div>
      )}

      {/* ── SECTION 1: KPI Cards ── */}
      <section aria-label="Key metrics">
        {isLoading ? (
          <KpiSkeleton />
        ) : data ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <DashboardMetricCard
              title="Total Users"
              value={data.totalUsers}
              icon={<Users className="w-4 h-4" />}
              helperText={`${data.newUsersToday.toLocaleString()} joined today`}
              accent="default"
            />
            <DashboardMetricCard
              title="Total Posts"
              value={data.totalPosts}
              icon={<FileText className="w-4 h-4" />}
              helperText="Published and moderated content"
              accent="emerald"
            />
            <DashboardMetricCard
              title="Posts Today"
              value={data.postsToday}
              icon={<Clock className="w-4 h-4" />}
              helperText="Created in the last 24h"
              accent="default"
            />
            <DashboardMetricCard
              title="Needs Review"
              value={data.queueEntries}
              icon={<AlertTriangle className="w-4 h-4" />}
              helperText="Items pending moderation"
              accent={data.queueEntries > 0 ? 'amber' : 'default'}
            />
          </div>
        ) : null}
      </section>

      {/* ── SECTION 2: Admin Attention Panel ── */}
      <section aria-label="Admin attention">
        {isLoading ? (
          <AttentionSkeleton />
        ) : data ? (
          <DashboardAttentionPanel
            queueEntries={data.queueEntries}
            inReviewPosts={data.inReviewPosts}
            flaggedPosts={data.flaggedPosts}
            pendingReports={pendingReportsCount}
          />
        ) : null}
      </section>

      {/* ── SECTION 3: Analytics Cards ── */}
      <section
        aria-label="Analytics"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {isLoading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : data ? (
          <>
            <DashboardActivityChart
              postsToday={data.postsToday}
              postsThisWeek={data.postsThisWeek}
              postsThisMonth={data.postsThisMonth}
              newUsersToday={data.newUsersToday}
              newUsersThisWeek={data.newUsersThisWeek}
              newUsersThisMonth={data.newUsersThisMonth}
            />
            <DashboardContentDistribution
              totalPosts={data.totalPosts}
              approvedPosts={data.approvedPosts}
              pendingPosts={data.pendingPosts}
              inReviewPosts={data.inReviewPosts}
              flaggedPosts={data.flaggedPosts}
              rejectedPosts={data.rejectedPosts}
              totalQuestionPosts={data.totalQuestionPosts}
              totalNormalPosts={data.totalNormalPosts}
            />
          </>
        ) : null}
      </section>

      {/* ── SECTION 4: Queue + Tags + AI ── */}
      <section
        aria-label="Operational widgets"
        className="grid grid-cols-1 xl:grid-cols-3 gap-6"
      >
        {/* Moderation Queue Preview — xl:col-span-2 */}
        <div className="xl:col-span-2 card p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-heading uppercase tracking-wide">
                Moderation Queue
              </h3>
            </div>
            {data && data.queueEntries > 0 && (
              <span className="badge-amber text-xs">
                {data.queueEntries} pending
              </span>
            )}
          </div>

          {queueLoading ? (
            <QueueSkeleton />
          ) : queueData ? (
            <DashboardModerationWidget entries={queueData.data.slice(0, 3)} />
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <AlertTriangle className="w-6 h-6 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Could not load queue</p>
            </div>
          )}
        </div>

        {/* Right column: Top Tags + AI Summary stacked */}
        <div className="flex flex-col gap-6">
          {/* Top Tags */}
          <div className="card p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-heading uppercase tracking-wide">
                Top Tags
              </h3>
            </div>
            {isLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : data ? (
              <DashboardTopTags tags={data.topTags.slice(0, 5)} />
            ) : null}
          </div>

          {/* AI Usage Summary */}
          <DashboardAiSummary />
        </div>
      </section>

    </div>
  )
}
