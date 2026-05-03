export function MessageListSkeleton() {
    return (
        <div className="flex flex-col gap-1 px-2">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-md px-3 py-3"
                    style={{ animationDelay: `${i * 80}ms` }}
                >
                    <div className="h-12 w-12 shrink-0 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2.5">
                        <div className="flex justify-between">
                            <div className="h-3.5 w-28 rounded-md bg-muted animate-pulse" />
                            <div className="h-3 w-10 rounded-md bg-muted animate-pulse" />
                        </div>
                        <div className="h-3 w-3/4 rounded-md bg-muted animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    );
}
