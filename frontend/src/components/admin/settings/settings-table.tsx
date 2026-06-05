'use client'

import { useState } from 'react'
import { Edit, Trash2, Copy, Check, Eye, EyeOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SelectSettingDTO, SettingDataType } from '@/types/admin/admin-setting-dto'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

type NormalizedDataType = 'String' | 'Integer' | 'Boolean' | 'Json' | 'DateTime'
const dataTypeOptions: NormalizedDataType[] = ['String', 'Integer', 'Boolean', 'Json', 'DateTime']

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

interface SettingsTableProps {
  settings: SelectSettingDTO[]
  onEdit: (setting: SelectSettingDTO) => void
  onDelete: (id: string) => void
  isDeleting: boolean
}

export function SettingsTable({ settings, onEdit, onDelete, isDeleting }: SettingsTableProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [jsonViewValue, setJsonViewValue] = useState<string | null>(null)

  function handleCopy(key: string) {
    navigator.clipboard.writeText(key)
    setCopiedKey(key)
    toast.success('Setting key copied to clipboard')
    setTimeout(() => setCopiedKey(null), 2000)
  }

  return (
    <>
      <div className="w-full bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-3.5 sm:px-6">Setting Key / Description</th>
                <th className="px-4 py-3.5 w-[110px]">Type</th>
                <th className="px-4 py-3.5 max-w-[280px]">Value Preview</th>
                <th className="px-4 py-3.5 w-[130px]">Flags</th>
                <th className="px-4 py-3.5 text-right w-[120px] pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {settings.map((setting) => {
                const dataType = normalizeDataType(setting.dataType)
                const isBoolean = dataType === 'Boolean'
                const isJson = dataType === 'Json'
                const isValSensitive = setting.isSensitive

                const isTrue = setting.value?.toLowerCase() === 'true'

                return (
                  <tr
                    key={setting.id}
                    className="hover:bg-muted/20 transition-colors group/row text-sm"
                  >
                    {/* Setting Key & Description */}
                    <td className="px-4 py-4 sm:px-6 align-top">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono font-bold text-heading truncate max-w-[240px] select-all">
                          {setting.key}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(setting.key)}
                          className="opacity-0 group-hover/row:opacity-100 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-all shrink-0"
                          title="Copy setting key"
                        >
                          {copiedKey === setting.key ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      {setting.description && (
                        <p className="text-xs text-muted-foreground mt-1 max-w-[340px] leading-relaxed break-words">
                          {setting.description}
                        </p>
                      )}
                    </td>

                    {/* Data Type */}
                    <td className="px-4 py-4 align-top">
                      <Badge variant="outline" className="badge-default font-mono text-[10px] sm:text-xs shrink-0">
                        {dataType}
                      </Badge>
                    </td>

                    {/* Value Preview */}
                    <td className="px-4 py-4 align-top max-w-[280px]">
                      {isValSensitive ? (
                        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-mono text-xs">
                          <EyeOff className="w-3.5 h-3.5 shrink-0" />
                          <span>••••••••</span>
                        </div>
                      ) : isBoolean ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-muted/40 text-xs font-semibold text-heading shrink-0">
                          <span
                            className={cn(
                              'w-2 h-2 rounded-full shrink-0',
                              isTrue ? 'bg-emerald-500' : 'bg-muted-foreground/40',
                            )}
                          />
                          {isTrue ? 'Enabled' : 'Disabled'}
                        </div>
                      ) : isJson ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs text-muted-foreground truncate max-w-[150px] bg-muted px-1.5 py-0.5 rounded border border-border">
                            {setting.value}
                          </span>
                          <button
                            type="button"
                            onClick={() => setJsonViewValue(setting.value)}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                            title="Expand JSON"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="font-mono text-xs text-muted-foreground line-clamp-2 break-all bg-muted/30 px-2 py-1 rounded border border-border/40 select-all">
                          {setting.value}
                        </span>
                      )}
                    </td>

                    {/* Flags */}
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-col gap-1 items-start shrink-0">
                        {isValSensitive && (
                          <Badge className="badge-amber text-[10px] sm:text-xs">
                            Sensitive
                          </Badge>
                        )}
                        <Badge variant="outline" className="badge-default text-[10px] sm:text-xs">
                          Editable
                        </Badge>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 align-top text-right pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(setting)}
                          className="btn-ghost h-8 px-2 sm:px-2.5 flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="btn-danger h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                              title="Delete setting"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
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
                              <AlertDialogAction
                                onClick={() => onDelete(setting.id)}
                                disabled={isDeleting}
                                className="btn-danger bg-destructive hover:bg-destructive/95 text-destructive-foreground"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Viewer Dialog */}
      <Dialog open={!!jsonViewValue} onOpenChange={(open) => !open && setJsonViewValue(null)}>
        <DialogContent className="sm:max-w-xl bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-heading font-mono text-sm">JSON Value View</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Pre-formatted raw JSON data representation.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 p-4 bg-muted border border-border rounded-lg max-h-[350px] overflow-y-auto font-mono text-xs text-foreground whitespace-pre-wrap select-all">
            {jsonViewValue ? (() => {
              try {
                return JSON.stringify(JSON.parse(jsonViewValue), null, 2)
              } catch {
                return jsonViewValue
              }
            })() : ''}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
