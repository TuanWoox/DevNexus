"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function ConnectionCardSkeleton() {
    return (
        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border border-border">
            <Skeleton className="h-5 w-5 rounded-sm shrink-0" />
            <Skeleton className="h-9 w-9 sm:h-11 sm:w-11 rounded-full shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
                <Skeleton className="h-2 sm:h-3 w-32 sm:w-48 hidden sm:block" />
            </div>
            <Skeleton className="h-8 w-16 sm:w-20 rounded-lg shrink-0" />
        </div>
    );
}

export function ConnectionCardSkeletonList({ count = 6 }: { count?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <ConnectionCardSkeleton key={i} />
            ))}
        </div>
    );
}
