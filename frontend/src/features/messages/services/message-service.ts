import messageApi from "../../../lib/messageServiceAxiosConfig";
import type { CreateMessageDto, Message, MessageReadReceipt, PagedData } from "@/features/messages/types/contracts";
import { Page } from "@/types/common/page";
import { ReturnResult } from "@/types/common/return-result";

export const messageService = {
    createMessage: async (createMessageDto: CreateMessageDto, file?: File): Promise<ReturnResult<Message>> => {
        const formData = new FormData();
        formData.append("createMessageDto", JSON.stringify(createMessageDto));
        if (file) {
            formData.append("file", file);
        }

        const { data } = await messageApi.post<ReturnResult<Message>>("/messages", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return data;
    },

    markMessageAsRead: async (messageId: number): Promise<ReturnResult<MessageReadReceipt>> => {
        const { data } = await messageApi.post<ReturnResult<MessageReadReceipt>>(
            `/messages/${messageId}/read`
        );
        return data;
    },

    markMultipleMessagesAsRead: async (messageIds: string[]): Promise<ReturnResult<MessageReadReceipt[]>> => {
        const { data } = await messageApi.post<ReturnResult<MessageReadReceipt[]>>("/messages/read", {
            messageIds,
        });
        return data;
    },

    getMessagesPaging: async (chatId: string, page: Page<number>): Promise<ReturnResult<PagedData<number, Message>>> => {
        const { data } = await messageApi.post<ReturnResult<PagedData<number, Message>>>(
            `/messages/paging/${chatId}`,
            page
        );
        return data;
    },
};
