import { useInfiniteQuery } from "@tanstack/react-query";
import { messagingQueryKeys } from "../messaging-query-keys";
import { chatService } from "../../services/chat-service";
import { Page } from "@/types/common/page";

export const useChatsPaging = (size: number = 20, type: string) => {
    return useInfiniteQuery({
        queryKey: messagingQueryKeys.chat(type),
        queryFn: ({ pageParam = 1 }) => {
            const page: Page<string> = { pageNumber: pageParam, size };
            return chatService.getChatPaging(page, type);
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const result = lastPage?.result;
            if (!result) return undefined;

            const { page, data } = result as { page: { pageNumber: number; size: number }; data: unknown[] };
            if (data.length < page.size) return undefined;
            return page.pageNumber + 1;
        },
    });
};