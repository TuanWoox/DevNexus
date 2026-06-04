'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const groupDescriptions: Record<string, string> = {
  AI_WORKER: 'Configure artificial intelligence services, API keys, model variables, and worker options.',
  EMAIL_TEMPLATE: 'Manage system automated email templates, content structures, and dispatcher settings.',
  FRONT_END: 'Configure frontend runtime constants, static assets, layout settings, and user features.',
  Moderation: 'Manage content moderation thresholds, AI guardrail parameters, and pre-publish flags.',
  UPLOAD: 'Configure maximum file size limits, permitted MIME types, and destination paths.',
}

function normalizeGroupLabel(group: string) {
  const labels: Record<string, string> = {
    AI_WORKER: 'AI Worker',
    EMAIL_TEMPLATE: 'Email Templates',
    FRONT_END: 'Frontend Config',
    Moderation: 'Moderation Rules',
    UPLOAD: 'Upload Settings',
  }
  return labels[group] ?? group
}

interface SettingsSummaryCardProps {
  group: string
  totalCount: number
  sensitiveCount: number
  editableCount: number
}

export function SettingsSummaryCard({ group, totalCount, sensitiveCount, editableCount }: SettingsSummaryCardProps) {
  const desc = groupDescriptions[group] ?? 'System setting group variables.'
  const normalizedLabel = normalizeGroupLabel(group)

  return (
    <Card className="card overflow-hidden">
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div>
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Group Context</div>
          <h2 className="text-lg font-bold text-heading mt-0.5 tracking-tight font-mono">{normalizedLabel}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">{desc}</p>
        </div>

        <div className="grid grid-cols-3 gap-2.5 pt-1.5 border-t border-border/60">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</div>
            <div className="text-lg font-bold text-heading mt-0.5 font-mono">{totalCount}</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Sensitive</div>
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5 font-mono">{sensitiveCount}</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Editable</div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">{editableCount}</div>
          </div>
        </div>
      </div>
    </Card>
  )
}
