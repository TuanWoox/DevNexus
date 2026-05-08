"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { RootState } from "@/store/store";
import { getProfileId, getTitle, getAvatarUrl, getOtherProfileId } from "@/features/messages/utils/message-service.helper";
import { useBlockStatus } from "@/hooks/block-hooks/use-block-status";
import { useChatById } from "@/features/messages/hooks/chats/use-chat-by-id";
import { useMessageList } from "@/features/messages/hooks/messages/use-message-list";
import { useSocket } from "@/features/messages/context/socket-context";
import { useChatWindows } from "@/features/messages/context/chat-windows-context";
import { MessageThread } from "@/components/message/message-thread";
import { MessageComposer } from "@/components/message/message-composer";
import { RequestBanner } from "@/components/message/request-banner";
import { BlockBanner } from "@/components/message/block-banner";
import { ChatPopupHeader } from "@/components/message/chat-popup-header";
import { ChatAvatarSection } from "@/app/(main)/messages/[chatId]/_component/chat-avatar-section";
import { MediaSection } from "@/app/(main)/messages/[chatId]/_component/media-section";
import { PrivacySettingsSection } from "@/app/(main)/messages/[chatId]/_component/privacy-settings-section";
import { DeleteAllMessagesSection } from "@/app/(main)/messages/[chatId]/_component/delete-all-messages-section";
import { GroupMemberList } from "@/app/(main)/messages/[chatId]/_component/group/group-member-list";
import { GroupAddMembersDialog } from "@/app/(main)/messages/[chatId]/_component/group/group-add-members-dialog";
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
    const [detailOpen, setDetailOpen] = useState(false);
    const [showAddMembers, setShowAddMembers] = useState(false);

    // Derive stable otherProfileId for block status — null for groups or while loading
    const otherProfileId = chat && !chat.IsGroup ? getOtherProfileId(chat, currentProfileId) : null;
    const { data: blockStatus } = useBlockStatus(otherProfileId);

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
                className="rounded-t-xl border border-border bg-card shadow-2xl ring-1 ring-border/50 flex items-center justify-center"
                style={{ width: WINDOW_W, height: 60 }}
            >
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
        );
    }

    const title = getTitle(chat, currentProfileId);
    const avatarUrl = getAvatarUrl(chat, currentProfileId);
    const mySetting = chat.ChatSettings?.[0];
    const isRequested = mySetting?.IsRequested ?? false;
    const isBlocked = !chat.IsGroup && ((blockStatus?.iBlockedThem || blockStatus?.theyBlockedMe) ?? false);

    return (
        <>
            <div
                className={cn(
                    "rounded-t-xl border border-border bg-card shadow-2xl ring-1 ring-border/50 flex flex-col overflow-hidden",
                    "animate-in slide-in-from-bottom-4 duration-200"
                )}
                style={{ width: WINDOW_W, height: WINDOW_H }}
            >
                <ChatPopupHeader
                    title={title}
                    avatarUrl={avatarUrl}
                    chat={chat}
                    onMinimize={() => minimizeChat(chatId)}
                    onExpand={handleExpand}
                    onClose={() => closeChat(chatId)}
                    onToggleDetail={() => setDetailOpen(p => !p)}
                    detailOpen={detailOpen}
                />

                {/* Main chat area + sliding detail panel */}
                <div className="flex-1 min-h-0 flex overflow-hidden relative">
                    {/* Chat view */}
                    <div
                        className={cn(
                            "flex flex-col w-full shrink-0 transition-transform duration-200",
                            detailOpen ? "-translate-x-full" : "translate-x-0"
                        )}
                    >
                        {isRequested && (
                            <RequestBanner chat={chat} currentProfileId={currentProfileId} />
                        )}

                        {!isRequested && otherProfileId && (blockStatus?.iBlockedThem || blockStatus?.theyBlockedMe) && (
                            <BlockBanner
                                iBlockedThem={blockStatus.iBlockedThem}
                                theyBlockedMe={blockStatus.theyBlockedMe}
                                blockId={blockStatus.blockId}
                                otherProfileId={otherProfileId}
                                otherName={title}
                            />
                        )}

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

                        <div className="border-t border-border px-3 py-2 shrink-0 bg-muted/30">
                            <MessageComposer
                                selectedChat={chat}
                                messages={messages}
                                currentProfileId={currentProfileId}
                                editingMessage={editingMessage}
                                onCancelEdit={() => setEditingMessage(null)}
                                disabled={isRequested || isBlocked}
                            />
                        </div>
                    </div>

                    {/* Detail panel — slides in from right */}
                    <div
                        className={cn(
                            "absolute inset-0 bg-card overflow-y-auto transition-transform duration-200",
                            detailOpen ? "translate-x-0" : "translate-x-full"
                        )}
                    >
                        <ChatAvatarSection chat={chat} currentProfileId={currentProfileId} />

                        {chat.IsGroup && (
                            <>
                                <div className="border-t border-border/60" />
                                <GroupMemberList
                                    chat={chat}
                                    currentProfileId={currentProfileId}
                                    onAddMembers={() => setShowAddMembers(true)}
                                />
                            </>
                        )}

                        <div className="border-t border-border/60" />
                        <MediaSection chatId={chat.Id} />

                        <div className="border-t border-border/60" />
                        <PrivacySettingsSection
                            chat={chat}
                            onBack={() => { closeChat(chatId); router.push("/messages"); }}
                            currentProfileId={currentProfileId}
                        />

                        {mySetting && (
                            <>
                                <div className="border-t border-border/60" />
                                <DeleteAllMessagesSection
                                    chatSettingId={mySetting.Id}
                                    onDeleted={() => { setDetailOpen(false); }}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>

            {chat.IsGroup && (
                <GroupAddMembersDialog
                    open={showAddMembers}
                    onClose={() => setShowAddMembers(false)}
                    chatId={chat.Id}
                />
            )}
        </>
    );
}
