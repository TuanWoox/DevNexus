import api from "@/lib/axiosConfig";
import { CreateBookmarkedItemDTO } from "@/types/bookmarked-item/create-bookmarked-item-dto";
import { SelectBookmarkedItemDTO } from "@/types/bookmarked-item/select-bookmarked-item-dto";
import { Page } from "@/types/common/page";
import { PagedData } from "@/types/common/paged-data";
import { ReturnResult } from "@/types/common/return-result";

export const bookmarkedItemService = {
    createBookmarkedItem: async (payload: CreateBookmarkedItemDTO): Promise<SelectBookmarkedItemDTO> => {
        const { data } = await api.post<ReturnResult<SelectBookmarkedItemDTO>>('/BookmarkedItems', payload);
        return data.result;
    },

    getItemByBookmarkId: async (bookmarkId: string, payload: Page<string>): Promise<PagedData<SelectBookmarkedItemDTO, string>> => {
        const { data } = await api.post<ReturnResult<PagedData<SelectBookmarkedItemDTO, string>>>(`/BookmarkedItems/paging?bookMarkId=${bookmarkId}`, payload);
        return data.result;
    },

    deleteById: async (bookmarkedItemId: string): Promise<boolean> => {
        const { data } = await api.delete<ReturnResult<boolean>>(`/BookmarkedItems/${bookmarkedItemId}`);
        return data.result;
    },

    bulkDelete: async (bookmarkedItemIds: string[]): Promise<number> => {
        const { data } = await api.delete<ReturnResult<number>>('/BookMarkedItems', { data: { selected: bookmarkedItemIds } });
        return data.result;
    }
}