"use client";

import { useGetCommunityById } from "@/hooks/community-hooks/use-get-community-by-id";
import { useParams } from "next/navigation";
import { CommunityHeader } from "@/components/communities/detail/community-header";
import { Skeleton } from "@/components/ui/skeleton";

const CommunityDetailPage = () => {
    const params = useParams();
    const id = params.communityId as string;

    const { data: community, isLoading, isError } = useGetCommunityById(id);

    if (isLoading) {
        return (
            <div className="w-full space-y-6 bg-page pb-12">
                <Skeleton className="w-full h-48 md:h-64 rounded-none" />
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col md:flex-row gap-8">
                    <div className="flex-1 space-y-4">
                        <Skeleton className="h-10 w-1/3" />
                        <Skeleton className="h-64 w-full rounded-xl" />
                    </div>
                    <div className="w-full md:w-80 space-y-4">
                        <Skeleton className="h-64 w-full rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (isError || !community) {
        return (
            <div className="flex items-center justify-center h-[50vh] bg-page">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-foreground">Community Not Found</h2>
                    <p className="text-muted-foreground">The community you are looking for does not exist or an error occurred.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-page pb-12">
            <CommunityHeader community={community} />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                <div className="p-12 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center space-y-3 bg-subtle/30">
                    <h3 className="text-lg font-medium text-foreground">No posts yet</h3>
                    <p className="text-muted-foreground text-sm max-w-sm">
                        Be the first to share your thoughts, questions, or ideas with the community.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default CommunityDetailPage;