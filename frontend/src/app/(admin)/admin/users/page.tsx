'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { AdminUsersTable } from '@/components/admin/users/admin-users-table';
import { useGetAdminUsers } from '@/hooks/admin/use-get-admin-users';
import { Page } from '@/types/common/page';

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

  const { data, isLoading, isError } = useGetAdminUsers(page);

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
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center gap-3 py-16 text-sm text-muted-foreground">
          <p>Loading users…</p>
        </div>
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
    </div>
  );
}
