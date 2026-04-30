"use client";

import { FormEvent, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useCreateMessage } from "@/features/messages/hooks/messages/use-create-message";
import { Chat } from "@/features/messages/types/contracts";

interface MessageComposerProps {
    selectedChat: Chat | null;
}

export function MessageComposer({ selectedChat }: MessageComposerProps) {
    const createMessage = useCreateMessage();
    const [value, setValue] = useState("");
    const [isSending, setIsSending] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const canSend = value.trim().length > 0 && !isSending && !createMessage.isPending;

    if (!selectedChat) return null;

    const submit = async (e?: FormEvent) => {
        e?.preventDefault();
        const content = value.trim();
        if (!content || isSending || createMessage.isPending) return;
        setIsSending(true);
        try {
            await createMessage.mutateAsync({
                createMessageDto: {
                    ChatId: selectedChat.Id,
                    Content: content,
                },
            });
            setValue("");
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
            }
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value);
        e.target.style.height = "auto";
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
    };

    return (
        <form
            onSubmit={submit}
            className="flex items-end gap-2 rounded-2xl border border-border bg-muted/40 px-3 py-2"
        >
            <Textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Message…"
                disabled={createMessage.isPending || isSending}
                rows={1}
                className={cn(
                    "flex-1 resize-none border-0 bg-transparent p-0 text-sm shadow-none",
                    "focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground",
                    "overflow-y-auto leading-relaxed",  // ✅ removed min-h-0, max-h-30
                )}
                style={{ maxHeight: "120px", minHeight: "unset" }} // ✅ inline to override shadcn defaults
            />

            <Button
                type="submit"
                size="icon"
                disabled={!canSend}
                className="mb-0.5 h-8 w-8 shrink-0 rounded-full transition-all"
                aria-label="Send message"
            >
                <Send className="h-4 w-4" />
            </Button>
        </form>
    );
}