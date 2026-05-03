import { Chat, PagedData } from "../types/contracts";
import messageApi from "../../../lib/messageServiceAxiosConfig"
import { Page } from "@/types/common/page";
import { ReturnResult } from "@/types/common/return-result";

export const chatService = {
    getChatPaging: async (page: Page<string>, type: string) => {
        const { data } = await messageApi.post<ReturnResult<PagedData<string, Chat>>>(`/chats/paging?type=${type}`, page)
        return data;
    },

    searchChats: async (page: Page<string>) => {
        const { data } = await messageApi.post<ReturnResult<PagedData<string, Chat>>>('/chats/search', page)
        return data;
    },

    getChatById: async (chatId: string) => {
        const { data } = await messageApi.get<ReturnResult<Chat>>(`/chats/${chatId}`);
        return data;
    },
}