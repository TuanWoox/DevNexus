'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { AdminTagsTable } from '@/components/admin/tags/admin-tags-table';
import { CreateTagDialog } from '@/components/admin/tags/create-tag-dialog';
import { EditTagDialog } from '@/components/admin/tags/edit-tag-dialog';
import { DeleteTagDialog } from '@/components/admin/tags/delete-tag-dialog';
import { MergeTagsDialog } from '@/components/admin/tags/merge-tags-dialog';
import { useGetAdminTags } from '@/hooks/admin/use-get-admin-tags';
import { useCreateTag } from '@/hooks/admin/use-create-tag';
import { useUpdateTag } from '@/hooks/admin/use-update-tag';
import { useDeleteTag } from '@/hooks/admin/use-delete-tag';
import { useMergeTags } from '@/hooks/admin/use-merge-tags';
import { SelectTagDTO } from '@/types/admin/admin-tag-dto';
import { Page } from '@/types/common/page';

const DEFAULT_PAGE_SIZE = 20;

function buildPage(pageNumber: number): Page<string> {
  return { pageNumber, size: DEFAULT_PAGE_SIZE, totalElements: 0, orders: [], filter: [], selected: [] };
}

export default function TagManagementPage() {
  const [pageNumber, setPageNumber] = useState(0);
  const page = buildPage(pageNumber);

  const { data, isLoading, isError } = useGetAdminTags(page);
  const createMutation = useCreateTag();
  const updateMutation = useUpdateTag();
  const deleteMutation = useDeleteTag();
  const mergeMutation = useMergeTags();

  const tags = data?.data ?? [];
  const totalElements = data?.page.totalElements ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalElements / DEFAULT_PAGE_SIZE));

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [editTag, setEditTag] = useState<SelectTagDTO | null>(null);
  const [deleteTag, setDeleteTag] = useState<SelectTagDTO | null>(null);
  const [mergeOpen, setMergeOpen] = useState(false);

  function handleCreate(name: string) {
    createMutation.mutate({ name }, {
      onSuccess: () => { toast.success('Tag created'); setCreateOpen(false); },
      onError: () => toast.error('Failed to create tag'),
    });
  }

  function handleEdit(id: string, name: string) {
    updateMutation.mutate({ id, name }, {
      onSuccess: () => { toast.success('Tag updated'); setEditTag(null); },
      onError: () => toast.error('Failed to update tag'),
    });
  }

  function handleDelete(tag: SelectTagDTO) {
    deleteMutation.mutate(tag.id, {
      onSuccess: () => { toast.success('Tag deleted'); setDeleteTag(null); },
      onError: () => toast.error('Failed to delete tag'),
    });
  }

  function handleMerge(sourceTagId: string, targetTagId: string) {
    mergeMutation.mutate({ sourceTagId, targetTagId }, {
      onSuccess: () => { toast.success('Tags merged successfully'); setMergeOpen(false); },
      onError: () => toast.error('Failed to merge tags'),
    });
  }

  const isAnyPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    mergeMutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-heading">Tag Management</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMergeOpen(true)}
            className="rounded-md border border-default px-3 py-1.5 text-xs font-semibold hover:bg-card transition-colors"
          >
            Merge Tags
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Create Tag
          </button>
        </div>
      </div>

      {isError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-sm text-muted-foreground">
          <p>Something went wrong. Try refreshing the page.</p>
        </div>
      ) : (
        <>
          <AdminTagsTable
            tags={tags}
            isLoading={isLoading || isAnyPending}
            onEdit={(tag) => setEditTag(tag)}
            onDelete={(tag) => setDeleteTag(tag)}
          />

          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Page {pageNumber + 1} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPageNumber((p) => Math.max(0, p - 1))}
                  disabled={pageNumber <= 0}
                  className="rounded-md border border-default px-3 py-1.5 text-xs font-semibold hover:bg-card disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPageNumber((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={pageNumber >= totalPages - 1}
                  className="rounded-md border border-default px-3 py-1.5 text-xs font-semibold hover:bg-card disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <CreateTagDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onConfirm={handleCreate}
        isPending={createMutation.isPending}
      />

      <EditTagDialog
        tag={editTag}
        open={editTag !== null}
        onClose={() => setEditTag(null)}
        onConfirm={handleEdit}
        isPending={updateMutation.isPending}
      />

      <DeleteTagDialog
        tag={deleteTag}
        open={deleteTag !== null}
        onClose={() => setDeleteTag(null)}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />

      <MergeTagsDialog
        tags={tags}
        open={mergeOpen}
        onClose={() => setMergeOpen(false)}
        onConfirm={handleMerge}
        isPending={mergeMutation.isPending}
      />
    </div>
  );
}
