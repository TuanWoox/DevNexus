"use client";

import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { ChatHeader } from "./chat-header";
import { MessageThread } from "./message-thread";
import { MessageComposer } from "./message-composer";
import { Chat, Message } from "@/features/messages/types/contracts";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { getProfileId } from "@/features/messages/utils/message-service.helper";
import { useMessagesPaging } from "@/features/messages/hooks/messages/use-messages-paging";

interface ChatPanelProps {
    selectedChat: Chat | null;
    setSelectedChat: (item: Chat | null) => void;
}

const ChatPanel = ({ selectedChat, setSelectedChat }: ChatPanelProps) => {
    const currentProfileId = useSelector((state: RootState) => getProfileId(state.auth.user?.profileId));
    const messagePagingQuery = useMessagesPaging(selectedChat?.Id ?? "", 30);
    const flattenedMessages = useMemo(() => {
        if (!messagePagingQuery.data?.pages) return [];

        const allMessages = messagePagingQuery.data.pages.flatMap(
            (page) => page?.result?.data ?? []
        );

        const map = new Map<number, Message>();
        allMessages.forEach((msg) => {
            map.set(msg.Id, msg);
        });

        return Array.from(map.values()).sort((a, b) => b.Id - a.Id);
    }, [messagePagingQuery.data]);


    if (!selectedChat) return null;

    return (
        <>
            {messagePagingQuery.isLoading ? (
                <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
            ) : (
                <div className="flex h-full flex-col overflow-hidden">
                    <ChatHeader
                        detail={selectedChat}
                        onBack={() => setSelectedChat(null)}
                    />

                    <MessageThread
                        messages={flattenedMessages}
                        currentProfileId={currentProfileId}
                        onLoadMore={() => {
                            if (messagePagingQuery.hasNextPage && !messagePagingQuery.isFetchingNextPage) {
                                messagePagingQuery.fetchNextPage();
                            }
                        }}
                        hasMore={messagePagingQuery.hasNextPage}
                        isLoadingMore={messagePagingQuery.isFetchingNextPage}
                    />

                    <div className="border-t border-border px-4 py-3">
                        <MessageComposer selectedChat={selectedChat} />
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatPanel;