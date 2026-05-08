import { Metadata, ResolvingMetadata } from 'next';
import { ProfileViewWrapper } from '@/components/profile/profile-view-wrapper';
import { serverGet, serverPost } from '@/lib/server-api';
import { SelectProfileDTO } from '@/types/profile/select-profile-dto';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/get-query-client';
import { postQueryKeys } from '@/hooks/post-hooks/use-post-query-keys';
import { PagedData } from '@/types/common/paged-data';
import { SelectPostDTO } from '@/types/post/select-post-dto';
import { INFINITE_PAGE_SIZE } from '@/constants/feed-payload';
import { SortOrderType } from '@/constants/sortOrderType';
import { ProfileNotFound } from '@/components/profile/profile-not-found';

type Props = {
    params: Promise<{ profileId: string }>
};

async function getProfile(id: string): Promise<SelectProfileDTO | null> {
    try {
        return await serverGet<SelectProfileDTO>(`/Profiles/${id}`);
    } catch (error) {
        console.error("Lỗi gọi API fetch Profile:", error);
        return null;
    }
}

export async function generateMetadata(
    { params }: Props
): Promise<Metadata> {
    const resolvedParams = await params;
    const profile = await getProfile(resolvedParams.profileId);

    if (!profile) {
        return {
            title: 'Profile Not Found | DevNexus',
        };
    }

    return {
        title: profile.fullName || 'Profile',
        description: profile.bio || 'Check out this profile on DevNexus',
        openGraph: {
            title: `${profile.fullName} - DevNexus Profile`,
            description: profile.bio,
            images: profile.avatarUrl ? [profile.avatarUrl] : [],
            type: 'profile'
        },
    };
}

export default async function ProfilePage({ params }: Props) {
    const resolvedParams = await params;
    const profileId = resolvedParams.profileId;
    const queryClient = getQueryClient();

    // Base payload for Overview fetching
    const basePayload = {
        totalElements: 0,
        orders: [{ sort: 'dateCreated', sortDir: SortOrderType.DESC, dynamicProperty: '', delimiter: '', dataType: '' }],
        filter: [],
        selected: []
    };

    try {
        // Prefetch profile data for hydration
        await queryClient.prefetchQuery({
            queryKey: ['profile', profileId],
            queryFn: () => serverGet<SelectProfileDTO>(`/Profiles/${profileId}`)
        });

        await queryClient.prefetchInfiniteQuery({
            queryKey: postQueryKeys.list({ ...basePayload, profileId, type: 'overview', infinite: true }),
            queryFn: ({ pageParam = 0 }) =>
                serverPost<PagedData<SelectPostDTO, string>>(`/Posts/profile/${profileId}/overview/paging`, {
                    ...basePayload,
                    size: INFINITE_PAGE_SIZE,
                    pageNumber: pageParam as number,
                }),
            initialPageParam: 0,
            getNextPageParam: (lastPage) => {
                if (!lastPage) return undefined;
                const { pageNumber, size, totalElements } = lastPage.page;
                const loaded = (pageNumber + 1) * size;
                return loaded < totalElements ? pageNumber + 1 : undefined;
            },
            pages: 1,
        });
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error('[SSR Prefetch Error] profile/page.tsx:', error);
        }
    }

    const profile = queryClient.getQueryData<SelectProfileDTO>(['profile', profileId]);

    if (!profile) {
        return <ProfileNotFound />;
    }

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <ProfileViewWrapper profileId={profileId} />
        </HydrationBoundary>
    );
}
