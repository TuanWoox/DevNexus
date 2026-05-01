"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { Paperclip, Send, X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useCreateMessage } from "@/features/messages/hooks/messages/use-create-message";
import { Chat } from "@/features/messages/types/contracts";
import { toast } from "sonner";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface MessageComposerProps {
    selectedChat: Chat | null;
}

export function MessageComposer({ selectedChat }: MessageComposerProps) {
    const createMessage = useCreateMessage();
    const [value, setValue] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pendingRefocus = useRef(false);
    const fileInputId = useId();
    const isImage = selectedFile?.type.startsWith("image/");
    const isVideo = selectedFile?.type.startsWith("video/");

    useEffect(() => {
        if (pendingRefocus.current && !isSending && !createMessage.isPending) {
            textareaRef.current?.focus();
            pendingRefocus.current = false;
        }
    }, [isSending, createMessage.isPending]);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const hasContent = value.trim().length > 0 || selectedFile !== null;
    const canSend = hasContent && !isSending && !createMessage.isPending;

    if (!selectedChat) return null;

    const submit = async (e?: FormEvent) => {
        e?.preventDefault();
        const content = value.trim();
        if ((!content && !selectedFile) || isSending || createMessage.isPending) return;
        setIsSending(true);
        try {
            await createMessage.mutateAsync({
                createMessageDto: {
                    ChatId: selectedChat.Id,
                    Content: content || "",
                },
                file: selectedFile ?? undefined,
            });
            setValue("");
            setSelectedFile(null);
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
            }
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
            }
            pendingRefocus.current = true;
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
            className="rounded-2xl border border-border bg-muted/40 px-3 py-2"
        >
            {selectedFile && (
                <div className="flex items-start gap-2 mb-2 px-1">
                    {isImage && previewUrl ? (
                        <div className="relative rounded-lg overflow-hidden border max-w-40 shrink-0">
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className="h-24 w-full object-cover"
                            />
                        </div>
                    ) : isVideo && previewUrl ? (
                        <div className="relative rounded-lg overflow-hidden border max-w-40 shrink-0">
                            <video src={previewUrl} className="h-24 w-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Play className="h-8 w-8 text-white" />
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 rounded-lg bg-background px-3 py-1.5 text-xs border min-w-0 flex-1">
                            <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span className="truncate font-medium">{selectedFile.name}</span>
                            <span className="text-muted-foreground shrink-0">
                                {formatFileSize(selectedFile.size)}
                            </span>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={removeFile}
                        className="shrink-0 rounded-full p-1 hover:bg-accent transition-colors"
                        aria-label="Remove file"
                    >
                        <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                </div>
            )}

            <div className="flex items-end gap-2">
                <Textarea
                    ref={textareaRef}
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Message…"
                    disabled={createMessage.isPending || isSending}
                    rows={1}
                    className={cn(
                        "min-h-10 flex-1 resize-none border-0 bg-transparent p-0 text-sm shadow-none",
                        "focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground",
                        "overflow-y-auto leading-relaxed",
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
                    className="mb-0.5 h-8 w-8 shrink-0 rounded-full transition-all"
                    aria-label="Attach file"
                >
                    <Paperclip className="h-4 w-4" />
                </Button>

                <Button
                    type="submit"
                    size="icon"
                    disabled={!canSend}
                    className="mb-0.5 h-8 w-8 shrink-0 rounded-full transition-all"
                    aria-label="Send message"
                >
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </form>
    );
}