'use client'

import { cn } from '@/lib/utils'
import { Cpu, Mail, Monitor, ShieldCheck, UploadCloud, Settings, ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const groupMetadata: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  AI_WORKER: { label: 'AI Worker', icon: Cpu },
  EMAIL_TEMPLATE: { label: 'Email Templates', icon: Mail },
  FRONT_END: { label: 'Frontend Config', icon: Monitor },
  Moderation: { label: 'Moderation Rules', icon: ShieldCheck },
  UPLOAD: { label: 'Upload Settings', icon: UploadCloud },
}

function normalizeGroup(group: string) {
  const meta = groupMetadata[group]
  if (meta) return meta

  // Fallback normalization
  const label = group
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase())
  return { label, icon: Settings }
}

interface SettingsGroupNavProps {
  groups: string[]
  activeGroup: string
  onGroupChange: (group: string) => void
  counts: Record<string, number>
}

export function SettingsGroupNav({ groups, activeGroup, onGroupChange, counts }: SettingsGroupNavProps) {
  return (
    <div className="w-full">
      {/* Mobile view dropdown selector */}
      <div className="md:hidden relative w-full mb-4">
        <select
          value={activeGroup}
          onChange={(e) => onGroupChange(e.target.value)}
          aria-label="Select settings group"
          className="w-full appearance-none pl-3 pr-10 py-2.5 text-sm font-medium rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
        >
          {groups.map((group) => {
            const { label } = normalizeGroup(group)
            const count = counts[group] ?? 0
            return (
              <option key={group} value={group}>
                {label} ({count})
              </option>
            )
          })}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>

      {/* Desktop view vertical navigation list */}
      <nav className="hidden md:flex flex-col gap-1.5" aria-label="Settings categories">
        {groups.map((group) => {
          const { label, icon: Icon } = normalizeGroup(group)
          const count = counts[group] ?? 0
          const isActive = activeGroup === group

          return (
            <button
              key={group}
              type="button"
              onClick={() => onGroupChange(group)}
              className={cn(
                'flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left w-full group/btn',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover/btn:text-foreground',
                  )}
                />
                <span className="truncate">{label}</span>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  'font-mono text-[10px] sm:text-xs tracking-tight transition-colors shrink-0 ml-2',
                  isActive ? 'bg-primary/20 text-primary border-transparent' : 'badge-default',
                )}
              >
                {count}
              </Badge>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
