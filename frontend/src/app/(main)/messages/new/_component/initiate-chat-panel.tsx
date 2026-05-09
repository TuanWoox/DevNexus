"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/features/messages/utils/message-service.helper";
import { useCreateChat } from "@/features/messages/hooks/chats/use-create-chat";
import { ProfileSummary } from "@/features/messages/types/contracts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface InitiateChatPanelProps {
    targetProfile: ProfileSummary;
}

export function InitiateChatPanel({ targetProfile }: InitiateChatPanelProps) {
    const router = useRouter();
    const [message, setMessage] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const createChat = useCreateChat();

    const handleBack = () => router.push("/messages");

    const handleSend = async () => {
        const content = message.trim();
        if (!content || createChat.isPending) return;

        createChat.mutate(
            {
                profileIds: [targetProfile.Id!],
                message: { Content: content, ChatId: "" },
            },
            {
                onSuccess: (data) => {
                    if (data.result?.Id) {
                        // Navigate to the newly created chat — replaces /new so back button works cleanly
                        router.replace(`/messages/${data.result.Id}`);
                    } else {
                        toast.error(data.message ?? "Failed to start conversation");
                    }
                },
                onError: () => {
                    toast.error("Failed to start conversation. Please try again.");
                },
            }
        );
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Auto-grow textarea
    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);
        const el = e.target;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    };

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border/60 bg-card/80 backdrop-blur-md px-4 py-3 shrink-0">
                <button
                    type="button"
                    onClick={handleBack}
                    className="rounded-full p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    aria-label="Back to messages"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>

                <Avatar className="h-9 w-9 ring-2 ring-border/50">
                    <AvatarImage src={targetProfile.AvatarUrl ?? undefined} alt={targetProfile.FullName} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                        {getInitials(targetProfile.FullName)}
                    </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{targetProfile.FullName}</p>
                    <p className="text-xs text-muted-foreground">New conversation</p>
                </div>
            </div>

            {/* Body — empty state until first message is sent */}
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground px-8 text-center">
                <Avatar className="h-20 w-20 ring-4 ring-border/30 shadow-card">
                    <AvatarImage src={targetProfile.AvatarUrl ?? undefined} alt={targetProfile.FullName} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                        {getInitials(targetProfile.FullName)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-base font-semibold text-foreground">{targetProfile.FullName}</p>
                    <p className="text-sm mt-1">
                        Send a message to start a conversation with {targetProfile.FullName.split(" ")[0]}.
                    </p>
                </div>
            </div>

            {/* Composer */}
            <div className="border-t border-border/60 bg-card px-4 py-3 shrink-0">
                <div className={cn(
                    "flex items-end gap-2 rounded-xl border border-border/60 bg-muted/40 px-3 py-2",
                    "focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200",
                )}>
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder={`Message ${targetProfile.FullName.split(" ")[0]}...`}
                        rows={1}
                        disabled={createChat.isPending}
                        className={cn(
                            "flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60",
                            "outline-none border-0 ring-0 py-1 max-h-[120px] overflow-y-auto",
                            "disabled:opacity-50",
                        )}
                        style={{ height: "36px" }}
                    />
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={!message.trim() || createChat.isPending}
                        className={cn(
                            "shrink-0 rounded-lg p-2 transition-all duration-200",
                            message.trim() && !createChat.isPending
                                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                                : "text-muted-foreground/40 cursor-not-allowed",
                        )}
                        aria-label="Send message"
                    >
                        {createChat.isPending
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Send className="h-4 w-4" />
                        }
                    </button>
                </div>
                <p className="text-[11px] text-muted-foreground/60 mt-1.5 text-center">
                    Press Enter to send · Shift+Enter for new line
                </p>
            </div>
        </div>
    );
}
