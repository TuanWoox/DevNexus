import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface TrendProps {
  value: number
  label: string
}

interface DashboardMetricCardProps {
  title: string
  value: number
  icon?: React.ReactNode
  trend?: TrendProps
}

function TrendBadge({ trend }: { trend: TrendProps }) {
  const isUp = trend.value > 0
  const isDown = trend.value < 0
  const formatted = Math.abs(trend.value).toFixed(1)

  return (
    <div
      className={cn(
        'flex items-center gap-1 text-xs font-medium',
        isUp && 'text-emerald-500',
        isDown && 'text-destructive',
        !isUp && !isDown && 'text-muted-foreground',
      )}
    >
      {isUp ? (
        <TrendingUp className="w-3 h-3" />
      ) : isDown ? (
        <TrendingDown className="w-3 h-3" />
      ) : (
        <Minus className="w-3 h-3" />
      )}
      <span>
        {isUp ? '+' : isDown ? '-' : ''}
        {formatted}% {trend.label}
      </span>
    </div>
  )
}

export function DashboardMetricCard({
  title,
  value,
  icon,
  trend,
}: DashboardMetricCardProps) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <p className="text-3xl font-bold text-heading">{value.toLocaleString()}</p>
      {trend && <TrendBadge trend={trend} />}
    </div>
  )
}
