'use client';

import { useState } from 'react';
import { AdminPostsTable } from '@/components/admin/posts/admin-posts-table';
import { useGetAdminPosts } from '@/hooks/admin/use-get-admin-posts';
import { useForceApprovePost } from '@/hooks/admin/use-force-approve-post';
import { useForceRejectPost } from '@/hooks/admin/use-force-reject-post';
import { AdminPostDTO } from '@/types/admin/admin-post-dto';
import { Page } from '@/types/common/page';

const DEFAULT_PAGE_SIZE = 20;

function buildPage(pageNumber: number): Page<string> {
  return { pageNumber, size: DEFAULT_PAGE_SIZE, totalElements: 0, orders: [], filter: [], selected: [] };
}

export default function ContentOversightPage() {
  const [pageNumber, setPageNumber] = useState(0);
  const page = buildPage(pageNumber);

  const { data, isLoading, isError, refetch } = useGetAdminPosts(page);
  const approveMutation = useForceApprovePost();
  const rejectMutation = useForceRejectPost();

  const posts = data?.data ?? [];
  const totalElements = data?.page.totalElements ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalElements / DEFAULT_PAGE_SIZE));
  const isPending = approveMutation.isPending || rejectMutation.isPending;

  function handleApprove(post: AdminPostDTO) {
    approveMutation.mutate(post.id);
  }

  function handleReject(post: AdminPostDTO) {
    rejectMutation.mutate(post.id);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-heading">Content Oversight</h1>

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
          <AdminPostsTable
            posts={posts}
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
