'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Edit, Loader2, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'

import { BannedKeywordsEditor } from '@/components/admin/settings/banned-keywords-editor'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCreateAdminSetting, useDeleteAdminSetting, useUpdateAdminSetting } from '@/hooks/admin/use-admin-setting-actions'
import { useGetAdminSettings } from '@/hooks/admin/use-get-admin-settings'
import { useGetBannedKeywords } from '@/hooks/admin/use-get-banned-keywords'
import { useUpdateBannedKeywords } from '@/hooks/admin/use-update-banned-keywords'
import { cn } from '@/lib/utils'
import type { RootState } from '@/store/store'
import type { CreateSettingDTO, SelectSettingDTO, SettingDataType, UpdateSettingDTO } from '@/types/admin/admin-setting-dto'

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

function formatSettingLabel(key: string) {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function normalizeDataType(dataType: SettingDataType): NormalizedDataType {
  if (typeof dataType === 'string' && dataTypeOptions.includes(dataType as NormalizedDataType)) return dataType as NormalizedDataType
  const numericTypes: Record<number, NormalizedDataType> = { 1: 'String', 2: 'Integer', 3: 'Boolean', 4: 'Json', 5: 'DateTime' }
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
    <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4">
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:space-y-2">
          <Label htmlFor="setting-key" className="text-xs sm:text-sm text-heading">Key</Label>
          <Input id="setting-key" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} required className="input font-mono text-sm" />
        </div>
        <div className="space-y-1.5 sm:space-y-2">
          <Label htmlFor="setting-group" className="text-xs sm:text-sm text-heading">Group</Label>
          <Input id="setting-group" value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} required className="input font-mono text-sm" />
        </div>
      </div>
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:space-y-2">
          <Label className="text-xs sm:text-sm text-heading">Data type</Label>
          <Select value={form.dataType} onValueChange={(value) => setForm({ ...form, dataType: value as NormalizedDataType })}>
            <SelectTrigger className="input font-mono text-sm"><SelectValue placeholder="Select data type" /></SelectTrigger>
            <SelectContent>{dataTypeOptions.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <label className="inline-flex mb-[8px] h-8 w-fit self-end items-center gap-2 rounded-lg border border-input bg-card px-2.5 text-xs sm:text-sm font-medium text-heading">
          <input type="checkbox" checked={form.isSensitive} onChange={(e) => setForm({ ...form, isSensitive: e.target.checked })} className="size-3 shrink-0 accent-primary" />
          sensitive
        </label>
      </div>
      <div className="space-y-1.5 sm:space-y-2">
        <Label htmlFor="setting-description" className="text-xs sm:text-sm text-heading">Description</Label>
        <Input id="setting-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input text-sm" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col space-y-1.5 sm:space-y-2">
        <Label htmlFor="setting-value" className="text-xs sm:text-sm text-heading">Value</Label>
        <textarea
          id="setting-value"
          value={form.value}
          onChange={(e) => setForm({ ...form, value: e.target.value })}
          placeholder={sensitivePlaceholder}
          rows={6}
          className="input min-h-32 sm:min-h-48 flex-1 resize-y bg-input font-mono text-xs sm:text-sm"
        />
      </div>
      <SheetFooter className="px-0 pt-2">
        <Button type="submit" disabled={isSaving || !form.key.trim() || !form.group.trim() || (!form.isSensitive && !form.value.trim())} className="btn-primary w-full sm:w-auto text-sm">
          {isSaving && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </SheetFooter>
    </form>
  )
}

function SettingValuePreview({ setting }: { setting: SelectSettingDTO }) {
  const dataType = normalizeDataType(setting.dataType)
  if (setting.isSensitive) return <div className="truncate rounded-lg border-default bg-input px-3 py-2 font-mono text-sm text-muted-foreground">••••••••</div>
  if (dataType === 'Boolean') {
    const checked = setting.value.toLowerCase() === 'true'
    return <div className="flex items-center gap-2 text-sm text-muted-foreground"><span className={cn('h-2.5 w-2.5 rounded-full', checked ? 'bg-emerald-500' : 'bg-muted-foreground/40')} />{checked ? 'Enabled' : 'Disabled'}</div>
  }
  return <div className="line-clamp-2 break-all rounded-lg border-default bg-input px-3 py-2 font-mono text-xs text-muted-foreground">{setting.value}</div>
}

function GenericSettingCard({ setting, onEdit, onDelete, isDeleting }: { setting: SelectSettingDTO; onEdit: () => void; onDelete: () => void; isDeleting: boolean }) {
  return (
    <Card className="card card-hover gap-0 overflow-hidden">
      <CardHeader className="border-b border-border px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex w-full min-w-0 items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="truncate text-sm font-semibold text-heading sm:text-base">{formatSettingLabel(setting.key)}</CardTitle>
            <CardDescription className="line-clamp-2 text-xs text-muted-foreground sm:text-sm">{setting.description || setting.key}</CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            <Badge variant="outline" className="badge-default font-mono text-[10px] sm:text-xs">{normalizeDataType(setting.dataType)}</Badge>
            {setting.isSensitive && <Badge variant="secondary" className="badge-amber text-[10px] sm:text-xs">Sensitive</Badge>}
            <Button type="button" variant="outline" size="sm" onClick={onEdit} className="btn-ghost px-2 sm:px-3">
              <Edit className="size-3.5 sm:size-4" />
              <span className="hidden sm:inline ml-1">Edit</span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="ghost" size="icon-sm" className="btn-danger"><Trash2 className="size-3.5 sm:size-4" /></Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-heading">Delete setting?</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    This permanently deletes <span className="font-mono text-heading">{setting.key}</span>. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={onDelete} disabled={isDeleting} className="btn-danger">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 py-4 sm:px-6 sm:py-5">
        <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">Current value</div>
        <SettingValuePreview setting={setting} />
      </CardContent>
    </Card>
  )
}

export default function SettingsPage() {
  const [activeGroup, setActiveGroup] = useState<string>('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingSetting, setEditingSetting] = useState<SelectSettingDTO | null>(null)
  const [createForm, setCreateForm] = useState<SettingFormState>(emptyForm())
  const [editForm, setEditForm] = useState<SettingFormState>(emptyForm())
  const { user } = useSelector((state: RootState) => state.auth)
  const router = useRouter()
  const isAdmin = user?.roles?.includes('Admin') ?? false

  useEffect(() => { if (!isAdmin) router.replace('/unauthorized') }, [isAdmin, router])

  const { data: settingsPage, isLoading: isSettingsLoading, isError: isSettingsError, refetch: refetchSettings } = useGetAdminSettings()
  const { data: bannedKeywords, isLoading: isBannedKeywordsLoading, isError: isBannedKeywordsError, refetch: refetchBannedKeywords } = useGetBannedKeywords()
  const { mutate: updateKeywords, isPending: isUpdatingKeywords } = useUpdateBannedKeywords()
  const createSetting = useCreateAdminSetting()
  const updateSetting = useUpdateAdminSetting()
  const deleteSetting = useDeleteAdminSetting()

  const settingsByGroup = useMemo<SettingsByGroup>(() =>
    (settingsPage?.data ?? []).reduce<SettingsByGroup>((acc, setting) => {
      const group = setting.group?.trim() || 'Ungrouped'
      acc[group] = [...(acc[group] || []), setting]
      return acc
    }, {}),
    [settingsPage?.data]
  )

  const allGroups = useMemo(() => Object.keys(settingsByGroup).sort((a, b) => a.localeCompare(b)), [settingsByGroup])
  const effectiveActiveGroup = activeGroup && allGroups.includes(activeGroup) ? activeGroup : allGroups[0]
  const activeSettings = effectiveActiveGroup ? settingsByGroup[effectiveActiveGroup] : []
  const hasBannedKeywordsSetting = activeSettings?.some(isBannedKeywordsSetting)
  const genericSettings = activeSettings?.filter((s) => !isBannedKeywordsSetting(s)) ?? []

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
    createSetting.mutate(toCreateDto(createForm), { onSuccess: () => setCreateOpen(false) })
  }

  const handleUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingSetting) return
    const unchangedMaskedSensitive = editingSetting.isSensitive && editingSetting.value === hiddenSensitiveValue && !editForm.value.trim()
    updateSetting.mutate({
      id: editingSetting.id,
      ...toCreateDto({ ...editForm, value: unchangedMaskedSensitive ? editingSetting.value : editForm.value }),
    } as UpdateSettingDTO, {
      onSuccess: () => setEditOpen(false),
    })
  }

  if (!isAdmin) return null

  return (
    <div className="w-full mx-auto py-4 sm:py-6 px-3 sm:px-6 flex flex-col gap-4 sm:gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-heading sm:text-2xl">Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5 sm:text-sm sm:mt-1">Configure platform settings, moderation rules, and system values</p>
        </div>
        <Button type="button" onClick={openCreate} className="btn-primary shrink-0 text-xs sm:text-sm px-3 sm:px-4">
          <Plus className="size-3.5 sm:size-4 mr-1 sm:mr-1.5" />
          <span className="hidden sm:inline">Add Setting</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {isSettingsLoading ? (
        <div className="card p-4 sm:p-6 flex flex-col gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-48 sm:h-64 w-full" />
        </div>
      ) : isSettingsError ? (
        <div className="card p-4 sm:p-6 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted-foreground">Failed to load settings.</p>
          <Button type="button" variant="secondary" onClick={() => refetchSettings()} className="btn-ghost">Retry</Button>
        </div>
      ) : (
        <Tabs value={effectiveActiveGroup} onValueChange={setActiveGroup}>
          <div className="relative w-full overflow-x-auto no-scrollbar touch-pan-x pb-2">
            <TabsList className="flex w-max min-w-full items-center justify-start gap-1.5 sm:gap-2 bg-transparent p-1">
              {allGroups.map((group) => {
                const count = settingsByGroup[group]?.length ?? 0
                return (
                  <TabsTrigger
                    key={group}
                    value={group}
                    className={cn(
                      'shrink-0 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 font-mono text-xs sm:text-sm',
                      'data-[state=active]:bg-secondary data-[state=active]:shadow-sm',
                      'border border-transparent data-[state=active]:border-border',
                    )}
                  >
                    {group}
                    <Badge variant="secondary" className="badge-default ml-1.5 sm:ml-2 text-[10px] sm:text-xs">{count}</Badge>
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>

          {allGroups.map((group) => (
            <TabsContent key={group} value={group} className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
              <section className="card p-4 sm:p-6 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] sm:text-sm font-semibold text-heading uppercase tracking-wide">Group</div>
                  <h2 className="font-mono text-base sm:text-xl font-semibold tracking-tight text-heading">{group}</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {settingsByGroup[group]?.length ?? 0} {(settingsByGroup[group]?.length ?? 0) === 1 ? 'setting' : 'settings'} loaded.
                  </p>
                </div>
                <Badge variant="outline" className="badge-default shrink-0 text-[10px] sm:text-xs">
                  {settingsByGroup[group]?.filter((s) => !isBannedKeywordsSetting(s)).length ?? 0} editable
                </Badge>
              </section>

              {(settingsByGroup[group]?.length ?? 0) === 0 ? (
                <div className="card border-dashed p-6 sm:p-8 text-center">
                  <h3 className="text-sm font-medium text-heading">No settings found</h3>
                  <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-muted-foreground">Add a setting to this group.</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {hasBannedKeywordsSetting && (
                    isBannedKeywordsLoading ? (
                      <div className="card p-4 sm:p-6 flex flex-col gap-4">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-8 w-72" />
                      </div>
                    ) : isBannedKeywordsError ? (
                      <div className="card p-4 sm:p-6 flex flex-col items-center gap-3 text-center">
                        <p className="text-sm text-muted-foreground">Failed to load banned keywords.</p>
                        <Button type="button" variant="secondary" onClick={() => refetchBannedKeywords()} className="btn-ghost">Retry</Button>
                      </div>
                    ) : (
                      <BannedKeywordsEditor
                        initialKeywords={bannedKeywords?.keywords ?? []}
                        onSave={(keywords) => updateKeywords({ keywords })}
                        isSaving={isUpdatingKeywords}
                      />
                    )
                  )}

                  {genericSettings.map((setting) => (
                    <GenericSettingCard
                      key={setting.id}
                      setting={setting}
                      onEdit={() => openEdit(setting)}
                      onDelete={() => deleteSetting.mutate(setting.id)}
                      isDeleting={deleteSetting.isPending}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="w-full sm:!w-[55vw] sm:!max-w-4xl overflow-y-auto border-border bg-card flex flex-col">
          <SheetHeader className="px-4 sm:px-6">
            <SheetTitle className="text-lg sm:text-xl text-heading">Create Setting</SheetTitle>
            <SheetDescription className="text-xs sm:text-sm text-muted-foreground">Add a new system setting.</SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 px-4 sm:px-6 pb-4 sm:pb-6 pt-4">
            <SettingForm form={createForm} setForm={setCreateForm} onSubmit={handleCreate} isSaving={createSetting.isPending} submitLabel="Create Setting" />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent className="w-full sm:!w-[55vw] sm:!max-w-5xl overflow-y-auto border-border bg-card flex flex-col">
          <SheetHeader className="px-4 sm:px-6">
            <SheetTitle className="text-lg sm:text-xl text-heading">Edit Setting</SheetTitle>
            <SheetDescription className="text-xs sm:text-sm text-muted-foreground">
              <span className="font-mono text-heading">{editingSetting?.key}</span> — full details and value editor.
            </SheetDescription>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 px-4 sm:px-6 pb-4 sm:pb-6 pt-4">
            <SettingForm
              form={editForm}
              setForm={setEditForm}
              onSubmit={handleUpdate}
              isSaving={updateSetting.isPending}
              submitLabel="Save Changes"
              sensitivePlaceholder={editingSetting?.isSensitive ? 'Current value masked. Leave blank to keep unchanged, type new value to override.' : undefined}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
