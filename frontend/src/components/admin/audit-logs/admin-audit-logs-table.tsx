'use client'

import { Fragment, useState } from 'react'
import { AdminAuditLogDTO, AuditActionType, AuditTargetType } from '@/types/admin/admin-audit-log-dto'
import { Skeleton } from '@/components/ui/skeleton'
import { History, ChevronDown, ChevronRight } from 'lucide-react'

interface AdminAuditLogsTableProps {
  logs: AdminAuditLogDTO[]
  isLoading: boolean
  pageNumber: number
  totalElements: number
  pageSize: number
  onPreviousPage: () => void
  onNextPage: () => void
}

function formatDate(iso?: string): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleString()
}

function targetTypeLabel(value: AuditTargetType | number): string {
  switch (value) {
    case AuditTargetType.User: return 'User'
    case AuditTargetType.Post: return 'Post'
    case AuditTargetType.ModerationQueueEntry: return 'Queue Entry'
    case AuditTargetType.ModerationReport: return 'Moderation report'
    default: return 'Unknown'
  }
}

function actionTypeLabel(value: AuditActionType | number): string {
  switch (value) {
    case AuditActionType.UserSuspended: return 'User suspended'
    case AuditActionType.UserUnsuspended: return 'User unsuspended'
    case AuditActionType.UserPermanentlyBanned: return 'User permanently banned'
    case AuditActionType.UserRoleChanged: return 'User role changed'
    case AuditActionType.PostForceApproved: return 'Post force approved'
    case AuditActionType.PostForceRejected: return 'Post force rejected'
    case AuditActionType.ModerationQueueApproved: return 'Queue approved'
    case AuditActionType.ModerationQueueRejected: return 'Queue rejected'
    case AuditActionType.ReportAssigned: return 'Report assigned'
    case AuditActionType.ReportResolved: return 'Report resolved'
    case AuditActionType.ReportDismissed: return 'Report dismissed'
    case AuditActionType.ReportEscalated: return 'Report escalated'
    default: return 'Unknown action'
  }
}

function prettyJson(value?: string | null): string {
  if (!value) return '-'
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

function reasonText(log: AdminAuditLogDTO): string {
  return log.publicReason || log.internalNote || '-'
}

export function AdminAuditLogsTable({
  logs,
  isLoading,
  pageNumber,
  totalElements,
  pageSize,
  onPreviousPage,
  onNextPage,
}: AdminAuditLogsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const canGoPrevious = pageNumber > 0
  const canGoNext = (pageNumber + 1) * pageSize < totalElements

  return (
    <div className="card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <span className="text-base font-semibold text-heading uppercase tracking-wide">Audit Events</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{totalElements.toLocaleString()} total</span>
          <button type="button" className="btn-ghost text-xs px-2 py-1 disabled:opacity-40 disabled:cursor-not-allowed" onClick={onPreviousPage} disabled={!canGoPrevious || isLoading}>
            Previous
          </button>
          <button type="button" className="btn-ghost text-xs px-2 py-1 disabled:opacity-40 disabled:cursor-not-allowed" onClick={onNextPage} disabled={!canGoNext || isLoading}>
            Next
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[980px]">
          <thead className="sticky top-0 bg-card z-10">
            <tr className="border-b border-default">
              <th className="w-10 px-4 py-3" />
              <th className="px-4 py-3 text-left text-xs font-semibold text-heading uppercase tracking-wide">Timestamp</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-heading uppercase tracking-wide">Actor</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-heading uppercase tracking-wide">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-heading uppercase tracking-wide">Action</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-heading uppercase tracking-wide">Target</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-heading uppercase tracking-wide">Reason / Note</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <tr key={i} className="border-b border-default last:border-0">
                  {Array.from({ length: 7 }).map((__, cell) => (
                    <td key={cell} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No audit logs match these filters.
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const isExpanded = expandedId === log.id
                return (
                  <Fragment key={log.id}>
                    <tr className="border-b border-default last:border-0 hover:bg-subtle transition-colors">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-primary"
                          onClick={() => setExpandedId(isExpanded ? null : log.id)}
                          aria-label={isExpanded ? 'Hide details' : 'Show details'}
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono">{formatDate(log.createdAt)}</td>
                      <td className="px-4 py-3 text-heading">{log.actorDisplayName || log.actorUserId || 'Unknown'}</td>
                      <td className="px-4 py-3">
                        <span className="badge-default">{log.actorRole || '-'}</span>
                      </td>
                      <td className="px-4 py-3 text-heading">{actionTypeLabel(log.actionType)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-heading">{log.targetDisplayName || log.targetId}</span>
                          <span className="text-xs text-muted-foreground">{targetTypeLabel(log.targetType)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[260px] truncate">{reasonText(log)}</td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-b border-default bg-subtle/40">
                        <td colSpan={7} className="px-4 py-4">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                            <div>
                              <p className="text-xs font-semibold text-heading uppercase tracking-wide mb-2">Old State</p>
                              <pre className="text-xs whitespace-pre-wrap rounded-md border border-default bg-card p-3 text-muted-foreground">{prettyJson(log.oldState)}</pre>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-heading uppercase tracking-wide mb-2">New State</p>
                              <pre className="text-xs whitespace-pre-wrap rounded-md border border-default bg-card p-3 text-muted-foreground">{prettyJson(log.newState)}</pre>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-heading uppercase tracking-wide mb-2">Metadata</p>
                              <pre className="text-xs whitespace-pre-wrap rounded-md border border-default bg-card p-3 text-muted-foreground">{prettyJson(log.metadataJson)}</pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
