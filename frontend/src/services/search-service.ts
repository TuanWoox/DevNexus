import api from "@/lib/axiosConfig";
import { FilterOperator } from "@/constants/filterOperator";
import { FilterType } from "@/constants/filterType";
import { Page } from "@/types/common/page";
import { PagedData } from "@/types/common/paged-data";
import { ReturnResult } from "@/types/common/return-result";
import {
  GlobalSearchResult,
  SearchCommunityResult,
  SearchPostResult,
  SearchProfileResult,
  SearchQAPostResult,
} from "@/types/search/global-search-result";

export function buildSearchPage(query: string, size: number, pageNumber = 0): Page<string> {
  return {
    size,
    pageNumber,
    totalElements: 0,
    orders: [],
    filter: query.trim()
      ? [{
        prop: "Query",
        value: query.trim(),
        filterOperator: FilterOperator.Contains,
        filterType: FilterType.Text,
        dynamicProperty: "",
        delimiter: "",
      }]
      : [],
    selected: [],
  };
}

export const searchService = {
  searchAll: async (payload: Page<string>): Promise<GlobalSearchResult> => {
    const { data } = await api.post<ReturnResult<GlobalSearchResult>>("/Search/all", payload);
    return data.result ?? { posts: [], qaPosts: [], communities: [], profiles: [] };
  },

  searchPosts: async (payload: Page<string>): Promise<PagedData<SearchPostResult, string>> => {
    const { data } = await api.post<ReturnResult<PagedData<SearchPostResult, string>>>("/Search/posts", payload);
    return data.result ?? { data: [], page: payload };
  },

  searchQuestions: async (payload: Page<string>): Promise<PagedData<SearchQAPostResult, string>> => {
    const { data } = await api.post<ReturnResult<PagedData<SearchQAPostResult, string>>>("/Search/questions", payload);
    return data.result ?? { data: [], page: payload };
  },

  searchCommunities: async (payload: Page<string>): Promise<PagedData<SearchCommunityResult, string>> => {
    const { data } = await api.post<ReturnResult<PagedData<SearchCommunityResult, string>>>("/Search/communities", payload);
    return data.result ?? { data: [], page: payload };
  },

  searchProfiles: async (payload: Page<string>): Promise<PagedData<SearchProfileResult, string>> => {
    const { data } = await api.post<ReturnResult<PagedData<SearchProfileResult, string>>>("/Search/profiles", payload);
    return data.result ?? { data: [], page: payload };
  },
};
