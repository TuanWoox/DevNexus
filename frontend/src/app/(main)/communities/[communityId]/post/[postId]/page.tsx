import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { serverGet } from "@/lib/server-api";
import { postQueryKeys } from "@/hooks/post-hooks/use-post-query-keys";
import { SelectPostDTO } from "@/types/post/select-post-dto";
import { CommunityPostDetail } from "@/components/post/detail/community-post-detail";
import PostNotFound from "@/components/post/post-not-found";

type Props = {
    params: Promise<{ communityId: string; postId: string }>;
};

export default async function CommunityPostDetailPage({ params }: Props) {
    const { communityId, postId } = await params;
    const queryClient = getQueryClient();
    let post: SelectPostDTO;

    try {
        post = await queryClient.fetchQuery({
            queryKey: postQueryKeys.detail(postId),
            queryFn: () => serverGet<SelectPostDTO>(`/Posts/${postId}`),
        });
    } catch (error) {
        return <PostNotFound />;
    }

    if (post.communityId !== communityId) {
        return <PostNotFound message="This post does not belong to the requested community." />;
    }

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <CommunityPostDetail communityId={communityId} postId={postId} />
        </HydrationBoundary>
    );
}
