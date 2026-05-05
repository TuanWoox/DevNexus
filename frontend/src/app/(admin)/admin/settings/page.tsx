'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { Skeleton } from '@/components/ui/skeleton';
import { BannedKeywordsEditor } from '@/components/admin/settings/banned-keywords-editor';
import { useGetBannedKeywords } from '@/hooks/admin/use-get-banned-keywords';
import { useUpdateBannedKeywords } from '@/hooks/admin/use-update-banned-keywords';

function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-80" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-20 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-9 w-48" />
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const isAdmin = user?.roles?.includes('Admin') ?? false;

  useEffect(() => {
    if (!isAdmin) {
      router.replace('/unauthorized');
    }
  }, [isAdmin, router]);

  const { data, isLoading, isError, refetch } = useGetBannedKeywords();
  const { mutate: updateKeywords, isPending } = useUpdateBannedKeywords();

  if (!isAdmin) return null;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-2xl font-semibold text-heading">Settings</h1>

      {isLoading ? (
        <SettingsSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-16 text-sm text-muted-foreground">
          <p>Failed to load settings.</p>
          <button
            onClick={() => refetch()}
            className="rounded-md border border-default px-3 py-1.5 text-xs font-semibold hover:bg-card transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <BannedKeywordsEditor
          initialKeywords={data?.keywords ?? []}
          onSave={(keywords) => updateKeywords({ keywords })}
          isSaving={isPending}
        />
      )}
    </div>
  );
}
