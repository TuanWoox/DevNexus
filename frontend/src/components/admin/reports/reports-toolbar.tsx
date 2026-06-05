import { Search, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ReportTargetType } from '@/types/report/report-target-type'
import { ReportTargetAction } from '@/types/report/report-target-action'
import { SortOrderType } from '@/constants/sortOrderType'

interface ReportsToolbarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  targetType: string
  onTargetTypeChange: (value: string) => void
  targetAction: string
  onTargetActionChange: (value: string) => void
  sortDirection: SortOrderType
  onSortChange: (value: SortOrderType) => void
  hasActiveFilters: boolean
  onClearFilters: () => void
}

export function ReportsToolbar({
  searchTerm,
  onSearchChange,
  targetType,
  onTargetTypeChange,
  targetAction,
  onTargetActionChange,
  sortDirection,
  onSortChange,
  hasActiveFilters,
  onClearFilters,
}: ReportsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search report description..."
          aria-label="Search reports by description"
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
        />
        {searchTerm && (
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

      {/* Target Type Filter */}
      <div className="relative">
        <select
          value={targetType}
          onChange={(e) => onTargetTypeChange(e.target.value)}
          aria-label="Filter by target type"
          className={cn(
            'appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all cursor-pointer',
            targetType !== 'all'
              ? 'border-primary/50 bg-primary/5 text-primary'
              : 'border-border',
          )}
        >
          <option value="all">All targets</option>
          <option value={String(ReportTargetType.Profile)}>Profile</option>
          <option value={String(ReportTargetType.Post)}>Post</option>
          <option value={String(ReportTargetType.Question)}>Question</option>
          <option value={String(ReportTargetType.Comment)}>Comment</option>
          <option value={String(ReportTargetType.Answer)}>Answer</option>
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
      </div>

      {/* Enforcement Action Filter */}
      <div className="relative">
        <select
          value={targetAction}
          onChange={(e) => onTargetActionChange(e.target.value)}
          aria-label="Filter by enforcement action"
          className={cn(
            'appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all cursor-pointer',
            targetAction !== 'all'
              ? 'border-primary/50 bg-primary/5 text-primary'
              : 'border-border',
          )}
        >
          <option value="all">All actions</option>
          <option value={String(ReportTargetAction.None)}>No enforcement</option>
          <option value={String(ReportTargetAction.HideContent)}>Hide content</option>
          <option value={String(ReportTargetAction.DeleteComment)}>Hide comment</option>
          <option value={String(ReportTargetAction.DeleteAnswer)}>Hide answer</option>
          <option value={String(ReportTargetAction.SuspendUser)}>Suspend user</option>
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
      </div>

      {/* Sort */}
      <div className="relative">
        <select
          value={sortDirection}
          onChange={(e) => onSortChange(e.target.value as SortOrderType)}
          aria-label="Sort reports"
          className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all cursor-pointer"
        >
          <option value={SortOrderType.DESC}>Newest first</option>
          <option value={SortOrderType.ASC}>Oldest first</option>
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
