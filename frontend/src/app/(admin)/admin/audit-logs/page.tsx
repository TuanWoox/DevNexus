'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { History, Search } from 'lucide-react'
import { FilterOperator } from '@/constants/filterOperator'
import { FilterType } from '@/constants/filterType'
import { useGetAdminAuditLogs } from '@/hooks/admin/use-get-admin-audit-logs'
import { RootState } from '@/store/store'
import { AuditActionType, AuditTargetType } from '@/types/admin/admin-audit-log-dto'
import { FilterMapping, Page } from '@/types/common/page'
import { AdminAuditLogsTable } from '@/components/admin/audit-logs/admin-audit-logs-table'

const PAGE_SIZE = 10

const actionOptions = [
  { value: AuditActionType.UserSuspended, label: 'User suspended' },
  { value: AuditActionType.UserUnsuspended, label: 'User unsuspended' },
  { value: AuditActionType.UserPermanentlyBanned, label: 'User permanently banned' },
  { value: AuditActionType.UserRoleChanged, label: 'User role changed' },
  { value: AuditActionType.PostForceApproved, label: 'Post force approved' },
  { value: AuditActionType.PostForceRejected, label: 'Post force rejected' },
  { value: AuditActionType.ModerationQueueApproved, label: 'Queue approved' },
  { value: AuditActionType.ModerationQueueRejected, label: 'Queue rejected' },
]

const targetOptions = [
  { value: AuditTargetType.User, label: 'User' },
  { value: AuditTargetType.Post, label: 'Post' },
  { value: AuditTargetType.ModerationQueueEntry, label: 'Queue entry' },
]

function textFilter(prop: string, value: string): FilterMapping {
  return {
    prop,
    value,
    filterOperator: FilterOperator.Contains,
    filterType: FilterType.Text,
    dynamicProperty: '',
    delimiter: '',
  }
}

function numberFilter(prop: string, value: number): FilterMapping {
  return {
    prop,
    value,
    filterOperator: FilterOperator.Equal,
    filterType: FilterType.Number,
    dynamicProperty: '',
    delimiter: '',
  }
}

function dateFilter(prop: string, value: string, filterOperator: FilterOperator): FilterMapping {
  return {
    prop,
    value,
    filterOperator,
    filterType: FilterType.DateTime,
    dynamicProperty: '',
    delimiter: '',
  }
}

function endOfDayIso(date: string): string {
  return `${date}T23:59:59.999Z`
}

export default function AdminAuditLogsPage() {
  const { user } = useSelector((state: RootState) => state.auth)
  const router = useRouter()
  const isAdmin = user?.roles?.includes('Admin') ?? false

  const [pageNumber, setPageNumber] = useState(0)
  const [actorSearch, setActorSearch] = useState('')
  const [targetSearch, setTargetSearch] = useState('')
  const [actionType, setActionType] = useState<string>('all')
  const [targetType, setTargetType] = useState<string>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  useEffect(() => {
    if (!isAdmin) router.replace('/unauthorized')
  }, [isAdmin, router])

  const filters = useMemo<FilterMapping[]>(() => {
    const items: FilterMapping[] = []
    const cleanActor = actorSearch.trim()
    const cleanTarget = targetSearch.trim()

    if (cleanActor) items.push(textFilter('actorDisplayName', cleanActor))
    if (cleanTarget) items.push(textFilter('targetDisplayName', cleanTarget))
    if (actionType !== 'all') items.push(numberFilter('actionType', Number(actionType)))
    if (targetType !== 'all') items.push(numberFilter('targetType', Number(targetType)))
    if (fromDate) items.push(dateFilter('createdAt', `${fromDate}T00:00:00.000Z`, FilterOperator.GreaterThanOrEqual))
    if (toDate) items.push(dateFilter('createdAt', endOfDayIso(toDate), FilterOperator.LessThanOrEqual))

    return items
  }, [actorSearch, targetSearch, actionType, targetType, fromDate, toDate])

  const page = useMemo<Page<string>>(() => ({
    size: PAGE_SIZE,
    pageNumber,
    totalElements: 0,
    orders: [],
    filter: filters,
    selected: [],
  }), [pageNumber, filters])

  const { data, isLoading, isFetching, isError, refetch } = useGetAdminAuditLogs(page)

  function resetToFirstPage() {
    setPageNumber(0)
  }

  function clearFilters() {
    setActorSearch('')
    setTargetSearch('')
    setActionType('all')
    setTargetType('all')
    setFromDate('')
    setToDate('')
    setPageNumber(0)
  }

  if (!isAdmin) return null

  return (
    <div className="w-full mx-auto py-4 sm:py-6 px-3 sm:px-6 flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <History className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold text-heading sm:text-2xl">Audit Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">Admin and moderator action history</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="actor-search">Actor</label>
            <input
              id="actor-search"
              className="input text-sm"
              value={actorSearch}
              onChange={(event) => { setActorSearch(event.target.value); resetToFirstPage() }}
              placeholder="Search actor"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="target-search">Target</label>
            <input
              id="target-search"
              className="input text-sm"
              value={targetSearch}
              onChange={(event) => { setTargetSearch(event.target.value); resetToFirstPage() }}
              placeholder="Search target"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="action-type">Action</label>
            <select
              id="action-type"
              className="input text-sm"
              value={actionType}
              onChange={(event) => { setActionType(event.target.value); resetToFirstPage() }}
            >
              <option value="all">All actions</option>
              {actionOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="target-type">Target type</label>
            <select
              id="target-type"
              className="input text-sm"
              value={targetType}
              onChange={(event) => { setTargetType(event.target.value); resetToFirstPage() }}
            >
              <option value="all">All targets</option>
              {targetOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="from-date">From</label>
            <input
              id="from-date"
              type="date"
              className="input text-sm"
              value={fromDate}
              onChange={(event) => { setFromDate(event.target.value); resetToFirstPage() }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="to-date">To</label>
            <input
              id="to-date"
              type="date"
              className="input text-sm"
              value={toDate}
              onChange={(event) => { setToDate(event.target.value); resetToFirstPage() }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Search className="w-3.5 h-3.5" />
            <span>Filters apply automatically</span>
          </div>
          <button type="button" className="btn-ghost text-xs px-3 py-1.5" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      </div>

      {isError && (
        <div className="card p-4 sm:p-6 flex flex-col items-center gap-3">
          <p className="text-xs sm:text-sm text-muted-foreground">Audit logs could not be loaded.</p>
          <button onClick={() => refetch()} className="btn-ghost text-xs sm:text-sm">Retry</button>
        </div>
      )}

      <AdminAuditLogsTable
        logs={data?.data ?? []}
        isLoading={isLoading || isFetching}
        pageNumber={data?.page.pageNumber ?? pageNumber}
        totalElements={data?.page.totalElements ?? 0}
        pageSize={data?.page.size ?? PAGE_SIZE}
        onPreviousPage={() => setPageNumber((page) => Math.max(0, page - 1))}
        onNextPage={() => setPageNumber((page) => page + 1)}
      />
    </div>
  )
}
