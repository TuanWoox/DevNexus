"use client";

import { Loader2 } from "lucide-react";
import { GroupChatHeader } from "./group-chat-header";
import { MessageThread } from "../common/message-thread";
import { MessageComposer } from "../common/message-composer";
import { Chat } from "@/features/messages/types/contracts";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { getProfileId } from "@/features/messages/utils/message-service.helper";
import { useMessageList } from "@/features/messages/hooks/messages/use-message-list";

interface GroupChatPanelProps {
    selectedChat: Chat | null;
    setSelectedChat: (item: Chat | null) => void;
}

export function GroupChatPanel({ selectedChat, setSelectedChat }: GroupChatPanelProps) {
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
            <GroupChatHeader
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
                <MessageComposer selectedChat={selectedChat} messages={messages} currentProfileId={currentProfileId} />
            </div>
        </div>
    );
}
