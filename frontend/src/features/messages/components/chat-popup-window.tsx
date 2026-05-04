"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { RootState } from "@/store/store";
import { getProfileId, getTitle, getAvatarUrl } from "@/features/messages/utils/message-service.helper";
import { useChatById } from "@/features/messages/hooks/chats/use-chat-by-id";
import { useMessageList } from "@/features/messages/hooks/messages/use-message-list";
import { useSocket } from "@/features/messages/context/socket-context";
import { useChatWindows } from "@/features/messages/context/chat-windows-context";
import { MessageThread } from "./message-thread";
import { MessageComposer } from "./message-composer";
import { ChatPopupHeader } from "./chat-popup-header";
import type { Message } from "@/features/messages/types/contracts";

const WINDOW_W = 340;
const WINDOW_H = 460;

interface Props {
    chatId: string;
}

export function ChatPopupWindow({ chatId }: Props) {
    const router = useRouter();
    const { closeChat, minimizeChat } = useChatWindows();
    const { socketRef, isConnected } = useSocket();
    const currentProfileId = useSelector((s: RootState) =>
        getProfileId(s.auth.user?.profileId)
    );
    const { chat, isLoading: chatLoading } = useChatById(chatId);
    const {
        messages, isLoading: msgsLoading, hasMore, loadMore, isFetchingMore,
    } = useMessageList(chatId, 30);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);

    useEffect(() => {
        const socket = socketRef.current;
        if (!socket || !isConnected) return;
        socket.emit("join-chat", { chatId });
        return () => { socket.emit("leave-chat", { chatId }); };
    }, [chatId, socketRef, isConnected]);

    const handleExpand = () => {
        closeChat(chatId);
        router.push(`/messages/${chatId}`);
    };

    if (chatLoading || !chat) {
        return (
            <div
                className="rounded-t-xl border border-border bg-card shadow-2xl flex items-center justify-center"
                style={{ width: WINDOW_W, height: 60 }}
            >
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
        );
    }

    const title = getTitle(chat, currentProfileId);
    const avatarUrl = getAvatarUrl(chat, currentProfileId);

    return (
        <div
            className={cn(
                "rounded-t-xl border border-border bg-card shadow-2xl flex flex-col",
                "animate-in slide-in-from-bottom-4 duration-200"
            )}
            style={{ width: WINDOW_W, height: WINDOW_H }}
        >
            <ChatPopupHeader
                title={title}
                avatarUrl={avatarUrl}
                onMinimize={() => minimizeChat(chatId)}
                onExpand={handleExpand}
                onClose={() => closeChat(chatId)}
            />

            {/* min-h-0 is required so flex child respects parent height and scroll works */}
            <div className="flex-1 min-h-0 overflow-hidden">
                {msgsLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                ) : (
                    <MessageThread
                        messages={messages}
                        currentProfileId={currentProfileId}
                        onLoadMore={loadMore}
                        hasMore={hasMore}
                        isLoadingMore={isFetchingMore}
                        onEdit={setEditingMessage}
                        chatId={chatId}
                        isGroup={chat.IsGroup}
                    />
                )}
            </div>

            <div className="border-t border-border px-3 py-2 shrink-0">
                <MessageComposer
                    selectedChat={chat}
                    messages={messages}
                    currentProfileId={currentProfileId}
                    editingMessage={editingMessage}
                    onCancelEdit={() => setEditingMessage(null)}
                />
            </div>
        </div>
    );
}
