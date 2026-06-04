import { TagStatDTO } from '@/types/admin/admin-dashboard-dto'
import { Tag } from 'lucide-react'

interface DashboardTopTagsProps {
  tags: TagStatDTO[]
}

const rankColors = [
  'bg-amber-400 text-white',       // #1 gold
  'bg-slate-400 text-white',       // #2 silver
  'bg-orange-400 text-white',      // #3 bronze
  'bg-muted text-muted-foreground', // #4+
  'bg-muted text-muted-foreground',
]

export function DashboardTopTags({ tags }: DashboardTopTagsProps) {
  if (tags.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <Tag className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No tags yet</p>
        <p className="text-xs text-muted-foreground/60">Tags will appear once posts are published</p>
      </div>
    )
  }

  const max = tags[0]?.postCount ?? 1

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted-foreground mb-2">Most used tags across posts</p>
      <ul className="flex flex-col gap-3.5">
        {tags.map((tag, index) => {
          const pct = Math.min(Math.round((tag.postCount / max) * 100), 100)
          const rankColor = rankColors[Math.min(index, rankColors.length - 1)]
          return (
            <li key={tag.tagName} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0 ${rankColor}`}
                  >
                    {index + 1}
                  </span>
                  <span className="text-sm font-semibold text-heading font-mono truncate">
                    #{tag.tagName}
                  </span>
                </div>
                <span className="text-xs font-medium text-muted-foreground tabular-nums shrink-0">
                  {tag.postCount.toLocaleString()} posts
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/60 transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
