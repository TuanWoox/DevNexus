"use client";

import { Ref, Fragment } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SelectBookmarkDTO } from '@/types/bookmark/select-bookmark-dto';
import { CollectionPreviewImage } from '@/components/bookmark/collection-preview-image';

interface CollectionsSidebarProps {
    collections: SelectBookmarkDTO[];
    selectedCollectionId: string | null;
    onSelectCollection: (id: string) => void;
    isLoading: boolean;
    isFetchingNext: boolean;
    onOpenCreateModal: () => void;
    sentinelRef: Ref<HTMLDivElement>;
}

export const CollectionsSidebar = ({
    collections,
    selectedCollectionId,
    onSelectCollection,
    isLoading,
    isFetchingNext,
    onOpenCreateModal,
    sentinelRef
}: CollectionsSidebarProps) => {
    return (
        <aside className={cn(
            "flex flex-col w-full lg:w-95 shrink-0 border-r border-border bg-card",
            selectedCollectionId ? "hidden lg:flex" : "flex"
        )}>
            {/* Header */}
            <div className="px-4 pt-5 pb-2 flex items-center justify-between">
                <h1 className="text-xl font-bold tracking-tight text-foreground">Saved Collections</h1>
                <button
                    type="button"
                    onClick={onOpenCreateModal}
                    className="rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                    title="New collection"
                >
                    <Plus className="h-5 w-5" />
                </button>
            </div>

            {/* Navigation/List */}
            <nav className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5">
                <hr />
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : collections.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-8">
                        No collections found.
                    </div>
                ) : (
                    <>
                        {collections.map((collection) => {
                            const isActive = collection.id === selectedCollectionId;
                            return (
                                <Fragment key={collection.id}>
                                    <button
                                        onClick={() => onSelectCollection(collection.id)}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg transition-colors group px-3 py-3 text-left font-medium cursor-pointer",
                                            isActive
                                                ? 'bg-primary/10 text-primary'
                                                : 'text-muted-foreground hover:bg-subtle hover:text-primary',
                                        )}
                                    >
                                        <CollectionPreviewImage
                                            previewImageMediaId={collection.previewImageMediaId}
                                            previewImageContentType={collection.previewImageContentType}
                                            isActive={isActive}
                                        />
                                        <span className="min-w-0 flex-1 truncate text-base">
                                            {collection.name}
                                        </span>
                                    </button>
                                    <hr />
                                </Fragment>
                            );
                        })}
                        <div ref={sentinelRef} className="h-4" />
                        {isFetchingNext && (
                            <div className="flex justify-center py-2">
                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                            </div>
                        )}
                    </>
                )
                }
            </nav>
        </aside>
    );
};
