import { SortOrderType } from "@/constants/sortOrderType";
import { Page } from "@/types/common/page";

const HISTORY_PAGE_SIZE = 10;

type HistoryRequest = Omit<Page<string>, "pageNumber" | "size">;

const defaultHistoryRequest: HistoryRequest = {
    totalElements: 0,
    orders: [
        {
            sort: "dateCreated",
            sortDir: SortOrderType.DESC,
            dynamicProperty: "",
            delimiter: "",
            dataType: "",
        },
    ],
    filter: [],
    selected: [],
};

export function buildHistoryPayload(request: HistoryRequest, pageParam: number): Page<string> {
    return {
        ...defaultHistoryRequest,
        ...request,
        orders: request.orders ?? defaultHistoryRequest.orders,
        filter: request.filter ?? defaultHistoryRequest.filter,
        selected: request.selected ?? defaultHistoryRequest.selected,
        totalElements: request.totalElements ?? defaultHistoryRequest.totalElements,
        size: HISTORY_PAGE_SIZE,
        pageNumber: pageParam,
    };
}

export function getNextHistoryPage(lastPage?: { page?: Page<string> }) {
    if (!lastPage?.page) return undefined;

    const { pageNumber, size, totalElements } = lastPage.page;
    if (pageNumber === undefined || size === undefined || totalElements === undefined) {
        return undefined;
    }

    const loaded = (pageNumber + 1) * size;
    return loaded < totalElements ? pageNumber + 1 : undefined;
}
