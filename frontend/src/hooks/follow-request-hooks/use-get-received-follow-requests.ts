import { useInfiniteQuery } from "@tanstack/react-query";
import { followRequestService } from "@/services/follow-request-service";
import { followRequestQueryKeys } from "./follow-request-query-keys";
import { Page } from "@/types/common/page";
import { FilterOperator } from "@/constants/filterOperator";
import { FilterType } from "@/constants/filterType";
import { INFINITE_PAGE_SIZE } from "@/constants/feed-payload";
import { SortOrderType } from "@/constants/sortOrderType";

export function useGetReceivedFollowRequests(searchTerm: string = "") {
  return useInfiniteQuery({
    queryKey: followRequestQueryKeys.receivedList(searchTerm),
    queryFn: ({ pageParam = 0 }) => {
      const page: Page<string> = {
        size: INFINITE_PAGE_SIZE,
        pageNumber: pageParam,
        orders: [
          { sort: 'dateModified', sortDir: SortOrderType.DESC, dynamicProperty: '', delimiter: '', dataType: '' }
        ],
        filter: searchTerm
          ? [
            {
              prop: "RequesterProfile.FullName",
              filterType: FilterType.Text,
              filterOperator: FilterOperator.Contains,
              value: searchTerm,
              dynamicProperty: "",
              delimiter: "",
            },
          ]
          : [],
        selected: []
      };
      return followRequestService.getReceivedRequests(page);
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage || !lastPage.page) return undefined;
      const { pageNumber, size, totalElements } = lastPage.page;
      if (pageNumber === undefined || size === undefined || totalElements === undefined) return undefined;
      const loaded = (pageNumber + 1) * size;
      return loaded < totalElements ? pageNumber + 1 : undefined;
    },
    initialPageParam: 0,
  });
}
