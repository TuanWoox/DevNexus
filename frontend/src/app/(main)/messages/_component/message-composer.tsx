"use client";

import { FormEvent, useRef, useState } from "react";
import { Send, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface MessageComposerProps {
    disabled?: boolean;
    onSend: (content: string) => Promise<void>;
}

export function MessageComposer({ disabled = false, onSend }: MessageComposerProps) {
    const [value, setValue] = useState("");
    const [isSending, setIsSending] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const canSend = value.trim().length > 0 && !isSending && !disabled;

    const submit = async (e?: FormEvent) => {
        e?.preventDefault();
        const content = value.trim();
        if (!content || isSending || disabled) return;
        setIsSending(true);
        try {
            await onSend(content);
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
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mb-0.5 h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                aria-label="Emoji"
            >
                <Smile className="h-5 w-5" />
            </Button>

            <Textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Message…"
                disabled={disabled || isSending}
                rows={1}
                className={cn(
                    "flex-1 resize-none border-0 bg-transparent p-0 text-sm shadow-none",
                    "focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground",
                    "max-h-[120px] min-h-0 leading-relaxed",
                )}
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
