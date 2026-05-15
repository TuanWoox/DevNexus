"use client";

import { useState, useCallback } from "react";
import { ConnectionCard } from "./connection-card";
import { ConnectionCardSkeletonList } from "./connection-card-skeleton";
import { useGetFollowingsByProfileId } from "@/hooks/user-follow-hooks/use-get-followings-by-profile-id";
import { useDeleteFollowById } from "@/hooks/user-follow-hooks/use-delete-follow-by-id";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, UserCheck } from "lucide-react";
import { userFollowService } from "@/services/user-follow-service";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { userFollowQueryKeys } from "@/hooks/user-follow-hooks/use-user-follow-query-key";
import { toast } from "sonner";
import { FilterOperator } from "@/constants/filterOperator";
import { FilterType } from "@/constants/filterType";
import { SortOrderType } from "@/constants/sortOrderType";

interface FollowingTabProps {
    profileId: string;
    isOwnProfile: boolean;
    searchTerm: string;
}

export function FollowingTab({ profileId, isOwnProfile, searchTerm }: FollowingTabProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const queryClient = useQueryClient();

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
        useGetFollowingsByProfileId(profileId, {
            orders: [
                { sort: 'dateModified', sortDir: SortOrderType.DESC, dynamicProperty: '', delimiter: '', dataType: '' }
            ],
            filter: searchTerm
                ? [{
                    prop: "FollowingProfile.FullName",
                    filterType: FilterType.Text,
                    filterOperator: FilterOperator.Contains,
                    value: searchTerm,
                    dynamicProperty: "",
                    delimiter: "",
                }]
                : [],
            selected: [],
        });

    const deleteFollow = useDeleteFollowById();
    const bulkDelete = useMutation({
        mutationFn: (ids: string[]) => userFollowService.bulkDelete(ids),
        onSuccess: (count) => {
            if (count) {
                queryClient.invalidateQueries({ queryKey: userFollowQueryKeys.lists() });
                queryClient.invalidateQueries({ queryKey: ['profile'] });
                toast.success(`Unfollowed ${count} user(s)`);
                setSelectedIds([]);
            }
        },
    });

    const followings = data?.pages.flatMap((page) => page.data) ?? [];

    const handleLoadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const sentinelRef = useIntersectionObserver(handleLoadMore);

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === followings.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(followings.map((f) => f.id));
        }
    };

    if (isLoading) return <ConnectionCardSkeletonList />;

    if (followings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <UserCheck className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm font-medium">{searchTerm ? "No results found" : "Not following anyone yet"}</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Bulk actions */}
            {isOwnProfile && selectedIds.length > 0 && (
                <div className="flex items-center gap-2 p-2 sm:p-3 bg-primary/5 rounded-lg">
                    <Checkbox
                        checked={selectedIds.length === followings.length}
                        onCheckedChange={toggleSelectAll}
                        className="cursor-pointer"
                    />
                    <span className="text-xs sm:text-sm font-medium">{selectedIds.length} selected</span>
                    <div className="ml-auto">
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => bulkDelete.mutate(selectedIds)}
                            disabled={bulkDelete.isPending}
                            className="cursor-pointer"
                        >
                            <Trash2 className="h-4 w-4 mr-1" /> Unfollow
                        </Button>
                    </div>
                </div>
            )}

            {followings.map((follow) => {
                const profile = follow.followingProfile;
                if (!profile) return null;
                return (
                    <ConnectionCard
                        key={follow.id}
                        profile={profile}
                        showCheckbox={isOwnProfile}
                        selected={selectedIds.includes(follow.id)}
                        onSelect={() => toggleSelect(follow.id)}
                        actionLabel={isOwnProfile ? "Unfollow" : undefined}
                        actionVariant="outline"
                        onAction={isOwnProfile ? () => deleteFollow.mutate(follow.id) : undefined}
                        actionPending={deleteFollow.isPending}
                    />
                );
            })}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-8 flex items-center justify-center">
                {isFetchingNextPage && (
                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
                )}
            </div>

            {!hasNextPage && followings.length > 0 && (
                <p className="text-center text-xs text-muted-foreground py-2">No more followings</p>
            )}
        </div>
    );
}
