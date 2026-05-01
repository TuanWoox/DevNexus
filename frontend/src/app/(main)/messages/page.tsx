"use client";

import { useState, useMemo } from "react";
import { MessageListSection } from "@/app/(main)/messages/_component/message-list-section";
import { MessageTabs } from "@/app/(main)/messages/_component/message-tabs";
import { cn } from "@/lib/utils";
import { Chat, InboxTab } from "@/features/messages/types/contracts";
import { useChatsPaging } from "@/features/messages/hooks/chats/use-chats-paging";
import { MessageSquareDashed } from "lucide-react";
import ChatPanel from "./_component/chat-panel";
import { useMessageGateway } from "@/features/messages/hooks/gateways/use-message-gateway";

export default function MessagesPage() {
    //Used to connect, can place anywhere because right now we are talking through react query cache not built it from scatch anymore
    useMessageGateway();
    const [activeTab, setActiveTab] = useState<InboxTab>("main");
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    useMessageGateway();

    // Fetch chats for the active tab
    const chatPagingQuery = useChatsPaging(30, activeTab);

    // Flatten pages into single array for infinite pagination
    const flattenedChats = useMemo(() => {
        return chatPagingQuery.data?.pages?.flatMap(
            (page) => page?.result?.data ?? []
        ) ?? [];
    }, [chatPagingQuery.data?.pages]);

    // Derive the fresh version of selectedChat from the latest fetched data
    // so that mutations (mute, pin, archive, etc.) are reflected without a cascading render
    const effectiveChat = useMemo(() => {
        if (!selectedChat) return null;
        return flattenedChats.find((c) => c.Id === selectedChat.Id) ?? null;
    }, [flattenedChats, selectedChat]);

    const handleTabChange = (tab: InboxTab) => {
        setActiveTab(tab);
        setSelectedChat(null); // Reset selected chat when changing tabs
    };

    const handleLoadMore = () => {
        if (chatPagingQuery.hasNextPage && !chatPagingQuery.isFetchingNextPage) {
            chatPagingQuery.fetchNextPage();
        }
    };

    return (
        <div className="flex h-[calc(100vh-3.5rem)] w-full sm:h-screen overflow-hidden bg-card">

            {/* ── LEFT PANEL: conversation list ── */}
            <aside
                className={cn(
                    "flex flex-col w-full md:w-85 lg:w-95 shrink-0",
                    "border-r border-border bg-card",
                    effectiveChat ? "hidden md:flex" : "flex",
                )}
            >
                <div className="px-4 pt-5 pb-2">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Messages</h1>
                </div>

                <div className="px-3 pb-1">
                    <MessageTabs activeTab={activeTab} onTabChange={handleTabChange} />
                </div>

                <div className="flex-1 overflow-y-auto px-2 py-2"
                    onScroll={(e) => {
                        const element = e.currentTarget;
                        if (
                            element.scrollHeight - element.scrollTop - element.clientHeight < 100 &&
                            chatPagingQuery.hasNextPage &&
                            !chatPagingQuery.isFetchingNextPage
                        ) {
                            handleLoadMore();
                        }
                    }}
                >
                    <MessageListSection
                        isLoading={chatPagingQuery.isLoading}
                        items={flattenedChats}
                        selectedChatId={effectiveChat?.Id ?? undefined}
                        onSelectChat={setSelectedChat}
                        isFetchingMore={chatPagingQuery.isFetchingNextPage}
                    />
                </div>
            </aside>

            <section
                className={cn(
                    "flex min-h-0 flex-1 flex-col",
                    effectiveChat ? "flex" : "hidden md:flex",
                )}
            >
                {!effectiveChat ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-border">
                            <MessageSquareDashed className="h-7 w-7" strokeWidth={1.5} />
                        </div>
                        <div className="text-center">
                            <p className="text-base font-semibold text-foreground">Your messages</p>
                            <p className="mt-1 text-sm">Select a conversation to start chatting</p>
                        </div>
                    </div>
                ) : <ChatPanel
                    selectedChat={effectiveChat}
                    setSelectedChat={setSelectedChat}
                />}
            </section>
        </div>
    );
}