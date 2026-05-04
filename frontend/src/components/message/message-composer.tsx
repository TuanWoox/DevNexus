"use client";

import { FormEvent, useCallback, useEffect, useId, useRef, useState } from "react";
import { Paperclip, Send, X, Play, Pencil, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useCreateMessage } from "@/features/messages/hooks/messages/use-create-message";
import { useMarkMessageAsRead } from "@/features/messages/hooks/messages/use-mark-message-as-read";
import { useUpdateMessage } from "@/features/messages/hooks/messages/use-update-message";
import { useSocket } from "@/features/messages/context/socket-context";
import { Chat, Message } from "@/features/messages/types/contracts";
import { toast } from "sonner";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface MessageComposerProps {
    selectedChat: Chat | null;
    messages: Message[];
    currentProfileId: string;
    editingMessage: Message | null;
    onCancelEdit: () => void;
    disabled?: boolean;
}

export function MessageComposer({ selectedChat, messages, currentProfileId, editingMessage, onCancelEdit, disabled }: MessageComposerProps) {
    const createMessage = useCreateMessage();
    const updateMessage = useUpdateMessage();
    const markAsRead = useMarkMessageAsRead();
    const { socketRef } = useSocket();
    const [value, setValue] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pendingRefocus = useRef(false);
    const fileInputId = useId();
    const lastReadMessageId = useRef<number | null>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isImage = selectedFile?.type.startsWith("image/");
    const isVideo = selectedFile?.type.startsWith("video/");

    const currentMember = selectedChat?.Members?.find(m => m.MemberId === currentProfileId);

    const emitTypingStop = useCallback(() => {
        if (!selectedChat) return;
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
        socketRef.current?.emit("typing-stop", { chatId: selectedChat.Id });
    }, [socketRef, selectedChat]);

    const emitTyping = useCallback(() => {
        const socket = socketRef.current;
        if (!socket || !selectedChat || !currentMember) return;

        socket.emit("typing-start", {
            chatId: selectedChat.Id,
            FullName: currentMember.Member.FullName,
            AvatarUrl: currentMember.Member.AvatarUrl ?? null,
        });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("typing-stop", { chatId: selectedChat.Id });
            typingTimeoutRef.current = null;
        }, 3000);
    }, [socketRef, selectedChat, currentMember]);

    useEffect(() => {
        const socket = socketRef.current;
        const chatId = selectedChat?.Id;
        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            socket?.emit("typing-stop", { chatId });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (pendingRefocus.current && !isSending && !createMessage.isPending) {
            textareaRef.current?.focus();
            pendingRefocus.current = false;
        }
    }, [isSending, createMessage.isPending]);

    useEffect(() => {
        if (editingMessage) {
            setValue(editingMessage.Content);
            textareaRef.current?.focus();
        } else {
            setValue("");
        }
    }, [editingMessage]);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const hasContent = value.trim().length > 0 || selectedFile !== null;
    const canSend = hasContent && !isSending && !createMessage.isPending;

    if (!selectedChat) return null;

    if (disabled) {
        return (
            <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5 shrink-0" />
                Accept the request to send a message
            </div>
        );
    }

    const handleFocus = () => {
        if (!selectedChat || !messages.length) return;
        const latestOther = messages.find((m) => m.SenderId !== currentProfileId);
        if (!latestOther) return;
        if (latestOther.ReadReceipts?.some((r) => r.ReaderId === currentProfileId)) return;
        if (lastReadMessageId.current === latestOther.Id) return;
        lastReadMessageId.current = latestOther.Id;
        markAsRead.mutate(selectedChat.Id);
    };

    const resetComposer = () => {
        setValue("");
        setSelectedFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (textareaRef.current) textareaRef.current.style.height = "auto";
        pendingRefocus.current = true;
    };

    const submit = async (e?: FormEvent) => {
        e?.preventDefault();
        const content = value.trim();
        if (isSending) return;

        setIsSending(true);
        try {
            if (editingMessage) {
                if (content && content !== editingMessage.Content) {
                    await updateMessage.mutateAsync({ messageId: editingMessage.Id, content });
                }
                emitTypingStop();
                onCancelEdit();
                setValue("");
            } else {
                if (!content && !selectedFile) return;
                await createMessage.mutateAsync({
                    createMessageDto: { ChatId: selectedChat.Id, Content: content || "" },
                    file: selectedFile ?? undefined,
                });
                emitTypingStop();
                resetComposer();
            }
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Escape" && editingMessage) {
            onCancelEdit();
            return;
        }
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value);
        e.target.style.height = "auto";
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
        emitTyping();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            toast.error("File must be under 50MB");
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            return;
        }

        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const removeFile = () => {
        setSelectedFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <form
            onSubmit={submit}
            className="relative rounded-lg border border-border/80 bg-muted/30 px-3 py-2 transition-all duration-200 focus-within:border-primary/30 focus-within:shadow-[0_0_12px_rgba(99,102,241,0.08)]"
        >
            {editingMessage && (
                <div className="flex items-center justify-between px-1 py-1.5 mb-2 rounded-md bg-brand-500/10 border border-brand-500/20 text-xs">
                    <div className="flex items-center gap-1.5 text-brand-500">
                        <Pencil className="h-3 w-3" />
                        <span>Editing message</span>
                    </div>
                    <button type="button" onClick={onCancelEdit} className="text-muted-foreground hover:text-foreground">
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            {selectedFile && (
                <div className="flex items-start gap-2 mb-2 px-1 animate-fade-in-up">
                    {isImage && previewUrl ? (
                        <div className="relative rounded-lg overflow-hidden border border-border/60 max-w-44 shrink-0 shadow-sm">
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className="h-28 w-full object-cover"
                            />
                        </div>
                    ) : isVideo && previewUrl ? (
                        <div className="relative rounded-lg overflow-hidden border border-border/60 max-w-44 shrink-0 shadow-sm">
                            <video src={previewUrl} className="h-28 w-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Play className="h-10 w-10 text-white drop-shadow-lg" />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2.5 rounded-lg bg-card px-3 py-2 text-xs border border-border/60 min-w-0 flex-1 shadow-sm">
                            <Paperclip className="h-3.5 w-3.5 shrink-0 text-primary" />
                            <span className="truncate font-medium">{selectedFile.name}</span>
                            <span className="text-muted-foreground shrink-0 tabular-nums">
                                {formatFileSize(selectedFile.size)}
                            </span>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={removeFile}
                        className="shrink-0 rounded-full p-1.5 hover:bg-destructive/10 hover:text-destructive transition-colors"
                        aria-label="Remove file"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            <div className="flex items-end gap-1.5">
                <Textarea
                    ref={textareaRef}
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    placeholder="Type a message…"
                    disabled={createMessage.isPending || isSending}
                    rows={1}
                    className={cn(
                        "min-h-10 flex-1 resize-none border-0 bg-transparent p-0 text-sm shadow-none",
                        "focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60",
                        "overflow-y-auto leading-relaxed py-1.5",
                    )}
                    style={{ maxHeight: "120px" }}
                />

                <input
                    ref={fileInputRef}
                    type="file"
                    id={fileInputId}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                />

                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={createMessage.isPending || isSending}
                    className="mb-0.5 h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    aria-label="Attach file"
                >
                    <Paperclip className="h-4 w-4" />
                </Button>

                <Button
                    type="submit"
                    size="icon"
                    disabled={!canSend}
                    className={cn(
                        "mb-0.5 h-9 w-9 shrink-0 rounded-full transition-colors",
                        canSend
                            ? "bg-linear-to-br from-brand-500 to-brand-600 text-white shadow-sm"
                            : "bg-muted text-muted-foreground",
                    )}
                    aria-label="Send message"
                >
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </form>
    );
}
