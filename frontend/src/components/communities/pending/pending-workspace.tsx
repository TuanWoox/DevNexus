"use client";

import { useState, useMemo, useEffect } from "react";
import { ListCollapse, Loader2 } from "lucide-react";
import { PendingList, PendingWorkspaceItem } from "./pending-list";
import { PendingDetailView } from "./pending-detail-view";
import { Skeleton } from "@/components/ui/skeleton";
import { SelectPostDTO } from "@/types/post/select-post-dto";
import { useApproveCommunityPost } from "@/hooks/post-hooks/use-approve-community-post";
import { useRejectCommunityPost } from "@/hooks/post-hooks/use-reject-community-post";
import { useApproveCommunityQAPost } from "@/hooks/qa-post-hooks/use-approve-community-qa-post";
import { useRejectCommunityQAPost } from "@/hooks/qa-post-hooks/use-reject-community-qa-post";

interface PendingWorkspaceProps {
    posts?: SelectPostDTO[];
    questions?: SelectPostDTO[];
    isModerator?: boolean;
    isAuthor?: boolean;
    isLoading?: boolean;
}

export function PendingWorkspace({
    posts = [],
    questions = [],
    isModerator = false,
    isAuthor = false,
    isLoading = false
}: PendingWorkspaceProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterTab, setFilterTab] = useState<"all" | "posts" | "questions">("all");

    // Mutation Hooks
    const approvePost = useApproveCommunityPost();
    const rejectPost = useRejectCommunityPost();
    const approveQuestion = useApproveCommunityQAPost();
    const rejectQuestion = useRejectCommunityQAPost();

    const isBusy =
        approvePost.isPending ||
        rejectPost.isPending ||
        approveQuestion.isPending ||
        rejectQuestion.isPending;

    // 1. Unified Sort and Filtering Logic
    const sortedAndFilteredItems = useMemo(() => {
        // Tag all items with their post types explicitly for downstream checks
        const taggedPosts: PendingWorkspaceItem[] = posts.map((p) => ({ ...p, isQuestion: false }));
        const taggedQuestions: PendingWorkspaceItem[] = questions.map((q) => ({ ...q, isQuestion: true }));

        let combined: PendingWorkspaceItem[] = [];
        if (filterTab === "all") {
            combined = [...taggedPosts, ...taggedQuestions];
        } else if (filterTab === "posts") {
            combined = taggedPosts;
        } else if (filterTab === "questions") {
            combined = taggedQuestions;
        }

        // Search text matching: check title and author full name
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            combined = combined.filter(
                (item) =>
                    item.title.toLowerCase().includes(query) ||
                    (item.author?.fullName ?? "").toLowerCase().includes(query)
            );
        }

        // Sort descending by dateCreated
        return combined.sort(
            (a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
        );
    }, [posts, questions, filterTab, searchQuery]);

    // Automatically select the first item on initial load
    useEffect(() => {
        if (!activeId && sortedAndFilteredItems.length > 0) {
            setActiveId(sortedAndFilteredItems[0].id);
        }
    }, [sortedAndFilteredItems, activeId]);

    // Find the currently active item detail object
    const activeItem = useMemo(() => {
        if (!activeId) return null;
        return sortedAndFilteredItems.find((item) => item.id === activeId) || null;
    }, [activeId, sortedAndFilteredItems]);

    // Action Handlers bound to active item
    const handleApprove = () => {
        if (!activeItem) return;
        const isQna = activeItem.isQuestion;
        
        // Optimistic reset selection helper
        const nextIndex = sortedAndFilteredItems.findIndex(x => x.id === activeId) + 1;
        const nextItem = sortedAndFilteredItems[nextIndex] || sortedAndFilteredItems[0] || null;

        if (isQna) {
            approveQuestion.mutate(activeItem.id, {
                onSuccess: () => {
                    setActiveId(nextItem && nextItem.id !== activeId ? nextItem.id : null);
                }
            });
            return;
        }
        approvePost.mutate(activeItem.id, {
            onSuccess: () => {
                setActiveId(nextItem && nextItem.id !== activeId ? nextItem.id : null);
            }
        });
    };

    const handleReject = (reasonText: string, onSuccessCallback: () => void) => {
        if (!activeItem) return;
        const isQna = activeItem.isQuestion;
        const payload = { postId: activeItem.id, reason: reasonText || undefined };

        const nextIndex = sortedAndFilteredItems.findIndex(x => x.id === activeId) + 1;
        const nextItem = sortedAndFilteredItems[nextIndex] || sortedAndFilteredItems[0] || null;

        const onRejectSuccess = () => {
            onSuccessCallback();
            setActiveId(nextItem && nextItem.id !== activeId ? nextItem.id : null);
        };

        if (isQna) {
            rejectQuestion.mutate(payload, { onSuccess: onRejectSuccess });
            return;
        }
        rejectPost.mutate(payload, { onSuccess: onRejectSuccess });
    };

    // 2. High-Fidelity Loading View
    if (isLoading) {
        return (
            <div className="h-full w-full flex overflow-hidden border border-border/80 rounded-xl bg-card shadow-sm animate-pulse">
                <div className="w-[35%] border-r border-border/60 p-4 space-y-4 shrink-0 bg-card">
                    <Skeleton className="h-9 w-full rounded-lg" />
                    <Skeleton className="h-7 w-full rounded-lg" />
                    <div className="space-y-3 pt-2">
                        <Skeleton className="h-16 w-full rounded-lg" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                    </div>
                </div>
                <div className="flex-1 p-6 space-y-6 bg-muted/15 border-l border-border/40">
                    <div className="flex items-center justify-between pb-4 border-b border-border/40">
                        <div className="flex items-center gap-3">
                            <Skeleton className="size-10 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-48 rounded" />
                                <Skeleton className="h-3 w-32 rounded" />
                            </div>
                        </div>
                        <Skeleton className="h-6 w-20 rounded" />
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-full rounded" />
                        <Skeleton className="h-4 w-full rounded" />
                        <Skeleton className="h-4 w-3/4 rounded" />
                    </div>
                </div>
            </div>
        );
    }

    // 3. Render Master-Detail Console Workspace
    return (
        <div className="h-full w-full flex overflow-hidden border border-border/80 rounded-xl bg-card shadow-elevated">
            {/* Left Column - Compact Searchable List */}
            <div className="w-[35%] border-r border-border/60 shrink-0 h-full">
                <PendingList
                    items={sortedAndFilteredItems}
                    activeId={activeId}
                    onSelect={(item) => setActiveId(item.id)}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    filterTab={filterTab}
                    onFilterTabChange={(tab) => {
                        setFilterTab(tab);
                        setActiveId(null); // Reset active detail view on tab toggles
                    }}
                    totalPostsCount={posts.length}
                    totalQuestionsCount={questions.length}
                />
            </div>

            {/* Right Column - Deep Review & Interaction HUD View */}
            <div className="flex-1 h-full min-w-0">
                <PendingDetailView
                    post={activeItem}
                    isModerator={isModerator}
                    isAuthor={isAuthor}
                    isBusy={isBusy}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    isQuestion={activeItem?.isQuestion}
                />
            </div>
        </div>
    );
}
