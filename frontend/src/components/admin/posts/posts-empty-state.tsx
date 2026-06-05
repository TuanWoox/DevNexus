import { FileSearch, Inbox, X } from 'lucide-react'

interface PostsEmptyStateProps {
  hasFilters: boolean
  onClearFilters?: () => void
}

export function PostsEmptyState({ hasFilters, onClearFilters }: PostsEmptyStateProps) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-xl border border-dashed border-border bg-card">
        <div className="p-4 rounded-full bg-muted">
          <FileSearch className="w-8 h-8 text-muted-foreground/60" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-heading">No posts match your filters</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your search or clearing the active filters.
          </p>
        </div>
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="btn-ghost flex items-center gap-2 text-sm"
          >
            <X className="w-3.5 h-3.5" />
            Clear filters
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-xl border border-dashed border-border bg-card">
      <div className="p-4 rounded-full bg-muted">
        <Inbox className="w-8 h-8 text-muted-foreground/60" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-heading">No posts in this category</p>
        <p className="text-xs text-muted-foreground mt-1">
          Items will appear here when they match this status.
        </p>
      </div>
    </div>
  )
}
