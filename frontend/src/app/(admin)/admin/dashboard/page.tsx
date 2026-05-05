'use client'

import { useGetAdminDashboard } from '@/hooks/admin/use-get-admin-dashboard';
import { DashboardMetricCard } from '@/components/admin/dashboard/dashboard-metric-card';
import { DashboardTopTags } from '@/components/admin/dashboard/dashboard-top-tags';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function MetricGridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading, isError, refetch } = useGetAdminDashboard();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-heading">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Platform overview and key metrics
        </p>
      </div>

      {isError && (
        <div className="card p-6 flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">
            Something went wrong. Try refreshing the page.
          </p>
          <button
            onClick={() => refetch()}
            className="btn-ghost text-sm px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      )}

      {/* Overview */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Overview
        </h2>
        {isLoading ? (
          <MetricGridSkeleton count={7} />
        ) : data ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <DashboardMetricCard title="Total Posts" value={data.totalPosts} />
            <DashboardMetricCard title="Approved Posts" value={data.approvedPosts} variant="success" />
            <DashboardMetricCard title="Rejected Posts" value={data.rejectedPosts} variant="danger" />
            <DashboardMetricCard title="Posts Today" value={data.postsToday} />
            <DashboardMetricCard title="Queue Entries" value={data.queueEntries} variant="warning" />
            <DashboardMetricCard title="Total Users" value={data.totalUsers} />
            <DashboardMetricCard title="Pending Posts" value={data.pendingPosts} variant="warning" />
          </div>
        ) : null}
      </section>

      {/* User Growth */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          User Growth
        </h2>
        {isLoading ? (
          <MetricGridSkeleton count={3} />
        ) : data ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <DashboardMetricCard title="New Users Today" value={data.newUsersToday} variant="success" />
            <DashboardMetricCard title="New Users This Week" value={data.newUsersThisWeek} variant="success" />
            <DashboardMetricCard title="New Users This Month" value={data.newUsersThisMonth} variant="success" />
          </div>
        ) : null}
      </section>

      {/* Post Breakdown */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Post Breakdown
        </h2>
        {isLoading ? (
          <MetricGridSkeleton count={4} />
        ) : data ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <DashboardMetricCard title="Question Posts" value={data.totalQuestionPosts} />
            <DashboardMetricCard title="Normal Posts" value={data.totalNormalPosts} />
            <DashboardMetricCard title="Posts This Week" value={data.postsThisWeek} />
            <DashboardMetricCard title="Posts This Month" value={data.postsThisMonth} />
          </div>
        ) : null}
      </section>

      {/* Moderation Status */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Moderation Status
        </h2>
        {isLoading ? (
          <MetricGridSkeleton count={4} />
        ) : data ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <DashboardMetricCard title="Pending Posts" value={data.pendingPosts} variant="warning" />
            <DashboardMetricCard title="In Review" value={data.inReviewPosts} variant="warning" />
            <DashboardMetricCard title="Flagged Posts" value={data.flaggedPosts} variant="danger" />
            <DashboardMetricCard title="Queue Entries" value={data.queueEntries} variant="warning" />
          </div>
        ) : null}
      </section>

      {/* Top Tags */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Top Tags
        </h2>
        {isLoading ? (
          <Card>
            <CardContent className="pt-4 flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        ) : data ? (
          <Card>
            <CardContent className="pt-4">
              <DashboardTopTags tags={data.topTags} />
            </CardContent>
          </Card>
        ) : null}
      </section>
    </div>
  );
}
