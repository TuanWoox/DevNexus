import { useInfiniteQuery } from '@tanstack/react-query';
import { answerService } from '@/services/answer-service';
import { Page } from '@/types/common/page';
import { answerQueryKeys } from './use-answer-query-keys';

type InfiniteBasePayload = {
    totalElements: number;
    orders?: ReadonlyArray<NonNullable<Page<string>['orders']>[number]>;
    filter?: ReadonlyArray<NonNullable<Page<string>['filter']>[number]>;
    selected?: ReadonlyArray<string>;
};

function toMutablePayload(basePayload: InfiniteBasePayload): Omit<Page<string>, 'pageNumber' | 'size'> {
    return {
        totalElements: basePayload.totalElements,
        orders: basePayload.orders ? [...basePayload.orders] : undefined,
        filter: basePayload.filter ? [...basePayload.filter] : undefined,
        selected: basePayload.selected ? [...basePayload.selected] : undefined,
    };
}

export function useGetAnswersByPostIdInfinite(
    postId: string,
    isEnabled: boolean = true,
    basePayload: InfiniteBasePayload,
    staleTime?: number,
) {
    const mutablePayload = toMutablePayload(basePayload);

    return useInfiniteQuery({
        queryKey: [...answerQueryKeys.listByPost(postId, mutablePayload as any), "infinite"],
        queryFn: ({ pageParam = 0 }) =>
            answerService.getAnswersByPostId(postId, {
                ...mutablePayload,
                size: 20, // default size
                pageNumber: pageParam as number,
            }),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => {
            if (!lastPage) return undefined;
            const { pageNumber, size, totalElements } = lastPage.page;
            if (pageNumber == null || totalElements == null) return undefined;
            const loaded = (pageNumber + 1) * size;
            return loaded < totalElements ? pageNumber + 1 : undefined;
        },
        enabled: !!postId && isEnabled,
        staleTime,
    });
}
