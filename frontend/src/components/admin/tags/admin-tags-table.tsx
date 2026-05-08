'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { SelectTagDTO } from '@/types/admin/admin-tag-dto'

interface AdminTagsTableProps {
  tags: SelectTagDTO[]
  isLoading: boolean
  onEdit: (tag: SelectTagDTO) => void
  onDelete: (tag: SelectTagDTO) => void
}

export function AdminTagsTable({ tags, isLoading, onEdit, onDelete }: AdminTagsTableProps) {
  if (isLoading) {
    return (
      <div className="overflow-x-auto rounded-lg border border-default">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card z-10">
            <tr className="border-b border-default">
              <th className="px-4 py-3 text-left text-xs font-semibold text-heading uppercase tracking-wide">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-heading uppercase tracking-wide">Post Count</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-heading uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-default last:border-0">
                <td className="px-4 py-3"><Skeleton className="h-5 w-32" /></td>
                <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                <td className="px-4 py-3"><Skeleton className="h-5 w-28" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (tags.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        No tags found.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-default">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-card z-10">
          <tr className="border-b border-default">
            <th className="px-4 py-3 text-left text-xs font-semibold text-heading uppercase tracking-wide">Name</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-heading uppercase tracking-wide">Post Count</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-heading uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tags.map((tag) => {
            const canDelete = tag.postCount === 0
            return (
              <tr key={tag.id} className="border-b border-default last:border-0 hover:bg-subtle transition-colors">
                <td className="px-4 py-3 text-foreground/85">
                  <span className="font-mono font-medium">{tag.name}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{tag.postCount}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="btn-ghost text-xs px-2 py-1"
                      onClick={() => onEdit(tag)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-danger text-xs px-2 py-1 disabled:opacity-40 disabled:cursor-not-allowed"
                      onClick={() => canDelete && onDelete(tag)}
                      disabled={!canDelete}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
