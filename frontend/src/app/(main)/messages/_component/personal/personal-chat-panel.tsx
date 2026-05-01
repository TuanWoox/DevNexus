"use client";

import { Loader2 } from "lucide-react";
import { PersonalChatHeader } from "./personal-chat-header";
import { MessageThread } from "../common/message-thread";
import { MessageComposer } from "../common/message-composer";
import { Chat } from "@/features/messages/types/contracts";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { getProfileId } from "@/features/messages/utils/message-service.helper";
import { useMessageList } from "@/features/messages/hooks/messages/use-message-list";

interface PersonalChatPanelProps {
    selectedChat: Chat | null;
    setSelectedChat: (item: Chat | null) => void;
}

export function PersonalChatPanel({ selectedChat, setSelectedChat }: PersonalChatPanelProps) {
    const currentProfileId = useSelector((state: RootState) => getProfileId(state.auth.user?.profileId));
    const { messages, isLoading, hasMore, loadMore, isFetchingMore } = useMessageList(selectedChat?.Id ?? "", 30);

    if (!selectedChat) return null;

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <PersonalChatHeader
                detail={selectedChat}
                onBack={() => setSelectedChat(null)}
            />

            <MessageThread
                messages={messages}
                currentProfileId={currentProfileId}
                onLoadMore={loadMore}
                hasMore={hasMore}
                isLoadingMore={isFetchingMore}
            />

            <div className="border-t border-border px-4 py-3">
                <MessageComposer selectedChat={selectedChat} />
            </div>
        </div>
    );
}
