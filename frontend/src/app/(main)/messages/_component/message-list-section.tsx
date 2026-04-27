"use client";

import { ChatListItem } from "@/features/messages/types/contracts";
import { InboxTab } from "@/features/messages/hooks/use-messaging";
import { MessageListItem } from "@/app/(main)/messages/_component/message-list-item";
import { MessageListSkeleton } from "@/app/(main)/messages/_component/message-list-skeleton";
import { MessageEmptyState } from "@/app/(main)/messages/_component/message-empty-state";

interface MessageListSectionProps {
    isLoading: boolean;
    tab: InboxTab;
    items: ChatListItem[];
    selectedChatId?: string;
    onSelectChat?: (chatId: string) => void;
}

const emptyCopy: Record<InboxTab, { title: string; description: string }> = {
    main: {
        title: "No conversations yet",
        description: "Start a chat to see your conversations here.",
    },
    request: {
        title: "No requests",
        description: "Message requests will appear here.",
    },
    archived: {
        title: "No archived chats",
        description: "Archived conversations stay out of your main inbox.",
    },
};

export function MessageListSection({
    isLoading,
    tab,
    items,
    selectedChatId,
    onSelectChat,
}: MessageListSectionProps) {
    if (isLoading) return <MessageListSkeleton />;

    if (items.length === 0) {
        return (
            <div className="px-2 pt-4">
                <MessageEmptyState
                    title={emptyCopy[tab].title}
                    description={emptyCopy[tab].description}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-0.5">
            {items.map((item) => (
                <MessageListItem
                    key={item.Chat.Id}
                    item={item}
                    isActive={selectedChatId === item.Chat.Id}
                    onSelect={onSelectChat}
                />
            ))}
        </div>
    );
}
