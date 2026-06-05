'use client'

import { FormEvent, useEffect, useMemo, useState, useCallback } from 'react'
import { Loader2, Plus, RefreshCw, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'

import { BannedKeywordsEditor } from '@/components/admin/settings/banned-keywords-editor'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useCreateAdminSetting, useDeleteAdminSetting, useUpdateAdminSetting } from '@/hooks/admin/use-admin-setting-actions'
import { useGetAdminSettings } from '@/hooks/admin/use-get-admin-settings'
import { useGetBannedKeywords } from '@/hooks/admin/use-get-banned-keywords'
import { useUpdateBannedKeywords } from '@/hooks/admin/use-update-banned-keywords'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { RootState } from '@/store/store'
import type { CreateSettingDTO, SelectSettingDTO, SettingDataType, UpdateSettingDTO } from '@/types/admin/admin-setting-dto'

// Redesigned sub-components
import { SettingsGroupNav } from '@/components/admin/settings/settings-group-nav'
import { SettingsSummaryCard } from '@/components/admin/settings/settings-summary-card'
import { SettingsToolbar, SettingsTypeFilter, SettingsFlagFilter } from '@/components/admin/settings/settings-toolbar'
import { SettingsTable } from '@/components/admin/settings/settings-table'
import { SettingsEmptyState } from '@/components/admin/settings/settings-empty-state'
import { SettingsSkeleton } from '@/components/admin/settings/settings-skeleton'

type SettingsByGroup = Record<string, SelectSettingDTO[]>
type NormalizedDataType = 'String' | 'Integer' | 'Boolean' | 'Json' | 'DateTime'
type SettingFormState = {
  key: string
  group: string
  value: string
  dataType: NormalizedDataType
  isSensitive: boolean
  description: string
}

const dataTypeOptions: NormalizedDataType[] = ['String', 'Integer', 'Boolean', 'Json', 'DateTime']
const hiddenSensitiveValue = '*******'

const emptyForm = (group = ''): SettingFormState => ({
  key: '',
  group,
  value: '',
  dataType: 'String',
  isSensitive: false,
  description: '',
})

function normalizeDataType(dataType: SettingDataType): NormalizedDataType {
  if (typeof dataType === 'string' && dataTypeOptions.includes(dataType as NormalizedDataType)) {
    return dataType as NormalizedDataType
  }
  const numericTypes: Record<number, NormalizedDataType> = {
    1: 'String',
    2: 'Integer',
    3: 'Boolean',
    4: 'Json',
    5: 'DateTime',
  }
  return typeof dataType === 'number' ? numericTypes[dataType] ?? 'String' : 'String'
}

function isBannedKeywordsSetting(setting: SelectSettingDTO) {
  return setting.group.toLowerCase() === 'moderation' && setting.key.toLowerCase() === 'bannedkeywords'
}

function toFormState(setting: SelectSettingDTO): SettingFormState {
  return {
    key: setting.key,
    group: setting.group,
    value: setting.isSensitive && setting.value === hiddenSensitiveValue ? '' : setting.value,
    dataType: normalizeDataType(setting.dataType),
    isSensitive: setting.isSensitive,
    description: setting.description ?? '',
  }
}

function toCreateDto(form: SettingFormState): CreateSettingDTO {
  return {
    key: form.key.trim(),
    group: form.group.trim(),
    value: form.value,
    dataType: form.dataType,
    isSensitive: form.isSensitive,
    description: form.description.trim() || null,
  }
}

function SettingForm({
  form,
  setForm,
  onSubmit,
  isSaving,
  submitLabel,
  sensitivePlaceholder,
}: {
  form: SettingFormState
  setForm: (form: SettingFormState) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  isSaving: boolean
  submitLabel: string
  sensitivePlaceholder?: string
}) {
  return (
    <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="setting-key" className="text-xs sm:text-sm text-heading font-medium">Setting Key</Label>
          <Input
            id="setting-key"
            value={form.key}
            onChange={(e) => setForm({ ...form, key: e.target.value })}
            placeholder="e.g. MAX_UPLOAD_LIMIT"
            required
            className="input font-mono text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="setting-group" className="text-xs sm:text-sm text-heading font-medium">Group</Label>
          <Input
            id="setting-group"
            value={form.group}
            onChange={(e) => setForm({ ...form, group: e.target.value })}
            placeholder="e.g. UPLOAD"
            required
            className="input font-mono text-sm"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 items-end">
        <div className="space-y-1.5">
          <Label className="text-xs sm:text-sm text-heading font-medium">Data Type</Label>
          <Select value={form.dataType} onValueChange={(value) => setForm({ ...form, dataType: value as NormalizedDataType })}>
            <SelectTrigger className="input font-mono text-sm">
              <SelectValue placeholder="Select data type" />
            </SelectTrigger>
            <SelectContent>
              {dataTypeOptions.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <label className="inline-flex h-9 w-full sm:w-auto items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 text-xs sm:text-sm font-medium text-heading cursor-pointer hover:bg-muted/30 transition-colors">
          <input
            type="checkbox"
            checked={form.isSensitive}
            onChange={(e) => setForm({ ...form, isSensitive: e.target.checked })}
            className="size-3.5 shrink-0 accent-primary rounded border-border"
          />
          Sensitive / Masked Value
        </label>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="setting-description" className="text-xs sm:text-sm text-heading font-medium">Description</Label>
        <Input
          id="setting-description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Brief description of what this setting configures"
          className="input text-sm"
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col space-y-1.5">
        <Label htmlFor="setting-value" className="text-xs sm:text-sm text-heading font-medium">Value</Label>
        <textarea
          id="setting-value"
          value={form.value}
          onChange={(e) => setForm({ ...form, value: e.target.value })}
          placeholder={sensitivePlaceholder ?? 'Enter configuration value...'}
          rows={6}
          className="input min-h-32 sm:min-h-40 flex-1 resize-y bg-input font-mono text-xs sm:text-sm"
        />
        {form.isSensitive && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
            ⚠️ Warning: Sensitive values are encrypted or hidden in logs.
          </p>
        )}
      </div>

      <SheetFooter className="px-0 pt-3 border-t border-border mt-auto">
        <Button
          type="submit"
          disabled={isSaving || !form.key.trim() || !form.group.trim() || (!form.isSensitive && !form.value.trim())}
          className="btn-primary w-full sm:w-auto text-sm"
        >
          {isSaving && <Loader2 className="size-4 animate-spin mr-1.5" />}
          {submitLabel}
        </Button>
      </SheetFooter>
    </form>
  )
}

export default function SettingsPage() {
  const [activeGroup, setActiveGroup] = useState<string>('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingSetting, setEditingSetting] = useState<SelectSettingDTO | null>(null)
  const [createForm, setCreateForm] = useState<SettingFormState>(emptyForm())
  const [editForm, setEditForm] = useState<SettingFormState>(emptyForm())

  // Toolbar search + filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<SettingsTypeFilter>('ALL')
  const [flagFilter, setFlagFilter] = useState<SettingsFlagFilter>('ALL')

  const { user } = useSelector((state: RootState) => state.auth)
  const router = useRouter()
  const isAdmin = user?.roles?.includes('Admin') ?? false

  useEffect(() => {
    if (!isAdmin) router.replace('/unauthorized')
  }, [isAdmin, router])

  const {
    data: settingsPage,
    isLoading: isSettingsLoading,
    isError: isSettingsError,
    refetch: refetchSettings,
  } = useGetAdminSettings()

  const {
    data: bannedKeywords,
    isLoading: isBannedKeywordsLoading,
    isError: isBannedKeywordsError,
    refetch: refetchBannedKeywords,
  } = useGetBannedKeywords()

  const { mutate: updateKeywords, isPending: isUpdatingKeywords } = useUpdateBannedKeywords()
  const createSetting = useCreateAdminSetting()
  const updateSetting = useUpdateAdminSetting()
  const deleteSetting = useDeleteAdminSetting()

  const settingsByGroup = useMemo<SettingsByGroup>(() => {
    return (settingsPage?.data ?? []).reduce<SettingsByGroup>((acc, setting) => {
      const group = setting.group?.trim() || 'Ungrouped'
      acc[group] = [...(acc[group] || []), setting]
      return acc
    }, {})
  }, [settingsPage?.data])

  const allGroups = useMemo(() => {
    return Object.keys(settingsByGroup).sort((a, b) => a.localeCompare(b))
  }, [settingsByGroup])

  const effectiveActiveGroup = useMemo(() => {
    if (activeGroup && allGroups.includes(activeGroup)) return activeGroup
    return allGroups[0] || ''
  }, [activeGroup, allGroups])

  const activeSettings = useMemo(() => {
    return effectiveActiveGroup ? settingsByGroup[effectiveActiveGroup] : []
  }, [effectiveActiveGroup, settingsByGroup])

  const hasBannedKeywordsSetting = useMemo(() => {
    return activeSettings?.some(isBannedKeywordsSetting) ?? false
  }, [activeSettings])

  // Filter settings per active tab group
  const filteredSettings = useMemo(() => {
    let list = activeSettings ?? []

    // 1. Search Query Filter (key or description)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (s) =>
          s.key.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q)),
      )
    }

    // 2. Type Filter
    if (typeFilter !== 'ALL') {
      list = list.filter((s) => normalizeDataType(s.dataType) === typeFilter)
    }

    // 3. Flags Filter
    if (flagFilter !== 'ALL') {
      if (flagFilter === 'SENSITIVE') {
        list = list.filter((s) => s.isSensitive === true)
      } else if (flagFilter === 'NON_SENSITIVE') {
        list = list.filter((s) => s.isSensitive === false)
      } else if (flagFilter === 'EDITABLE') {
        // All are editable in this schema
      } else if (flagFilter === 'READ_ONLY') {
        return [] // No read-only settings currently exist
      }
    }

    return list
  }, [activeSettings, searchQuery, typeFilter, flagFilter])

  // Split generic settings vs custom moderation bannedKeywords setting
  const displayGenericSettings = useMemo(() => {
    return filteredSettings.filter((s) => !isBannedKeywordsSetting(s))
  }, [filteredSettings])

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    allGroups.forEach((g) => {
      counts[g] = settingsByGroup[g]?.length ?? 0
    })
    return counts
  }, [allGroups, settingsByGroup])

  const activeGroupStats = useMemo(() => {
    const list = activeSettings ?? []
    return {
      total: list.length,
      sensitive: list.filter((s) => s.isSensitive).length,
      editable: list.filter((s) => !isBannedKeywordsSetting(s)).length,
    }
  }, [activeSettings])

  const hasActiveFilters = useMemo(() => {
    return searchQuery.trim() !== '' || typeFilter !== 'ALL' || flagFilter !== 'ALL'
  }, [searchQuery, typeFilter, flagFilter])

  const handleClearFilters = useCallback(() => {
    setSearchQuery('')
    setTypeFilter('ALL')
    setFlagFilter('ALL')
  }, [])

  const openCreate = () => {
    setCreateForm(emptyForm(effectiveActiveGroup || ''))
    setCreateOpen(true)
  }

  const openEdit = (setting: SelectSettingDTO) => {
    setEditingSetting(setting)
    setEditForm(toFormState(setting))
    setEditOpen(true)
  }

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    createSetting.mutate(toCreateDto(createForm), {
      onSuccess: () => setCreateOpen(false),
    })
  }

  const handleUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingSetting) return
    const unchangedMaskedSensitive =
      editingSetting.isSensitive &&
      editingSetting.value === hiddenSensitiveValue &&
      !editForm.value.trim()

    updateSetting.mutate(
      {
        id: editingSetting.id,
        ...toCreateDto({
          ...editForm,
          value: unchangedMaskedSensitive ? editingSetting.value : editForm.value,
        }),
      } as UpdateSettingDTO,
      {
        onSuccess: () => setEditOpen(false),
      },
    )
  }

  const handleRefresh = () => {
    void refetchSettings()
    void refetchBannedKeywords()
  }

  if (!isAdmin) return null

  return (
    <div className="w-full mx-auto py-6 px-4 sm:px-6 flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-heading">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage platform configuration, moderation rules, integrations, and system values.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleRefresh}
            disabled={isSettingsLoading}
            className="btn-ghost flex items-center gap-1.5 text-xs h-9"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isSettingsLoading && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            type="button"
            onClick={openCreate}
            className="btn-primary flex items-center gap-1.5 text-xs h-9"
          >
            <Plus className="w-4 h-4" />
            Add Setting
          </Button>
        </div>
      </div>

      {isSettingsLoading ? (
        <SettingsSkeleton />
      ) : isSettingsError ? (
        <div className="card p-8 flex flex-col items-center gap-3 text-center border-destructive/20">
          <AlertTriangle className="w-8 h-8 text-destructive" />
          <h3 className="text-sm font-semibold text-heading">Failed to load system settings</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            Check network connections or ensure the platform service is running.
          </p>
          <Button type="button" variant="outline" onClick={handleRefresh} className="btn-ghost mt-2">
            Retry Connection
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          {/* Left Navigation Menu */}
          <div className="md:col-span-1">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 pl-1 hidden md:block">
              Group Categories
            </div>
            <SettingsGroupNav
              groups={allGroups}
              activeGroup={effectiveActiveGroup}
              onGroupChange={(group) => {
                setActiveGroup(group)
                handleClearFilters()
              }}
              counts={groupCounts}
            />
          </div>

          {/* Right Content Panel */}
          <div className="md:col-span-3 space-y-6">
            {/* Context Header Summary Card */}
            <SettingsSummaryCard
              group={effectiveActiveGroup}
              totalCount={activeGroupStats.total}
              sensitiveCount={activeGroupStats.sensitive}
              editableCount={activeGroupStats.editable}
            />

            {/* Custom Banned Keywords Editor (Moderation Group only) */}
            {hasBannedKeywordsSetting && !searchQuery.trim() && (
              <div className="border-b border-border/50 pb-4">
                {isBannedKeywordsLoading ? (
                  <div className="card p-5 space-y-4">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-9 w-24 ml-auto" />
                  </div>
                ) : isBannedKeywordsError ? (
                  <div className="card p-5 flex flex-col items-center justify-center text-center gap-2 border-destructive/20">
                    <p className="text-xs text-muted-foreground">Failed to load moderation banned keywords.</p>
                    <Button type="button" variant="ghost" onClick={() => refetchBannedKeywords()} className="btn-ghost text-xs h-8">
                      Retry Load
                    </Button>
                  </div>
                ) : (
                  <BannedKeywordsEditor
                    initialKeywords={bannedKeywords?.keywords ?? []}
                    onSave={(keywords) => updateKeywords({ keywords })}
                    isSaving={isUpdatingKeywords}
                  />
                )}
              </div>
            )}

            {/* Toolbar - only show if there are generic settings or active filters */}
            {(activeSettings.filter((s) => !isBannedKeywordsSetting(s)).length > 0 || hasActiveFilters) && (
              <SettingsToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                typeFilter={typeFilter}
                onTypeChange={setTypeFilter}
                flagFilter={flagFilter}
                onFlagChange={setFlagFilter}
                onClearFilters={handleClearFilters}
                hasActiveFilters={hasActiveFilters}
              />
            )}

            {/* Main Settings Table or Empty state */}
            {displayGenericSettings.length === 0 ? (
              (hasActiveFilters || !hasBannedKeywordsSetting) && (
                <SettingsEmptyState
                  onClear={handleClearFilters}
                  hasActiveFilters={hasActiveFilters}
                />
              )
            ) : (
              <SettingsTable
                settings={displayGenericSettings}
                onEdit={openEdit}
                onDelete={(id) => deleteSetting.mutate(id)}
                isDeleting={deleteSetting.isPending}
              />
            )}
          </div>
        </div>
      )}

      {/* Add Setting Dialog Sheet */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="w-full sm:!w-[500px] overflow-y-auto border-border bg-card flex flex-col p-6">
          <SheetHeader className="pb-4 border-b border-border">
            <SheetTitle className="text-lg text-heading font-bold">Add Configuration Setting</SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Define a new system environment variable or platform flag.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 min-h-0 pt-4">
            <SettingForm
              form={createForm}
              setForm={setCreateForm}
              onSubmit={handleCreate}
              isSaving={createSetting.isPending}
              submitLabel="Register Setting"
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Setting Dialog Sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="w-full sm:!w-[500px] overflow-y-auto border-border bg-card flex flex-col p-6">
          <SheetHeader className="pb-4 border-b border-border">
            <SheetTitle className="text-lg text-heading font-bold">Edit Configuration Value</SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground font-mono truncate">
              {editingSetting?.key}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 min-h-0 pt-4">
            <SettingForm
              form={editForm}
              setForm={setEditForm}
              onSubmit={handleUpdate}
              isSaving={updateSetting.isPending}
              submitLabel="Save System Changes"
              sensitivePlaceholder={
                editingSetting?.isSensitive
                  ? 'Sensitive value masked. Leave blank to keep current value, or type a new value.'
                  : undefined
              }
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
