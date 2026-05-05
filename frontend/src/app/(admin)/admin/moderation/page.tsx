'use client';

import { useState } from 'react';
import { ModerationQueueTable } from '@/components/admin/moderation/moderation-queue-table';
import { useGetModerationQueue } from '@/hooks/admin/use-get-moderation-queue';
import { useApproveQueueEntry } from '@/hooks/admin/use-approve-queue-entry';
import { useRejectQueueEntry } from '@/hooks/admin/use-reject-queue-entry';
import { AdminQueueEntryDTO } from '@/types/admin/admin-queue-entry-dto';
import { Page } from '@/types/common/page';

const DEFAULT_PAGE_SIZE = 20;

function buildPage(pageNumber: number): Page<string> {
  return { pageNumber, size: DEFAULT_PAGE_SIZE, totalElements: 0, orders: [], filter: [], selected: [] };
}

export default function ModerationQueuePage() {
  const [pageNumber, setPageNumber] = useState(0);
  const page = buildPage(pageNumber);

  const { data, isLoading, isError, refetch } = useGetModerationQueue(page);
  const approveMutation = useApproveQueueEntry();
  const rejectMutation = useRejectQueueEntry();

  const entries = data?.data ?? [];
  const totalElements = data?.page.totalElements ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalElements / DEFAULT_PAGE_SIZE));
  const isPending = approveMutation.isPending || rejectMutation.isPending;

  function handleApprove(entry: AdminQueueEntryDTO, note?: string) {
    approveMutation.mutate({ id: entry.id, resolution: 'Approved', moderatorNote: note });
  }

  function handleReject(entry: AdminQueueEntryDTO, note?: string) {
    rejectMutation.mutate({ id: entry.id, resolution: 'Rejected', moderatorNote: note });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-heading">Moderation Queue</h1>
        {!isLoading && (
          <span className="badge-default text-xs px-2 py-0.5 rounded-full">
            {totalElements} pending
          </span>
        )}
      </div>

      {isError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-sm text-muted-foreground">
          <p>Something went wrong. Try refreshing the page.</p>
          <button
            onClick={() => refetch()}
            className="btn-ghost text-xs"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <ModerationQueueTable
            entries={entries}
            isLoading={isLoading || isPending}
            onApprove={handleApprove}
            onReject={handleReject}
          />

          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Page {pageNumber + 1} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPageNumber((p) => Math.max(0, p - 1))}
                  disabled={pageNumber <= 0}
                  className="btn-ghost text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPageNumber((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={pageNumber >= totalPages - 1}
                  className="btn-ghost text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
