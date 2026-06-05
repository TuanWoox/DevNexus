'use client'

import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SettingsEmptyStateProps {
  onClear: () => void
  hasActiveFilters: boolean
}

export function SettingsEmptyState({ onClear, hasActiveFilters }: SettingsEmptyStateProps) {
  return (
    <div className="card border-dashed p-10 flex flex-col items-center justify-center text-center gap-4 min-h-[300px]">
      <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
        <SlidersHorizontal className="w-5 h-5" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-heading">No settings match your criteria</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-sm">
          {hasActiveFilters
            ? 'Try adjusting your search query, selecting another data type, or relaxing flags.'
            : 'No configuration variables are registered in this setting group.'}
        </p>
      </div>
      {hasActiveFilters && (
        <Button type="button" variant="outline" onClick={onClear} className="btn-ghost text-xs">
          Reset Filter Options
        </Button>
      )}
    </div>
  )
}
