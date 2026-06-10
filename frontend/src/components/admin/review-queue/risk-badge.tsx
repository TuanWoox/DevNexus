import { cn } from '@/lib/utils'
import { ShieldAlert } from 'lucide-react'

type RiskLevel = 'low' | 'medium' | 'high'

interface RiskConfig {
  label: string
  className: string
  dotClass: string
}

const RISK_CONFIGS: Record<RiskLevel, RiskConfig> = {
  low: {
    label: 'Low',
    className:
      'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30',
    dotClass: 'bg-emerald-500',
  },
  medium: {
    label: 'Med',
    className:
      'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30',
    dotClass: 'bg-amber-500',
  },
  high: {
    label: 'High',
    className:
      'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30',
    dotClass: 'bg-red-500',
  },
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 0.75) return 'high'
  if (score >= 0.40) return 'medium'
  return 'low'
}

interface RiskBadgeProps {
  score: number
  className?: string
}

export function RiskBadge({ score, className }: RiskBadgeProps) {
  const level = getRiskLevel(score)
  const config = RISK_CONFIGS[level]

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium',
          config.className,
        )}
      >
        <ShieldAlert className="w-3 h-3 shrink-0" />
        {config.label}
      </span>
      <span className="text-[10px] font-mono text-muted-foreground tabular-nums pl-0.5">
        {score.toFixed(2)}
      </span>
    </div>
  )
}

/** Utility export for row highlighting */
export function getRiskLevelForScore(score: number): RiskLevel {
  return getRiskLevel(score)
}
