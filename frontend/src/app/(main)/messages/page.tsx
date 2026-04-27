"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, MessageSquareDashed } from "lucide-react";
import { toast } from "sonner";
import { ChatHeader } from "@/app/(main)/messages/_component/chat-header";
import { MessageComposer } from "@/app/(main)/messages/_component/message-composer";
import { MessageThread } from "@/app/(main)/messages/_component/message-thread";
import { MessageListSection } from "@/app/(main)/messages/_component/message-list-section";
import { MessageTabs } from "@/app/(main)/messages/_component/message-tabs";
import {
    InboxTab,
    useClearChatMessages,
    useFilteredInbox,
    useMarkChatAsRead,
    useMessagingChat,
    useSendMessage,
    useUpdateChatSetting,
} from "@/features/messages/hooks/use-messaging";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { cn } from "@/lib/utils";

function getProfileId(rawProfileId?: string): string {
    return rawProfileId || "mock-self";
}

export default function MessagesPage() {
    const [activeTab, setActiveTab] = useState<InboxTab>("main");
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

    const filteredQuery = useFilteredInbox(activeTab);
    const profileId = useSelector((state: RootState) => getProfileId(state.auth.user?.profileId));

    const chatId = selectedChatId ?? "";
    const chatQuery = useMessagingChat(chatId);
    const sendMessage = useSendMessage(chatId);
    const updateSetting = useUpdateChatSetting();
    const clearMessages = useClearChatMessages();
    const markAsRead = useMarkChatAsRead(chatId);

    const counts = useMemo(() => {
        const source = filteredQuery.data?.Result?.data ?? [];
        return {
            main: source.filter((item) => !item.CurrentSetting.IsArchived && !item.CurrentSetting.IsRequested).length,
            request: source.filter((item) => item.CurrentSetting.IsRequested).length,
            archived: source.filter((item) => item.CurrentSetting.IsArchived).length,
        } as Record<InboxTab, number>;
    }, [filteredQuery.data?.Result?.data]);

    const detail = chatQuery.data?.Result?.data?.[0] ?? null;

    useEffect(() => {
        if (!detail || markAsRead.isPending || !selectedChatId) return;
        const unreadCount = detail.Messages.filter((message) => {
            if (message.SenderId === profileId) return false;
            return !detail.Receipts.some(
                (receipt) => receipt.MessageId === message.Id && receipt.ReaderId === profileId,
            );
        }).length;
        if (unreadCount > 0) markAsRead.mutate();
    }, [detail, markAsRead, profileId, selectedChatId]);

    const mutateSetting = async (partial: {
        IsMuted?: boolean;
        IsPinned?: boolean;
        IsArchived?: boolean;
        IsRequested?: boolean;
    }) => {
        if (!detail) return;
        const result = await updateSetting.mutateAsync({
            Id: detail.CurrentSetting.Id,
            MuteUntil: partial.IsMuted ? new Date(Date.now() + 60 * 60 * 1000).toISOString() : null,
            IsMuted: partial.IsMuted ?? null,
            IsPinned: partial.IsPinned ?? null,
            IsArchived: partial.IsArchived ?? null,
            IsRequested: partial.IsRequested ?? null,
        });
        if (!result.Message) toast.success("Chat setting updated");
    };

    return (
        <div className="flex h-[calc(100vh-3.5rem)] w-full sm:h-screen overflow-hidden bg-card">

            {/* ── LEFT PANEL: conversation list ── */}
            <aside
                className={cn(
                    "flex flex-col w-full md:w-[340px] lg:w-[380px] shrink-0",
                    "border-r border-border bg-card",
                    selectedChatId ? "hidden md:flex" : "flex",
                )}
            >
                <div className="px-4 pt-5 pb-2">
                    <h1 className="text-xl font-bold tracking-tight text-foreground">Messages</h1>
                </div>

                <div className="px-3 pb-1">
                    <MessageTabs activeTab={activeTab} onTabChange={setActiveTab} counts={counts} />
                </div>

                <div className="flex-1 overflow-y-auto px-2 py-2">
                    <MessageListSection
                        isLoading={filteredQuery.isLoading}
                        tab={activeTab}
                        items={filteredQuery.items}
                        selectedChatId={selectedChatId ?? undefined}
                        onSelectChat={setSelectedChatId}
                    />
                </div>
            </aside>

            {/* ── RIGHT PANEL: active conversation ── */}
            <section
                className={cn(
                    "flex min-h-0 flex-1 flex-col",
                    selectedChatId ? "flex" : "hidden md:flex",
                )}
            >
                {!selectedChatId ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-border">
                            <MessageSquareDashed className="h-7 w-7" strokeWidth={1.5} />
                        </div>
                        <div className="text-center">
                            <p className="text-base font-semibold text-foreground">Your messages</p>
                            <p className="mt-1 text-sm">Select a conversation to start chatting</p>
                        </div>
                    </div>
                ) : chatQuery.isLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : !detail ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        Chat not found.
                    </div>
                ) : (
                    <div className="flex h-full flex-col overflow-hidden">
                        <ChatHeader
                            detail={detail}
                            onBack={() => setSelectedChatId(null)}
                            onToggleArchive={() => mutateSetting({ IsArchived: !detail.CurrentSetting.IsArchived })}
                            onToggleMute={() => mutateSetting({ IsMuted: !detail.CurrentSetting.IsMuted })}
                            onTogglePin={() => mutateSetting({ IsPinned: !detail.CurrentSetting.IsPinned })}
                            onAcceptRequest={() => mutateSetting({ IsRequested: false })}
                            onClearMessages={() => clearMessages.mutate(detail.CurrentSetting.Id)}
                        />

                        <div className="flex-1 overflow-y-auto px-4 py-3">
                            <MessageThread detail={detail} currentProfileId={profileId} />
                        </div>

                        <div className="border-t border-border px-4 py-3">
                            <MessageComposer
                                disabled={sendMessage.isPending}
                                onSend={async (content) => {
                                    const result = await sendMessage.mutateAsync({ Content: content });
                                    if (result.Message) toast.error(result.Message);
                                }}
                            />
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}