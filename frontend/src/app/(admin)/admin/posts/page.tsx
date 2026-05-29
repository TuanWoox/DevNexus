'use client'

import { useState } from 'react'
import { UnifiedPostsTable } from '@/components/admin/posts/unified-posts-table'
import { useGetModerationQueue } from '@/hooks/admin/use-get-moderation-queue'
import { useGetAdminPosts } from '@/hooks/admin/use-get-admin-posts'
import { useApproveQueueEntry } from '@/hooks/admin/use-approve-queue-entry'
import { useRejectQueueEntry } from '@/hooks/admin/use-reject-queue-entry'
import { useForceApprovePost } from '@/hooks/admin/use-force-approve-post'
import { useForceRejectPost } from '@/hooks/admin/use-force-reject-post'
import { AdminQueueEntryDTO } from '@/types/admin/admin-queue-entry-dto'
import { AdminPostDTO } from '@/types/admin/admin-post-dto'
import { Page, FilterMapping } from '@/types/common/page'
import { FilterType } from '@/constants/filterType'
import { FilterOperator } from '@/constants/filterOperator'

const DEFAULT_PAGE_SIZE = 20

type TabValue = 'needs-review' | 'published' | 'flagged' | 'all'

function buildPage(pageNumber: number, filters: FilterMapping[] = []): Page<string> {
  return {
    pageNumber,
    size: DEFAULT_PAGE_SIZE,
    totalElements: 0,
    orders: [],
    filter: filters,
    selected: []
  }
}

// Build filter for post-backed tabs. Needs Review is queue-backed via AdminModeration.
function buildModerationStatusFilter(tab: TabValue): FilterMapping[] {
  if (tab === 'published') {
    // Filter for Approved posts (enum value 1)
    return [{
      prop: 'moderationStatus',
      value: 1,
      filterOperator: FilterOperator.Equal,
      filterType: FilterType.Number,
      dynamicProperty: '',
      delimiter: ''
    }]
  }
  if (tab === 'flagged') {
    // Filter for Flagged only (enum value 2)
    return [{
      prop: 'moderationStatus',
      value: 2,
      filterOperator: FilterOperator.Equal,
      filterType: FilterType.Number,
      dynamicProperty: '',
      delimiter: ''
    }]
  }
  // 'all' tab: no filter (show everything)
  return []
}

export default function PostsManagementPage() {
  const [pageByTab, setPageByTab] = useState<Record<TabValue, number>>({
    'needs-review': 0,
    published: 0,
    flagged: 0,
    all: 0,
  })
  const [activeTab, setActiveTab] = useState<TabValue>('needs-review')
  const pageNumber = pageByTab[activeTab]

  const queuePage = buildPage(pageByTab['needs-review'])
  const publishedPage = buildPage(pageByTab.published, buildModerationStatusFilter('published'))
  const flaggedPage = buildPage(pageByTab.flagged, buildModerationStatusFilter('flagged'))
  const allPage = buildPage(pageByTab.all, buildModerationStatusFilter('all'))

  const { data: queueData, isLoading: queueLoading, isError: queueError, refetch: refetchQueue } = useGetModerationQueue(queuePage)
  const { data: publishedData, isLoading: publishedLoading, isError: publishedError, refetch: refetchPublished } = useGetAdminPosts(publishedPage)
  const { data: flaggedData, isLoading: flaggedLoading, isError: flaggedError, refetch: refetchFlagged } = useGetAdminPosts(flaggedPage)
  const { data: allData, isLoading: allLoading, isError: allError, refetch: refetchAll } = useGetAdminPosts(allPage)

  // Mutations
  const approveQueueMutation = useApproveQueueEntry()
  const rejectQueueMutation = useRejectQueueEntry()
  const approvePostMutation = useForceApprovePost()
  const rejectPostMutation = useForceRejectPost()

  const queueEntries = activeTab === 'needs-review' ? queueData?.data ?? [] : []
  const allPosts = activeTab === 'published'
    ? publishedData?.data ?? []
    : activeTab === 'flagged'
      ? flaggedData?.data ?? []
      : activeTab === 'all'
        ? allData?.data ?? []
        : []

  const isLoading = activeTab === 'needs-review'
    ? queueLoading
    : activeTab === 'published'
      ? publishedLoading
      : activeTab === 'flagged'
        ? flaggedLoading
        : allLoading
  const isError = queueError || publishedError || flaggedError || allError
  const isPending = approveQueueMutation.isPending || rejectQueueMutation.isPending ||
                    approvePostMutation.isPending || rejectPostMutation.isPending

  const tabCounts: Record<TabValue, number> = {
    'needs-review': queueData?.page.totalElements ?? 0,
    published: publishedData?.page.totalElements ?? 0,
    flagged: flaggedData?.page.totalElements ?? 0,
    all: allData?.page.totalElements ?? 0,
  }
  const totalElements = tabCounts[activeTab]
  const totalPages = Math.max(1, Math.ceil(totalElements / DEFAULT_PAGE_SIZE))

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
    refetchQueue()
    refetchPublished()
    refetchFlagged()
    refetchAll()
  }

  function handleTabChange(newTab: TabValue) {
    setActiveTab(newTab)
  }

  function setActivePage(updater: (page: number) => number) {
    setPageByTab((current) => ({
      ...current,
      [activeTab]: updater(current[activeTab]),
    }))
  }

  return (
    <div className="w-full mx-auto py-6 px-4 sm:px-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-heading">Posts</h1>
          <p className="text-sm text-muted-foreground mt-1">Unified content management and moderation workflow</p>
        </div>
      </div>

      {isError ? (
        <div className="card p-6 flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">Something went wrong. Try refreshing the page.</p>
          <button onClick={handleRetry} className="btn-ghost">Retry</button>
        </div>
      ) : (
        <>
          <UnifiedPostsTable
            queueEntries={queueEntries}
            allPosts={allPosts}
            tabCounts={tabCounts}
            isLoading={isLoading || isPending}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onApproveQueue={handleApproveQueue}
            onRejectQueue={handleRejectQueue}
            onApprovePost={handleApprovePost}
            onRejectPost={handleRejectPost}
          />

          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Page {pageNumber + 1} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActivePage((p) => Math.max(0, p - 1))}
                  disabled={pageNumber <= 0}
                  className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setActivePage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={pageNumber >= totalPages - 1}
                  className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
