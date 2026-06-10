'use client'

import { useState, useCallback, useMemo } from 'react'
import { ReviewQueueTable } from '@/components/admin/review-queue/review-queue-table'
import { QueueStatusTabs } from '@/components/admin/review-queue/queue-status-tabs'
import { QueueToolbar } from '@/components/admin/review-queue/queue-toolbar'
import { QueuePagination } from '@/components/admin/review-queue/queue-pagination'
import { useGetModerationQueue } from '@/hooks/admin/use-get-moderation-queue'
import { useGetAdminPosts } from '@/hooks/admin/use-get-admin-posts'
import { useApproveQueueEntry } from '@/hooks/admin/use-approve-queue-entry'
import { useRejectQueueEntry } from '@/hooks/admin/use-reject-queue-entry'
import { useForceApprovePost } from '@/hooks/admin/use-force-approve-post'
import { useForceRejectPost } from '@/hooks/admin/use-force-reject-post'
import { AdminQueueEntryDTO } from '@/types/admin/admin-queue-entry-dto'
import { AdminPostDTO } from '@/types/admin/admin-post-dto'
import { Page, FilterMapping, OrderMapping } from '@/types/common/page'
import { FilterType } from '@/constants/filterType'
import { FilterOperator } from '@/constants/filterOperator'
import { SortOrderType } from '@/constants/sortOrderType'
import { AlertTriangle, RefreshCw } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type TabValue = 'needs-review' | 'published' | 'flagged' | 'all'
type SortKey = 'newest' | 'oldest'
type EntityTypeFilter = '' | 'Post' | 'QAPost' | 'Answer' | 'Comment'

const DEFAULT_PAGE_SIZE = 20

// ─── Page Builder ─────────────────────────────────────────────────────────────

function buildEnhancedPage(
  pageNumber: number,
  tabFilters: FilterMapping[],
  searchQuery: string,
  entityTypeFilter: EntityTypeFilter,
  sortKey: SortKey,
  activeTab: TabValue,
): Page<string> {
  const filters: FilterMapping[] = [...tabFilters]

  if (searchQuery.trim()) {
    filters.push({
      prop: 'title',
      value: searchQuery.trim(),
      filterOperator: FilterOperator.Contains,
      filterType: FilterType.Text,
      dynamicProperty: '',
      delimiter: '',
    })
  }

  if (entityTypeFilter && activeTab === 'needs-review') {
    const targetTypeMap: Record<Exclude<EntityTypeFilter, '' | 'QAPost'>, number> = {
      Post: 0,
      Answer: 1,
      Comment: 2,
    }
    const mappedTargetType = entityTypeFilter === 'QAPost' ? 0 : targetTypeMap[entityTypeFilter]
    filters.push({
      prop: 'targetType',
      value: mappedTargetType,
      filterOperator: FilterOperator.Equal,
      filterType: FilterType.Number,
      dynamicProperty: '',
      delimiter: '',
    })
  } else if (entityTypeFilter) {
    filters.push({
      prop: 'entityType',
      value: entityTypeFilter,
      filterOperator: FilterOperator.Equal,
      filterType: FilterType.Text,
      dynamicProperty: '',
      delimiter: '',
    })
  }

  const orders: OrderMapping[] = [
    {
      sort: 'dateCreated',
      sortDir: sortKey === 'newest' ? SortOrderType.DESC : SortOrderType.ASC,
      dynamicProperty: '',
      delimiter: '',
      dataType: '',
    },
  ]

  return {
    pageNumber,
    size: DEFAULT_PAGE_SIZE,
    orders,
    filter: filters,
    selected: [],
  }
}

function buildModerationStatusFilter(tab: TabValue): FilterMapping[] {
  if (tab === 'published') {
    return [{
      prop: 'moderationStatus',
      value: 1,
      filterOperator: FilterOperator.Equal,
      filterType: FilterType.Number,
      dynamicProperty: '',
      delimiter: '',
    }]
  }
  if (tab === 'flagged') {
    return [{
      prop: 'moderationStatus',
      value: 2,
      filterOperator: FilterOperator.Equal,
      filterType: FilterType.Number,
      dynamicProperty: '',
      delimiter: '',
    }]
  }
  return []
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function ReviewQueuePage() {
  // Tab + pagination state
  const [activeTab, setActiveTab] = useState<TabValue>('needs-review')
  const [pageByTab, setPageByTab] = useState<Record<TabValue, number>>({
    'needs-review': 0,
    published: 0,
    flagged: 0,
    all: 0,
  })

  // Filter + search state
  const [searchQuery, setSearchQuery] = useState('')
  const [entityTypeFilter, setEntityTypeFilter] = useState<EntityTypeFilter>('')
  const [sortKey, setSortKey] = useState<SortKey>('newest')

  const pageNumber = pageByTab[activeTab]
  const hasActiveFilters = searchQuery.trim() !== '' || entityTypeFilter !== ''

  // Reset page to 0 when filters/sort change
  const resetPage = useCallback(() => {
    setPageByTab((prev) => ({ ...prev, [activeTab]: 0 }))
  }, [activeTab])

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    resetPage()
  }, [resetPage])

  const handleEntityTypeChange = useCallback((value: EntityTypeFilter) => {
    setEntityTypeFilter(value)
    resetPage()
  }, [resetPage])

  const handleSortChange = useCallback((value: SortKey) => {
    setSortKey(value)
    resetPage()
  }, [resetPage])

  const handleClearFilters = useCallback(() => {
    setSearchQuery('')
    setEntityTypeFilter('')
    resetPage()
  }, [resetPage])

  function handleTabChange(tab: TabValue) {
    setActiveTab(tab)
  }

  function setActivePage(updater: (page: number) => number) {
    setPageByTab((current) => ({
      ...current,
      [activeTab]: updater(current[activeTab]),
    }))
  }

  // Build pages per tab
  const queuePageParams = useMemo(
    () => buildEnhancedPage(pageByTab['needs-review'], [], searchQuery, entityTypeFilter, sortKey, 'needs-review'),
    [pageByTab, searchQuery, entityTypeFilter, sortKey],
  )
  const publishedPageParams = useMemo(
    () => buildEnhancedPage(pageByTab.published, buildModerationStatusFilter('published'), searchQuery, entityTypeFilter, sortKey, 'published'),
    [pageByTab, searchQuery, entityTypeFilter, sortKey],
  )
  const flaggedPageParams = useMemo(
    () => buildEnhancedPage(pageByTab.flagged, buildModerationStatusFilter('flagged'), searchQuery, entityTypeFilter, sortKey, 'flagged'),
    [pageByTab, searchQuery, entityTypeFilter, sortKey],
  )
  const allPageParams = useMemo(
    () => buildEnhancedPage(pageByTab.all, [], searchQuery, entityTypeFilter, sortKey, 'all'),
    [pageByTab, searchQuery, entityTypeFilter, sortKey],
  )

  // Queries
  const { data: queueData, isLoading: queueLoading, isError: queueError, refetch: refetchQueue } = useGetModerationQueue(queuePageParams)
  const { data: publishedData, isLoading: publishedLoading, isError: publishedError, refetch: refetchPublished } = useGetAdminPosts(publishedPageParams)
  const { data: flaggedData, isLoading: flaggedLoading, isError: flaggedError, refetch: refetchFlagged } = useGetAdminPosts(flaggedPageParams)
  const { data: allData, isLoading: allLoading, isError: allError, refetch: refetchAll } = useGetAdminPosts(allPageParams)

  // Mutations
  const approveQueueMutation = useApproveQueueEntry()
  const rejectQueueMutation = useRejectQueueEntry()
  const approvePostMutation = useForceApprovePost()
  const rejectPostMutation = useForceRejectPost()

  // Derived data
  const queueEntries = activeTab === 'needs-review' ? queueData?.data ?? [] : []
  const allPosts =
    activeTab === 'published'
      ? publishedData?.data ?? []
      : activeTab === 'flagged'
      ? flaggedData?.data ?? []
      : activeTab === 'all'
      ? allData?.data ?? []
      : []

  const isLoading =
    activeTab === 'needs-review'
      ? queueLoading
      : activeTab === 'published'
      ? publishedLoading
      : activeTab === 'flagged'
      ? flaggedLoading
      : allLoading

  const isError = queueError || publishedError || flaggedError || allError
  const isPending =
    approveQueueMutation.isPending ||
    rejectQueueMutation.isPending ||
    approvePostMutation.isPending ||
    rejectPostMutation.isPending

  const tabCounts: Record<TabValue, number> = {
    'needs-review': queueData?.page.totalElements ?? 0,
    published: publishedData?.page.totalElements ?? 0,
    flagged: flaggedData?.page.totalElements ?? 0,
    all: allData?.page.totalElements ?? 0,
  }

  const totalElements =
    activeTab === 'needs-review'
      ? (queueData?.page.totalElements ?? 0)
      : activeTab === 'published'
      ? (publishedData?.page.totalElements ?? 0)
      : activeTab === 'flagged'
      ? (flaggedData?.page.totalElements ?? 0)
      : (allData?.page.totalElements ?? 0)

  const totalPages = Math.max(1, Math.ceil(totalElements / DEFAULT_PAGE_SIZE))

  // Handlers
  function handleApproveQueue(entry: AdminQueueEntryDTO, note?: string) {
    approveQueueMutation.mutate({ id: entry.id, resolution: 'Approved', moderatorNote: note })
  }

  function handleRejectQueue(entry: AdminQueueEntryDTO, note?: string) {
    rejectQueueMutation.mutate({ id: entry.id, resolution: 'Rejected', moderatorNote: note })
  }

  function handleApprovePost(post: AdminPostDTO) {
    approvePostMutation.mutate(post.id)
  }

  function handleRejectPost(post: AdminPostDTO, reasonText: string, moderatorNote?: string) {
    rejectPostMutation.mutate({ id: post.id, reasonText, moderatorNote })
  }

  function handleRetry() {
    void refetchQueue()
    void refetchPublished()
    void refetchFlagged()
    void refetchAll()
  }

  return (
    <div className="w-full mx-auto py-6 px-4 sm:px-6 flex flex-col gap-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-heading">Review Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review, approve, and moderate content across all types
          </p>
        </div>
        <button
          type="button"
          onClick={handleRetry}
          disabled={isLoading}
          aria-label="Refresh queue"
          className="btn-ghost flex items-center gap-2 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Status Tabs ── */}
      <QueueStatusTabs
        activeTab={activeTab}
        tabCounts={tabCounts}
        onTabChange={handleTabChange}
      />

      {/* ── Error State ── */}
      {isError && (
        <div className="card p-6 flex flex-col items-center gap-3 border-destructive/30">
          <AlertTriangle className="w-7 h-7 text-destructive" />
          <p className="text-sm text-muted-foreground">
            Something went wrong loading the review queue.
          </p>
          <button onClick={handleRetry} className="btn-ghost text-sm">
            Retry
          </button>
        </div>
      )}

      {/* ── Toolbar ── */}
      <QueueToolbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        entityTypeFilter={entityTypeFilter}
        onEntityTypeChange={handleEntityTypeChange}
        sortKey={sortKey}
        onSortChange={handleSortChange}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
      />

      {/* ── Table ── */}
      <ReviewQueueTable
        queueEntries={queueEntries}
        allPosts={allPosts}
        tabCounts={tabCounts}
        isLoading={isLoading || isPending}
        activeTab={activeTab}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        onApproveQueue={handleApproveQueue}
        onRejectQueue={handleRejectQueue}
        onApprovePost={handleApprovePost}
        onRejectPost={handleRejectPost}
      />

      {/* ── Pagination ── */}
      {!isLoading && !isError && (
        <QueuePagination
          currentPage={pageNumber}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={DEFAULT_PAGE_SIZE}
          onPageChange={(p) => setActivePage(() => p)}
        />
      )}

    </div>
  )
}
