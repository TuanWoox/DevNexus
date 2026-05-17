"use client";

import { useState, useMemo, useEffect } from 'react';
import { useGetMyBookmarksInfinite } from '@/hooks/bookmark-hooks/use-get-my-bookmarks-infinite';
import { useGetBookmarkedItemsByBookmarkIdInfinite } from '@/hooks/bookmarked-item-hooks/use-get-bookmarked-items-by-bookmark-id-infinite';
import { useDeleteBookmarkById } from '@/hooks/bookmark-hooks/use-delete-bookmark-by-id';
import { useUpdateBookmark } from '@/hooks/bookmark-hooks/use-update-bookmark';
import { useCreateBookmark } from '@/hooks/bookmark-hooks/use-create-bookmark';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { SortOrderType } from '@/constants/sortOrderType';
import { useHasMounted } from '@/hooks/use-has-mounted';

// Sub-components
import { CollectionsSidebar } from './_components/collections-sidebar';
import { CollectionItemsFeed } from './_components/collection-items-feed';
import { CreateCollectionDialog, EditCollectionDialog } from './_components/collection-dialogs';

const SavedPage = () => {
    const hasMounted = useHasMounted();
    const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editCollectionName, setEditCollectionName] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState("");

    // --- Collections Logic ---
    const collectionsPayload = useMemo(() => ({
        totalElements: 0,
        orders: [
            { sort: 'dateModified', sortDir: SortOrderType.DESC, dynamicProperty: '', delimiter: '', dataType: '' }
        ],
        filter: [],
        selected: [],
    }), []);

    const {
        data: collectionsData,
        isLoading: isCollectionsLoading,
        isFetchingNextPage: isFetchingNextCollections,
        hasNextPage: hasNextCollections,
        fetchNextPage: fetchNextCollections,
    } = useGetMyBookmarksInfinite(collectionsPayload);

    const collections = useMemo(
        () => collectionsData?.pages.flatMap((page) => page?.data ?? []) ?? [],
        [collectionsData]
    );

    const selectedCollection = collections.find((c) => c.id === selectedCollectionId);

    // Auto-select first collection if none selected (Desktop only)
    useEffect(() => {
        if (hasMounted && window.innerWidth >= 1024) { // matching 'lg' breakpoint
            if (!selectedCollectionId && collections.length > 0) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setSelectedCollectionId(collections[0].id);
            }
        }
    }, [collections, selectedCollectionId, hasMounted]);

    // --- Items Logic ---
    const itemsPayload = useMemo(() => ({
        totalElements: 0,
        orders: [
            { sort: 'dateModified', sortDir: SortOrderType.DESC, dynamicProperty: '', delimiter: '', dataType: '' }
        ],
        filter: [],
        selected: [],
    }), []);

    const {
        data: itemsData,
        isLoading: isItemsLoading,
        isFetchingNextPage: isFetchingNextItems,
        hasNextPage: hasNextItems,
        fetchNextPage: fetchNextItems,
    } = useGetBookmarkedItemsByBookmarkIdInfinite(selectedCollectionId, itemsPayload);

    const items = useMemo(
        () => itemsData?.pages.flatMap((page) => page?.data ?? []) ?? [],
        [itemsData]
    );

    // --- Intersection Observers ---
    const collectionsSentinelRef = useIntersectionObserver(() => {
        if (hasNextCollections && !isFetchingNextCollections) fetchNextCollections();
    });

    const itemsSentinelRef = useIntersectionObserver(() => {
        if (hasNextItems && !isFetchingNextItems) fetchNextItems();
    });

    // --- Mutations ---
    const { mutate: deleteBookmark, isPending: isDeletingBookmark } = useDeleteBookmarkById();
    const { mutate: updateBookmark, isPending: isUpdatingBookmark } = useUpdateBookmark();
    const { mutate: createBookmark, isPending: isCreatingBookmark } = useCreateBookmark();

    const handleDeleteCollection = () => {
        if (!selectedCollectionId) return;
        deleteBookmark(selectedCollectionId, {
            onSuccess: () => {
                const remaining = collections.filter(c => c.id !== selectedCollectionId);
                setSelectedCollectionId(remaining.length > 0 ? remaining[0].id : null);
            }
        });
    };

    const handleEditCollection = () => {
        if (!selectedCollectionId || !editCollectionName.trim() || !selectedCollection) return;
        updateBookmark({
            id: selectedCollectionId,
            name: editCollectionName.trim()
        }, {
            onSuccess: () => setIsEditModalOpen(false)
        });
    };

    const handleCreateCollection = () => {
        if (!newCollectionName.trim()) return;
        createBookmark({ name: newCollectionName.trim() }, {
            onSuccess: (data) => {
                setIsCreateModalOpen(false);
                setNewCollectionName("");
                if (data?.id) setSelectedCollectionId(data.id);
            }
        });
    };

    if (!hasMounted) return null;

    return (
        <div className="flex h-[calc(100vh-3.5rem)] sm:h-screen w-full overflow-hidden">
            <CollectionsSidebar
                collections={collections}
                selectedCollectionId={selectedCollectionId}
                onSelectCollection={setSelectedCollectionId}
                isLoading={isCollectionsLoading}
                isFetchingNext={isFetchingNextCollections}
                onOpenCreateModal={() => setIsCreateModalOpen(true)}
                sentinelRef={collectionsSentinelRef}
            />

            <CollectionItemsFeed
                selectedCollection={selectedCollection}
                items={items}
                isLoading={isItemsLoading}
                isFetchingNext={isFetchingNextItems}
                onBack={() => setSelectedCollectionId(null)}
                onEdit={() => {
                    if (selectedCollection) {
                        setEditCollectionName(selectedCollection.name);
                        setIsEditModalOpen(true);
                    }
                }}
                onDelete={handleDeleteCollection}
                isDeleting={isDeletingBookmark}
                sentinelRef={itemsSentinelRef}
                collectionsCount={collections.length}
            />

            <CreateCollectionDialog
                isOpen={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                name={newCollectionName}
                onNameChange={setNewCollectionName}
                onConfirm={handleCreateCollection}
                isPending={isCreatingBookmark}
            />

            <EditCollectionDialog
                isOpen={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                name={editCollectionName}
                onNameChange={setEditCollectionName}
                onConfirm={handleEditCollection}
                isPending={isUpdatingBookmark}
            />
        </div>
    );
};

export default SavedPage;