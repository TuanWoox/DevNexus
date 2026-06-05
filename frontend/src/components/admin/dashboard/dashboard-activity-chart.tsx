import { TrendingUp } from 'lucide-react'

interface ActivityBar {
  label: string
  value: number
  subLabel?: string
}

interface DashboardActivityChartProps {
  postsToday: number
  postsThisWeek: number
  postsThisMonth: number
  newUsersToday: number
  newUsersThisWeek: number
  newUsersThisMonth: number
}

function BarGroup({
  bars,
  title,
  accentClass,
}: {
  bars: ActivityBar[]
  title: string
  accentClass: string
}) {
  const max = Math.max(...bars.map((b) => b.value), 1)

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
      <div className="flex flex-col gap-2.5">
        {bars.map((bar) => {
          const pct = Math.min(Math.round((bar.value / max) * 100), 100)
          return (
            <div key={bar.label} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-16 shrink-0 text-right tabular-nums">
                {bar.label}
              </span>
              <div className="flex-1 h-5 bg-muted rounded-md overflow-hidden relative">
                <div
                  className={`h-full ${accentClass} rounded-md transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
                {bar.value > 0 && (
                  <span className="absolute inset-y-0 left-2 flex items-center text-[10px] font-semibold text-white/90 tabular-nums pointer-events-none">
                    {bar.value.toLocaleString()}
                  </span>
                )}
              </div>
              {bar.value === 0 && (
                <span className="text-xs text-muted-foreground tabular-nums">0</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function DashboardActivityChart({
  postsToday,
  postsThisWeek,
  postsThisMonth,
  newUsersToday,
  newUsersThisWeek,
  newUsersThisMonth,
}: DashboardActivityChartProps) {
  const postBars: ActivityBar[] = [
    { label: 'Today', value: postsToday },
    { label: 'This week', value: postsThisWeek },
    { label: 'This month', value: postsThisMonth },
  ]

  const userBars: ActivityBar[] = [
    { label: 'Today', value: newUsersToday },
    { label: 'This week', value: newUsersThisWeek },
    { label: 'This month', value: newUsersThisMonth },
  ]

  return (
    <div className="card p-5 flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-heading uppercase tracking-wide">
          Platform Activity
        </h3>
      </div>

      <div className="flex flex-col gap-6">
        <BarGroup
          bars={postBars}
          title="New Posts"
          accentClass="bg-primary/80"
        />
        <div className="border-t border-default" />
        <BarGroup
          bars={userBars}
          title="New Users"
          accentClass="bg-emerald-500/80"
        />
      </div>

      <p className="text-[10px] text-muted-foreground mt-auto">
        Comparing today · this week · this month
      </p>
    </div>
  )
}
