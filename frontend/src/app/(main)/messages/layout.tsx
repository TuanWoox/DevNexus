"use client";

import { Suspense, useState } from "react";
import { useParams, useRouter, usePathname, useSearchParams } from "next/navigation";
import { MessageListSection } from "@/app/(main)/messages/_component/message-list-section";
import { MessageTabs } from "@/app/(main)/messages/_component/message-tabs";
import { MessageSearch } from "@/app/(main)/messages/_component/message-search";
import { cn } from "@/lib/utils";
import { UsersRound } from "lucide-react";
import { InboxTab, Chat, ProfileSummary } from "@/features/messages/types/contracts";
import { useChatList } from "@/features/messages/hooks/chats/use-chat-list";

const validTabs: InboxTab[] = ["main", "request", "archived"];

function getValidTab(tabParam: string | null): InboxTab {
    if (tabParam && validTabs.includes(tabParam as InboxTab)) {
        return tabParam as InboxTab;
    }
    return "main";
}

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={null}>
            <MessagesLayoutContent>{children}</MessagesLayoutContent>
        </Suspense>
    );
}

function MessagesLayoutContent({ children }: { children: React.ReactNode }) {

    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const activeChatId = params?.chatId as string | undefined;
    // Treat /messages/new and /messages/new-group as "right panel open" for mobile
    const isRightPanelOpen = !!activeChatId
        || pathname === "/messages/new"
        || pathname === "/messages/new-group";

    const activeTab = getValidTab(searchParams.get("tab"));
    const [searchQuery, setSearchQuery] = useState("");

    const { chats: chatList, isLoading: chatsLoading, isFetchingMore: chatsFetchingMore,
        hasMore: chatsHasMore, loadMore: chatsLoadMore } = useChatList(30, activeTab);

    const buildUrlWithTab = (basePath: string, tab: InboxTab, preserveParams: boolean) => {
        const nextParams = preserveParams
            ? new URLSearchParams(searchParams.toString())
            : new URLSearchParams();

        if (tab === "main") {
            nextParams.delete("tab");
        } else {
            nextParams.set("tab", tab);
        }

        const query = nextParams.toString();
        return query ? `${basePath}?${query}` : basePath;
    };

    const handleTabChange = (tab: InboxTab) => {
        router.push(buildUrlWithTab(pathname, tab, true), { scroll: false });
    };

    const handleSelectChat = (chat: Chat) => {
        setSearchQuery("");
        router.push(buildUrlWithTab(`/messages/${chat.Id}`, activeTab, false));
    };

    const handleSelectPerson = (profile: ProfileSummary) => {
        if (!profile.Id) return;
        setSearchQuery("");
        const params = new URLSearchParams({ profileId: profile.Id });
        if (activeTab !== "main") params.set("tab", activeTab);
        router.push(`/messages/new?${params.toString()}`);
    };

    return (
        <div className="flex h-[calc(100vh-3.5rem)] w-full sm:h-screen overflow-hidden bg-card">

            {/* ── LEFT PANEL: conversation list ── */}
            <aside
                className={cn(
                    "flex flex-col w-full md:w-85 lg:w-95 shrink-0",
                    "border-r border-border bg-card",
                    isRightPanelOpen ? "hidden md:flex" : "flex",
                )}
            >
                <div className="px-4 pt-5 pb-2 flex items-center justify-between">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Messages</h1>
                    <button
                        type="button"
                        onClick={() => router.push(buildUrlWithTab("/messages/new-group", activeTab, false))}
                        className="rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        title="New group chat"
                    >
                        <UsersRound className="h-5 w-5" />
                    </button>
                </div>

                <div className="px-3 pb-3 space-y-3">
                    <MessageSearch
                        value={searchQuery}
                        onChange={setSearchQuery}
                        onSelectChat={handleSelectChat}
                        onSelectPerson={handleSelectPerson}
                    />
                    <MessageTabs activeTab={activeTab} onTabChange={handleTabChange} />
                </div>

                <div
                    className="flex-1 overflow-y-auto px-2 py-2"
                    onScroll={(e) => {
                        const el = e.currentTarget;
                        if (
                            el.scrollHeight - el.scrollTop - el.clientHeight < 100 &&
                            chatsHasMore && !chatsFetchingMore
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
                    isRightPanelOpen ? "flex" : "hidden md:flex",
                )}
            >
                {children}
            </section>
        </div>
    );
}
