import { useInfiniteQuery } from "@tanstack/react-query";
import { messagingQueryKeys } from "../messaging-query-keys";
import { Page } from "@/types/common/page";
import { messageService } from "../../services/message-service";

export const useMessagesPaging = (chatId: string, size: number = 20) => {
    return useInfiniteQuery({
        queryKey: messagingQueryKeys.messagesInsideChat(chatId),

        queryFn: ({ pageParam }) => {
            const page: Page<number> = {
                indexPaging: pageParam, // 👈 cursor (message ID)
                size,
            };

            return messageService.getMessagesPaging(chatId, page);
        },
        // 👇 first load = latest messages
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => {

            const result = lastPage?.result;
            if (!result) return undefined;


            const { data } = result as { data: any[] };

            if (!data.length || data.length < size) return undefined;

            // 👇 because backend is DESC
            const lastMessage = data[data.length - 1];
            return lastMessage.Id;
        },

        enabled: !!chatId,
    });
};