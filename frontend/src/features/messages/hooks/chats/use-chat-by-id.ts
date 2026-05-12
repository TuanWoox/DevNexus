import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { messagingQueryKeys } from "../messaging-query-keys";
import { chatService } from "../../services/chat-service";
import type { Chat } from "../../types/contracts";
import type { InfiniteData } from "@tanstack/react-query";
import type { ReturnResult } from "@/types/common/return-result";
import type { PagedData } from "../../types/contracts";

type ChatListPage = ReturnResult<PagedData<string, Chat>>;
type ChatListInfiniteData = InfiniteData<ChatListPage>;

export const useChatById = (chatId: string) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: messagingQueryKeys.chatById(chatId),
        queryFn: () => chatService.getChatById(chatId),
        enabled: !!chatId,
        staleTime: 30_000,
    });

    // Try to find the chat from any already-loaded chat list cache (instant navigation)
    // Use this as fallback while the query is loading
    const cachedChat = useMemo(() => {
        if (!chatId) return null;
        const tabTypes = ["main", "request", "archived"];
        for (const type of tabTypes) {
            const data = queryClient.getQueryData<ChatListInfiniteData>(
                messagingQueryKeys.chat(type)
            );
            if (!data?.pages) continue;
            for (const page of data.pages) {
                const found = page?.result?.data?.find((c) => c.Id === chatId);
                if (found) return found;
            }
        }
        return null;
    }, [chatId, queryClient]);

    // Prefer the query result (most up-to-date), fallback to cached chat during loading
    const chat = query.data?.result ?? cachedChat ?? null;

    return {
        chat,
        isLoading: query.isLoading && !cachedChat,
        isError: query.isError,
        error: query.error,
    };
};
