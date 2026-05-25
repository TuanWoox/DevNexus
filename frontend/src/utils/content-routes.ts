export type ContentRouteTarget = {
    id: string;
    communityId?: string | null;
};

function hasCommunityId(value: string | null | undefined): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

export function getPostDetailHref(post: ContentRouteTarget): string {
    if (hasCommunityId(post.communityId)) {
        return `/communities/${post.communityId}/post/${post.id}`;
    }

    return `/post/${post.id}`;
}

export function getQAPostDetailHref(qaPost: ContentRouteTarget): string {
    if (hasCommunityId(qaPost.communityId)) {
        return `/communities/${qaPost.communityId}/questions/${qaPost.id}`;
    }

    return `/questions/${qaPost.id}`;
}

export function getSharedPostDetailHref(sharedPost: ContentRouteTarget & { contentType: number }): string {
    return sharedPost.contentType === 1
        ? getQAPostDetailHref(sharedPost)
        : getPostDetailHref(sharedPost);
}
