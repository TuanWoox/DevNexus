"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { MessageListSection } from "@/app/(main)/messages/_component/message-list-section";
import { MessageTabs } from "@/app/(main)/messages/_component/message-tabs";
import { MessageSearch } from "@/app/(main)/messages/_component/message-search";
import { cn } from "@/lib/utils";
import { InboxTab, Chat } from "@/features/messages/types/contracts";
import { useChatList } from "@/features/messages/hooks/chats/use-chat-list";
import { useChatSearch } from "@/features/messages/hooks/chats/use-chat-search";
import { useMessageGateway } from "@/features/messages/hooks/gateways/use-message-gateway";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
    useMessageGateway();

    const params = useParams();
    const router = useRouter();
    const activeChatId = params?.chatId as string | undefined;

    const [activeTab, setActiveTab] = useState<InboxTab>("main");
    const [searchQuery, setSearchQuery] = useState("");

    const { chats: chatList, isLoading: chatsLoading, isFetchingMore: chatsFetchingMore,
        hasMore: chatsHasMore, loadMore: chatsLoadMore } = useChatList(30, activeTab);

    const searchQueryHook = useChatSearch(searchQuery);

    const searchResults = useMemo(() => {
        return searchQueryHook.data?.pages?.flatMap(
            (page) => page?.result?.data ?? []
        ) ?? [];
    }, [searchQueryHook.data?.pages]);

    const handleTabChange = (tab: InboxTab) => {
        setActiveTab(tab);
        router.push("/messages");
    };

    const handleSelectChat = (chat: Chat) => {
        setSearchQuery("");
        router.push(`/messages/${chat.Id}`);
    };

    return (
        <div className="flex h-[calc(100vh-3.5rem)] w-full sm:h-screen overflow-hidden bg-card">

            {/* ── LEFT PANEL: conversation list ── */}
            <aside
                className={cn(
                    "flex flex-col w-full md:w-85 lg:w-95 shrink-0",
                    "border-r border-border bg-card",
                    // On mobile: hide the list when a chat is open
                    activeChatId ? "hidden md:flex" : "flex",
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
                        onSelectResult={handleSelectChat}
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
                        selectedChatId={activeChatId}
                        onSelectChat={handleSelectChat}
                        isFetchingMore={chatsFetchingMore}
                        activeTab={activeTab}
                    />
                </div>
            </aside>

            {/* ── RIGHT PANEL: chat view (children) ── */}
            <section
                className={cn(
                    "flex min-h-0 flex-1 flex-col",
                    // On mobile: show the right panel only when a chat is open
                    activeChatId ? "flex" : "hidden md:flex",
                )}
            >
                {children}
            </section>
        </div>
    );
}
