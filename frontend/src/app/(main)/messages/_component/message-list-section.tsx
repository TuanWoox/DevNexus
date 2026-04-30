"use client";

import { MessageListItem } from "@/app/(main)/messages/_component/message-list-item";
import { MessageListSkeleton } from "@/app/(main)/messages/_component/message-list-skeleton";
import { MessageEmptyState } from "@/app/(main)/messages/_component/message-empty-state";
import { Chat } from "@/features/messages/types/contracts";

interface MessageListSectionProps {
    isLoading: boolean;
    items: Chat[];
    selectedChatId?: string;
    onSelectChat?: (item: Chat) => void;
    isFetchingMore?: boolean;
}

const emptyCopy = {
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
    items,
    selectedChatId,
    onSelectChat,
    isFetchingMore,
}: MessageListSectionProps) {
    if (isLoading) return <MessageListSkeleton />;

    if (items.length === 0) {
        return (
            <div className="px-2 pt-4">
                <MessageEmptyState
                    title={emptyCopy.main.title}
                    description={emptyCopy.main.description}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-0.5">
            {items.map((item) => (
                <MessageListItem
                    key={item.Id}
                    item={item}
                    isActive={selectedChatId === item.Id}
                    onSelect={onSelectChat}
                />
            ))}
            {isFetchingMore && (
                <div className="flex justify-center py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                </div>
            )}
        </div>
    );
}
