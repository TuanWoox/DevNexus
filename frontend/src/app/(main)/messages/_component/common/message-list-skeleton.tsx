import { Skeleton } from "@/components/ui/skeleton";

export function MessageListSkeleton() {
    return (
        <div className="flex flex-col gap-1 px-2">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                    <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <div className="flex justify-between">
                            <Skeleton className="h-3.5 w-28" />
                            <Skeleton className="h-3 w-8" />
                        </div>
                        <Skeleton className="h-3 w-3/4" />
                    </div>
                </div>
            ))}
        </div>
    );
}
