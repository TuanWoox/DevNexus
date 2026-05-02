"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chat } from "@/features/messages/types/contracts";
import { cn } from "@/lib/utils";
import { ChatAvatarSection } from "./chat-avatar-section";
import { MediaSection } from "./media-section";
import { PrivacySettingsSection } from "./privacy-settings-section";
import { DeleteAllMessagesSection } from "./delete-all-messages-section";

interface ChatDetailPanelProps {
    chat: Chat;
    open: boolean;
    onClose: () => void;
    currentProfileId: string;
    onBack?: () => void;
}

export function ChatDetailPanel({ chat, open, onClose, currentProfileId, onBack }: ChatDetailPanelProps) {
    const mySetting = chat?.ChatSettings?.[0];

    return (
        <>
            {/* Mobile overlay backdrop */}
            <div
                className={cn(
                    "fixed inset-0 z-20 bg-black/20 transition-opacity duration-300 md:hidden",
                    open ? "opacity-100" : "opacity-0 pointer-events-none",
                )}
                onClick={onClose}
            />

            {/* Panel */}
            <aside
                className={cn(
                    "flex flex-col h-full bg-card overflow-hidden",
                    "transition-all duration-300 ease-in-out",
                    // Desktop: inline sidebar
                    "md:relative md:z-0 md:border-l md:border-border/60",
                    open ? "md:w-80 md:min-w-80" : "md:w-0 md:min-w-0 md:border-l-0",
                    // Mobile: absolute overlay
                    "absolute inset-y-0 right-0 z-30 w-80 max-w-[85vw]",
                    "max-md:shadow-elevated",
                    open
                        ? "max-md:translate-x-0 max-md:opacity-100"
                        : "max-md:translate-x-full max-md:opacity-0 max-md:pointer-events-none",
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-card/80 backdrop-blur-md shrink-0">
                    <h2 className="text-sm font-semibold text-foreground">Chat Details</h2>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={onClose}
                        className="rounded-full"
                        aria-label="Close panel"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto overscroll-contain">
                    <ChatAvatarSection chat={chat} currentProfileId={currentProfileId} />

                    <div className="border-t border-border/60" />

                    <MediaSection chatId={chat.Id} />

                    <div className="border-t border-border/60" />

                    <PrivacySettingsSection chat={chat} onBack={onBack} />

                    <div className="border-t border-border/60" />

                    {mySetting && (
                        <DeleteAllMessagesSection
                            chatSettingId={mySetting.Id}
                            onDeleted={() => onBack?.()}
                        />
                    )}
                </div>
            </aside>
        </>
    );
}
