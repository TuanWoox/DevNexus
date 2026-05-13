"use client";

import { useState } from "react";
import { Loader2, Minus, Send, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChatWindows, type NewChatProfileData } from "@/features/messages/context/chat-windows-context";
import { useCreateNewChatPopup } from "@/features/messages/hooks/chats/use-create-new-chat-popup";
import { getInitials } from "@/features/messages/utils/message-service.helper";

const WINDOW_W = 340;
const WINDOW_H = 460;

interface NewChatPopupWindowProps {
    targetProfile: NewChatProfileData;
}

export function NewChatPopupWindow({ targetProfile }: NewChatPopupWindowProps) {
    const [message, setMessage] = useState("");
    const { closeChat, minimizeChat } = useChatWindows();
    const createChat = useCreateNewChatPopup({
        targetProfile,
        onCreated: () => setMessage(""),
    });
    const windowId = `new-${targetProfile.id}`;
    const firstName = targetProfile.fullName.trim().split(/\s+/)[0] || targetProfile.fullName;
    const canSend = message.trim().length > 0 && !createChat.isPending;

    const handleSend = () => {
        const content = message.trim();
        if (!content || createChat.isPending) return;

        createChat.mutate(content);
    };

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);
        e.target.style.height = "auto";
        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div
            className={cn(
                "rounded-t-xl border border-border bg-card shadow-2xl ring-1 ring-border/50 flex flex-col overflow-hidden",
                "animate-in slide-in-from-bottom-4 duration-200",
            )}
            style={{ width: WINDOW_W, height: WINDOW_H }}
        >
            <div className="flex items-center gap-3 border-b border-border/60 bg-card/80 backdrop-blur-md px-4 py-3 shrink-0">
                <Avatar className="h-9 w-9 ring-2 ring-border/50">
                    <AvatarImage src={targetProfile.avatarUrl ?? "/images/default-avatar.webp"} alt={targetProfile.fullName} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {getInitials(targetProfile.fullName)}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                        {targetProfile.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground">New conversation</p>
                </div>

                <button
                    type="button"
                    onClick={() => minimizeChat(windowId)}
                    className="p-1.5 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Minimize"
                >
                    <Minus className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={() => closeChat(windowId)}
                    className="p-1.5 rounded-full hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                    aria-label="Close"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground px-8 text-center">
                <Avatar className="h-20 w-20 ring-4 ring-border/30 shadow-card">
                    <AvatarImage src={targetProfile.avatarUrl ?? "/images/default-avatar.webp"} alt={targetProfile.fullName} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                        {getInitials(targetProfile.fullName)}
                    </AvatarFallback>
                </Avatar>

                <div>
                    <p className="text-base font-semibold text-foreground">
                        {targetProfile.fullName}
                    </p>
                    <p className="text-sm mt-1">
                        Send a message to start a conversation with {firstName}.
                    </p>
                </div>
            </div>

            <div className="border-t border-border/60 bg-muted/30 px-3 py-2 shrink-0">
                <div
                    className={cn(
                        "flex items-end gap-2 rounded-xl border border-border/60 bg-background px-3 py-2",
                        "focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200",
                    )}
                >
                    <textarea
                        value={message}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder={`Message ${firstName}...`}
                        rows={1}
                        disabled={createChat.isPending}
                        className={cn(
                            "flex-1 resize-none bg-transparent text-sm text-foreground",
                            "placeholder:text-muted-foreground/60",
                            "outline-none border-0 ring-0 py-1",
                            "max-h-30 overflow-y-auto",
                            "disabled:opacity-50",
                        )}
                        style={{ height: "36px" }}
                    />

                    <Button
                        type="button"
                        size="icon"
                        onClick={handleSend}
                        disabled={!canSend}
                        className={cn(
                            "shrink-0 h-8 w-8 rounded-lg transition-all duration-200",
                            canSend
                                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                                : "bg-transparent text-muted-foreground/40 hover:bg-transparent cursor-not-allowed",
                        )}
                        aria-label="Send message"
                    >
                        {createChat.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
