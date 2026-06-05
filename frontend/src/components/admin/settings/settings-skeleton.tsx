'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function SettingsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Sidebar Nav Skeleton */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>

      {/* Main Settings Panel Skeleton */}
      <div className="md:col-span-3 space-y-4">
        {/* Summary Card Skeleton */}
        <div className="card p-5 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-14 w-full" />
          <div className="flex gap-4 pt-3 border-t border-border/60">
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-16" />
          </div>
        </div>

        {/* Toolbar Skeleton */}
        <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl">
          <Skeleton className="h-9 flex-1 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>

        {/* Table Skeleton */}
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="h-10 bg-muted/40 border-b border-border flex items-center px-6 gap-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
          <div className="divide-y divide-border/60">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 flex items-center px-6 gap-6">
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-3 w-60" />
                </div>
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-6 w-32 rounded-lg" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <div className="flex gap-2 ml-auto">
                  <Skeleton className="h-8 w-14 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
