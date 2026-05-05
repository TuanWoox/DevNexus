'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminUsersTable } from '@/components/admin/users/admin-users-table';
import { useGetAdminUsers } from '@/hooks/admin/use-get-admin-users';
import { Page } from '@/types/common/page';

const SKELETON_COLS = 5;

function UsersTableSkeleton() {
  return (
    <div className="overflow-x-auto rounded-md border border-default">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-default bg-card">
            {Array.from({ length: SKELETON_COLS }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => (
            <tr key={i} className="border-b border-default last:border-0">
              {Array.from({ length: SKELETON_COLS }).map((__, j) => (
                <td key={j} className="px-4 py-3">
                  <Skeleton className="h-5 w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const DEFAULT_PAGE_SIZE = 20;

function buildPage(pageNumber: number): Page<string> {
  return { pageNumber, size: DEFAULT_PAGE_SIZE, totalElements: 0, orders: [], filter: [], selected: [] };
}

export default function UserManagementPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const isAdmin = user?.roles?.includes('Admin') ?? false;

  useEffect(() => {
    if (!isAdmin) {
      router.replace('/unauthorized');
    }
  }, [isAdmin, router]);

  const [pageNumber, setPageNumber] = useState(0);
  const page = buildPage(pageNumber);

  const { data, isLoading, isError, refetch } = useGetAdminUsers(page);

  const users = data?.data ?? [];
  const totalElements = data?.page.totalElements ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalElements / DEFAULT_PAGE_SIZE));

  if (!isAdmin) return null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-heading">User Management</h1>

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
      ) : isLoading ? (
        <UsersTableSkeleton />
      ) : (
        <>
          <AdminUsersTable users={users} />

          {totalPages > 1 && (
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
