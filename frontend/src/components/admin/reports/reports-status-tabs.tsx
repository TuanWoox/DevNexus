import { cn } from '@/lib/utils'
import { Clock, CheckCircle2, AlertTriangle, LayoutList, ShieldAlert, Sparkles } from 'lucide-react'

type TabValue = 'open' | 'pending' | 'inreview' | 'escalated' | 'closed' | 'all'

interface TabConfig {
  value: TabValue
  label: string
  helperText: string
  icon: React.ReactNode
  borderColor: string
  activeIconBg: string
  activeTextColor: string
}

const TAB_CONFIGS: TabConfig[] = [
  {
    value: 'open',
    label: 'Open Reports',
    helperText: 'Awaiting resolution',
    icon: <Clock className="w-4 h-4" />,
    borderColor: 'border-l-amber-500',
    activeIconBg: 'bg-amber-50 dark:bg-amber-500/10',
    activeTextColor: 'text-amber-700 dark:text-amber-300',
  },
  {
    value: 'pending',
    label: 'Pending',
    helperText: 'Awaiting first review',
    icon: <ShieldAlert className="w-4 h-4" />,
    borderColor: 'border-l-blue-400',
    activeIconBg: 'bg-blue-50 dark:bg-blue-500/10',
    activeTextColor: 'text-blue-700 dark:text-blue-300',
  },
  {
    value: 'inreview',
    label: 'In Review',
    helperText: 'Under investigation',
    icon: <Sparkles className="w-4 h-4" />,
    borderColor: 'border-l-cyan-400',
    activeIconBg: 'bg-cyan-50 dark:bg-cyan-500/10',
    activeTextColor: 'text-cyan-700 dark:text-cyan-300',
  },
  {
    value: 'escalated',
    label: 'Escalated',
    helperText: 'Requires admin action',
    icon: <AlertTriangle className="w-4 h-4" />,
    borderColor: 'border-l-red-500',
    activeIconBg: 'bg-red-50 dark:bg-red-500/10',
    activeTextColor: 'text-red-700 dark:text-red-300',
  },
  {
    value: 'closed',
    label: 'Closed',
    helperText: 'Resolved or dismissed',
    icon: <CheckCircle2 className="w-4 h-4" />,
    borderColor: 'border-l-emerald-500',
    activeIconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    activeTextColor: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    value: 'all',
    label: 'All Reports',
    helperText: 'Complete history log',
    icon: <LayoutList className="w-4 h-4" />,
    borderColor: 'border-l-primary',
    activeIconBg: 'bg-primary/10',
    activeTextColor: 'text-primary',
  },
]

interface ReportsStatusTabsProps {
  activeTab: TabValue
  tabCounts: Record<TabValue, number>
  onTabChange: (tab: TabValue) => void
}

export function ReportsStatusTabs({ activeTab, tabCounts, onTabChange }: ReportsStatusTabsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {TAB_CONFIGS.map((tab) => {
        const isActive = activeTab === tab.value
        const count = tabCounts[tab.value]
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onTabChange(tab.value)}
            className={cn(
              'flex flex-col gap-2 p-4 rounded-xl border-l-4 border border-border text-left transition-all duration-150',
              tab.borderColor,
              isActive
                ? 'bg-card shadow-card'
                : 'bg-card/50 hover:bg-card hover:shadow-card opacity-70 hover:opacity-100',
            )}
          >
            <div className="flex items-center justify-between">
              <div
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  isActive ? tab.activeIconBg : 'bg-muted',
                  isActive ? tab.activeTextColor : 'text-muted-foreground',
                )}
              >
                {tab.icon}
              </div>
              <span
                className={cn(
                  'text-xl font-bold tabular-nums transition-colors',
                  isActive ? tab.activeTextColor : 'text-muted-foreground',
                )}
              >
                {count.toLocaleString()}
              </span>
            </div>
            <div>
              <p
                className={cn(
                  'text-xs font-semibold transition-colors truncate',
                  isActive ? 'text-heading' : 'text-muted-foreground',
                )}
              >
                {tab.label}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{tab.helperText}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
