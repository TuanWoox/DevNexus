import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { serverGet } from "@/lib/server-api";
import { qaPostQueryKeys } from "@/hooks/qa-post-hooks/use-qa-post-query-key";
import { SelectQAPostDTO } from "@/types/qa-post/select-qa-post-dto";
import { CommunityQAPostDetail } from "@/components/post/detail/community-qa-post-detail";
import PostNotFound from "@/components/post/post-not-found";

type Props = {
    params: Promise<{ communityId: string; qaPostId: string }>;
};

export default async function CommunityQAPostDetailPage({ params }: Props) {
    const { communityId, qaPostId } = await params;
    const queryClient = getQueryClient();
    let qaPost: SelectQAPostDTO;

    try {
        qaPost = await queryClient.fetchQuery({
            queryKey: qaPostQueryKeys.detail(qaPostId),
            queryFn: () => serverGet<SelectQAPostDTO>(`/QAPosts/${qaPostId}`),
        });
    } catch (error) {
        return <PostNotFound />;
    }

    if (qaPost.communityId !== communityId) {
        return <PostNotFound message="This question does not belong to the requested community." />;
    }

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <CommunityQAPostDetail communityId={communityId} qaPostId={qaPostId} />
        </HydrationBoundary>
    );
}
