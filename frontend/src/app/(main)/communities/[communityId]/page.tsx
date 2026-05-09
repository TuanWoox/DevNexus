import { Metadata } from 'next';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/get-query-client';
import { serverGet, serverPost } from '@/lib/server-api';
import { SelectCommunityDTO } from '@/types/community/select-community-dto';
import { PagedData } from '@/types/common/paged-data';
import { SelectPostDTO } from '@/types/post/select-post-dto';
import { postQueryKeys } from '@/hooks/post-hooks/use-post-query-keys';
import { communityQueryKeys } from '@/hooks/community-hooks/use-community-query-key';
import { INFINITE_PAGE_SIZE } from '@/constants/feed-payload';
import { SortOrderType } from '@/constants/sortOrderType';
import { CommunityDetailWrapper } from '@/components/communities/detail/community-detail-wrapper';

type Props = {
    params: Promise<{ communityId: string }>;
};

const BASE_PAYLOAD = {
    totalElements: 0,
    orders: [{ sort: 'dateCreated', sortDir: SortOrderType.DESC, dynamicProperty: '', delimiter: '', dataType: '' }],
    filter: [],
    selected: [],
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const resolvedParams = await params;
    const communityId = resolvedParams.communityId;
    try {
        const community = await serverGet<SelectCommunityDTO>(`/Communities/${communityId}`);
        return {
            title: community.name,
            description: community.description || `Join ${community.name} on DevNexus`,
            openGraph: {
                title: community.name,
                description: community.description,
                images: community.communityCoverPhotoUrl ? [community.communityCoverPhotoUrl] : [],
                type: 'website',
            },
        };
    } catch {
        return { title: 'Community Not Found' };
    }
}

export default async function CommunityDetailPage({ params }: Props) {
    const resolvedParams = await params;
    const communityId = resolvedParams.communityId;
    const queryClient = getQueryClient();

    try {
        // Step 1: Prefetch community info
        await Promise.all([
            queryClient.prefetchQuery({
                queryKey: communityQueryKeys.detail(communityId),
                queryFn: () => serverGet<SelectCommunityDTO>(`/Communities/${communityId}`),
            }),
        ]);
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('[SSR Prefetch Error] community/page.tsx step 1:', error);
        }
    }

    // Step 2: Read community + role from cache to compute canViewContent
    const community = queryClient.getQueryData<SelectCommunityDTO>(
        communityQueryKeys.detail(communityId)
    );

    if (!community) {
        return (
            <div className="flex items-center justify-center h-[50vh] bg-page">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-foreground">Community Not Found</h2>
                    <p className="text-muted-foreground">
                        The community you are looking for does not exist or an error occurred.
                    </p>
                </div>
            </div>
        );
    }

    const roleData = community.currentUserRole;
    const role = roleData ?? 'GUEST';

    // canViewContent: public communities or private communities where user is not a guest/pending
    const canViewContent = !community.isPrivate || (role !== 'GUEST' && role !== 'PENDING');

    // Step 3: Only prefetch posts if the user can actually see content
    if (canViewContent) {
        try {
            await queryClient.prefetchInfiniteQuery({
                queryKey: postQueryKeys.list({
                    ...BASE_PAYLOAD,
                    communityId,
                    type: 'community-posts',
                    infinite: true,
                }),
                queryFn: ({ pageParam = 0 }) =>
                    serverPost<PagedData<SelectPostDTO, string>>(
                        `/Posts/community/${communityId}/paging`,
                        { ...BASE_PAYLOAD, size: INFINITE_PAGE_SIZE, pageNumber: pageParam as number }
                    ),
                initialPageParam: 0,
                getNextPageParam: (lastPage) => {
                    if (!lastPage) return undefined;
                    const { pageNumber, size, totalElements } = lastPage.page;
                    if (pageNumber == null || totalElements == null) return undefined;
                    const loaded = (pageNumber + 1) * size;
                    return loaded < totalElements ? pageNumber + 1 : undefined;
                },
                pages: 1,
            });
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('[SSR Prefetch Error] community/page.tsx posts:', error);
            }
        }
    }

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <CommunityDetailWrapper
                communityId={communityId}
                canViewContent={canViewContent}
                initialRole={role}
            />
        </HydrationBoundary>
    );
}