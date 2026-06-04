import { Skeleton } from '@/components/ui/skeleton'

interface PostsTableSkeletonProps {
  rows?: number
  showRisk?: boolean
}

export function PostsTableSkeleton({ rows = 6, showRisk = false }: PostsTableSkeletonProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Fake header */}
      <div className="border-b border-border bg-muted/20 px-4 py-3 flex items-center gap-6">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
        {showRisk && <Skeleton className="h-3 w-12" />}
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12 ml-auto" />
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-3.5 flex items-start gap-4">
            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            {/* Author */}
            <div className="w-36 flex items-center gap-2 shrink-0">
              <Skeleton className="w-7 h-7 rounded-full shrink-0" />
              <Skeleton className="h-3 w-20" />
            </div>
            {/* Status */}
            <div className="w-24 shrink-0">
              <Skeleton className="h-5 w-20 rounded-md" />
            </div>
            {/* Risk or Votes */}
            <div className="w-24 shrink-0 flex flex-col gap-1">
              <Skeleton className="h-5 w-16 rounded-md" />
              {showRisk && <Skeleton className="h-3 w-8" />}
            </div>
            {/* Date */}
            <div className="w-24 shrink-0">
              <Skeleton className="h-3 w-20" />
            </div>
            {/* Actions */}
            <div className="w-16 shrink-0 flex justify-end">
              <Skeleton className="h-7 w-7 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
