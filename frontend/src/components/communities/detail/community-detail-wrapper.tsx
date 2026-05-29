"use client";

import { useMemo, useState } from "react";
import { Lock } from "lucide-react";
import { CommunityHeader } from "./community-header";
import { CommunityTabs } from "./community-tabs";
import { PostListView } from "@/components/post/post-list-view";
import { useGetPostsByCommunityIdInfinite } from "@/hooks/post-hooks/use-get-posts-by-community-id-infinite";
import { useGetQAPostsByCommunityIdInfinite } from "@/hooks/qa-post-hooks/use-get-qa-posts-by-community-id-infinite";
import { SortOrderType } from "@/constants/sortOrderType";
import { CommunityMemberList } from "./community-member-list";
import { useGetCommunityById } from "@/hooks/community-hooks/use-get-community-by-id";
import { useGetCommunityMute } from "@/hooks/community-mute-hooks/use-get-community-mute";
import { MuteBanner } from "@/components/communities/mute-banner";
import { SelectCommunityDTO } from "@/types/community/select-community-dto";
import CommunityNotFound from "@/components/communities/community-not-found";

type CommunityTab = "posts" | "qa" | "members";

interface CommunityDetailWrapperProps {
    communityId: string;
    /** Computed server-side: false when community is private AND role is guest/pending */
    canViewContent: boolean;
    /** Role pre-computed on server to avoid layout shift */
    initialRole: string;
}

const STALE_TIME = 5 * 60 * 1000;

const BASE_PAYLOAD = {
    totalElements: 0,
    orders: [
        {
            sort: "dateCreated",
            sortDir: SortOrderType.DESC,
            dynamicProperty: "",
            delimiter: "",
            dataType: "",
        },
    ],
    filter: [],
    selected: [],
} as const;

export function CommunityDetailWrapper({ communityId, canViewContent }: CommunityDetailWrapperProps) {
    const { data: community } = useGetCommunityById(communityId);

    if (!community) {
        return (
            <CommunityNotFound />
        );
    }

    return (
        <CommunityDetailContent
            community={community}
            canViewContent={canViewContent}
        />
    );
}

interface CommunityDetailContentProps {
    community: SelectCommunityDTO;
    canViewContent: boolean;
}

function CommunityDetailContent({ community, canViewContent }: CommunityDetailContentProps) {
    const [activeTab, setActiveTab] = useState<CommunityTab>("posts");

    const { data: muteStatus } = useGetCommunityMute(community.id);
    const canModerateCommunity =
        community.currentUserRole === "Owner" ||
        community.currentUserRole === "OWNER" ||
        community.currentUserRole === "Moderator" ||
        community.currentUserRole === "MODERATOR";

    // Lazy tab-based fetching:
    // Posts only fetch when on posts tab AND user has access to content
    const postsEnabled = activeTab === "posts" && canViewContent;
    const qaEnabled = activeTab === "qa" && canViewContent;

    const {
        data: postsData,
        isLoading: isPostsLoading,
        isError: isPostsError,
        fetchNextPage: fetchNextPosts,
        hasNextPage: hasNextPosts,
        isFetchingNextPage: isFetchingNextPosts,
    } = useGetPostsByCommunityIdInfinite(community.id, BASE_PAYLOAD, STALE_TIME, postsEnabled);

    const {
        data: qaData,
        isLoading: isQALoading,
        isError: isQAError,
        fetchNextPage: fetchNextQA,
        hasNextPage: hasNextQA,
        isFetchingNextPage: isFetchingNextQA,
    } = useGetQAPostsByCommunityIdInfinite(community.id, BASE_PAYLOAD, STALE_TIME, qaEnabled);

    const allPosts = useMemo(
        () => postsData?.pages.flatMap((page) => page?.data ?? []),
        [postsData]
    );
    const allQA = useMemo(
        () => qaData?.pages.flatMap((page) => page?.data ?? []),
        [qaData]
    );

    return (
        <div className="flex flex-col w-full min-h-screen fade-in">
            {/* Header + Cover photo + Action buttons + Tabs */}
            <div className="bg-card shadow-card">
                <CommunityHeader community={community} activeTab={activeTab} />
                <CommunityTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
            {muteStatus?.isMuted && (
                <div className="px-4">
                    <MuteBanner
                        mutedUntil={muteStatus.mutedUntil}
                        muteReason={muteStatus.muteReason}
                    />
                </div>
            )}

            {/* Tab content */}
            <div className="max-w-6xl mx-auto w-full pb-12">
                {/* Private community block screen — shown on posts/qa tabs for guest/pending */}
                {!canViewContent && (activeTab === "posts" || activeTab === "qa" || activeTab === "members") && (
                    <PrivateCommunityBlock />
                )}

                {canViewContent && activeTab === "posts" && (
                    <PostListView
                        posts={allPosts}
                        isLoading={isPostsLoading}
                        isError={isPostsError}
                        hasNextPage={hasNextPosts}
                        isFetchingNextPage={isFetchingNextPosts}
                        onLoadMore={fetchNextPosts}
                        emptyTitle="No posts yet"
                        emptySubtitle="Be the first to share something with this community."
                        loadingText="Loading posts..."
                        canModerateCommunity={canModerateCommunity}
                    />
                )}

                {canViewContent && activeTab === "qa" && (
                    <PostListView
                        posts={allQA}
                        isLoading={isQALoading}
                        isError={isQAError}
                        hasNextPage={hasNextQA}
                        isFetchingNextPage={isFetchingNextQA}
                        onLoadMore={fetchNextQA}
                        emptyTitle="No Q&A posts yet"
                        emptySubtitle="Ask a question to start a discussion in this community."
                        loadingText="Loading Q&A posts..."
                        canModerateCommunity={canModerateCommunity}
                    />
                )}

                {canViewContent && activeTab === "members" && (
                    <CommunityMemberList communityId={community.id} role={community.currentUserRole} />
                )}
            </div>
        </div>
    );
}

function PrivateCommunityBlock() {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">This is a private community</h3>
            <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
                Only approved members can view posts, Q&amp;A and members in this community.
                Join the community or wait for your request to be approved.
            </p>
        </div>
    );
}
