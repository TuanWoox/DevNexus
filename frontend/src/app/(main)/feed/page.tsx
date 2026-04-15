'use client';

import { useGetPostsWithPagination } from "@/hooks/post-hooks/use-get-posts-with-pagination";
import { PostCard } from "@/components/post/post-card";
import { Loader2 } from "lucide-react";
import { SortOrderType } from "@/constants/sortOrderType";

export default function FeedPage() {
    // Tạm thời gọi tất cả bài posts theo yêu cầu, disable ordering/filtering cứng.
    const { data: pagedData, isLoading, isError } = useGetPostsWithPagination({
        size: -1,
        pageNumber: 0,
        totalElements: 0,
        orders: [{ sort: 'dateCreated', sortDir: SortOrderType.DESC, dynamicProperty: '', delimiter: '', dataType: '' }],
        filter: [],
        selected: []
    });

    return (
        <div className="w-full mx-auto py-4 sm:p-6">
            <div className="mb-6 px-4 sm:px-0">
                <h1 className="text-2xl font-bold text-heading">Your Feed</h1>
                <p className="text-sm text-muted-foreground mt-1">Discover the latest discussions and Q&As.</p>
            </div>

            <div className="flex flex-col gap-4 px-4 sm:px-0">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-muted-foreground font-medium animate-pulse">Loading posts...</p>
                    </div>
                )}

                {isError && (
                    <div className="card p-6 text-center border-destructive">
                        <p className="text-destructive font-medium">Failed to load posts. Please try again.</p>
                    </div>
                )}

                {!isLoading && !isError && pagedData?.data && pagedData.data.length === 0 && (
                    <div className="card p-10 text-center flex flex-col items-center justify-center fade-in">
                        <div className="w-16 h-16 rounded-full bg-subtle flex items-center justify-center mb-4">
                            <span className="text-2xl">📭</span>
                        </div>
                        <h3 className="text-lg font-bold text-heading">No posts yet</h3>
                        <p className="text-muted-foreground mt-2">Check back later or create a new post to get started.</p>
                    </div>
                )}

                {!isLoading && !isError && pagedData?.data?.map((post) => (
                    <PostCard key={post.id} post={post} />
                ))}
            </div>
        </div>
    );
}
