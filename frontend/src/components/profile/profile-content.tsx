"use client";

import { useGetPostsWithPagination } from "@/hooks/post-hooks/use-get-posts-with-pagination";
import { useGetQAPostsWithPagination } from "@/hooks/qa-post-hooks/use-get-qa-posts-with-pagination";
import { PostCard } from "@/components/post/post-card";
import { SortOrderType } from "@/constants/sortOrderType";
import { FilterType } from "@/constants/filterType";
import { Loader2, Lock } from "lucide-react";

interface ProfileContentProps {
    activeTab: "overview" | "post" | "qa-post" | "saved";
    targetProfileId: string;
    isOwnProfile: boolean;
    isPrivate: boolean;
    fullName: string;
}

export function ProfileContent({ activeTab, targetProfileId, isOwnProfile, isPrivate, fullName }: ProfileContentProps) {
    const isPrivateAndNotOwner = !isOwnProfile && isPrivate;

    // Fetch Posts
    const { data: postsData, isLoading: isPostsLoading } = useGetPostsWithPagination({
        size: -1,
        pageNumber: 0,
        totalElements: 0,
        orders: [{ sort: 'dateCreated', sortDir: SortOrderType.DESC, dynamicProperty: '', delimiter: '', dataType: '' }],
        filter: [{
            prop: "ProfileId",
            value: targetProfileId,
            filterOperator: 0 as any,
            filterType: FilterType.Text,
            dynamicProperty: "",
            delimiter: ""
        }],
        selected: []
    });

    // Fetch QA Posts
    const { data: qaPostsData, isLoading: isQAPostsLoading } = useGetQAPostsWithPagination({
        size: -1,
        pageNumber: 0,
        totalElements: 0,
        orders: [{ sort: 'dateCreated', sortDir: SortOrderType.DESC, dynamicProperty: '', delimiter: '', dataType: '' }],
        filter: [{
            prop: "ProfileId",
            value: targetProfileId,
            filterOperator: 0 as any,
            filterType: FilterType.Text,
            dynamicProperty: "",
            delimiter: ""
        }],
        selected: []
    });

    return (
        <div className="px-4 md:px-8 max-w-5xl mx-auto w-full py-8">
            {activeTab === "overview" && (
                <div className="p-8 border border-dashed rounded-lg bg-card text-card-foreground text-center fade-in">
                    {isPrivateAndNotOwner ? (
                        <div className="flex flex-col items-center justify-center py-6 gap-3">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                <Lock className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-semibold mt-2">This account is private</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                                You are only allowed to view basic information about this profile.
                            </p>
                        </div>
                    ) : (
                        <>
                            <h3 className="text-lg font-semibold mb-2">Welcome to {fullName}'s profile!</h3>
                            <p className="text-muted-foreground">This is an overview of the recent activities.</p>
                        </>
                    )}
                </div>
            )}

            {!isPrivateAndNotOwner && activeTab === "post" && (
                <div className="flex flex-col gap-4 fade-in">
                    {isPostsLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : postsData?.data && postsData.data.length > 0 ? (
                        postsData.data.map((post: any) => (
                            <PostCard key={post.id} post={post} />
                        ))
                    ) : (
                        <div className="p-8 border border-dashed rounded-lg text-center">
                            <p className="text-muted-foreground">No posts found.</p>
                        </div>
                    )}
                </div>
            )}

            {!isPrivateAndNotOwner && activeTab === "qa-post" && (
                <div className="flex flex-col gap-4 fade-in">
                    {isQAPostsLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : qaPostsData?.data && qaPostsData.data.length > 0 ? (
                        qaPostsData.data.map((qaPost: any) => (
                            <PostCard key={qaPost.id} post={qaPost} />
                        ))
                    ) : (
                        <div className="p-8 border border-dashed rounded-lg text-center">
                            <p className="text-muted-foreground">No Q&A posts found.</p>
                        </div>
                    )}
                </div>
            )}

            {isOwnProfile && activeTab === "saved" && (
                <div className="p-8 border border-dashed rounded-lg bg-card text-card-foreground text-center fade-in">
                    <p className="text-muted-foreground">Saved items will be displayed here.</p>
                </div>
            )}
        </div>
    );
}
