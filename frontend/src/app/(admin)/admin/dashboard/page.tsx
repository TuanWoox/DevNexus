'use client'

import { useGetAdminDashboard } from '@/hooks/admin/use-get-admin-dashboard'
import { useGetModerationQueue } from '@/hooks/admin/use-get-moderation-queue'
import { DashboardMetricCard } from '@/components/admin/dashboard/dashboard-metric-card'
import { DashboardTopTags } from '@/components/admin/dashboard/dashboard-top-tags'
import { DashboardModerationWidget } from '@/components/admin/dashboard/dashboard-moderation-widget'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, FileText, Clock, AlertTriangle, BarChart3, TrendingUp } from 'lucide-react'

function HeroMetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card p-5">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  )
}

function ChartPlaceholder({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="card p-6 min-h-[300px] flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-sm font-semibold text-heading uppercase tracking-wide">
          {title}
        </h3>
      </div>
      <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
        <p className="text-sm text-muted-foreground">Chart visualization coming soon</p>
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const { data, isLoading, isError, refetch } = useGetAdminDashboard()
  const { data: queueData, isLoading: queueLoading } = useGetModerationQueue({
    pageNumber: 0,
    size: 3,
    totalElements: 0,
    orders: [],
    filter: [],
    selected: [],
  })

  return (
    <div className="w-full mx-auto py-6 px-4 sm:px-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-heading">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Platform overview and key metrics
        </p>
      </div>

      {isError && (
        <div className="card p-6 flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">
            Something went wrong. Try refreshing the page.
          </p>
          <button onClick={() => refetch()} className="btn-ghost">
            Retry
          </button>
        </div>
      )}

      {/* LAYER 1: Hero Metrics (North Star) */}
      <section>
        {isLoading ? (
          <HeroMetricsSkeleton />
        ) : data ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DashboardMetricCard
              title="Total Users"
              value={data.totalUsers}
              icon={<Users className="w-4 h-4" />}
              trend={{ value: 12.5, label: 'from last week' }}
            />
            <DashboardMetricCard
              title="Total Posts"
              value={data.totalPosts}
              icon={<FileText className="w-4 h-4" />}
              trend={{ value: 8.3, label: 'from last week' }}
            />
            <DashboardMetricCard
              title="Posts Today"
              value={data.postsToday}
              icon={<Clock className="w-4 h-4" />}
              trend={{ value: -2.1, label: 'from yesterday' }}
            />
            <DashboardMetricCard
              title="Pending Moderation"
              value={data.queueEntries}
              icon={<AlertTriangle className="w-4 h-4" />}
              trend={{ value: 0, label: 'no change' }}
            />
          </div>
        ) : null}
      </section>

      {/* LAYER 2: Data Visualization */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartPlaceholder
          title="User Growth"
          icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
        />
        <ChartPlaceholder
          title="Post Breakdown"
          icon={<BarChart3 className="w-5 h-5 text-primary" />}
        />
      </section>

      {/* LAYER 3: Actionable Widgets */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Actionable Moderation Queue (col-span-2) */}
        <div className="xl:col-span-2 card p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-semibold text-heading uppercase tracking-wide">
                Moderation Queue
              </h3>
            </div>
            {data && data.queueEntries > 0 && (
              <span className="badge-default text-xs">{data.queueEntries} pending</span>
            )}
          </div>
          {queueLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : queueData ? (
            <DashboardModerationWidget entries={queueData.data.slice(0, 3)} />
          ) : null}
        </div>

        {/* Top Tags (col-span-1) */}
        <div className="card p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-heading uppercase tracking-wide">
              Top Tags
            </h3>
          </div>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : data ? (
            <DashboardTopTags tags={data.topTags.slice(0, 5)} />
          ) : null}
        </div>
      </section>
    </div>
  )
}
