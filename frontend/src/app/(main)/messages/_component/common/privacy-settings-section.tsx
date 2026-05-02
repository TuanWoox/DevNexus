"use client";

import { Pin, BellOff, Bell, Archive, UserPlus, LogOut } from "lucide-react";
import { Chat } from "@/features/messages/types/contracts";
import { useUpdateChatSetting } from "@/features/messages/hooks/chatsettings/use-update-chat-setting";
import { toast } from "sonner";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface PrivacySettingsSectionProps {
    chat: Chat;
    onBack?: () => void;
}

export function PrivacySettingsSection({ chat, onBack }: PrivacySettingsSectionProps) {
    const updateChatSetting = useUpdateChatSetting();

    const mySetting = useMemo(() => {
        return chat?.ChatSettings?.[0];
    }, [chat?.ChatSettings]);

    if (!mySetting) return null;

    const canPin = !mySetting.IsArchived && !mySetting.IsRequested;

    const handleTogglePin = () => {
        if (!canPin) return;
        updateChatSetting.mutate({
            Id: mySetting.Id,
            IsPinned: !mySetting.IsPinned,
            IsArchived: null,
            IsMuted: null,
            IsRequested: null,
            MuteUntil: null,
        });
    };

    const handleToggleMute = () => {
        updateChatSetting.mutate({
            Id: mySetting.Id,
            IsMuted: !mySetting.IsMuted,
            IsArchived: null,
            IsPinned: null,
            IsRequested: null,
            MuteUntil: null,
        });
    };

    const handleToggleArchive = () => {
        const archiving = !mySetting.IsArchived;
        updateChatSetting.mutate(
            {
                Id: mySetting.Id,
                IsArchived: archiving,
                IsRequested: false,
                IsMuted: null,
                IsPinned: null,
                MuteUntil: null,
            },
            {
                onSuccess: () => {
                    if (archiving && onBack) onBack();
                },
            }
        );
    };

    const handleAcceptRequest = () => {
        updateChatSetting.mutate({
            Id: mySetting.Id,
            IsRequested: false,
            IsArchived: false,
            IsMuted: null,
            IsPinned: null,
            MuteUntil: null,
        });
    };

    const handleLeaveGroup = () => {
        toast.info("Leave group coming soon");
    };

    return (
        <div className="py-3">
            <h3 className="px-4 pt-1 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Privacy &amp; Settings
            </h3>

            <div className="flex flex-col">
                {canPin && (
                    <button
                        type="button"
                        onClick={handleTogglePin}
                        className="flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-left transition-colors duration-150 hover:bg-accent/40"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="shrink-0 h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                                <Pin className={cn(
                                    "h-4 w-4",
                                    mySetting.IsPinned ? "text-amber-500" : "text-muted-foreground",
                                )} />
                            </div>
                            <span className="text-sm font-medium text-foreground">
                                {mySetting.IsPinned ? "Pinned" : "Pin chat"}
                            </span>
                        </div>
                        {mySetting.IsPinned && (
                            <span className="text-xs font-medium text-amber-500 shrink-0">On</span>
                        )}
                    </button>
                )}

                <button
                    type="button"
                    onClick={handleToggleMute}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-left transition-colors duration-150 hover:bg-accent/40"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0 h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            {mySetting.IsMuted ? (
                                <BellOff className="h-4 w-4 text-amber-500" />
                            ) : (
                                <Bell className="h-4 w-4 text-muted-foreground" />
                            )}
                        </div>
                        <span className="text-sm font-medium text-foreground">
                            {mySetting.IsMuted ? "Muted" : "Mute chat"}
                        </span>
                    </div>
                    {mySetting.IsMuted && (
                        <span className="text-xs font-medium text-amber-500 shrink-0">On</span>
                    )}
                </button>

                <button
                    type="button"
                    onClick={handleToggleArchive}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-left transition-colors duration-150 hover:bg-accent/40"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0 h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            <Archive className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-sm font-medium text-foreground">
                            {mySetting.IsArchived ? "Archived" : "Archive chat"}
                        </span>
                    </div>
                    {mySetting.IsArchived && (
                        <span className="text-xs font-medium text-muted-foreground shrink-0">Archived</span>
                    )}
                </button>

                {mySetting.IsRequested && (
                    <button
                        type="button"
                        onClick={handleAcceptRequest}
                        className="flex w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-left transition-colors duration-150 hover:bg-accent/40"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="shrink-0 h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                                <UserPlus className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <span className="text-sm font-medium text-foreground">Accept request</span>
                        </div>
                    </button>
                )}

                {chat.IsGroup && (
                    <button
                        type="button"
                        onClick={handleLeaveGroup}
                        className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors duration-150 hover:bg-destructive/10"
                    >
                        <div className="shrink-0 h-9 w-9 rounded-full bg-destructive/10 flex items-center justify-center">
                            <LogOut className="h-4 w-4 text-destructive" />
                        </div>
                        <span className="text-sm font-medium text-destructive">Leave group</span>
                    </button>
                )}
            </div>
        </div>
    );
}
