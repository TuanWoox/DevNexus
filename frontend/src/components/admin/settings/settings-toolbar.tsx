'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'

export type SettingsTypeFilter = 'ALL' | 'String' | 'Integer' | 'Boolean' | 'Json' | 'DateTime'
export type SettingsFlagFilter = 'ALL' | 'SENSITIVE' | 'NON_SENSITIVE' | 'EDITABLE' | 'READ_ONLY'

interface SettingsToolbarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  typeFilter: SettingsTypeFilter
  onTypeChange: (value: SettingsTypeFilter) => void
  flagFilter: SettingsFlagFilter
  onFlagChange: (value: SettingsFlagFilter) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
}

export function SettingsToolbar({
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeChange,
  flagFilter,
  onFlagChange,
  onClearFilters,
  hasActiveFilters,
}: SettingsToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-card border border-border rounded-xl shadow-sm">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by key or description..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-8 input w-full text-sm"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={typeFilter} onValueChange={(val) => onTypeChange(val as SettingsTypeFilter)}>
          <SelectTrigger className="w-[140px] input text-sm font-mono">
            <SelectValue placeholder="Data Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="String">String</SelectItem>
            <SelectItem value="Integer">Integer</SelectItem>
            <SelectItem value="Boolean">Boolean</SelectItem>
            <SelectItem value="Json">JSON</SelectItem>
            <SelectItem value="DateTime">DateTime</SelectItem>
          </SelectContent>
        </Select>

        <Select value={flagFilter} onValueChange={(val) => onFlagChange(val as SettingsFlagFilter)}>
          <SelectTrigger className="w-[150px] input text-sm font-mono">
            <SelectValue placeholder="Flags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Settings</SelectItem>
            <SelectItem value="SENSITIVE">Sensitive Only</SelectItem>
            <SelectItem value="NON_SENSITIVE">Non-Sensitive</SelectItem>
            <SelectItem value="EDITABLE">Editable Only</SelectItem>
            <SelectItem value="READ_ONLY">Read-only</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            onClick={onClearFilters}
            className="btn-ghost text-xs px-2.5 h-9 flex items-center gap-1.5 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
