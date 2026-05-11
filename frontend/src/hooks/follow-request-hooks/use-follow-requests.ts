import { useInfiniteQuery } from "@tanstack/react-query";
import { followRequestService } from "@/services/follow-request-service";
import { Page } from "@/types/common/page";
import { FilterOperator } from "@/constants/filterOperator";
import { FilterType } from "@/constants/filterType";

export function useFollowRequests(searchTerm: string = "") {
  return useInfiniteQuery({
    queryKey: ["follow-requests", searchTerm],
    queryFn: ({ pageParam = 0 }) => {
      const page: Page<string> = {
        size: 10,
        pageNumber: pageParam,
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
      };
      return followRequestService.getReceivedRequests(page);
    },
    getNextPageParam: (lastPage) => {
      const { pageNumber, size, totalElements } = lastPage.page;
      const totalPages = Math.ceil((totalElements || 0) / size);
      return (pageNumber || 1) < totalPages ? (pageNumber || 1) + 1 : undefined;
    },
    initialPageParam: 0,
  });
}
