import { TagStatDTO } from '@/types/admin/admin-dashboard-dto'

interface DashboardTopTagsProps {
  tags: TagStatDTO[]
}

export function DashboardTopTags({ tags }: DashboardTopTagsProps) {
  if (tags.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">No tags yet</p>
      </div>
    )
  }

  const max = tags[0]?.postCount ?? 1

  return (
    <ul className="flex flex-col gap-3">
      {tags.map((tag, index) => {
        const pct = Math.round((tag.postCount / max) * 100)
        return (
          <li key={tag.tagName} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-4 text-right">
                  {index + 1}
                </span>
                <span className="text-sm font-semibold text-heading font-mono">
                  {tag.tagName}
                </span>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">
                {tag.postCount.toLocaleString()}
              </span>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary/60 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
