"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { PersonalChatHeader } from "./personal-chat-header";
import { MessageThread } from "@/components/message/message-thread";
import { MessageComposer } from "@/components/message/message-composer";
import { RequestBanner } from "@/components/message/request-banner";
import { ChatDetailPanel } from "../chat-detail-panel";
import { Chat, Message } from "@/features/messages/types/contracts";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { getProfileId } from "@/features/messages/utils/message-service.helper";
import { useMessageList } from "@/features/messages/hooks/messages/use-message-list";
import { useState, useEffect } from "react";
import { useSocket } from "@/features/messages/context/socket-context";

interface PersonalChatPanelProps {
    selectedChat: Chat;
}

export function PersonalChatPanel({ selectedChat }: PersonalChatPanelProps) {
    const router = useRouter();
    const currentProfileId = useSelector((state: RootState) => getProfileId(state.auth.user?.profileId));
    const { messages, isLoading, hasMore, loadMore, isFetchingMore } = useMessageList(selectedChat?.Id ?? "", 30);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);

    const { socketRef, isConnected } = useSocket();

    const isRequested = selectedChat.ChatSettings?.[0]?.IsRequested ?? false;

    useEffect(() => {
        const socket = socketRef.current;
        if (!socket || !isConnected) return;
        socket.emit("join-chat", { chatId: selectedChat.Id });
        return () => {
            socket.emit("leave-chat", { chatId: selectedChat.Id });
        };
    }, [selectedChat.Id, socketRef, isConnected]);

    const handleBack = () => router.push("/messages");

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex h-full overflow-hidden relative">
            <div className="flex h-full flex-1 flex-col overflow-hidden min-w-0">
                <PersonalChatHeader
                    detail={selectedChat}
                    onBack={handleBack}
                    onTogglePanel={() => setIsPanelOpen((prev) => !prev)}
                />

                <RequestBanner chat={selectedChat} currentProfileId={currentProfileId} />

                <MessageThread
                    messages={messages}
                    currentProfileId={currentProfileId}
                    onLoadMore={loadMore}
                    hasMore={hasMore}
                    isLoadingMore={isFetchingMore}
                    onEdit={setEditingMessage}
                    chatId={selectedChat.Id}
                    isGroup={false}
                />

                <div className="border-t border-border px-4 py-3">
                    <MessageComposer
                        selectedChat={selectedChat}
                        messages={messages}
                        currentProfileId={currentProfileId}
                        editingMessage={editingMessage}
                        onCancelEdit={() => setEditingMessage(null)}
                        disabled={isRequested}
                    />
                </div>
            </div>

            <ChatDetailPanel
                chat={selectedChat}
                open={isPanelOpen}
                onClose={() => setIsPanelOpen((prev) => !prev)}
                currentProfileId={currentProfileId}
                onBack={handleBack}
            />
        </div>
    );
}
