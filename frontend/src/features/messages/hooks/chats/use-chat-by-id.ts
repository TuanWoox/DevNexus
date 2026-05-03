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

    // Try to find the chat from any already-loaded chat list cache (instant navigation)
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

    const query = useQuery({
        queryKey: messagingQueryKeys.chatById(chatId),
        queryFn: () => chatService.getChatById(chatId),
        // Skip the network call if we already have the chat from the list cache
        enabled: !!chatId && !cachedChat,
        staleTime: 30_000,
    });

    const chat = cachedChat ?? query.data?.result ?? null;

    return {
        chat,
        isLoading: !cachedChat && query.isLoading,
        isError: query.isError,
        error: query.error,
    };
};
