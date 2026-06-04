import { cn } from '@/lib/utils'
import { Clock, CheckCircle2, AlertTriangle, LayoutList } from 'lucide-react'

type TabValue = 'needs-review' | 'published' | 'flagged' | 'all'

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
    value: 'needs-review',
    label: 'Needs Review',
    helperText: 'Requires your action',
    icon: <Clock className="w-4 h-4" />,
    borderColor: 'border-l-amber-400',
    activeIconBg: 'bg-amber-50 dark:bg-amber-500/10',
    activeTextColor: 'text-amber-700 dark:text-amber-300',
  },
  {
    value: 'published',
    label: 'Published',
    helperText: 'Visible to all users',
    icon: <CheckCircle2 className="w-4 h-4" />,
    borderColor: 'border-l-emerald-400',
    activeIconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    activeTextColor: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    value: 'flagged',
    label: 'Flagged',
    helperText: 'Hidden, needs action',
    icon: <AlertTriangle className="w-4 h-4" />,
    borderColor: 'border-l-red-400',
    activeIconBg: 'bg-red-50 dark:bg-red-500/10',
    activeTextColor: 'text-red-700 dark:text-red-300',
  },
  {
    value: 'all',
    label: 'All Posts',
    helperText: 'Complete content library',
    icon: <LayoutList className="w-4 h-4" />,
    borderColor: 'border-l-primary',
    activeIconBg: 'bg-primary/10',
    activeTextColor: 'text-primary',
  },
]

interface PostsStatusTabsProps {
  activeTab: TabValue
  tabCounts: Record<TabValue, number>
  onTabChange: (tab: TabValue) => void
}

export function PostsStatusTabs({ activeTab, tabCounts, onTabChange }: PostsStatusTabsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
                  'text-2xl font-bold tabular-nums transition-colors',
                  isActive ? tab.activeTextColor : 'text-muted-foreground',
                )}
              >
                {count.toLocaleString()}
              </span>
            </div>
            <div>
              <p
                className={cn(
                  'text-sm font-semibold transition-colors',
                  isActive ? 'text-heading' : 'text-muted-foreground',
                )}
              >
                {tab.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{tab.helperText}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
