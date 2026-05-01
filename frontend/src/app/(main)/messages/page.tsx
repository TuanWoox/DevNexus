"use client";

import { useState, useMemo } from "react";
import { MessageListSection } from "@/app/(main)/messages/_component/common/message-list-section";
import { MessageTabs } from "@/app/(main)/messages/_component/common/message-tabs";
import { cn } from "@/lib/utils";
import { Chat, InboxTab } from "@/features/messages/types/contracts";
import { useChatList } from "@/features/messages/hooks/chats/use-chat-list";
import { useChatSearch } from "@/features/messages/hooks/chats/use-chat-search";
import { MessageSquareDashed } from "lucide-react";
import { PersonalChatPanel } from "./_component/personal/personal-chat-panel";
import { GroupChatPanel } from "./_component/group/group-chat-panel";
import { useMessageGateway } from "@/features/messages/hooks/gateways/use-message-gateway";
import { MessageSearch } from "./_component/common/message-search";

export default function MessagesPage() {
    useMessageGateway();

    const [activeTab, setActiveTab] = useState<InboxTab>("main");
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const { chats: chatList, isLoading: chatsLoading, isFetchingMore: chatsFetchingMore,
            hasMore: chatsHasMore, loadMore: chatsLoadMore } = useChatList(30, activeTab);

    const searchQueryHook = useChatSearch(searchQuery);

    const searchResults = useMemo(() => {
        return searchQueryHook.data?.pages?.flatMap(
            (page) => page?.result?.data ?? []
        ) ?? [];
    }, [searchQueryHook.data?.pages]);

    const effectiveChat = useMemo(() => {
        if (!selectedChat) return null;
        return chatList.find((c) => c.Id === selectedChat.Id)
            ?? searchResults.find((c) => c.Id === selectedChat.Id)
            ?? selectedChat;
    }, [chatList, searchResults, selectedChat]);

    const handleTabChange = (tab: InboxTab) => {
        setActiveTab(tab);
        setSelectedChat(null);
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

                <div className="px-3 pb-3 space-y-3">
                    <MessageSearch
                        value={searchQuery}
                        onChange={setSearchQuery}
                        results={searchResults}
                        isLoading={searchQueryHook.isLoading}
                        isFetchingMore={searchQueryHook.isFetchingNextPage}
                        hasMore={searchQueryHook.hasNextPage}
                        onSelectResult={setSelectedChat}
                        onLoadMore={() => {
                            if (searchQueryHook.hasNextPage && !searchQueryHook.isFetchingNextPage) {
                                searchQueryHook.fetchNextPage();
                            }
                        }}
                    />
                    <MessageTabs activeTab={activeTab} onTabChange={handleTabChange} />
                </div>

                <div className="flex-1 overflow-y-auto px-2 py-2"
                    onScroll={(e) => {
                        const element = e.currentTarget;
                        if (
                            element.scrollHeight - element.scrollTop - element.clientHeight < 100 &&
                            chatsHasMore &&
                            !chatsFetchingMore
                        ) {
                            chatsLoadMore();
                        }
                    }}
                >
                    <MessageListSection
                        isLoading={chatsLoading}
                        items={chatList}
                        selectedChatId={effectiveChat?.Id ?? undefined}
                        onSelectChat={setSelectedChat}
                        isFetchingMore={chatsFetchingMore}
                        activeTab={activeTab}
                    />
                </div>
            </aside>

            {/* ── RIGHT PANEL: chat view ── */}
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
                ) : effectiveChat.IsGroup ? (
                    <GroupChatPanel
                        selectedChat={effectiveChat}
                        setSelectedChat={setSelectedChat}
                    />
                ) : (
                    <PersonalChatPanel
                        selectedChat={effectiveChat}
                        setSelectedChat={setSelectedChat}
                    />
                )}
            </section>
        </div>
    );
}
