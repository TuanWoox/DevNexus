import { InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import { buildSearchPage, searchService } from "@/services/search-service";
import { searchQueryKeys } from "./use-global-search";
import { PagedData } from "@/types/common/paged-data";
import {
  SearchCommunityResult,
  SearchProfileResult,
} from "@/types/search/global-search-result";
import { SelectPostDTO } from "@/types/post/select-post-dto";
import { SelectQAPostDTO } from "@/types/qa-post/select-qa-post-dto";

const PAGE_SIZE = 20;

const searchFns = {
  posts: searchService.searchPosts,
  questions: searchService.searchQuestions,
  communities: searchService.searchCommunities,
  profiles: searchService.searchProfiles,
};

export type SearchTab = keyof typeof searchFns;
export type SearchResultItem = SelectPostDTO | SelectQAPostDTO | SearchCommunityResult | SearchProfileResult;

export function useSearchInfinite(type: SearchTab, query: string) {
  const normalizedQuery = query.trim();

  return useInfiniteQuery<
    PagedData<SearchResultItem, string>,
    Error,
    InfiniteData<PagedData<SearchResultItem, string>, number>,
    ReturnType<typeof searchQueryKeys.list>,
    number
  >({
    queryKey: searchQueryKeys.list(type, normalizedQuery),
    queryFn: ({ pageParam = 0 }) =>
      searchFns[type](buildSearchPage(normalizedQuery, PAGE_SIZE, pageParam)) as Promise<PagedData<SearchResultItem, string>>,
    enabled: normalizedQuery.length >= 2,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const { pageNumber = 0, size, totalElements = 0 } = lastPage.page;
      const loaded = (pageNumber + 1) * size;
      return loaded < totalElements ? pageNumber + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });
}
