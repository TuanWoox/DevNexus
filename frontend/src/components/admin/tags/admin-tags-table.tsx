'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { SelectTagDTO } from '@/types/admin/admin-tag-dto';

interface AdminTagsTableProps {
  tags: SelectTagDTO[];
  isLoading: boolean;
  onEdit: (tag: SelectTagDTO) => void;
  onDelete: (tag: SelectTagDTO) => void;
}

export function AdminTagsTable({ tags, isLoading, onEdit, onDelete }: AdminTagsTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-default overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-default bg-card">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Post Count</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-default last:border-0">
                <td className="px-4 py-3"><Skeleton className="h-10 w-32" /></td>
                <td className="px-4 py-3"><Skeleton className="h-10 w-16" /></td>
                <td className="px-4 py-3"><Skeleton className="h-10 w-28" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (tags.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        No tags found.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-default overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-default bg-card">
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Post Count</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tags.map((tag) => {
            const canDelete = tag.postCount === 0;
            return (
              <tr key={tag.id} className="border-b border-default last:border-0 hover:bg-card/50 transition-colors">
                <td className="px-4 py-3 text-sm text-foreground font-medium">{tag.name}</td>
                <td className="px-4 py-3 text-sm text-foreground">{tag.postCount}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(tag)}
                      className="rounded-md border border-default px-3 py-1.5 text-xs font-semibold hover:bg-card transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => canDelete && onDelete(tag)}
                      disabled={!canDelete}
                      className="rounded-md border border-destructive/50 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
