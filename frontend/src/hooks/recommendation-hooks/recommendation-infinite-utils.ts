import { Page } from "@/types/common/page";

export type RecommendationInfiniteBasePayload = {
    totalElements: number;
    orders?: ReadonlyArray<NonNullable<Page<string>["orders"]>[number]>;
    filter?: ReadonlyArray<NonNullable<Page<string>["filter"]>[number]>;
    selected?: ReadonlyArray<string>;
};

export function toMutableRecommendationPayload(
    basePayload: RecommendationInfiniteBasePayload
): Omit<Page<string>, "pageNumber" | "size"> {
    return {
        totalElements: basePayload.totalElements,
        orders: basePayload.orders ? [...basePayload.orders] : undefined,
        filter: basePayload.filter ? [...basePayload.filter] : undefined,
        selected: basePayload.selected ? [...basePayload.selected] : undefined,
    };
}

export function getNextRecommendationPageParam(lastPage: { page?: Page<string> } | undefined) {
    if (!lastPage?.page) return undefined;

    const { pageNumber, size, totalElements } = lastPage.page;
    if (pageNumber == null || size == null || totalElements == null) return undefined;

    const loaded = (pageNumber + 1) * size;
    return loaded < totalElements ? pageNumber + 1 : undefined;
}
