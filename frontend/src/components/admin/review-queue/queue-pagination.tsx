import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QueuePaginationProps {
  currentPage: number  // 0-indexed
  totalPages: number
  totalElements: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function QueuePagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
}: QueuePaginationProps) {
  if (totalPages <= 1) return null

  const startItem = currentPage * pageSize + 1
  const endItem = Math.min((currentPage + 1) * pageSize, totalElements)

  // Build page numbers to show (max 5 visible, with ellipsis)
  function getPageNumbers(): (number | '...')[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i)
    }
    const pages: (number | '...')[] = [0]
    if (currentPage > 2) pages.push('...')
    const start = Math.max(1, currentPage - 1)
    const end = Math.min(totalPages - 2, currentPage + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (currentPage < totalPages - 3) pages.push('...')
    pages.push(totalPages - 1)
    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex items-center justify-between gap-4 px-1 flex-wrap">
      <p className="text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground tabular-nums">{startItem.toLocaleString()}–{endItem.toLocaleString()}</span>{' '}
        of <span className="font-medium text-foreground tabular-nums">{totalElements.toLocaleString()}</span> items
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 0}
          aria-label="Previous page"
          className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pageNumbers.map((page, idx) =>
          page === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-1.5 text-xs text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page as number)}
              aria-label={`Page ${(page as number) + 1}`}
              aria-current={currentPage === page ? 'page' : undefined}
              className={cn(
                'min-w-[32px] h-8 px-2 rounded-md text-xs font-medium transition-colors',
                currentPage === page
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              {(page as number) + 1}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          aria-label="Next page"
          className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
