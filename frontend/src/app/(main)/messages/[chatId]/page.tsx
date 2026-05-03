"use client";

import { useParams, useRouter } from "next/navigation";
import { Loader2, MessageSquareOff } from "lucide-react";
import { PersonalChatPanel } from "./_component/personal/personal-chat-panel";
import { GroupChatPanel } from "./_component/group/group-chat-panel";
import { useChatById } from "@/features/messages/hooks/chats/use-chat-by-id";

export default function ChatPage() {
    const params = useParams();
    const router = useRouter();
    const chatId = params?.chatId as string;

    const { chat, isLoading, isError } = useChatById(chatId);

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    if (isError || !chat) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-border">
                    <MessageSquareOff className="h-7 w-7" strokeWidth={1.5} />
                </div>
                <div className="text-center">
                    <p className="text-base font-semibold text-foreground">Chat not found</p>
                    <p className="mt-1 text-sm">This conversation may have been deleted or you don&apos;t have access.</p>
                </div>
                <button
                    onClick={() => router.push("/messages")}
                    className="mt-2 text-sm text-primary hover:underline"
                >
                    Back to messages
                </button>
            </div>
        );
    }

    if (chat.IsGroup) {
        return <GroupChatPanel selectedChat={chat} />;
    }

    return <PersonalChatPanel selectedChat={chat} />;
}
