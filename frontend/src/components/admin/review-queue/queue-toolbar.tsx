import { Search, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type SortKey = 'newest' | 'oldest'
type EntityTypeFilter = '' | 'Post' | 'QAPost' | 'Answer' | 'Comment'

interface QueueToolbarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  entityTypeFilter: EntityTypeFilter
  onEntityTypeChange: (value: EntityTypeFilter) => void
  sortKey: SortKey
  onSortChange: (value: SortKey) => void
  hasActiveFilters: boolean
  onClearFilters: () => void
}

export function QueueToolbar({
  searchQuery,
  onSearchChange,
  entityTypeFilter,
  onEntityTypeChange,
  sortKey,
  onSortChange,
  hasActiveFilters,
  onClearFilters,
}: QueueToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by title..."
          aria-label="Search content by title"
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Entity Type Filter */}
      <div className="relative">
        <select
          value={entityTypeFilter}
          onChange={(e) => onEntityTypeChange(e.target.value as EntityTypeFilter)}
          aria-label="Filter by content type"
          className={cn(
            'appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all cursor-pointer',
            entityTypeFilter
              ? 'border-primary/50 bg-primary/5 text-primary'
              : 'border-border',
          )}
        >
          <option value="">All Types</option>
          <option value="Post">Blog Post</option>
          <option value="QAPost">Q&amp;A Post</option>
          <option value="Answer">Answer</option>
          <option value="Comment">Comment</option>
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
      </div>

      {/* Sort */}
      <div className="relative">
        <select
          value={sortKey}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
          aria-label="Sort content"
          className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all cursor-pointer"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
      </div>

      {/* Clear */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all"
        >
          <X className="w-3.5 h-3.5" />
          Clear
        </button>
      )}
    </div>
  )
}
