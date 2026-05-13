import api from "@/lib/axiosConfig";
import { CreateBookmarkDTO } from "@/types/bookmark/create-bookmark-dto";
import { SelectBookmarkDTO } from "@/types/bookmark/select-bookmark-dto";
import { UpdateBookmarkDTO } from "@/types/bookmark/update-bookmark-dto";
import { Page } from "@/types/common/page";
import { PagedData } from "@/types/common/paged-data";
import { ReturnResult } from "@/types/common/return-result";

export const bookmarkService = {
    createBookmark: async (payload: CreateBookmarkDTO): Promise<SelectBookmarkDTO> => {
        const { data } = await api.post<ReturnResult<SelectBookmarkDTO>>('/BookMarks', payload);
        return data.result;
    },

    getMyBookmarks: async (payload: Page<string>): Promise<PagedData<SelectBookmarkDTO, string>> => {
        const { data } = await api.post<ReturnResult<PagedData<SelectBookmarkDTO, string>>>('/BookMarks/paging', payload);
        return data.result;
    },

    updateBookmark: async (payload: UpdateBookmarkDTO): Promise<SelectBookmarkDTO> => {
        const { data } = await api.put<ReturnResult<SelectBookmarkDTO>>('/BookMarks', payload);
        return data.result;
    },

    deleteById: async (bookmarkId: string): Promise<boolean> => {
        const { data } = await api.delete<ReturnResult<boolean>>(`/BookMarks/${bookmarkId}`);
        return data.result;
    },

    bulkDelete: async (bookmarkIds: string[]): Promise<number> => {
        const { data } = await api.delete<ReturnResult<number>>('/BookMarks', { data: { selected: bookmarkIds } });
        return data.result;
    }
}