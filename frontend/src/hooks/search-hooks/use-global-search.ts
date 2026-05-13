import { useQuery } from "@tanstack/react-query";
import { buildSearchPage, searchService } from "@/services/search-service";

export const searchQueryKeys = {
  all: ["search"] as const,
  preview: (query: string) => [...searchQueryKeys.all, "preview", query] as const,
  list: (type: string, query: string) => [...searchQueryKeys.all, type, query] as const,
};

export function useGlobalSearch(query: string) {
  const normalizedQuery = query.trim();

  return useQuery({
    queryKey: searchQueryKeys.preview(normalizedQuery),
    queryFn: () => searchService.searchAll(buildSearchPage(normalizedQuery, 5)),
    enabled: normalizedQuery.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}
