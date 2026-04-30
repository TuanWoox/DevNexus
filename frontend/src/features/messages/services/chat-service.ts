import { Chat, PagedData } from "../types/contracts";
import messageApi from "../config/messageServiceAxiosConfig"
import { Page } from "@/types/common/page";
import { ReturnResult } from "@/types/common/return-result";

export const chatService = {
    getChatPaging: async (page: Page<string>, type: string) => {
        const { data } = await messageApi.post<ReturnResult<PagedData<string, Chat>>>(`/chats/paging?type=${type}`, page)
        return data;
    }
}