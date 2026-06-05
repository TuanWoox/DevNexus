import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface TrendProps {
  value: number
  label: string
}

type AccentColor = 'default' | 'amber' | 'emerald' | 'red'

interface DashboardMetricCardProps {
  title: string
  value: number
  icon?: React.ReactNode
  trend?: TrendProps
  helperText?: string
  accent?: AccentColor
}

const accentStyles: Record<AccentColor, { border: string; iconBg: string; iconText: string }> = {
  default: {
    border: 'border-l-4 border-l-primary/40',
    iconBg: 'bg-primary/10',
    iconText: 'text-primary',
  },
  amber: {
    border: 'border-l-4 border-l-amber-400',
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    iconText: 'text-amber-600 dark:text-amber-400',
  },
  emerald: {
    border: 'border-l-4 border-l-emerald-400',
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconText: 'text-emerald-600 dark:text-emerald-400',
  },
  red: {
    border: 'border-l-4 border-l-red-400',
    iconBg: 'bg-red-50 dark:bg-red-500/10',
    iconText: 'text-red-600 dark:text-red-400',
  },
}

function TrendBadge({ trend }: { trend: TrendProps }) {
  const isUp = trend.value > 0
  const isDown = trend.value < 0
  const formatted = Math.abs(trend.value).toFixed(1)

  return (
    <div
      className={cn(
        'flex items-center gap-1 text-xs font-medium',
        isUp && 'text-emerald-600 dark:text-emerald-400',
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
  helperText,
  accent = 'default',
}: DashboardMetricCardProps) {
  const styles = accentStyles[accent]

  return (
    <div className={cn('card p-5 flex flex-col gap-3 transition-shadow hover:shadow-elevated', styles.border)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </p>
        {icon && (
          <div className={cn('p-2 rounded-lg', styles.iconBg, styles.iconText)}>
            {icon}
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-heading tabular-nums">{value.toLocaleString()}</p>
      {trend ? (
        <TrendBadge trend={trend} />
      ) : helperText ? (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  )
}
